import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 text-slate-400">거래일 {label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-slate-300">{item.name}</span>
          <span className="font-semibold text-slate-100">{Number(item.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}

export default function BacktestChart({ shieldCurve, goldenCurve }) {
  if ((!shieldCurve?.length) && (!goldenCurve?.length)) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700/70 text-sm text-slate-400">
        시뮬레이션 실행 후 1년 백테스트 곡선이 표시됩니다.
      </div>
    );
  }

  const maxLen = Math.max(shieldCurve?.length ?? 0, goldenCurve?.length ?? 0);
  const data = Array.from({ length: maxLen }, (_, i) => ({
    day: i + 1,
    shield: shieldCurve?.[i] != null ? Number(shieldCurve[i].toFixed(2)) : undefined,
    golden: goldenCurve?.[i] != null ? Number(goldenCurve[i].toFixed(2)) : undefined,
  }));

  return (
    <div className="h-[320px] w-full rounded-2xl border border-slate-700/75 bg-slate-900/55 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: -4 }}>
          <CartesianGrid strokeDasharray="4 6" stroke="#334155" opacity={0.45} />
          <XAxis
            dataKey="day"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-300">
                {value === 'shield' ? '불패의 방패' : '황금비율'}
              </span>
            )}
          />
          {shieldCurve?.length > 0 && (
            <Line
              name="shield"
              type="monotone"
              dataKey="shield"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          )}
          {goldenCurve?.length > 0 && (
            <Line
              name="golden"
              type="monotone"
              dataKey="golden"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
