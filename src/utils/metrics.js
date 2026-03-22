/**
 * 포트폴리오 성과지표 및 통계 유틸리티
 */
import { RISK_FREE_RATE } from '../data/etfs';

export const TRADING_DAYS = {
  oneMonth: 21,
  threeMonths: 63,
  sixMonths: 126,
  oneYear: 252,
};

// ── 일간 수익률 계산 ─────────────────────────────────────

/**
 * 종가 배열에서 일간 수익률 배열 생성
 * @param {number[]} closes - 종가 배열 (시간순)
 * @returns {number[]} 일간 수익률 배열 (길이 = closes.length - 1)
 */
export function calcDailyReturns(closes) {
  const returns = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) {
      returns.push(closes[i] / closes[i - 1] - 1);
    }
  }
  return returns;
}

/**
 * 모든 ETF의 일간 수익률 행렬 생성 (정렬됨)
 * @param {Object[]} etfs - ETF_LIST
 * @param {Object} etfDataByCode - {code: {closes: number[]}}
 * @returns {{returns: number[][], length: number}} returns[i] = i번째 ETF 수익률
 */
export function calcAllDailyReturns(etfs, etfDataByCode) {
  // 공통 길이 맞추기
  const allCloses = etfs.map((etf) => etfDataByCode[etf.code]?.closes ?? []);
  const minLen = Math.min(...allCloses.map((c) => c.length));
  const aligned = allCloses.map((c) => c.slice(c.length - minLen));

  const returns = aligned.map((closes) => calcDailyReturns(closes));
  const retLen = Math.min(...returns.map((r) => r.length));
  const trimmed = returns.map((r) => r.slice(r.length - retLen));

  return { returns: trimmed, length: retLen };
}

// ── 공분산/상관 행렬 ──────────────────────────────────────

/**
 * 일간 수익률로부터 연율화 공분산 행렬 계산
 * Σ_annual(i,j) = Cov_daily(i,j) × 252
 * @param {number[][]} allReturns - allReturns[i] = i번째 자산의 일간 수익률
 * @returns {number[][]} n×n 공분산 행렬
 */
export function calcCovarianceMatrix(allReturns) {
  const n = allReturns.length;
  const T = allReturns[0]?.length ?? 0;
  if (T < 2) return Array.from({ length: n }, () => new Array(n).fill(0));

  // 평균
  const means = allReturns.map(
    (ret) => ret.reduce((s, r) => s + r, 0) / T,
  );

  // 공분산 (연율화)
  const cov = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let sum = 0;
      for (let t = 0; t < T; t++) {
        sum += (allReturns[i][t] - means[i]) * (allReturns[j][t] - means[j]);
      }
      const val = (sum / (T - 1)) * 252;
      cov[i][j] = val;
      cov[j][i] = val;
    }
  }

  return cov;
}

/**
 * 공분산 행렬에서 상관계수 행렬 추출
 * @param {number[][]} cov - 공분산 행렬
 * @returns {number[][]} 상관계수 행렬
 */
export function calcCorrelationMatrix(cov) {
  const n = cov.length;
  const corr = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const denom = Math.sqrt(cov[i][i] * cov[j][j]);
      corr[i][j] = denom > 0 ? cov[i][j] / denom : i === j ? 1 : 0;
    }
  }

  return corr;
}

// ── 포트폴리오 지표 ───────────────────────────────────────

/**
 * 기간 수익률 계산
 */
export function calculatePeriodReturn(closes = [], lookbackDays) {
  if (!Array.isArray(closes) || closes.length <= lookbackDays) return null;

  const latest = Number(closes[closes.length - 1]);
  const base = Number(closes[closes.length - 1 - lookbackDays]);

  if (!Number.isFinite(base) || !Number.isFinite(latest) || base <= 0) return null;
  return ((latest / base) - 1) * 100;
}

/**
 * MDD 계산 (곡선 배열에서)
 * MDD = max_t [(Peak_t - V_t) / Peak_t]
 * @param {number[]} curve - 자산 가치 곡선
 * @returns {number} MDD (0~1 스케일, 예: 0.08 = 8%)
 */
