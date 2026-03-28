interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-sm font-medium">
        <span>No streak yet</span>
      </div>
    );
  }

  const isHot = streak >= 3;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${
        isHot
          ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
      }`}
    >
      <span>{isHot ? "🔥" : "⚡"}</span>
      <span>{streak}-day streak</span>
    </div>
  );
}
