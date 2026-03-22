/**
 * 은퇴 자산 시뮬레이션 및 투자 KPI 계산 유틸리티
 */

// ── 투자 KPI 계산 ──────────────────────────────────────────────

/**
 * 포트폴리오 일간 수익률 배열에서 연환산 변동성(표준편차) 산출
 */
export function calcAnnualizedVolatility(curve) {
  if (!curve || curve.length < 3) return null;

  const dailyReturns = [];
  for (let i = 1; i < curve.length; i++) {
    if (curve[i - 1] > 0) {
      dailyReturns.push(curve[i] / curve[i - 1] - 1);
    }
  }

  if (dailyReturns.length < 2) return null;

  const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) /
    (dailyReturns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(252) * 100; // 연환산 %
}

/**
 * 하방편차(Downside Deviation) 연환산
 */
export function calcDownsideDeviation(curve, targetReturn = 0) {
  if (!curve || curve.length < 3) return null;

  const dailyReturns = [];
  for (let i = 1; i < curve.length; i++) {
    if (curve[i - 1] > 0) {
      dailyReturns.push(curve[i] / curve[i - 1] - 1);
    }
  }

  if (dailyReturns.length < 2) return null;

  const dailyTarget = targetReturn / 252;
  const downsideSquares = dailyReturns
    .filter((r) => r < dailyTarget)
    .map((r) => (r - dailyTarget) ** 2);

  if (downsideSquares.length === 0) return 0;

  const downsideVariance =
    downsideSquares.reduce((s, v) => s + v, 0) / dailyReturns.length;

  return Math.sqrt(downsideVariance) * Math.sqrt(252) * 100;
}

/**
 * 샤프 비율 = (CAGR - 무위험수익률) / 연환산 변동성
 */
export function calcSharpeRatio(cagr, volatility, riskFreeRate = 3.5) {
  if (cagr == null || volatility == null || volatility === 0) return null;
  return (cagr - riskFreeRate) / volatility;
}

/**
 * 소르티노 비율 = (CAGR - 무위험수익률) / 하방편차
 */
export function calcSortinoRatio(cagr, downsideDev, riskFreeRate = 3.5) {
  if (cagr == null || downsideDev == null || downsideDev === 0) return null;
  return (cagr - riskFreeRate) / downsideDev;
}

/**
 * 미래 투자 자산 추정 (복리 성장 + 월 적립)
 * @returns 연도별 자산 가치 배열 [{year, value, contribution, growth}]
 */
export function projectFutureValue(
  initialCapital,
  monthlyContribution,
  annualReturnPct,
  years,
) {
  const monthlyRate = annualReturnPct / 100 / 12;
  const projections = [];
  let totalValue = initialCapital;
  let totalContributed = initialCapital;

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      totalValue = totalValue * (1 + monthlyRate) + monthlyContribution;
      totalContributed += monthlyContribution;
    }

    projections.push({
      year: y,
      value: Math.round(totalValue),
      contribution: Math.round(totalContributed),
      growth: Math.round(totalValue - totalContributed),
    });
  }

  return projections;
}

/**
 * 연간 배당 수입 추정 (세전)
 */
export function estimateAnnualDividend(portfolioValue, dividendYieldPct) {
  return portfolioValue * (dividendYieldPct / 100);
}

// ── 은퇴 시뮬레이션 ────────────────────────────────────────────

/**
 * 은퇴 자산 시뮬레이션 (적립기 + 인출기)
 * @param {Object} params
 * @param {number} params.currentAge - 현재 나이
 * @param {number} params.retirementAge - 은퇴 나이
 * @param {number} params.lifeExpectancy - 기대 수명
 * @param {number} params.currentSavings - 현재 투자 자산 (만원)
 * @param {number} params.monthlyContribution - 월 적립금 (만원)
 * @param {number} params.monthlyExpense - 은퇴 후 월 생활비 (만원)
 * @param {number} params.annualReturnPct - 연 기대수익률 (%)
 * @param {number} params.inflationPct - 연 물가상승률 (%)
 * @param {number} params.withdrawalReturnPct - 은퇴 후 연 수익률 (%), 보수적
 * @returns {Object} 시뮬레이션 결과
 */
