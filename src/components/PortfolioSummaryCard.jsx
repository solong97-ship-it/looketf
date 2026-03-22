import { Coins, ShieldCheck, TrendingUp } from 'lucide-react';
import { formatPercent } from '../utils/metrics';

const MODEL_META = {
  A: {
    title: 'A | 수익률 최대',
    subtitle: '1년 수익률 극대화',
    icon: TrendingUp,
    accent: 'from-cyan-500/25 to-blue-500/10',
    border: 'border-cyan-400/45',
  },
  B: {
    title: 'B | MDD 최소',
    subtitle: '하방 방어력 우선',
    icon: ShieldCheck,
    accent: 'from-emerald-500/25 to-teal-500/10',
    border: 'border-emerald-400/45',
  },
  C: {
    title: 'C | 배당률 최대',
    subtitle: '현금흐름 우선',
    icon: Coins,
    accent: 'from-amber-500/25 to-orange-500/10',
    border: 'border-amber-400/45',
  },
};

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default function PortfolioSummaryCard({ type, model }) {
  const meta = MODEL_META[type];
  const Icon = meta.icon;

  return (
    <article
      className={`rounded-2xl border ${meta.border} bg-gradient-to-br ${meta.accent} p-4 backdrop-blur`}
    >
      <header className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{meta.title}</h3>
          <p className="text-xs text-slate-300/90">{meta.subtitle}</p>
        </div>
        <span className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-2 text-slate-200">
          <Icon size={16} />
        </span>
      </header>

      {model ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="1Y Return" value={formatPercent(model.oneYearReturn)} />
            <Metric label="MDD" value={formatPercent(-model.mdd)} />
            <Metric label="Dividend" value={`${model.dividend.toFixed(2)}%`} />
          </div>

          <div className="mt-3 space-y-1.5">
            {model.allocations.slice(0, 5).map((allocation) => (
              <div
                key={`${type}-${allocation.code}`}
                className="flex items-center justify-between rounded-lg bg-slate-950/45 px-2.5 py-1.5 text-xs"
              >
                <span className="max-w-[72%] truncate text-slate-300">{allocation.name}</span>
                <span className="font-semibold text-slate-100">{allocation.weight.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-700/70 bg-slate-900/40 p-3 text-xs text-slate-300">
          조건을 만족한 조합이 충분하지 않습니다. 데이터 재로드 후 다시 시도해 주세요.
        </p>
      )}
    </article>
  );
}
