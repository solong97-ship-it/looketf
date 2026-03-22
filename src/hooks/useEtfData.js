import { useCallback, useEffect, useMemo, useState } from 'react';

const TRADING_DAYS_IN_YEAR = 252;
const HISTORY_POINTS = TRADING_DAYS_IN_YEAR + 1;

const ANNUAL_PROFILE = {
  stock:       { minReturn: 0.1,  maxReturn: 0.2,   minVol: 0.18, maxVol: 0.27, basePrice: 18000 },
  alternative: { minReturn: 0.07, maxReturn: 0.15,  minVol: 0.12, maxVol: 0.2,  basePrice: 13000 },
  mixed:       { minReturn: 0.06, maxReturn: 0.11,  minVol: 0.08, maxVol: 0.13, basePrice: 11000 },
  bond:        { minReturn: 0.045,maxReturn: 0.085, minVol: 0.05, maxVol: 0.09, basePrice: 10500 },
  cash:        { minReturn: 0.03, maxReturn: 0.045, minVol: 0.015,maxVol: 0.03, basePrice: 10200 },
};

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function randomBetween(rng, min, max) {
  return min + (max - min) * rng();
}

function randomNormal(rng) {
  const u1 = Math.max(rng(), 1e-10);
  const u2 = Math.max(rng(), 1e-10);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function generateFallbackSeries(code, type) {
  const profile = ANNUAL_PROFILE[type] ?? ANNUAL_PROFILE.stock;
  const seed = Number.parseInt(code, 10) || 1;
  const rng = seededRandom(seed);

  const annualReturn = randomBetween(rng, profile.minReturn, profile.maxReturn);
  const annualVolatility = randomBetween(rng, profile.minVol, profile.maxVol);
  const dailyDrift = Math.pow(1 + annualReturn, 1 / TRADING_DAYS_IN_YEAR) - 1;
  const dailyVol = annualVolatility / Math.sqrt(TRADING_DAYS_IN_YEAR);

  let price = profile.basePrice * randomBetween(rng, 0.85, 1.2);
  const closes = [];

  for (let i = 0; i < HISTORY_POINTS; i++) {
    const shockWindow = i > 92 && i < 112;
    const stress = shockWindow ? randomBetween(rng, -0.0055, -0.0015) : 0;
    const dailyReturn = dailyDrift + randomNormal(rng) * dailyVol + stress;
    price = Math.max(price * (1 + dailyReturn), profile.basePrice * 0.32);
    closes.push(Number(price.toFixed(2)));
  }

  return closes;
}

function buildCandidateUrls(code, type) {
  const apiBase = import.meta.env.VITE_ETF_API_BASE;
  const normalizedBase = apiBase ? apiBase.replace(/\/$/, '') : '';

  if (type === 'current') {
    return [
      `${normalizedBase}/api/etf/current?code=${code}`,
      `${normalizedBase}/api/etf/${code}/current`,
      `${normalizedBase}/api/etf/price?code=${code}`,
    ];
  }

  return [
    `${normalizedBase}/api/etf/history?code=${code}&range=1y`,
    `${normalizedBase}/api/etf/${code}/history?range=1y`,
    `${normalizedBase}/api/etf/close-series?code=${code}&days=${HISTORY_POINTS}`,
  ];
}

function extractNumber(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const direct = [
    payload.currentPrice, payload.price, payload.close,
    payload.last, payload.value,
    payload?.data?.currentPrice, payload?.data?.price,
    payload?.result?.currentPrice,
  ];
  for (const value of direct) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return null;
}

function normalizeCloses(raw) {
  const values = raw
    .map((v) => {
      if (typeof v === 'number') return v;
      if (v && typeof v === 'object') return Number(v.close ?? v.price ?? v.value);
      return Number(v);
    })
    .filter((v) => Number.isFinite(v) && v > 0);
  return values.length >= 120 ? values : null;
}

function extractCloseSeries(payload) {
  if (Array.isArray(payload)) return normalizeCloses(payload);
  const possibilities = [
    payload?.closes, payload?.closePrices, payload?.prices,
    payload?.data?.closes, payload?.data?.prices, payload?.result?.closes,
  ];
  for (const option of possibilities) {
    if (Array.isArray(option)) {
      const normalized = normalizeCloses(option);
      if (normalized) return normalized;
    }
  }
  return null;
}

async function fetchJsonWithTimeout(url, timeout = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchCurrentPrice(code) {
  for (const url of buildCandidateUrls(code, 'current')) {
    const payload = await fetchJsonWithTimeout(url);
    const price = extractNumber(payload);
    if (Number.isFinite(price)) return price;
  }
  return null;
}

async function fetchOneYearCloses(code) {
  let bestEffortCloses = null;
  for (const url of buildCandidateUrls(code, 'history')) {
    const payload = await fetchJsonWithTimeout(url, 3000);
    const closes = extractCloseSeries(payload);
    if (closes && closes.length > TRADING_DAYS_IN_YEAR) return closes;
    if (closes && (!bestEffortCloses || closes.length > bestEffortCloses.length)) {
      bestEffortCloses = closes;
    }
  }
  return bestEffortCloses?.length > TRADING_DAYS_IN_YEAR ? bestEffortCloses : null;
}

function buildInitialState(etfs) {
  return Object.fromEntries(
    etfs.map((etf) => [
      etf.code,
      { ...etf, currentPrice: null, closes: [], loading: true, isFallback: false, error: null },
    ]),
  );
}

export function useEtfData(etfs) {
  const [etfDataByCode, setEtfDataByCode] = useState(() => buildInitialState(etfs));
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const entries = await Promise.all(
      etfs.map(async (etf) => {
        const [priceResult, closeResult] = await Promise.allSettled([
          fetchCurrentPrice(etf.code),
          fetchOneYearCloses(etf.code),
        ]);

        const closesFromApi = closeResult.status === 'fulfilled' ? closeResult.value : null;
        const closes = closesFromApi?.length
          ? closesFromApi
          : generateFallbackSeries(etf.code, etf.type);

        const priceFromApi = priceResult.status === 'fulfilled' ? priceResult.value : null;
        const currentPrice = Number.isFinite(priceFromApi) ? priceFromApi : closes[closes.length - 1];
        const isFallback = !closesFromApi || !Number.isFinite(priceFromApi);

        return [
          etf.code,
          { ...etf, currentPrice, closes, loading: false, isFallback, error: null },
        ];
      }),
    );

    setEtfDataByCode(Object.fromEntries(entries));
    setLoading(false);
  }, [etfs]);

  useEffect(() => {
    let mounted = true;
    (async () => { if (mounted) await load(); })();
    return () => { mounted = false; };
  }, [load]);

  const stats = useMemo(() => {
    const values = Object.values(etfDataByCode);
    const fallbackCount = values.filter((item) => item.isFallback).length;
    return { total: values.length, fallbackCount, apiCount: values.length - fallbackCount };
  }, [etfDataByCode]);

  return { loading, etfDataByCode, stats, reload: load };
}
