interface Props {
  score: number; // 0–100
}

const R      = 44;
const CIRCUM = 2 * Math.PI * R;

function scoreColor(score: number): string {
  if (score >= 70) return "#10b981"; // emerald
  if (score >= 40) return "#f59e0b"; // amber
  return "#ef4444";                  // red
}

export default function ScoreRing({ score }: Props) {
  const pct    = Math.min(Math.max(score, 0), 100) / 100;
  const dash   = pct * CIRCUM;
  const color  = scoreColor(score);

  return (
    <div className="relative flex-shrink-0">
      <svg width={100} height={100} viewBox="0 0 100 100">
        {/* Track */}
        <circle
          cx={50} cy={50} r={R}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
        />
        {/* Fill — starts at top */}
        <circle
          cx={50} cy={50} r={R}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUM - dash}`}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        {/* Score label */}
        <text
          x={50} y={46}
          textAnchor="middle"
          fill="white"
          fontSize={18}
          fontWeight="bold"
        >
          {score}
        </text>
        <text
          x={50} y={60}
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize={9}
        >
          / 100
        </text>
      </svg>
    </div>
  );
}
