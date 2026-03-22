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

const LABEL = {
  A: 'A 수익률 최대',
  B: 'B MDD 최소',
  C: 'C 배당률 최대',
};

const COLORS = {
  A: '#22d3ee',
  B: '#34d399',
  C: '#f59e0b',
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur">
      <p className="mb-2 font-medium text-slate-300">거래일 {label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div key={item.dataKey} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-300">{LABEL[item.dataKey]}</span>
            <span className="font-semibold text-slate-100">{item.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioChart({ chartData, models }) {
  const keys = Object.entries(models)
    .filter(([, model]) => Boolean(model))
    .map(([key]) => key);

  if (!chartData.length || !keys.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/45 text-sm text-slate-400">
        최적화 결과를 생성하면 A/B/C 포트폴리오의 1년 자산 곡선이 표시됩니다.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full rounded-2xl border border-slate-700/75 bg-slate-900/55 p-3 md:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 16, right: 12, bottom: 8, left: -8 }}>
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
            formatter={(value) => <span className="text-xs text-slate-300">{LABEL[value] ?? value}</span>}
          />

          {keys.map((key) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[key]}
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
