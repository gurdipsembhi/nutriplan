import { useState } from "react";
import type { Meal, MealPlanned } from "../types";

interface Props {
  meal: Meal;
  loading: boolean;
  onCheckIn: (mealName: string) => void;
  onLogActual: (mealName: string, actual: MealPlanned) => void;
}

const MEAL_ICONS: Record<string, string> = {
  "Breakfast":          "☀️",
  "Mid-Morning Snack":  "🍎",
  "Lunch":              "🍽️",
  "Evening Snack":      "🌤️",
  "Dinner":             "🌙",
};

export default function MealCard({ meal, loading, onCheckIn, onLogActual }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [calories, setCalories] = useState(meal.planned.totalCalories.toString());
  const [protein,  setProtein]  = useState(meal.planned.protein.toString());
  const [carbs,    setCarbs]    = useState(meal.planned.carbs.toString());
  const [fat,      setFat]      = useState(meal.planned.fat.toString());

  const icon = MEAL_ICONS[meal.mealName] ?? "🍴";
  const isLogged = meal.checkedOff;

  function handleSubmitActual(e: React.FormEvent) {
    e.preventDefault();
    onLogActual(meal.mealName, {
      foods:         [],                          // food-level detail added in Feature 1.2
      totalCalories: Number(calories),
      protein:       Number(protein),
      carbs:         Number(carbs),
      fat:           Number(fat),
    });
    setShowForm(false);
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 ${
      isLogged
        ? "bg-emerald-950/30 border-emerald-500/30"
        : "bg-[#12121a] border-white/10"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <p className="text-white font-semibold text-sm">{meal.mealName}</p>
            <p className="text-white/40 text-xs">
              {meal.planned.totalCalories} kcal planned
            </p>
          </div>
        </div>

        {/* Status badge */}
        {isLogged ? (
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Done
          </span>
        ) : (
          <span className="text-white/30 text-xs">Pending</span>
        )}
      </div>

      {/* Actual macros (shown after logging) */}
      {isLogged && meal.actual && (
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            { label: "Cal",     value: meal.actual.totalCalories, unit: "kcal" },
            { label: "Protein", value: meal.actual.protein,       unit: "g" },
            { label: "Carbs",   value: meal.actual.carbs,         unit: "g" },
            { label: "Fat",     value: meal.actual.fat,           unit: "g" },
          ].map(({ label, value, unit }) => (
            <div key={label} className="bg-white/5 rounded-xl py-2">
              <p className="text-white text-sm font-semibold">{value}</p>
              <p className="text-white/40 text-[10px]">{unit}</p>
              <p className="text-white/30 text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons — only shown when not yet logged */}
      {!isLogged && !showForm && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onCheckIn(meal.mealName)}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 text-xs font-medium
                       hover:bg-emerald-600/30 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Check off"}
          </button>
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-medium
                       hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            Log actual
          </button>
        </div>
      )}

      {/* Log actual form */}
      {showForm && (
        <form onSubmit={handleSubmitActual} className="mt-3 space-y-3">
          <p className="text-white/50 text-xs">Enter actual amounts:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Calories (kcal)", value: calories, set: setCalories },
              { label: "Protein (g)",     value: protein,  set: setProtein },
              { label: "Carbs (g)",       value: carbs,    set: setCarbs },
              { label: "Fat (g)",         value: fat,      set: setFat },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-white/40 text-[10px] block mb-1">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
                             text-white text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium
                         hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-xs font-medium
                         hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
