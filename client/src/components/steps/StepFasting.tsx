import type { FastingProtocol } from "../../types";

interface Props {
  onNext: (protocol: FastingProtocol) => void;
  error: string | null;
}

const PROTOCOLS: {
  type: FastingProtocol;
  label: string;
  window: string;
  desc: string;
  meals: string;
  icon: string;
  accent: string;
}[] = [
  {
    type: "none",
    label: "No Fasting",
    window: "Eat any time",
    desc: "Standard 5-meal plan with no eating window restrictions",
    meals: "5 meals / day",
    icon: "🍽️",
    accent: "from-white/5 to-white/[0.02] border-white/10 hover:border-white/20",
  },
  {
    type: "16:8",
    label: "16:8",
    window: "12:00 – 20:00",
    desc: "16 hours fasting, 8-hour eating window — the most popular IF protocol",
    meals: "3 meals / day",
    icon: "⏱️",
    accent: "from-emerald-400/10 to-cyan-400/10 border-emerald-400/20 hover:border-emerald-400/50",
  },
  {
    type: "18:6",
    label: "18:6",
    window: "13:00 – 19:00",
    desc: "18 hours fasting, 6-hour eating window — for experienced fasters",
    meals: "2 meals / day",
    icon: "🕐",
    accent: "from-blue-400/10 to-violet-400/10 border-blue-400/20 hover:border-blue-400/50",
  },
  {
    type: "5:2",
    label: "5:2",
    window: "5 normal + 2 restricted days",
    desc: "Eat normally 5 days a week. Two non-consecutive days capped at 500 kcal",
    meals: "500 kcal on restricted days",
    icon: "📅",
    accent: "from-orange-400/10 to-yellow-400/10 border-orange-400/20 hover:border-orange-400/50",
  },
];

export default function StepFasting({ onNext, error }: Props) {
  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">Fasting schedule?</h1>
        <p className="text-slate-400 text-sm">
          Intermittent fasting restructures your meal times within an eating window
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {PROTOCOLS.map(({ type, label, window, desc, meals, icon, accent }) => (
          <button
            key={type}
            onClick={() => onNext(type)}
            className={`group w-full p-5 rounded-2xl bg-gradient-to-br ${accent} border transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-100">{label}</p>
                  <span className="text-xs text-white/40 font-mono">{window}</span>
                </div>
                <p className="text-slate-400 text-sm">{desc}</p>
                <p className="text-white/30 text-xs mt-1">{meals}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
                <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
