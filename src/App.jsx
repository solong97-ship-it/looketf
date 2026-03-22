import {
  Activity,
  BrainCircuit,
  LoaderCircle,
  RefreshCcw,
  Rocket,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import EtfAccordionList from './components/EtfAccordionList';
import PortfolioChart from './components/PortfolioChart';
import PortfolioSummaryCard from './components/PortfolioSummaryCard';
import { ETF_LIST } from './data/etfs';
import { useEtfData } from './hooks/useEtfData';
import { calculatePeriodReturn, TRADING_DAYS } from './utils/metrics';
import { runMonteCarloOptimization } from './utils/portfolio';

const MODEL_TYPES = ['A', 'B', 'C'];

function EmptyOptimizationResult() {
  return {
    generated: 0,
    passedHardFilter: 0,
    passedAllFilters: 0,
    dividendRule: '아직 시뮬레이션이 실행되지 않았습니다.',
    models: {
      A: null,
      B: null,
      C: null,
    },
    chartData: [],
  };
}

export default function App() {
  const { loading, etfDataByCode, stats, reload } = useEtfData(ETF_LIST);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState(EmptyOptimizationResult);

  const etfRows = useMemo(() => {
    return ETF_LIST.map((etf) => {
      const entry = etfDataByCode[etf.code] ?? {};
      const closes = entry.closes ?? [];

      return {
        ...etf,
        currentPrice: entry.currentPrice,
        return1M: calculatePeriodReturn(closes, TRADING_DAYS.oneMonth),
        return3M: calculatePeriodReturn(closes, TRADING_DAYS.threeMonths),
        return6M: calculatePeriodReturn(closes, TRADING_DAYS.sixMonths),
      };
    });
  }, [etfDataByCode]);

  const readyForOptimization = useMemo(
    () => ETF_LIST.every((etf) => (etfDataByCode[etf.code]?.closes?.length ?? 0) > 180),
    [etfDataByCode],
  );

  const runOptimization = () => {
    if (!readyForOptimization || optimizing) {
      return;
    }

    setOptimizing(true);

    window.setTimeout(() => {
      const result = runMonteCarloOptimization(ETF_LIST, etfDataByCode, {
        iterations: 5000,
      });
      setOptimization(result);
      setOptimizing(false);
    }, 20);
  };

  const reloadData = async () => {
    await reload();
    setOptimization(EmptyOptimizationResult());
  };

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-glass backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -top-14 right-4 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full border border-slate-700/80 bg-slate-950/60 px-3 py-1 text-[11px] tracking-[0.16em] text-cyan-300">
              DRC • REAL-TIME ETF INTELLIGENCE
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
              looketf | 실시간 ETF 시세 & 포트폴리오 최적화 대시보드
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
              투트랙 페칭(현재가 + 1년 종가) 기반으로 5,000회 몬테카를로 시뮬레이션을 실행하고,
              수익률/방어력/배당금 기준의 최적 포트폴리오를 동시에 제안합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">ETF Universe</p>
              <p className="text-lg font-semibold text-slate-100">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Live/API</p>
              <p className="text-lg font-semibold text-emerald-300">{stats.apiCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Fallback</p>
              <p className="text-lg font-semibold text-amber-300">{stats.fallbackCount}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">ETF 아코디언 리스트</h2>
              <p className="text-xs text-slate-400 md:text-sm">
                접힘: 종목명·현재가·최근 1개월 수익률 | 펼침: 3개월·6개월·배당률 상세
              </p>
            </div>
            <button
              type="button"
              onClick={reloadData}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/65 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800/55"
            >
              <RefreshCcw size={14} />
              데이터 새로고침
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-20 animate-pulse rounded-2xl bg-slate-800/60" />
              ))}
            </div>
          ) : (
            <EtfAccordionList items={etfRows} />
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                  <BrainCircuit size={18} className="text-cyan-300" />
                  1년 데이터 기반 최적화 엔진
                </h2>
                <p className="text-xs text-slate-400 md:text-sm">
                  제약 조건 필터링 후 A/B/C 모델을 자동 선별합니다.
                </p>
              </div>

              <button
                type="button"
                disabled={!readyForOptimization || optimizing || loading}
                onClick={runOptimization}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {optimizing ? <LoaderCircle size={16} className="animate-spin" /> : <Rocket size={16} />}
                최적 포트폴리오 생성
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-slate-300">
                주식 개별 비중 ≤ 10%
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-slate-300">
                전체 종목 비중 ≤ 20%
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-slate-300">
                KOFR(439330) ≥ 5%
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-slate-300">
                가중 배당률 3~5% (유연 적용)
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-slate-300">
                1Y MDD ≤ 10%
              </div>
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-slate-300">
                1Y 실제 수익률 ≥ 8%
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/55 px-3 py-2 text-xs text-slate-300">
              <Activity size={14} className="text-cyan-300" />
              생성 {optimization.generated.toLocaleString()}개
              <span className="text-slate-500">|</span>
              하드필터 통과 {optimization.passedHardFilter.toLocaleString()}개
              <span className="text-slate-500">|</span>
              최종 후보 {optimization.passedAllFilters.toLocaleString()}개
              <span className="text-slate-500">|</span>
              {optimization.dividendRule}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {MODEL_TYPES.map((type) => (
              <PortfolioSummaryCard key={type} type={type} model={optimization.models[type]} />
            ))}
          </div>

          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
            <h2 className="mb-2 text-lg font-semibold text-slate-100">A/B/C 1년 가상 자산 흐름 (초기자본 100)</h2>
            <p className="mb-4 text-xs text-slate-400 md:text-sm">
              X축은 거래일, Y축은 자산 가치 변화이며 Recharts 멀티라인 차트로 세 모델의 궤적을 비교합니다.
            </p>
            <PortfolioChart chartData={optimization.chartData} models={optimization.models} />
          </div>
        </div>
      </section>
    </main>
  );
}
