import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { TYPE_COLOR } from '../data/etfs';

const FALLBACK_COLORS = [
  '#22d3ee', '#34d399', '#f59e0b', '#a78bfa', '#f87171',
  '#38bdf8', '#2dd4bf', '#fbbf24', '#c084fc', '#fb923c',
  '#818cf8', '#4ade80', '#facc15',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="font-medium text-slate-200">{d.name}</p>
      <p className="text-slate-400">{d.value.toFixed(2)}%</p>
    </div>
  );
}

export default function DonutChart({ data, size = 160 }) {
  // data: [{name, value, type}]  value = weight %
  const filtered = data.filter((d) => d.value > 0.5);

  return (
    <ResponsiveContainer width={size} height={size}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="88%"
          paddingAngle={1}
          stroke="none"
        >
          {filtered.map((entry, idx) => (
            <Cell
              key={entry.name}
              fill={TYPE_COLOR[entry.type] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
