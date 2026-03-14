import { useState, useEffect } from "react";
import type { DietType, FoodItem } from "../../types";
import { fetchFoods } from "../../lib/api";

interface Props {
  dietType: DietType;
  onNext: (foods: string[]) => void;
}

const POPULAR_FOODS: Record<DietType, string[]> = {
  veg: ["banana", "oats", "paneer", "dal", "brown rice", "milk", "spinach", "apple", "roti", "curd", "tofu", "almonds", "broccoli", "sweet potato", "lentils", "peanuts", "greek yogurt"],
  nonveg: ["chicken breast", "egg", "salmon", "banana", "oats", "brown rice", "milk", "spinach", "apple", "roti", "curd", "almonds", "broccoli", "sweet potato", "lentils", "peanuts", "greek yogurt"],
};

export default function StepFoods({ dietType, onNext }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dbFoods, setDbFoods] = useState<FoodItem[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [customFoods, setCustomFoods] = useState<string[]>([]);

  useEffect(() => {
    fetchFoods(dietType)
      .then(setDbFoods)
      .catch(() => {});
  }, [dietType]);

  const allFoodNames = Array.from(
    new Set([
      ...POPULAR_FOODS[dietType],
      ...dbFoods.map((f) => f.name),
      ...customFoods,
    ])
  );

  const toggle = (food: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(food)) next.delete(food);
      else next.add(food);
      return next;
    });
  };

  const addCustom = () => {
    const name = customInput.trim().toLowerCase();
    if (!name) return;
    setCustomFoods((prev) => [...prev, name]);
    setSelected((prev) => new Set([...prev, name]));
    setCustomInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addCustom();
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">Pick your foods</h1>
        <p className="text-slate-400 text-sm">
          Select what you eat regularly. We'll build your plan from these.
        </p>
      </div>

      {/* Selected count badge */}
      {selected.size > 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 w-fit mx-auto">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 text-sm font-medium">{selected.size} foods selected</span>
        </div>
      )}

      {/* Food grid */}
      <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1">
        {allFoodNames.map((food) => {
          const isSelected = selected.has(food);
          return (
            <button
              key={food}
              onClick={() => toggle(food)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 border ${
                isSelected
                  ? "bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 border-emerald-400/50 text-emerald-300"
                  : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-white/20 hover:text-slate-200"
              }`}
            >
              {isSelected && <span className="mr-1.5">✓</span>}
              {food}
            </button>
          );
        })}
      </div>

      {/* Custom food input */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-widest">Add a custom food</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. moong dal, paneer tikka..."
            className="flex-1 px-4 py-3 rounded-xl bg-[#13131a] border border-white/[0.08] text-slate-200 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-400/50 transition-colors"
          />
          <button
            onClick={addCustom}
            className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.10] transition-all text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* Next button */}
      <button
        onClick={() => onNext(Array.from(selected))}
        disabled={selected.size < 3}
        className="w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-emerald-400 to-cyan-400 text-[#0a0a0f] hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
      >
        {selected.size < 3 ? `Select at least ${3 - selected.size} more` : "Continue →"}
      </button>
    </div>
  );
}
