interface Props {
  waterMl: number;
  waterGoalMl: number;
  onAdd: () => void;   // always adds 250ml
  loading: boolean;
}

function toL(ml: number): string {
  return (Math.round(ml / 100) / 10).toFixed(1) + "L";
}

export default function WaterTracker({ waterMl, waterGoalMl, onAdd, loading }: Props) {
  const pct    = waterGoalMl > 0 ? Math.min(waterMl / waterGoalMl, 1) : 0;
  const R      = 44;
  const CIRCUM = 2 * Math.PI * R;
  const dash   = pct * CIRCUM;
  const gap    = CIRCUM - dash;

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
      {/* Progress ring */}
      <div className="relative flex-shrink-0">
        <svg width={100} height={100} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx={50} cy={50} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={8}
          />

          {/* Fill — clamped to 100%, starts at top */}
          <circle
            cx={50} cy={50} r={R}
            fill="none"
            stroke="url(#waterGrad)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            transform="rotate(-90 50 50)"
          />

          {/* Current value */}
          <text
            x={50} y={46}
            textAnchor="middle"
            fill="white"
            fontSize={13}
            fontWeight="bold"
          >
            {toL(waterMl)}
          </text>

          {/* Goal label */}
          <text
            x={50} y={60}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize={9}
          >
            of {toL(waterGoalMl)}
          </text>
        </svg>
      </div>

      {/* Label + button */}
      <div className="flex-1 space-y-2">
        <div>
          <p className="text-white font-semibold text-sm">Water Intake</p>
          <p className="text-white/40 text-xs">
            {Math.round(pct * 100)}% of daily goal
          </p>
        </div>

        <button
          onClick={onAdd}
          disabled={loading || pct >= 1}
          className="w-full py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <span className="text-base">💧</span>
          {pct >= 1 ? "Goal reached!" : "+ 250 ml"}
        </button>
      </div>
    </div>
  );
}
