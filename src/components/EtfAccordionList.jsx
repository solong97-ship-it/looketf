import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TYPE_LABEL } from '../data/etfs';
import { formatKrw, formatPercent } from '../utils/metrics';

function ReturnBadge({ value }) {
  const positive = (value ?? 0) >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        positive ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'
      }`}
    >
      {formatPercent(value)}
    </span>
  );
}

function DetailRow({ label, value, emphasis = false }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${emphasis ? 'text-slate-100' : 'text-slate-200/90'}`}>
        {value}
      </p>
    </div>
  );
}

export default function EtfAccordionList({ items }) {
  const firstCode = useMemo(() => items[0]?.code ?? null, [items]);
  const [openCode, setOpenCode] = useState(firstCode);

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const expanded = openCode === item.code;

        return (
          <article
            key={item.code}
            className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 shadow-glass backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setOpenCode((prev) => (prev === item.code ? null : item.code))}
              className="w-full px-4 py-3 text-left transition hover:bg-slate-800/45"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-slate-100">{item.name}</h3>
                    <span className="rounded-full border border-slate-600/80 px-2 py-0.5 text-[10px] text-slate-300">
                      {TYPE_LABEL[item.type] ?? item.type}
                    </span>
                    {item.subClass && (
                      <span className="rounded-full border border-slate-700/80 px-2 py-0.5 text-[10px] text-slate-400">
                        {item.subClass}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">{item.code}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-medium text-slate-200">현재가 {formatKrw(item.currentPrice)}</span>
                    <span className="text-slate-400">1M</span>
                    <ReturnBadge value={item.return1M} />
                  </div>
                </div>
                <span className="rounded-xl border border-slate-700/80 p-1.5 text-slate-300">
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </div>
            </button>

            {expanded && (
              <div className="grid grid-cols-2 gap-2 border-t border-slate-700/70 bg-slate-900/70 px-4 py-3 sm:grid-cols-5">
                <DetailRow label="1개월" value={formatPercent(item.return1M)} emphasis />
                <DetailRow label="3개월" value={formatPercent(item.return3M)} />
                <DetailRow label="6개월" value={formatPercent(item.return6M)} />
                <DetailRow label="배당률" value={`${item.dividendYield.toFixed(2)}%`} />
                <DetailRow label="기대수익(연)" value={`${(item.expectedReturn * 100).toFixed(1)}%`} />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
