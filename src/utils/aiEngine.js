/**
 * 모드 2: AI 비전 시뮬레이션 엔진 (10년)
 *
 * GBM 기반 10년 자산 성장 시뮬레이션
 * S_i(t+dt) = S_i(t) × exp[(α_i × μ_i - σ_i²/2) × dt + σ_i × √dt × ε_i(t)]
 *
 * - Itô 보정항(-σ²/2) 포함
 * - Cholesky 분해로 상관된 난수 생성
 * - (A) 10년 최대 성장: MDD ≤ 15%
 * - (B) 10년 밸런스:   MDD ≤ 10%
 */
import { choleskyDecompose, correlatedNormals } from './matrix';
import {
  calcAllDailyReturns,
  calcCalmar,
  calcCovarianceMatrix,
  calcCorrelationMatrix,
  calcMDD,
} from './metrics';
import { generateValidWeights } from './sampling';

const GBM_YEARS = 10;
const DAILY_STEPS = 252;
const TOTAL_STEPS = GBM_YEARS * DAILY_STEPS; // 2520
const DT = 1 / DAILY_STEPS;
const SQRT_DT = Math.sqrt(DT);

/**
 * AI 비전 시뮬레이션 실행
 * @param {Object[]} etfs - ETF_LIST
 * @param {Object} etfDataByCode - 종가 데이터
 * @param {Object} options - { iterations: 2000 }
 * @returns {Object} { maxGrowth, balanced, stats }
 */
export function runAISimulation(etfs, etfDataByCode, options = {}) {
  const iterations = options.iterations ?? 2000;
  const n = etfs.length;

  // 1. 일간 수익률에서 변동성과 상관행렬 추출
  const { returns: allReturns } = calcAllDailyReturns(etfs, etfDataByCode);
  const covMatrix = calcCovarianceMatrix(allReturns);
  const corrMatrix = calcCorrelationMatrix(covMatrix);

  // 각 자산의 연환산 변동성 (역사적)
  const sigmas = etfs.map((_, i) => Math.sqrt(Math.max(covMatrix[i][i], 0)));

  // Cholesky 분해
  const L = choleskyDecompose(corrMatrix);
  if (!L) {
    // 양의 정부호가 아닌 경우 대각 근사
    console.warn('Cholesky 분해 실패, 독립 난수 사용');
  }

  // GBM 드리프트: α_i × μ_i (하드코딩 기대수익률 × AI Alpha)
  const drifts = etfs.map((etf) => etf.aiAlpha * etf.expectedReturn);

  // 2. 유효 비중 생성
  const weightSets = generateValidWeights(etfs, iterations);

  // 3. 각 비중에 대해 GBM 시뮬레이션
  const results = [];

  for (const w of weightSets) {
    const portfolioCurve = simulateGBM(w, n, drifts, sigmas, L);

    const vStart = portfolioCurve[0];
    const vEnd = portfolioCurve[portfolioCurve.length - 1];
    const cagr = Math.pow(vEnd / vStart, 1 / GBM_YEARS) - 1;
    const mdd = calcMDD(portfolioCurve);
    const calmar = calcCalmar(cagr, mdd);

    // 연환산 변동성 (포트폴리오 곡선에서)
    let volSum = 0;
    for (let t = 1; t < portfolioCurve.length; t++) {
      const r = portfolioCurve[t] / portfolioCurve[t - 1] - 1;
      volSum += r * r;
    }
    const annualVol = Math.sqrt((volSum / (portfolioCurve.length - 1)) * 252);

    // 가중 배당률
    let dividend = 0;
    for (let i = 0; i < n; i++) {
      dividend += w[i] * etfs[i].dividendYield;
    }

    results.push({
      w: [...w],
      curve: portfolioCurve,
      cagr,
      mdd,
      calmar,
      annualVol,
      dividend,
    });
  }

  // 4. 포트폴리오 선정
  // (A) 최대 성장: MDD ≤ 15%인 것 중 CAGR 최대
  const growthCandidates = results.filter((r) => r.mdd <= 0.15);
  growthCandidates.sort((a, b) => b.cagr - a.cagr);
  const maxGrowthResult = growthCandidates[0] ?? null;

  // (B) 밸런스: MDD ≤ 10%인 것 중 CAGR 최대
  const balancedCandidates = results.filter((r) => r.mdd <= 0.10);
  balancedCandidates.sort((a, b) => b.cagr - a.cagr);
  const balancedResult = balancedCandidates[0] ?? null;

  return {
    maxGrowth: buildAIResult(maxGrowthResult, etfs, '10년 최대 성장'),
    balanced: buildAIResult(balancedResult, etfs, '10년 밸런스'),
    stats: {
      generated: iterations,
      valid: weightSets.length,
      growthCandidates: growthCandidates.length,
      balancedCandidates: balancedCandidates.length,
    },
  };
}

