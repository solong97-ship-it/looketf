import { Coins, Gauge, Shield, ShieldCheck, Sparkles, Target, TrendingUp } from 'lucide-react';
import DonutChart from './DonutChart';

const CARD_THEMES = {
  shield: {
    icon: ShieldCheck,
    accent: 'from-cyan-500/20 to-blue-600/10',
    border: 'border-cyan-400/40',
    iconColor: 'text-cyan-300',
  },
  golden: {
    icon: Target,
    accent: 'from-amber-500/20 to-orange-600/10',
    border: 'border-amber-400/40',
    iconColor: 'text-amber-300',
  },
  growth: {
    icon: TrendingUp,
    accent: 'from-rose-500/20 to-pink-600/10',
    border: 'border-rose-400/40',
    iconColor: 'text-rose-300',
  },
  balanced: {
    icon: Sparkles,
    accent: 'from-emerald-500/20 to-teal-600/10',
    border: 'border-emerald-400/40',
    iconColor: 'text-emerald-300',
  },
};

function MetricRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/40 px-2.5 py-2">
      <div className="flex items-center gap-1.5">
        <Icon size={12} className="text-slate-400" />
        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</span>
      </div>
      <span className={`text-sm font-bold ${accent ?? 'text-slate-100'}`}>{value}</span>
    </div>
  );
}

export default function PortfolioCard({ title, subtitle, theme = 'shield', result, mode = 'quant' }) {
  const t = CARD_THEMES[theme] ?? CARD_THEMES.shield;
  const Icon = t.icon;
  const hasData = result && result.weights?.length > 0;

  const donutData = hasData
    ? result.weights.filter((w) => w.weight > 0.5).map((w) => ({
        name: w.name,
        value: w.weight,
        type: w.type,
      }))
    : [];

  return (
    <article
      className={`rounded-2xl border ${t.border} bg-gradient-to-br ${t.accent} p-4 backdrop-blur`}
    >
      {/* 헤더 */}
      <header className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100">{title}</h3>
          <p className="text-[11px] text-slate-300/80">{subtitle}</p>
        </div>
        <span className={`rounded-xl border border-slate-700/70 bg-slate-900/50 p-2 ${t.iconColor}`}>
          <Icon size={16} />
        </span>
      </header>

      {!hasData ? (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-700/60 text-xs text-slate-400">
          시뮬레이션을 실행해 주세요.
        </div>
      ) : (
        <>
          {/* 도넛 + 핵심 지표 */}
          <div className="mb-3 flex items-center gap-3">
            <div className="shrink-0">
              <DonutChart data={donutData} size={120} />
            </div>
            <div className="flex-1 space-y-1.5">
              {mode === 'quant' ? (
                <>
                  <MetricRow
                    icon={TrendingUp}
                    label="기대수익"
                    value={`${result.mu?.toFixed(2) ?? '-'}%`}
                    accent={result.mu > 0 ? 'text-emerald-300' : 'text-rose-300'}
                  />
                  <MetricRow
                    icon={Gauge}
                    label="변동성"
                    value={`${result.sigma?.toFixed(2) ?? '-'}%`}
                  />
                  <MetricRow
                    icon={Shield}
                    label="Sharpe"
                    value={result.sharpe?.toFixed(3) ?? '-'}
                    accent={result.sharpe >= 1 ? 'text-emerald-300' : 'text-slate-100'}
                  />
                </>
              ) : (
                <>
                  <MetricRow
                    icon={TrendingUp}
                    label="10Y CAGR"
                    value={`${result.cagr?.toFixed(2) ?? '-'}%`}
                    accent={result.cagr > 0 ? 'text-emerald-300' : 'text-rose-300'}
                  />
                  <MetricRow
                    icon={Gauge}
                    label="변동성"
                    value={`${result.annualVol?.toFixed(2) ?? '-'}%`}
                  />
                  <MetricRow
                    icon={Target}
                    label="Calmar"
                    value={result.calmar?.toFixed(2) ?? '-'}
                    accent={result.calmar >= 1 ? 'text-emerald-300' : 'text-slate-100'}
                  />
                </>
              )}
            </div>
          </div>

          {/* 보조 지표 */}
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-slate-950/50 px-2 py-1.5 text-center">
              <p className="text-[9px] uppercase text-slate-500">MDD</p>
              <p className="text-xs font-bold text-rose-300">-{result.mdd?.toFixed(2) ?? '0'}%</p>
            </div>
            {mode === 'quant' ? (
              <div className="rounded-lg bg-slate-950/50 px-2 py-1.5 text-center">
                <p className="text-[9px] uppercase text-slate-500">Sortino</p>
                <p className="text-xs font-bold text-slate-100">{result.sortino?.toFixed(2) ?? '-'}</p>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-950/50 px-2 py-1.5 text-center">
                <p className="text-[9px] uppercase text-slate-500">CAGR</p>
                <p className="text-xs font-bold text-emerald-300">{result.cagr?.toFixed(1) ?? '0'}%</p>
              </div>
            )}
            <div className="rounded-lg bg-slate-950/50 px-2 py-1.5 text-center">
              <p className="text-[9px] uppercase text-slate-500">배당률</p>
              <p className="text-xs font-bold text-amber-300">{result.dividend?.toFixed(2) ?? '0'}%</p>
            </div>
          </div>

          {/* 비중 Top 5 */}
          <div className="space-y-1">
            {result.weights.slice(0, 6).map((w) => (
              <div
                key={w.code}
                className="flex items-center justify-between rounded-lg bg-slate-950/40 px-2.5 py-1.5 text-xs"
              >
                <div className="flex items-center gap-1.5 max-w-[70%]">
                  <span className="truncate text-slate-300">{w.name}</span>
                  <span className="shrink-0 text-[9px] text-slate-500">{w.subClass}</span>
                </div>
                <span className="font-bold text-slate-100">{w.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