export function calcMDD(curve) {
  if (!curve || curve.length < 2) return 0;

  let peak = curve[0];
  let maxDD = 0;

  for (const v of curve) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  return maxDD;
}

/**
 * 소르티노 비율
 * Sortino = (μ_p - r_f) / σ_downside
 * σ_downside = √(Σ min(r_t - r_f_daily, 0)² / N) × √252
 * @param {number[]} dailyReturns - 포트폴리오 일간 수익률
 * @param {number} annualReturn - 포트폴리오 연환산 수익률 (소수, 예: 0.09)
 * @param {number} rf - 연간 무위험수익률 (소수)
 * @returns {number|null}
 */
export function calcSortino(dailyReturns, annualReturn, rf = RISK_FREE_RATE) {
  if (!dailyReturns || dailyReturns.length < 2) return null;

  const dailyRf = rf / 252;
  let downsideSqSum = 0;
  let count = 0;

  for (const r of dailyReturns) {
    const excess = r - dailyRf;
    if (excess < 0) {
      downsideSqSum += excess * excess;
    }
    count++;
  }

  const downsideDev = Math.sqrt(downsideSqSum / count) * Math.sqrt(252);
  if (downsideDev === 0) return null;

  return (annualReturn - rf) / downsideDev;
}

/**
 * 칼마 비율 = CAGR / |MDD|
 * @param {number} cagr - CAGR (소수)
 * @param {number} mdd - MDD (소수, 양수)
 * @returns {number|null}
 */
export function calcCalmar(cagr, mdd) {
  if (mdd === 0 || mdd == null || cagr == null) return null;
  return cagr / mdd;
}

/**
 * CAGR 계산
 * @param {number} vStart - 초기 가치
 * @param {number} vEnd - 최종 가치
 * @param {number} years - 기간 (년)
 * @returns {number} CAGR (소수)
 */
export function calcCAGR(vStart, vEnd, years) {
  if (vStart <= 0 || vEnd <= 0 || years <= 0) return 0;
  return Math.pow(vEnd / vStart, 1 / years) - 1;
}

/**
 * 백테스트: 비중 벡터와 실제 종가로 포트폴리오 가치 곡선 생성
 * @param {number[]} weights - 비중 배열 (ETF_LIST 순서)
 * @param {Object[]} etfs - ETF_LIST
 * @param {Object} etfDataByCode
 * @param {number} initialCapital
 * @returns {number[]} 일별 포트폴리오 가치 곡선
 */
export function buildBacktestCurve(weights, etfs, etfDataByCode, initialCapital = 100) {
  const allCloses = etfs.map((etf) => etfDataByCode[etf.code]?.closes ?? []);
  const minLen = Math.min(...allCloses.map((c) => c.length));
  if (minLen < 2) return [];

  // 최근 1년 + 1 데이터 사용
  const targetLen = Math.min(minLen, TRADING_DAYS.oneYear + 1);
  const aligned = allCloses.map((c) => c.slice(c.length - targetLen));

  const curve = [];
  for (let t = 0; t < targetLen; t++) {
    let value = 0;
    for (let i = 0; i < etfs.length; i++) {
      const startPrice = aligned[i][0];
      const price = aligned[i][t];
      if (startPrice > 0 && price > 0) {
        value += initialCapital * weights[i] * (price / startPrice);
      }
    }
    curve.push(value);
  }

  return curve;
}

/**
 * 포트폴리오 일간 수익률 (백테스트 곡선에서)
 */
export function curveToReturns(curve) {
  const returns = [];
  for (let i = 1; i < curve.length; i++) {
    if (curve[i - 1] > 0) {
      returns.push(curve[i] / curve[i - 1] - 1);
    }
  }
  return returns;
}

// ── 포맷 유틸 ─────────────────────────────────────────────

export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '-';
  const pct = typeof value === 'number' ? value : 0;
  const signed = pct > 0 ? `+${pct.toFixed(2)}` : pct.toFixed(2);
  return `${signed}%`;
}

export function formatKrw(value) {
  if (!Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}