/**
 * 단일 비중에 대한 GBM 경로 시뮬레이션
 * @returns {number[]} 포트폴리오 가치 곡선 (길이 = TOTAL_STEPS + 1)
 */
function simulateGBM(w, n, drifts, sigmas, L) {
  // 각 자산의 현재 가격 (정규화: 1.0)
  const prices = new Array(n).fill(1.0);
  const portfolioCurve = new Array(TOTAL_STEPS + 1);

  // 초기 포트폴리오 가치
  let pValue = 0;
  for (let i = 0; i < n; i++) pValue += w[i] * prices[i];
  portfolioCurve[0] = pValue;

  for (let t = 1; t <= TOTAL_STEPS; t++) {
    // 상관된 정규 난수 (Cholesky 또는 독립)
    const eps = L ? correlatedNormals(L) : independentNormals(n);

    // GBM 가격 업데이트
    for (let i = 0; i < n; i++) {
      const drift = drifts[i];
      const sigma = sigmas[i];
      // S(t+dt) = S(t) × exp[(αμ - σ²/2)×dt + σ×√dt×ε]
      const exponent = (drift - (sigma * sigma) / 2) * DT + sigma * SQRT_DT * eps[i];
      prices[i] *= Math.exp(exponent);
    }

    // 포트폴리오 가치 (일별 리밸런싱 가정)
    pValue = 0;
    for (let i = 0; i < n; i++) pValue += w[i] * prices[i];
    portfolioCurve[t] = pValue;
  }

  return portfolioCurve;
}

/**
 * L이 없을 때 독립 정규 난수 생성
 */
function independentNormals(n) {
  const result = new Array(n);
  for (let i = 0; i < n; i += 2) {
    const u1 = Math.max(Math.random(), 1e-10);
    const u2 = Math.max(Math.random(), 1e-10);
    const r = Math.sqrt(-2 * Math.log(u1));
    result[i] = r * Math.cos(2 * Math.PI * u2);
    if (i + 1 < n) result[i + 1] = r * Math.sin(2 * Math.PI * u2);
  }
  return result;
}

/**
 * AI 시뮬레이션 결과 포맷팅
 */
function buildAIResult(result, etfs, label) {
  if (!result) {
    return {
      label,
      weights: [],
      cagr: 0,
      mdd: 0,
      calmar: null,
      annualVol: 0,
      dividend: 0,
      curve: [],
    };
  }

  const weights = etfs
    .map((etf, i) => ({
      code: etf.code,
      name: etf.name,
      type: etf.type,
      subClass: etf.subClass,
      weight: result.w[i] * 100,
    }))
    .sort((a, b) => b.weight - a.weight);

  // 곡선을 월별로 다운샘플링 (2521 → ~121점)
  const step = Math.max(1, Math.floor(DAILY_STEPS / 12));
  const sampledCurve = [];
  for (let i = 0; i < result.curve.length; i += step) {
    sampledCurve.push({
      day: i,
      year: Number((i / DAILY_STEPS).toFixed(2)),
      value: Number((result.curve[i] * 100).toFixed(2)),
    });
  }
  // 마지막 점 보장
  if (sampledCurve[sampledCurve.length - 1]?.day !== result.curve.length - 1) {
    sampledCurve.push({
      day: result.curve.length - 1,
      year: GBM_YEARS,
      value: Number((result.curve[result.curve.length - 1] * 100).toFixed(2)),
    });
  }

  return {
    label,
    weights,
    cagr: result.cagr * 100,
    mdd: result.mdd * 100,
    calmar: result.calmar,
    annualVol: result.annualVol * 100,
    dividend: result.dividend,
    curve: sampledCurve,
  };
}
