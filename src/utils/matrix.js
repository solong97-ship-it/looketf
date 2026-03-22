/**
 * 행렬 연산 및 확률분포 유틸리티
 * - Cholesky 분해
 * - 행렬-벡터 곱
 * - Box-Muller 정규분포 난수
 */

/**
 * Cholesky 분해: A = L × Lᵀ
 * @param {number[][]} A - 양의 정부호 대칭 행렬 (n×n)
 * @returns {number[][]|null} 하삼각 행렬 L, 실패 시 null
 */
export function choleskyDecompose(A) {
  const n = A.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        const diag = A[i][i] - sum;
        if (diag <= 1e-10) return null;
        L[i][j] = Math.sqrt(diag);
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

/**
 * 행렬-벡터 곱: result = A × v
 * @param {number[][]} A - m×n 행렬
 * @param {number[]} v - 길이 n 벡터
 * @returns {number[]} 길이 m 결과 벡터
 */
export function matVecMul(A, v) {
  const m = A.length;
  const result = new Array(m);
  for (let i = 0; i < m; i++) {
    let sum = 0;
    const row = A[i];
    for (let j = 0; j < row.length; j++) {
      sum += row[j] * v[j];
    }
    result[i] = sum;
  }
  return result;
}

/**
 * wᵀ × Σ × w (이차형식, 포트폴리오 분산 계산)
 * @param {number[]} w - 비중 벡터
 * @param {number[][]} sigma - 공분산 행렬
 * @returns {number} 포트폴리오 분산
 */
export function quadraticForm(w, sigma) {
  const n = w.length;
  let result = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      result += w[i] * sigma[i][j] * w[j];
    }
  }
  return result;
}

/**
 * Box-Muller 변환으로 n개의 독립 표준정규 난수 생성
 * @param {number} n - 생성할 난수 개수
 * @returns {number[]} N(0,1) 난수 배열
 */
export function boxMullerNormals(n) {
  const result = new Array(n);
  for (let i = 0; i < n; i += 2) {
    const u1 = Math.max(Math.random(), 1e-10);
    const u2 = Math.max(Math.random(), 1e-10);
    const r = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;
    result[i] = r * Math.cos(theta);
    if (i + 1 < n) {
      result[i + 1] = r * Math.sin(theta);
    }
  }
  return result;
}

/**
 * Cholesky L과 독립 정규 벡터 z로부터 상관된 정규 벡터 생성
 * ε = L × z
 * @param {number[][]} L - Cholesky 하삼각 행렬
 * @returns {number[]} 상관된 정규 난수 벡터
 */
export function correlatedNormals(L) {
  const n = L.length;
  const z = boxMullerNormals(n);
  return matVecMul(L, z);
}
