import {
  Activity,
  BarChart3,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  Landmark,
  LoaderCircle,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import BacktestChart from './components/BacktestChart';
import EfficientFrontierChart from './components/EfficientFrontierChart';
import EtfAccordionList from './components/EtfAccordionList';
import GrowthCurveChart from './components/GrowthCurveChart';
import PortfolioCard from './components/PortfolioCard';
import RetirementPlanner from './components/RetirementPlanner';
import { ETF_LIST, TYPE_LABEL } from './data/etfs';
import { useEtfData } from './hooks/useEtfData';
import { calculatePeriodReturn, TRADING_DAYS } from './utils/metrics';
import { runQuantSimulation } from './utils/quantEngine';
import { runAISimulation } from './utils/aiEngine';

const TABS = [
  { key: 'quant', label: '정통 퀀트 분석 (1년)', icon: BarChart3, emoji: '📊' },
  { key: 'ai', label: 'AI 비전 시뮬레이션 (10년)', icon: Sparkles, emoji: '🚀' },
  { key: 'retirement', label: '은퇴 플래너', icon: Landmark, emoji: '🏦' },
];

export default function App() {
  const { loading, etfDataByCode, stats, reload } = useEtfData(ETF_LIST);
  const [activeTab, setActiveTab] = useState('quant');

  // ── Mode 1: 정통 퀀트 ──
  const [quantResult, setQuantResult] = useState(null);
  const [quantRunning, setQuantRunning] = useState(false);

  // ── Mode 2: AI 비전 ──
  const [aiResult, setAiResult] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);

  // ── ETF 리스트 확장 ──
  const [etfListOpen, setEtfListOpen] = useState(false);

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

  const readyForSim = useMemo(
    () =>
      !loading &&
      ETF_LIST.every(
        (etf) => (etfDataByCode[etf.code]?.closes?.length ?? 0) > TRADING_DAYS.oneYear,
      ),
    [etfDataByCode, loading],
  );

  // ── 시뮬레이션 실행 ──
  const runQuant = () => {
    if (!readyForSim || quantRunning) return;
    setQuantRunning(true);
    setTimeout(() => {
      const result = runQuantSimulation(ETF_LIST, etfDataByCode, { iterations: 5000 });
      setQuantResult(result);
      setQuantRunning(false);
    }, 30);
  };

  const runAI = () => {
    if (!readyForSim || aiRunning) return;
    setAiRunning(true);
    setTimeout(() => {
      const result = runAISimulation(ETF_LIST, etfDataByCode, { iterations: 2000 });
      setAiResult(result);
      setAiRunning(false);
    }, 30);
  };

  // ── Efficient Frontier 포인트 ──
  const shieldFrontierPoint = quantResult?.shield?.weights?.length
    ? { volatility: quantResult.shield.sigma, expectedReturn: quantResult.shield.mu, sharpe: quantResult.shield.sharpe }
    : null;
  const goldenFrontierPoint = quantResult?.golden?.weights?.length
    ? { volatility: quantResult.golden.sigma, expectedReturn: quantResult.golden.mu, sharpe: quantResult.golden.sharpe }
    : null;

  // ── 은퇴 플래너용 포트폴리오 옵션 ──
  const retirementOptions = useMemo(() => {
    const opts = [];
    if (quantResult?.shield?.weights?.length) {
      opts.push({
        label: '🛡️ 불패의 방패 (Min-Vol)',
        expectedReturn: quantResult.shield.mu,
        volatility: quantResult.shield.sigma,
        dividend: quantResult.shield.dividend,
      });
    }
    if (quantResult?.golden?.weights?.length) {
      opts.push({
        label: '⚖️ 황금비율 (Max-Sharpe)',
        expectedReturn: quantResult.golden.mu,
        volatility: quantResult.golden.sigma,
        dividend: quantResult.golden.dividend,
      });
    }
    if (aiResult?.maxGrowth?.weights?.length) {
      opts.push({
        label: '🚀 10년 최대 성장',
        expectedReturn: aiResult.maxGrowth.cagr,
        volatility: aiResult.maxGrowth.annualVol,
        dividend: aiResult.maxGrowth.dividend,
      });
    }
    if (aiResult?.balanced?.weights?.length) {
      opts.push({
        label: '✨ 10년 밸런스',
        expectedReturn: aiResult.balanced.cagr,
        volatility: aiResult.balanced.annualVol,
        dividend: aiResult.balanced.dividend,
      });
    }
    return opts;
  }, [quantResult, aiResult]);

  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      {/* ── 헤더 ── */}
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-glass backdrop-blur md:p-8">
        <div className="pointer-events-none absolute -top-14 right-4 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-teal-500/15 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full border border-slate-700/80 bg-slate-950/60 px-3 py-1 text-[11px] tracking-[0.16em] text-cyan-300">
              DRC • PORTFOLIO OPTIMIZATION ENGINE
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 md:text-3xl">
              LookETF
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">
              13개 ETF · 공분산 행렬 + GBM + Cholesky 기반 3가지 포트폴리오 철학 동시 제안
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Universe</p>
              <p className="text-lg font-bold text-slate-100">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">API</p>
              <p className="text-lg font-bold text-emerald-300">{stats.apiCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-400">Fallback</p>
              <p className="text-lg font-bold text-amber-300">{stats.fallbackCount}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ── 탭 네비게이션 ── */}
      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700/60 bg-slate-900/40 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ──────────────────────────────────────────────────── */}
      {/* 모드 1: 정통 퀀트 분석                              */}
      {/* ──────────────────────────────────────────────────── */}
      {activeTab === 'quant' && (
        <div className="space-y-5">
          {/* ETF 리스트 (접이식) */}
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
            <button
              type="button"
              onClick={() => setEtfListOpen((v) => !v)}
              className="flex w-full items-center justify-between text-left"
            >
              <div>
                <h2 className="text-lg font-semibold text-slate-100">13개 ETF Universe</h2>
                <p className="text-xs text-slate-400">
                  {Object.entries(TYPE_LABEL).map(([k, v]) => `${v}(${ETF_LIST.filter((e) => e.type === k).length})`).join(' · ')}
                </p>
              </div>
              <span className="rounded-xl border border-slate-700/70 p-2 text-slate-300">
                {etfListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {etfListOpen && (
              <div className="mt-4">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-800/60" />
                    ))}
                  </div>
                ) : (
                  <EtfAccordionList items={etfRows} />
                )}
              </div>
            )}
          </div>

          {/* 엔진 컨트롤 */}
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                  <BrainCircuit size={18} className="text-cyan-300" />
                  정통 퀀트 최적화 엔진
                </h2>
                <p className="text-xs text-slate-400">
                  1년 일간 공분산 행렬 · 몬테카를로 5,000회 · Constrained Dirichlet Sampling
                </p>
              </div>
              <button
                type="button"
                disabled={!readyForSim || quantRunning}
                onClick={runQuant}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {quantRunning ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Rocket size={16} />
                )}
                시뮬레이션 실행
              </button>
            </div>

            {/* 제약조건 */}
            <div className="mb-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
              {[
                '주식 개별 ≤ 10%',
                '전체 종목 ≤ 20%',
                'KOFR(439330) ≥ 5%',
                '총합 = 100%',
                '공매도 불허 (≥ 0%)',
                'Dirichlet + Rejection',
              ].map((rule) => (
                <div
                  key={rule}
                  className="rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2 text-slate-300"
                >
                  {rule}
                </div>
              ))}
            </div>

            {/* 통계 */}
            {quantResult && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/55 px-3 py-2 text-xs text-slate-300">
                <Activity size={14} className="text-cyan-300" />
                유효 비중 {quantResult.stats.valid.toLocaleString()}개 / {quantResult.stats.generated.toLocaleString()}회 시도
              </div>
            )}
          </div>

          {/* 두 포트폴리오 카드 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PortfolioCard
              title="🛡️ 불패의 방패"
              subtitle="최소 변동성 — 잃지 않는 것이 이기는 것"
              theme="shield"
              mode="quant"
              result={quantResult?.shield}
            />
            <PortfolioCard
              title="⚖️ 황금비율"
              subtitle="최대 샤프 — 위험 한 단위당 최대 보상"
              theme="golden"
              mode="quant"
              result={quantResult?.golden}
            />
          </div>

          {/* 차트 영역 */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
              <h3 className="mb-1 text-sm font-semibold text-slate-200">1년 백테스트 누적 수익률</h3>
              <p className="mb-3 text-[11px] text-slate-400">
                실제 종가 기반 · 초기자본 100 · 두 포트폴리오 궤적 비교
              </p>
              <BacktestChart
                shieldCurve={quantResult?.shield?.curve}
                goldenCurve={quantResult?.golden?.curve}
              />
            </div>
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
              <h3 className="mb-1 text-sm font-semibold text-slate-200">Efficient Frontier</h3>
              <p className="mb-3 text-[11px] text-slate-400">
                x=변동성(σ%) · y=기대수익(μ%) · 특수점: ★방패 ◆황금비율
              </p>
              <EfficientFrontierChart
                frontier={quantResult?.frontier}
                shieldPoint={shieldFrontierPoint}
                goldenPoint={goldenFrontierPoint}
              />
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────── */}
      {/* 모드 2: AI 비전 시뮬레이션 (10년)                    */}
      {/* ──────────────────────────────────────────────────── */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          {/* 엔진 컨트롤 */}
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
                  <Sparkles size={18} className="text-amber-300" />
                  AI 비전 시뮬레이션 — "10년 후의 나에게"
                </h2>
                <p className="text-xs text-slate-400">
                  GBM(기하학적 브라운 운동) · Cholesky 상관 난수 · AI Alpha · Itô 보정 · MC 2,000회
                </p>
              </div>
              <button
                type="button"
                disabled={!readyForSim || aiRunning}
                onClick={runAI}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiRunning ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Rocket size={16} />
                )}
                10년 시뮬레이션 실행
              </button>
            </div>

            {/* GBM 수식 설명 */}
            <div className="mb-4 rounded-xl border border-slate-700/70 bg-slate-950/50 px-4 py-3">
              <p className="mb-1 text-xs font-semibold text-slate-300">GBM 공식</p>
              <p className="font-mono text-[11px] text-slate-400">
                S(t+dt) = S(t) × exp[(α×μ - σ²/2)×dt + σ×√dt×ε]
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                ε = L×z (Cholesky 상관 정규 난수) · T=10년 · dt=1/252 · N=2,520일
              </p>
            </div>

            {/* AI Alpha 테이블 */}
            <div className="mb-4 grid grid-cols-3 gap-1.5 text-[11px] sm:grid-cols-4 md:grid-cols-7">
              {ETF_LIST.filter((e) => e.type === 'stock').map((etf) => (
                <div key={etf.code} className="rounded-lg border border-slate-700/60 bg-slate-950/50 px-2 py-1.5 text-center">
                  <p className="truncate text-slate-400">{etf.subClass}</p>
                  <p className="font-bold text-slate-200">α={etf.aiAlpha}</p>
                </div>
              ))}
            </div>

            {/* 통계 */}
            {aiResult && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-950/55 px-3 py-2 text-xs text-slate-300">
                <Activity size={14} className="text-amber-300" />
                유효 비중 {aiResult.stats.valid.toLocaleString()}개
                <span className="text-slate-500">|</span>
                MDD≤15% 후보 {aiResult.stats.growthCandidates.toLocaleString()}개
                <span className="text-slate-500">|</span>
                MDD≤10% 후보 {aiResult.stats.balancedCandidates.toLocaleString()}개
              </div>
            )}
          </div>

          {/* 두 포트폴리오 카드 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PortfolioCard
              title="🚀 10년 최대 성장"
              subtitle="MDD ≤ 15% 제약 하 CAGR 극대화"
              theme="growth"
              mode="ai"
              result={aiResult?.maxGrowth}
            />
            <PortfolioCard
              title="✨ 10년 밸런스"
              subtitle="MDD ≤ 10% 제약 하 방어적 성장"
              theme="balanced"
              mode="ai"
              result={aiResult?.balanced}
            />
          </div>

          {/* 10년 성장곡선 */}
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
            <h3 className="mb-1 text-sm font-semibold text-slate-200">10년 자산 성장 곡선</h3>
            <p className="mb-3 text-[11px] text-slate-400">
              초기자본 100 기준 · GBM 시뮬레이션 경로 · 일별 리밸런싱 가정
            </p>
            <GrowthCurveChart
              maxGrowthCurve={aiResult?.maxGrowth?.curve}
              balancedCurve={aiResult?.balanced?.curve}
            />
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────── */}
      {/* 모드 3: 은퇴 플래너                                 */}
      {/* ──────────────────────────────────────────────────── */}
      {activeTab === 'retirement' && (
        <RetirementPlanner portfolioOptions={retirementOptions} />
      )}
    </main>
  );
}
