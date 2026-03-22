import { ETF_CODE_KOFR } from '../data/etfs';
import { buildPortfolioCurve, calculateMDDFromCurve, calculateOneYearReturn } from './metrics';

const EPS = 1e-9;

export const DEFAULT_OPTIMIZATION_CONSTRAINTS = {
  iterations: 5000,
  maxStockWeight: 0.1,
  maxAssetWeight: 0.2,
  kofrMinWeight: 0.05,
  minDividend: 3,
  maxDividend: 5,
  maxMdd: 10,
  minOneYearReturn: 8,
};

function createRandomWeights(etfs) {
  const raw = etfs.map((etf) => {
    let value = Math.random() + 0.01;

    if (etf.type === 'stock') {
      value *= 0.62;
    }

    if (etf.type === 'cash' || etf.type === 'bond') {
      value *= 1.28;
    }

    if (etf.code === ETF_CODE_KOFR) {
      value *= 1.6;
    }

    return value;
  });

  const sum = raw.reduce((acc, value) => acc + value, 0);

  return Object.fromEntries(
    etfs.map((etf, idx) => [etf.code, raw[idx] / sum]),
  );
}

function calcWeightedDividend(weightsByCode, etfs) {
  return etfs.reduce((acc, etf) => {
    const weight = weightsByCode[etf.code] ?? 0;
    return acc + (weight * etf.dividendYield);
  }, 0);
}

function isHardConstraintSatisfied(weightsByCode, etfs, constraints) {
  for (const etf of etfs) {
    const weight = weightsByCode[etf.code] ?? 0;

    if (weight - constraints.maxAssetWeight > EPS) {
      return false;
    }

    if (etf.type === 'stock' && weight - constraints.maxStockWeight > EPS) {
      return false;
    }
  }

  const kofrWeight = weightsByCode[ETF_CODE_KOFR] ?? 0;
  if (constraints.kofrMinWeight - kofrWeight > EPS) {
    return false;
  }

  return true;
}

function toAllocationList(weightsByCode, etfs) {
  return etfs
    .map((etf) => ({
      code: etf.code,
      name: etf.name,
      type: etf.type,
      dividendYield: etf.dividendYield,
      weight: (weightsByCode[etf.code] ?? 0) * 100,
    }))
    .sort((a, b) => b.weight - a.weight);
}

function chooseDistinct(candidates, sorter, usedIds) {
  const sorted = [...candidates].sort(sorter);

  for (const candidate of sorted) {
    if (!usedIds.has(candidate.id)) {
      usedIds.add(candidate.id);
      return candidate;
    }
  }

  return sorted[0] ?? null;
}

function buildChartData(models) {
  const available = Object.entries(models).filter(([, model]) => Boolean(model));

  if (!available.length) {
    return [];
  }

  const minLen = Math.min(...available.map(([, model]) => model.curve.length));

  return Array.from({ length: minLen }, (_, i) => {
    const point = {
      day: i + 1,
    };

    for (const [key, model] of available) {
      point[key] = Number(model.curve[model.curve.length - minLen + i].toFixed(3));
    }

    return point;
  });
}

export function runMonteCarloOptimization(etfs, etfDataByCode, options = {}) {
  const constraints = {
    ...DEFAULT_OPTIMIZATION_CONSTRAINTS,
    ...options,
  };

  const candidates = [];

  for (let i = 0; i < constraints.iterations; i += 1) {
    const weightsByCode = createRandomWeights(etfs);

    if (!isHardConstraintSatisfied(weightsByCode, etfs, constraints)) {
      continue;
    }

    const curve = buildPortfolioCurve(weightsByCode, etfDataByCode, 100);
    if (curve.length < 2) {
      continue;
    }

    const oneYearReturn = calculateOneYearReturn(curve);
    const mdd = calculateMDDFromCurve(curve);
    const dividend = calcWeightedDividend(weightsByCode, etfs);

    if (
      oneYearReturn === null
      || mdd === null
      || oneYearReturn < constraints.minOneYearReturn
      || mdd > constraints.maxMdd
    ) {
      continue;
    }

    candidates.push({
      id: `${i}-${Math.random().toString(36).slice(2, 8)}`,
      weightsByCode,
      allocations: toAllocationList(weightsByCode, etfs),
      curve,
      oneYearReturn,
      mdd,
      dividend,
    });
  }

  const strictDividend = candidates.filter(
    (candidate) => candidate.dividend >= constraints.minDividend
      && candidate.dividend <= constraints.maxDividend,
  );

  let pool = strictDividend;
  let dividendRule = '배당률 3%~5% 조건 적용';

  if (!pool.length) {
    pool = candidates.filter((candidate) => candidate.dividend >= constraints.minDividend);
    dividendRule = '배당률 상단을 완화하고 3% 이상 조건 적용';
  }

  if (!pool.length && candidates.length) {
    pool = [...candidates]
      .sort(
        (a, b) => Math.abs(a.dividend - constraints.minDividend) - Math.abs(b.dividend - constraints.minDividend),
      )
      .slice(0, Math.min(candidates.length, 40));
    dividendRule = '배당률 근사치 허용(3% 목표 근접 순)';
  }

  const usedIds = new Set();

  const models = {
    A: chooseDistinct(
      pool,
      (a, b) => (b.oneYearReturn - a.oneYearReturn) || (a.mdd - b.mdd),
      usedIds,
    ),
    B: chooseDistinct(
      pool,
      (a, b) => (a.mdd - b.mdd) || (b.oneYearReturn - a.oneYearReturn),
      usedIds,
    ),
    C: chooseDistinct(
      pool,
      (a, b) => (b.dividend - a.dividend) || (b.oneYearReturn - a.oneYearReturn),
      usedIds,
    ),
  };

  const chartData = buildChartData(models);

  return {
    constraints,
    generated: constraints.iterations,
    passedHardFilter: candidates.length,
    passedAllFilters: pool.length,
    dividendRule,
    models,
    chartData,
  };
}
