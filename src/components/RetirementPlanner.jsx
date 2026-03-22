import {
  AlertTriangle,
  CheckCircle2,
  Heart,
  Landmark,
  LoaderCircle,
  PiggyBank,
  Play,
  Shield,
  Target,
  Wallet,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatManWon,
  monteCarloRetirement,
  simulateRetirement,
} from '../utils/retirement';

function InputField({ label, value, onChange, suffix, min, max, step = 1 }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-slate-400">
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-full rounded-lg border border-slate-700/70 bg-slate-950/60 px-3 py-2.5 pr-12 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, accent = false, warn = false }) {
  return (
    <div
      className={`rounded-xl border px-3 py-3 ${
        warn
          ? 'border-rose-500/40 bg-rose-950/30'
          : accent
            ? 'border-emerald-500/40 bg-emerald-950/30'
            : 'border-slate-700/60 bg-slate-900/50'
      }`}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={13} className={warn ? 'text-rose-400' : accent ? 'text-emerald-400' : 'text-slate-400'} />
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</span>
      </div>
      <p className={`text-lg font-bold ${warn ? 'text-rose-300' : accent ? 'text-emerald-300' : 'text-slate-100'}`}>
        {value}
      </p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur">
      <p className="mb-1 font-medium text-slate-300">{label}세</p>
      <p className="font-semibold text-slate-100">자산 {formatManWon(payload[0]?.value ?? 0)}원</p>
    </div>
  );
}