export function simulateRetirement(params) {
  const {
    currentAge,
    retirementAge,
    lifeExpectancy,
    currentSavings,
    monthlyContribution,
    monthlyExpense,
    annualReturnPct,
    inflationPct = 2.5,
    withdrawalReturnPct,
  } = params;

  const accumYears = retirementAge - currentAge;
  const withdrawYears = lifeExpectancy - retirementAge;

  // ── 적립기 ──
  const accumMonthlyRate = annualReturnPct / 100 / 12;
  const accumTimeline = []; // [{age, value}]
  let balance = currentSavings;

  accumTimeline.push({ age: currentAge, value: Math.round(balance) });

  for (let y = 1; y <= accumYears; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + accumMonthlyRate) + monthlyContribution;
    }
    accumTimeline.push({
      age: currentAge + y,
      value: Math.round(balance),
    });
  }

  const retirementBalance = balance;

  // ── 인출기 ──
  const withdrawMonthlyRate = withdrawalReturnPct / 100 / 12;
  const monthlyInflationRate = inflationPct / 100 / 12;
  const withdrawTimeline = [];
  let withdrawBalance = retirementBalance;
  let currentMonthlyExpense = monthlyExpense;
  let depletionAge = null;

  withdrawTimeline.push({
    age: retirementAge,
    value: Math.round(withdrawBalance),
  });

  for (let y = 1; y <= withdrawYears; y++) {
    for (let m = 0; m < 12; m++) {
      withdrawBalance =
        withdrawBalance * (1 + withdrawMonthlyRate) - currentMonthlyExpense;
      currentMonthlyExpense *= 1 + monthlyInflationRate;

      if (withdrawBalance <= 0 && depletionAge === null) {
        depletionAge = retirementAge + y - 1 + (m + 1) / 12;
        withdrawBalance = 0;
      }
    }

    withdrawTimeline.push({
      age: retirementAge + y,
      value: Math.max(0, Math.round(withdrawBalance)),
    });
  }

  const finalBalance = Math.max(0, withdrawBalance);

  // 안전 인출률 (4% 룰 기반 월 인출 가능액)
  const safeMonthlyWithdrawal = (retirementBalance * 0.04) / 12;

  // 자산 고갈 없이 인출 가능한 최대 월 생활비 (이분탐색)
  const maxSafeExpense = findMaxSafeExpense(
    retirementBalance,
    withdrawalReturnPct,
    inflationPct,
    withdrawYears,
  );

  // 목표 달성률 (은퇴 후 자산이 기대수명까지 유지되는지)
  const isSuccess = depletionAge === null;
  const successRate = isSuccess ? 100 : Math.round(((depletionAge - retirementAge) / withdrawYears) * 100);

  // 부족 자금
  const shortfall = !isSuccess
    ? estimateShortfall(
        monthlyExpense,
        inflationPct,
        withdrawYears,
        depletionAge - retirementAge,
      )
    : 0;

  return {
    accumYears,
    withdrawYears,
    retirementBalance: Math.round(retirementBalance),
    finalBalance: Math.round(finalBalance),
    depletionAge: depletionAge ? Number(depletionAge.toFixed(1)) : null,
    safeMonthlyWithdrawal: Math.round(safeMonthlyWithdrawal),
    maxSafeExpense: Math.round(maxSafeExpense),
    isSuccess,
    successRate,
    shortfall: Math.round(shortfall),
    accumTimeline,
    withdrawTimeline,
    fullTimeline: [...accumTimeline, ...withdrawTimeline.slice(1)],
  };
}

/**
 * 이분탐색으로 자산 고갈 없는 최대 월 생활비 산출
 */
