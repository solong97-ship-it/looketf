import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="text-slate-300">
        변동성 <span className="font-semibold text-slate-100">{d.volatility.toFixed(2)}%</span>
      </p>
      <p className="text-slate-300">
        기대수익 <span className="font-semibold text-slate-100">{d.expectedReturn.toFixed(2)}%</span>
      </p>
      <p className="text-slate-300">
        Sharpe <span className="font-semibold text-cyan-300">{d.sharpe.toFixed(3)}</span>
      </p>
    </div>
  );
}

export default function EfficientFrontierChart({ frontier, shieldPoint, goldenPoint }) {
  if (!frontier?.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-700/70 text-sm text-slate-400">
        시뮬레이션 실행 후 Efficient Frontier가 표시됩니다.
      </div>
    );
  }

  // 산점도 포인트 (성능을 위해 최대 800개 샘플링)
  const sampled = frontier.length > 800
    ? frontier.filter((_, i) => i % Math.ceil(frontier.length / 800) === 0)
    : frontier;

  // 특수 포인트
  const highlights = [];
  if (shieldPoint) {
    highlights.push({
      ...shieldPoint,
      label: '방패',
    });
  }
  if (goldenPoint) {
    highlights.push({
      ...goldenPoint,
      label: '황금',
    });
  }

  return (
    <div className="h-[320px] w-full rounded-2xl border border-slate-700/75 bg-slate-900/55 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="4 6" stroke="#334155" opacity={0.45} />
          <XAxis
            dataKey="volatility"
            type="number"
            name="변동성"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            label={{
              value: '변동성 σ (%)',
              position: 'insideBottomRight',
              offset: -4,
              fill: '#64748b',
              fontSize: 10,
            }}
          />
          <YAxis
            dataKey="expectedReturn"
            type="number"
            name="기대수익"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={{ stroke: '#475569' }}
            axisLine={{ stroke: '#475569' }}
            label={{
              value: '기대수익 μ (%)',
              position: 'insideTopLeft',
              offset: 8,
              fill: '#64748b',
              fontSize: 10,
            }}
          />
          <ZAxis dataKey="sharpe" range={[12, 12]} />
          <Tooltip content={<CustomTooltip />} />

          {/* 전체 포인트 */}
          <Scatter
            name="포트폴리오"
            data={sampled}
            fill="#475569"
            opacity={0.4}
          />

          {/* 방패 포인트 */}
          {shieldPoint && (
            <Scatter
              name="불패의 방패"
              data={[shieldPoint]}
              fill="#22d3ee"
              shape="star"
            >
              <ZAxis range={[120, 120]} />
            </Scatter>
          )}

          {/* 황금비율 포인트 */}
          {goldenPoint && (
            <Scatter
              name="황금비율"
              data={[goldenPoint]}
              fill="#f59e0b"
              shape="diamond"
            >
              <ZAxis range={[120, 120]} />
            </Scatter>
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
