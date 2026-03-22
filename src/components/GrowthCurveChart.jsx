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
      <p className="mb-1 text-slate-400">{Number(label).toFixed(1)}년</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-slate-300">{item.name}</span>
          <span className="font-semibold text-slate-100">{Number(item.value).toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
}

export default function GrowthCurveChart({ maxGrowthCurve, balancedCurve }) {
  if (!maxGrowthCurve?.length && !balancedCurve?.length) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-dashed border-slate-700/70 text-sm text-slate-400">
        시뮬레이션 실행 후 10년 성장 곡선이 표시됩니다.
      </div>
    );
  }

  // 두 곡선을 year 기준으로 병합
  const yearMap = new Map();

  const addPoints = (curve, key) => {
    if (!curve) return;
    for (const pt of curve) {
      const existing = yearMap.get(pt.year) ?? { year: pt.year };
      existing[key] = pt.value;
      yearMap.set(pt.year, existing);
    }
  };

  addPoints(maxGrowthCurve, 'maxGrowth');
  addPoints(balancedCurve, 'balanced');

  const data = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  return (
    <div className="h-[360px] w-full rounded-2xl border border-slate-700/75 bg-slate-900/55 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 8, left: -4 }}>
          <CartesianGrid strokeDasharray="4 6" stroke="#334155" opacity={0.45} />
          <XAxis
            dataKey="year"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            label={{
              value: '년',
              position: 'insideBottomRight',
              offset: -4,
              fill: '#64748b',
              fontSize: 10,
            }}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            label={{
              value: '자산 가치',
              position: 'insideTopLeft',
              offset: 8,
              fill: '#64748b',
              fontSize: 10,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-slate-300">
                {value === 'maxGrowth' ? '최대 성장 (MDD≤15%)' : '밸런스 (MDD≤10%)'}
              </span>
            )}
          />
          {maxGrowthCurve?.length > 0 && (
            <Line
              name="maxGrowth"
              type="monotone"
              dataKey="maxGrowth"
              stroke="#f87171"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          )}
          {balancedCurve?.length > 0 && (
            <Line
              name="balanced"
              type="monotone"
              dataKey="balanced"
              stroke="#34d399"
              strokeWidth={2.2}
              dot={false}
              activeDot={{ r: 3 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
