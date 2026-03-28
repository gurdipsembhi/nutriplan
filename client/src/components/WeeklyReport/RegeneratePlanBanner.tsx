interface Props {
  onRecalculate: () => void;
}

export default function RegeneratePlanBanner({ onRecalculate }: Props) {
  return (
    <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl px-4 py-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-amber-400 text-lg flex-shrink-0">⚠️</span>
        <div>
          <p className="text-amber-300 font-semibold text-sm">
            Your plan needs recalibration
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            Compliance has been below 50% for 2 consecutive weeks. Your current
            targets may not be realistic — recalculating will adjust them to
            better fit your actual intake patterns.
          </p>
        </div>
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
