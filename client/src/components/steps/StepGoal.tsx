import type { Goal } from "../../types";

interface Props {
  onNext: (goal: Goal) => void;
  error: string | null;
}

const GOALS: { type: Goal; label: string; desc: string; icon: string; accent: string }[] = [
  {
    type: "fat_loss",
    label: "Fat Loss",
    desc: "Burn fat with a 500 kcal daily deficit",
    icon: "🔥",
    accent: "from-orange-400/10 to-red-400/10 border-orange-400/20 hover:border-orange-400/50",
  },
  {
    type: "muscle_gain",
    label: "Muscle Gain",
    desc: "Build muscle with a 300 kcal daily surplus",
    icon: "💪",
    accent: "from-blue-400/10 to-violet-400/10 border-blue-400/20 hover:border-blue-400/50",
  },
  {
    type: "maintenance",
    label: "Maintenance",
    desc: "Maintain your current weight and health",
    icon: "⚖️",
    accent: "from-emerald-400/10 to-cyan-400/10 border-emerald-400/20 hover:border-emerald-400/50",
  },
];

export default function StepGoal({ onNext, error }: Props) {
  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">What's your goal?</h1>
        <p className="text-slate-400 text-sm">
          This determines your calorie target and macro split
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {GOALS.map(({ type, label, desc, icon, accent }) => (
          <button
            key={type}
            onClick={() => onNext(type)}
            className={`group w-full p-5 rounded-2xl bg-gradient-to-br ${accent} border transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-100">{label}</p>
                <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
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
