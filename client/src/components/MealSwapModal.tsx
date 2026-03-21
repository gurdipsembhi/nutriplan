import { useState } from "react";
import type { SwapMealOption } from "../types";

interface Props {
  mealName: string;
  alternatives: SwapMealOption[];
  onSelect: (option: SwapMealOption) => void;
  onClose: () => void;
}

export default function MealSwapModal({ mealName, alternatives, onSelect, onClose }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleConfirm() {
    if (selected === null) return;
    onSelect(alternatives[selected]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base">Swap Meal</p>
            <p className="text-white/40 text-xs mt-0.5">{mealName} · pick one alternative</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {alternatives.map((option, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                selected === i
                  ? "border-emerald-500/60 bg-emerald-950/30"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              {/* Option header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/50 text-xs font-medium uppercase tracking-wide">
                  Option {i + 1}
                </span>
                <span className={`text-xs font-semibold ${selected === i ? "text-emerald-400" : "text-white/40"}`}>
                  {option.totalCalories} kcal
                </span>
              </div>

              {/* Foods list */}
              <div className="space-y-1 mb-3">
                {option.foods.map((food, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <span className="text-white text-sm capitalize">{food.name}</span>
                    <span className="text-white/40 text-xs">{food.grams}g · {food.calories} kcal</span>
                  </div>
                ))}
              </div>

              {/* Macro pills */}
              <div className="flex gap-2">
                {[
                  { label: "P", value: option.protein, color: "text-blue-400 bg-blue-400/10" },
                  { label: "C", value: option.carbs,   color: "text-yellow-400 bg-yellow-400/10" },
                  { label: "F", value: option.fat,     color: "text-orange-400 bg-orange-400/10" },
                ].map(({ label, value, color }) => (
                  <span key={label} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
                    {label} {value}g
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={selected === null}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
        >
          Use This Meal
        </button>
      </div>
    </div>
  );
}
