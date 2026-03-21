interface Props {
  originalWeight: number;
  currentWeight: number;
  onRecalculate: () => void;
  onDismiss: () => void;
}

export default function StalePlanBanner({
  originalWeight,
  currentWeight,
  onRecalculate,
  onDismiss,
}: Props) {
  const delta = Math.round((currentWeight - originalWeight) * 10) / 10;
  const sign  = delta > 0 ? "+" : "";
  const verb  = delta > 0 ? "gained" : "lost";
  const abs   = Math.abs(delta);

  return (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl px-4 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-lg">⚠️</span>
          <div>
            <p className="text-amber-300 font-semibold text-sm">
              Your weight has changed significantly
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              You've {verb} {abs}kg ({sign}{delta}kg) since your plan was created.
              Your calorie targets may no longer be accurate.
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <button
        onClick={onRecalculate}
        className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-sm font-medium transition-all duration-200"
      >
        Recalculate my plan
      </button>
    </div>
  );
}
