interface Props {
  logs: { date: string; weight: number }[];
}

const W = 320;
const H = 140;
const PAD = { top: 16, right: 12, bottom: 28, left: 36 };

export default function WeightChart({ logs }: Props) {
  if (logs.length < 2) {
    return (
      <div className="flex items-center justify-center h-36 text-white/30 text-xs">
        Log at least 2 entries to see your chart
      </div>
    );
  }

  const weights = logs.map((l) => l.weight);
  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / (logs.length - 1)) * chartW;
  const yScale = (w: number) => PAD.top + chartH - ((w - minW) / (maxW - minW)) * chartH;

  const points = logs.map((l, i) => `${xScale(i)},${yScale(l.weight)}`).join(" ");

  // At most 4 x-axis date labels
  const labelIndices =
    logs.length <= 4
      ? logs.map((_, i) => i)
      : [
          0,
          Math.floor(logs.length / 3),
          Math.floor((2 * logs.length) / 3),
          logs.length - 1,
        ];

  const gridWeights = [minW, Math.round((minW + maxW) / 2), maxW];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 160 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines + Y labels */}
      {gridWeights.map((w) => (
        <g key={w}>
          <line
            x1={PAD.left} x2={W - PAD.right}
            y1={yScale(w)} y2={yScale(w)}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1}
          />
          <text
            x={PAD.left - 4} y={yScale(w) + 4}
            textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize={9}
          >
            {w}
          </text>
        </g>
      ))}

      {/* Fill under line */}
      <polygon
        points={`${PAD.left},${PAD.top + chartH} ${points} ${W - PAD.right},${PAD.top + chartH}`}
        fill="url(#fillGrad)"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {logs.map((l, i) => (
        <circle
          key={i}
          cx={xScale(i)} cy={yScale(l.weight)} r={3}
          fill="#34d399" stroke="#0a0a0f" strokeWidth={1.5}
        />
      ))}

      {/* X-axis date labels (MM-DD) */}
      {labelIndices.map((i) => (
        <text
          key={i}
          x={xScale(i)} y={H - 6}
          textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={8}
        >
          {logs[i].date.slice(5)}
        </text>
      ))}
    </svg>
  );
}
