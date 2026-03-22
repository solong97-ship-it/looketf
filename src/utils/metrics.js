export const TRADING_DAYS = {
  oneMonth: 21,
  threeMonths: 63,
  sixMonths: 126,
};

export function calculatePeriodReturn(closes = [], lookbackDays) {
  if (!Array.isArray(closes) || closes.length <= lookbackDays) {
    return null;
  }

  const latest = Number(closes[closes.length - 1]);
  const base = Number(closes[closes.length - lookbackDays]);

  if (!Number.isFinite(latest) || !Number.isFinite(base) || base === 0) {
    return null;
  }

  return ((latest / base) - 1) * 100;
}

export function calculateOneYearReturn(closes = []) {
  if (!Array.isArray(closes) || closes.length < 2) {
    return null;
  }

  const start = Number(closes[0]);
  const end = Number(closes[closes.length - 1]);

  if (!Number.isFinite(start) || !Number.isFinite(end) || start === 0) {
    return null;
  }

  return ((end / start) - 1) * 100;
}

export function calculateMDDFromCurve(curve = []) {
  if (!Array.isArray(curve) || curve.length < 2) {
    return null;
  }

  let peak = curve[0];
  let maxDrawdown = 0;

  for (const value of curve) {
    if (!Number.isFinite(value)) {
      continue;
    }

    if (value > peak) {
      peak = value;
      continue;
    }

    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '-';
  }

  const signed = value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  return `${signed}%`;
}

export function formatKrw(value) {
  if (!Number.isFinite(value)) {
    return '-';
  }

  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildPortfolioCurve(weightsByCode, etfDataByCode, initialCapital = 100) {
  const weightedAssets = Object.entries(weightsByCode)
    .filter(([, weight]) => Number.isFinite(weight) && weight > 0)
    .map(([code, weight]) => {
      const closes = etfDataByCode[code]?.closes ?? [];
      return {
        code,
        weight,
        closes,
      };
    })
    .filter((asset) => asset.closes.length > 1);

  if (!weightedAssets.length) {
    return [];
  }

  const minLen = Math.min(...weightedAssets.map((asset) => asset.closes.length));
  if (minLen < 2) {
    return [];
  }

  const alignedAssets = weightedAssets.map((asset) => ({
    ...asset,
    closes: asset.closes.slice(-minLen),
  }));

  const curve = [initialCapital];
  let currentValue = initialCapital;

  for (let i = 1; i < minLen; i += 1) {
    let dailyReturn = 0;

    for (const asset of alignedAssets) {
      const previous = asset.closes[i - 1];
      const current = asset.closes[i];

      if (!Number.isFinite(previous) || !Number.isFinite(current) || previous === 0) {
        continue;
      }

      dailyReturn += asset.weight * ((current / previous) - 1);
    }

    currentValue *= (1 + dailyReturn);
    curve.push(currentValue);
  }

  return curve;
}
