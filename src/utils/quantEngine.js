/**
 * 모드 1: 정통 퀀트 분석 엔진
 *
 * (A) "불패의 방패" — 최소 변동성 (Min-Vol)
 *     Minimize σ_p = √(wᵀΣw)
 *
 * (B) "황금비율" — 최대 샤프 (Max-Sharpe)
 *     Maximize (μ_p - r_f) / σ_p
 *
 * 몬테카를로 5,000회, 1년 일간 공분산 행렬 사용
 */
import { RISK_FREE_RATE } from '../data/etfs';
import { quadraticForm } from './matrix';
import {
  buildBacktestCurve,
  calcAllDailyReturns,
  calcCovarianceMatrix,
  calcMDD,
  calcSortino,
  curveToReturns,
} from './metrics';
import { generateValidWeights } from './sampling';

/**
 * 정통 퀀트 시뮬레이션 실행
 * @param {Object[]} etfs - ETF_LIST
 * @param {Object} etfDataByCode - 종가 데이터
 * @param {Object} options - { iterations: 5000 }
 * @returns {Object} { shield, golden, frontier, stats }
 */
export function runQuantSimulation(etfs, etfDataByCode, options = {}) {
  const iterations = options.iterations ?? 5000;

  // 1. 일간 수익률 및 공분산 행렬 계산
  const { returns: allReturns } = calcAllDailyReturns(etfs, etfDataByCode);
  const covMatrix = calcCovarianceMatrix(allReturns);

  // 2. 유효 비중 생성
  const weightSets = generateValidWeights(etfs, iterations);

  // 3. 각 비중의 기대수익/변동성/샤프 계산
  const frontier = [];
  let bestMinVol = null;
  let bestMaxSharpe = null;

  for (const w of weightSets) {
    // μ_p = Σ(w_i × expectedReturn_i) 하드코딩 기대수익률
    let mu = 0;
    for (let i = 0; i < etfs.length; i++) {
      mu += w[i] * etfs[i].expectedReturn;
    }

    // σ_p = √(wᵀΣw)
    const variance = quadraticForm(w, covMatrix);
    const sigma = Math.sqrt(Math.max(variance, 0));

    // Sharpe = (μ_p - r_f) / σ_p
    const sharpe = sigma > 0 ? (mu - RISK_FREE_RATE) / sigma : 0;

    const point = { w: [...w], mu, sigma, sharpe };
    frontier.push(point);

    // Min-Vol 후보
    if (!bestMinVol || sigma < bestMinVol.sigma) {
      bestMinVol = point;
    }

    // Max-Sharpe 후보
    if (!bestMaxSharpe || sharpe > bestMaxSharpe.sharpe) {
      bestMaxSharpe = point;
    }
  }

  // 4. 선정된 포트폴리오의 백테스트 수행
  const shield = buildPortfolioResult(
    bestMinVol,
    etfs,
    etfDataByCode,
    '불패의 방패',
  );

  const golden = buildPortfolioResult(
    bestMaxSharpe,
    etfs,
    etfDataByCode,
    '황금비율',
  );

  // 5. Efficient Frontier 데이터 (산점도용, 적당히 샘플링)
  const frontierData = frontier.map((p) => ({
    volatility: p.sigma * 100,
    expectedReturn: p.mu * 100,
    sharpe: p.sharpe,
  }));

  return {
    shield,
    golden,
    frontier: frontierData,
    stats: {
      generated: iterations,
      valid: weightSets.length,
    },
  };
}

/**
 * 선정된 비중의 상세 결과 빌드
 */
function buildPortfolioResult(point, etfs, etfDataByCode, label) {
  if (!point) {
    return {
      label,
      weights: [],
      mu: 0,
      sigma: 0,
      sharpe: 0,
      sortino: null,
      mdd: 0,
      curve: [],
      dividend: 0,
    };
  }

  const curve = buildBacktestCurve(point.w, etfs, etfDataByCode, 100);
  const dailyReturns = curveToReturns(curve);
  const mdd = calcMDD(curve);
  const sortino = calcSortino(dailyReturns, point.mu, RISK_FREE_RATE);

  // 가중 배당률
  let dividend = 0;
  for (let i = 0; i < etfs.length; i++) {
    dividend += point.w[i] * etfs[i].dividendYield;
  }

  // 비중 목록 (정렬)
  const weights = etfs
    .map((etf, i) => ({
      code: etf.code,
      name: etf.name,
      type: etf.type,
      subClass: etf.subClass,
      weight: point.w[i] * 100,
    }))
    .sort((a, b) => b.weight - a.weight);

  return {
    label,
    weights,
    mu: point.mu * 100,
    sigma: point.sigma * 100,
    sharpe: point.sharpe,
    sortino,
    mdd: mdd * 100,
    curve,
    dividend,
  };
}
