import type { DietType } from "../../types";

interface Props {
  onSelect: (dt: DietType) => void;
}

export default function StepDietType({ onSelect }: Props) {
  const options: { type: DietType; label: string; desc: string; emoji: string; gradient: string }[] = [
    {
      type: "veg",
      label: "Vegetarian",
      desc: "Plant-based foods, dairy, and eggs",
      emoji: "🥗",
      gradient: "from-emerald-400/10 to-green-400/10 border-emerald-400/20 hover:border-emerald-400/50",
    },
    {
      type: "nonveg",
      label: "Non-Vegetarian",
      desc: "All foods including meat and seafood",
      emoji: "🍗",
      gradient: "from-orange-400/10 to-red-400/10 border-orange-400/20 hover:border-orange-400/50",
    },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 border border-emerald-400/20 items-center justify-center mb-2">
          <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-100">What's your diet?</h1>
        <p className="text-slate-400 text-sm">We'll personalize your food choices based on your preference</p>
      </div>

      <div className="grid gap-4">
        {options.map(({ type, label, desc, emoji, gradient }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`group relative p-6 rounded-2xl bg-gradient-to-br ${gradient} border transition-all duration-200 text-left hover:scale-[1.02] active:scale-[0.98]`}
          >
            <div className="flex items-center gap-4">
              <div className="text-4xl">{emoji}</div>
              <div>
                <p className="font-semibold text-slate-100 text-lg">{label}</p>
                <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
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
