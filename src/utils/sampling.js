/**
 * Constrained Dirichlet Sampling
 * Dirichlet(α=1) 분포 기반 비중 생성 + 제약조건 클리핑/재분배
 */
import { ETF_CODE_KOFR, KOFR_MIN_WEIGHT } from '../data/etfs';

const EPS = 1e-6;

/**
 * 비중 벡터 유효성 검사
 * @param {number[]} w - 비중 배열 (ETF_LIST 순서)
 * @param {Object[]} etfs - ETF_LIST
 * @returns {boolean}
 */
export function isValidWeights(w, etfs) {
  const n = etfs.length;
  if (w.length !== n) return false;

  let sum = 0;
  for (let i = 0; i < n; i++) {
    if (w[i] < -EPS) return false;
    if (w[i] > etfs[i].maxWeight + EPS) return false;
    sum += w[i];
  }

  if (Math.abs(sum - 1.0) > EPS) return false;

  const kofrIdx = etfs.findIndex((e) => e.code === ETF_CODE_KOFR);
  if (kofrIdx >= 0 && w[kofrIdx] < KOFR_MIN_WEIGHT - EPS) return false;

  return true;
}

/**
 * 단일 비중 벡터 생성 시도
 */
function sampleOnce(etfs, kofrIdx) {
  const n = etfs.length;

  // Dirichlet(α=1): Gamma(1,1) = Exp(1) = -ln(U)
  const gammas = new Array(n);
  for (let i = 0; i < n; i++) {
    gammas[i] = -Math.log(Math.max(Math.random(), 1e-10));
  }
  const gSum = gammas.reduce((a, b) => a + b, 0);

  const w = new Array(n);
  for (let i = 0; i < n; i++) {
    w[i] = gammas[i] / gSum;
  }

  // KOFR 최소 보장 (정규화 후에도 유지되도록 약간 여유)
  if (w[kofrIdx] < KOFR_MIN_WEIGHT + 0.01) {
    const deficit = KOFR_MIN_WEIGHT + 0.01 - w[kofrIdx];
    w[kofrIdx] = KOFR_MIN_WEIGHT + 0.01;
    // 다른 종목에서 비례 차감
    const othersSum = w.reduce((s, v, i) => (i === kofrIdx ? s : s + v), 0);
    if (othersSum > deficit) {
      for (let i = 0; i < n; i++) {
        if (i !== kofrIdx) w[i] -= deficit * (w[i] / othersSum);
      }
    }
  }

  // 반복적 클리핑 + 재분배 (최대 5회)
  for (let pass = 0; pass < 5; pass++) {
    let excess = 0;
    let belowCapSum = 0;

    for (let i = 0; i < n; i++) {
      if (w[i] > etfs[i].maxWeight) {
        excess += w[i] - etfs[i].maxWeight;
        w[i] = etfs[i].maxWeight;
      } else {
        belowCapSum += w[i];
      }
    }

    if (excess > 0 && belowCapSum > 0) {
      for (let i = 0; i < n; i++) {
        if (w[i] < etfs[i].maxWeight) {
          w[i] += excess * (w[i] / belowCapSum);
        }
      }
    }

    // 정규화
    const total = w.reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (let i = 0; i < n; i++) w[i] /= total;
    }

    // KOFR 재확인
    if (w[kofrIdx] < KOFR_MIN_WEIGHT) {
      const deficit = KOFR_MIN_WEIGHT - w[kofrIdx];
      w[kofrIdx] = KOFR_MIN_WEIGHT;
      const rest = w.reduce((s, v, i) => (i === kofrIdx ? s : s + v), 0);
      if (rest > deficit) {
        for (let i = 0; i < n; i++) {
          if (i !== kofrIdx) w[i] -= deficit * (w[i] / rest);
        }
      }
      const t2 = w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < n; i++) w[i] /= t2;
    }

    if (isValidWeights(w, etfs)) return w;
  }

  return isValidWeights(w, etfs) ? w : null;
}

/**
 * count개의 유효 비중 벡터 생성
 * Constrained Dirichlet Sampling + Rejection 하이브리드
 * @param {Object[]} etfs - ETF_LIST
 * @param {number} count - 목표 개수
 * @returns {number[][]} 유효 비중 배열들
 */
export function generateValidWeights(etfs, count) {
  const results = [];
  const kofrIdx = etfs.findIndex((e) => e.code === ETF_CODE_KOFR);
  const maxAttempts = count * 20;
  let attempts = 0;

  while (results.length < count && attempts < maxAttempts) {
    attempts++;
    const w = sampleOnce(etfs, kofrIdx);
    if (w) results.push(w);
  }

  return results;
}