function findMaxSafeExpense(
  retirementBalance,
  returnPct,
  inflationPct,
  years,
) {
  let lo = 0;
  let hi = retirementBalance / 12; // 최대 1년치
  const monthlyRate = returnPct / 100 / 12;
  const monthlyInflRate = inflationPct / 100 / 12;

  for (let iter = 0; iter < 50; iter++) {
    const mid = (lo + hi) / 2;
    let bal = retirementBalance;
    let expense = mid;
    let depleted = false;

    for (let y = 0; y < years; y++) {
      for (let m = 0; m < 12; m++) {
        bal = bal * (1 + monthlyRate) - expense;
        expense *= 1 + monthlyInflRate;
        if (bal <= 0) {
          depleted = true;
          break;
        }
      }
      if (depleted) break;
    }

    if (depleted) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return lo;
}

/**
 * 자산 고갈 후 부족 자금 추정
 */
function estimateShortfall(
  monthlyExpense,
  inflationPct,
  totalWithdrawYears,
  depletionYear,
) {
  const monthlyInflRate = inflationPct / 100 / 12;
  let expense = monthlyExpense;

  // 고갈 시점까지의 물가상승 반영
  for (let m = 0; m < depletionYear * 12; m++) {
    expense *= 1 + monthlyInflRate;
  }

  // 고갈 후 남은 기간의 생활비 합산
  let shortfall = 0;
  const remainingMonths = (totalWithdrawYears - depletionYear) * 12;
  for (let m = 0; m < remainingMonths; m++) {
    shortfall += expense;
    expense *= 1 + monthlyInflRate;
  }

  return shortfall;
}

// ── 몬테카를로 은퇴 성공률 시뮬레이션 ────────────────────────────

/**
 * 수익률에 변동성을 반영한 몬테카를로 시뮬레이션으로 은퇴 성공확률 산출
 * @param {Object} params - simulateRetirement와 동일 파라미터
 * @param {number} volatilityPct - 연환산 변동성 (%)
 * @param {number} iterations - 시뮬레이션 횟수
 * @returns {Object} {successRate, percentiles}
 */
export function monteCarloRetirement(params, volatilityPct = 15, iterations = 1000) {
  const {
    retirementAge,
    lifeExpectancy,
    monthlyExpense,
    inflationPct = 2.5,
    withdrawalReturnPct,
  } = params;

  // 먼저 적립기 시뮬레이션으로 은퇴시점 자산 확보
  const base = simulateRetirement(params);
  const retirementBalance = base.retirementBalance;

  const withdrawYears = lifeExpectancy - retirementAge;
  const monthlyVol = (volatilityPct / 100) / Math.sqrt(12);
  const monthlyReturn = withdrawalReturnPct / 100 / 12;
  const monthlyInflRate = inflationPct / 100 / 12;

  let successCount = 0;
  const finalBalances = [];

  for (let i = 0; i < iterations; i++) {
    let bal = retirementBalance;
    let expense = monthlyExpense;
    let depleted = false;

    for (let y = 0; y < withdrawYears && !depleted; y++) {
      for (let m = 0; m < 12 && !depleted; m++) {
        // Box-Muller 정규분포 랜덤
        const u1 = Math.max(Math.random(), 1e-10);
        const u2 = Math.max(Math.random(), 1e-10);
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        const r = monthlyReturn + z * monthlyVol;
        bal = bal * (1 + r) - expense;
        expense *= 1 + monthlyInflRate;

        if (bal <= 0) {
          depleted = true;
        }
      }
    }

    if (!depleted) successCount++;
    finalBalances.push(Math.max(0, bal));
  }

  finalBalances.sort((a, b) => a - b);

  return {
    successRate: Math.round((successCount / iterations) * 100),
    median: Math.round(finalBalances[Math.floor(iterations * 0.5)]),
    p10: Math.round(finalBalances[Math.floor(iterations * 0.1)]),
    p25: Math.round(finalBalances[Math.floor(iterations * 0.25)]),
    p75: Math.round(finalBalances[Math.floor(iterations * 0.75)]),
    p90: Math.round(finalBalances[Math.floor(iterations * 0.9)]),
  };
}

// ── 포맷 유틸 ──────────────────────────────────────────────────

export function formatManWon(value) {
  if (!Number.isFinite(value)) return '-';

  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)}억`;
  }

  return `${value.toLocaleString('ko-KR')}만`;
}