function SuccessGauge({ rate }) {
  const color = rate >= 80 ? 'text-emerald-300' : rate >= 50 ? 'text-amber-300' : 'text-rose-300';
  const bg = rate >= 80
    ? 'from-emerald-500/20 to-emerald-500/5'
    : rate >= 50
      ? 'from-amber-500/20 to-amber-500/5'
      : 'from-rose-500/20 to-rose-500/5';

  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-slate-700/60 bg-gradient-to-br ${bg} p-5`}>
      <div className={`text-4xl font-black ${color}`}>{rate}%</div>
      <p className="mt-1 text-xs text-slate-400">몬테카를로 성공확률</p>
      <p className="mt-0.5 text-[10px] text-slate-500">(1,000회 시뮬레이션)</p>
      <div className="mt-2">
        {rate >= 80 ? (
          <CheckCircle2 size={20} className="text-emerald-400" />
        ) : (
          <AlertTriangle size={20} className={rate >= 50 ? 'text-amber-400' : 'text-rose-400'} />
        )}
      </div>
    </div>
  );
}

export default function RetirementPlanner({ portfolioOptions = [] }) {
  // 포트폴리오 선택
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [customReturn, setCustomReturn] = useState(7);
  const [customVol, setCustomVol] = useState(12);

  // 입력 상태
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [currentSavings, setCurrentSavings] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(100);
  const [monthlyExpense, setMonthlyExpense] = useState(300);
  const [inflationPct, setInflationPct] = useState(2.5);

  // 결과 상태
  const [result, setResult] = useState(null);
  const [mcResult, setMcResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const selectedPortfolio = selectedIdx >= 0 ? portfolioOptions[selectedIdx] : null;
  const annualReturn = selectedPortfolio ? selectedPortfolio.expectedReturn : customReturn;
  const volatility = selectedPortfolio ? selectedPortfolio.volatility : customVol;

  const withdrawalReturnPct = useMemo(() => {
    return Math.max(2, annualReturn * 0.6);
  }, [annualReturn]);

  const runSimulation = useCallback(() => {
    if (simulating) return;
    setSimulating(true);

    setTimeout(() => {
      const params = {
        currentAge,
        retirementAge,
        lifeExpectancy,
        currentSavings,
        monthlyContribution,
        monthlyExpense,
        annualReturnPct: annualReturn,
        inflationPct,
        withdrawalReturnPct,
      };

      const sim = simulateRetirement(params);
      setResult(sim);

      const mc = monteCarloRetirement(params, volatility, 1000);
      setMcResult(mc);

      setSimulating(false);
    }, 30);
  }, [
    simulating, currentAge, retirementAge, lifeExpectancy,
    currentSavings, monthlyContribution, monthlyExpense,
    annualReturn, inflationPct, withdrawalReturnPct, volatility,
  ]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.fullTimeline.map((pt) => ({ age: pt.age, value: pt.value }));
  }, [result]);

  return (
    <div className="rounded-3xl border border-slate-700/60 bg-slate-900/55 p-4 shadow-glass backdrop-blur md:p-5">
      {/* 헤더 */}
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
          <Landmark size={18} className="text-cyan-300" />
          은퇴 자산 시뮬레이터
        </h2>
        <p className="text-xs text-slate-400">
          적립기 → 인출기 시뮬레이션 · 물가상승 반영 · 몬테카를로 성공확률
        </p>
      </div>

      {/* 포트폴리오 선택 */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold text-slate-300">수익률/변동성 기준 선택</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedIdx(-1)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition ${
              selectedIdx === -1
                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            직접 입력
          </button>
          {portfolioOptions.map((opt, idx) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                selectedIdx === idx
                  ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                  : 'border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {selectedIdx === -1 && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <InputField label="연 기대수익률" value={customReturn} onChange={setCustomReturn} suffix="%" min={0} max={30} step={0.5} />
            <InputField label="연 변동성" value={customVol} onChange={setCustomVol} suffix="%" min={0} max={50} step={0.5} />
          </div>
        )}

        {selectedPortfolio && (
          <div className="mt-3 rounded-xl border border-slate-700/70 bg-slate-950/40 px-4 py-2 text-xs text-slate-300">
            기대수익 {annualReturn.toFixed(1)}% · 변동성 {volatility.toFixed(1)}% · 인출기 {withdrawalReturnPct.toFixed(1)}% (보수적)
          </div>
        )}
      </div>

      {/* 입력 폼 */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InputField label="현재 나이" value={currentAge} onChange={setCurrentAge} suffix="세" min={20} max={70} />
        <InputField label="은퇴 나이" value={retirementAge} onChange={setRetirementAge} suffix="세" min={40} max={80} />
        <InputField label="기대 수명" value={lifeExpectancy} onChange={setLifeExpectancy} suffix="세" min={70} max={110} />
        <InputField label="물가상승률" value={inflationPct} onChange={setInflationPct} suffix="%" min={0} max={10} step={0.5} />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <InputField label="현재 투자 자산" value={currentSavings} onChange={setCurrentSavings} suffix="만원" min={0} />
        <InputField label="월 적립금" value={monthlyContribution} onChange={setMonthlyContribution} suffix="만원" min={0} />
        <InputField label="은퇴 후 월 생활비" value={monthlyExpense} onChange={setMonthlyExpense} suffix="만원" min={0} />
      </div>

      {/* 실행 버튼 */}
      <button
        type="button"
        disabled={simulating}
        onClick={runSimulation}
        className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        {simulating ? <LoaderCircle size={16} className="animate-spin" /> : <Play size={16} />}
        은퇴 시뮬레이션 실행
      </button>

      {/* 결과 */}
      {result && (
        <>
          {/* 핵심 결과 */}
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            <ResultCard icon={PiggyBank} label="은퇴시 자산" value={`${formatManWon(result.retirementBalance)}원`} accent />
            <ResultCard icon={Wallet} label="4% 룰 월 인출" value={`${formatManWon(result.safeMonthlyWithdrawal)}원`} />
            <ResultCard
              icon={Shield}
              label="안전 월 생활비"
              value={`${formatManWon(result.maxSafeExpense)}원`}
              accent={result.maxSafeExpense >= monthlyExpense}
              warn={result.maxSafeExpense < monthlyExpense}
            />
            <ResultCard
              icon={Heart}
              label={result.isSuccess ? '기대수명까지 유지' : '자산 고갈 나이'}
              value={result.isSuccess ? `${lifeExpectancy}세 달성` : `${result.depletionAge}세`}
              accent={result.isSuccess}
              warn={!result.isSuccess}
            />
            <ResultCard
              icon={Target}
              label="최종 잔액"
              value={`${formatManWon(result.finalBalance)}원`}
              accent={result.finalBalance > 0}
              warn={result.finalBalance === 0}
            />
            {!result.isSuccess && (
              <ResultCard icon={AlertTriangle} label="부족 자금" value={`${formatManWon(result.shortfall)}원`} warn />
            )}
          </div>

          {/* 몬테카를로 + 자산 차트 */}
          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[180px_1fr]">
            {mcResult && <SuccessGauge rate={mcResult.successRate} />}

            <div className="h-[300px] w-full rounded-2xl border border-slate-700/75 bg-slate-900/55 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: -4 }}>
                  <defs>
                    <linearGradient id="retireGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 6" stroke="#334155" opacity={0.45} />
                  <XAxis
                    dataKey="age"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    label={{ value: '나이 (세)', position: 'insideBottomRight', offset: -4, fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(v) => formatManWon(v)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    x={retirementAge}
                    stroke="#f59e0b"
                    strokeDasharray="6 4"
                    strokeWidth={1.5}
                    label={{ value: '은퇴', fill: '#f59e0b', fontSize: 11, position: 'top' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#retireGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 몬테카를로 상세 */}
          {mcResult && (
            <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 px-4 py-3">
              <h4 className="mb-2 text-xs font-semibold text-slate-300">
                몬테카를로 시뮬레이션 결과 (인출기, 변동성 {volatility.toFixed(1)}% 반영)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                {[
                  { label: '하위 10%', value: mcResult.p10, color: 'text-rose-300' },
                  { label: '하위 25%', value: mcResult.p25, color: 'text-slate-200' },
                  { label: '중앙값', value: mcResult.median, color: 'text-slate-100' },
                  { label: '상위 25%', value: mcResult.p75, color: 'text-slate-200' },
                  { label: '상위 10%', value: mcResult.p90, color: 'text-emerald-300' },
                  {
                    label: '성공확률',
                    value: `${mcResult.successRate}%`,
                    color: mcResult.successRate >= 80 ? 'text-emerald-300' : mcResult.successRate >= 50 ? 'text-amber-300' : 'text-rose-300',
                    raw: true,
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-slate-900/60 px-2 py-1.5">
                    <span className="text-slate-400">{item.label}</span>
                    <p className={`font-semibold ${item.color}`}>
                      {item.raw ? item.value : formatManWon(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 진단 */}
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              result.isSuccess
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                : 'border-rose-500/40 bg-rose-950/20 text-rose-200'
            }`}
          >
            {result.isSuccess ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold">노후 자산 안정 유지 가능</p>
                  <p className="mt-1 text-xs text-emerald-300/80">
                    현재 계획대로 투자를 유지하면 {lifeExpectancy}세까지 월 {formatManWon(monthlyExpense)}원 생활비를 충당하고도{' '}
                    {formatManWon(result.finalBalance)}원이 남습니다.
                    안전 인출 기준 월 최대 {formatManWon(result.maxSafeExpense)}원까지 사용 가능합니다.
                    {mcResult && ` 변동성을 고려한 성공확률은 ${mcResult.successRate}%입니다.`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-400" />
                <div>
                  <p className="font-semibold">자산 고갈 경고</p>
                  <p className="mt-1 text-xs text-rose-300/80">
                    현재 계획대로라면 약 {result.depletionAge}세에 자산이 고갈됩니다.
                    부족 자금은 약 {formatManWon(result.shortfall)}원입니다.
                    안전하게 유지하려면 월 생활비를 {formatManWon(result.maxSafeExpense)}원 이하로 줄이거나,
                    월 적립금을 늘리거나, 은퇴 시기를 늦추는 것을 고려하세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
