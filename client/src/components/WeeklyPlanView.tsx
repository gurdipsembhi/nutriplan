import { useState } from "react";
import type { WeeklyDay, WeeklyMeal, DietType, Goal } from "../types";
import { generateWeeklyPlan } from "../lib/api";

interface Props {
  planId: string;
  selectedFoods: string[];
  targetCalories: number;
  dietType: DietType;
  goal: Goal;
  onBack: () => void;
  onGroceryList: () => void;
}

const DAY_ABBR: Record<string, string> = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun",
};

const MEAL_ICONS: Record<string, string> = {
  "Breakfast":         "☀️",
  "Mid-Morning Snack": "🍎",
  "Lunch":             "🍽️",
  "Evening Snack":     "🌤️",
  "Dinner":            "🌙",
};

function MealBlock({ meal }: { meal: WeeklyMeal }) {
  return (
    <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{MEAL_ICONS[meal.name] ?? "🍴"}</span>
          <span className="text-white font-semibold text-sm">{meal.name}</span>
        </div>
        <span className="text-emerald-400 text-xs font-medium">{meal.totalCalories} kcal</span>
      </div>

      {/* Foods list */}
      <div className="space-y-1.5">
        {meal.foods.map((food, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-white/70 text-xs capitalize">{food.name}</span>
            <span className="text-white/40 text-xs">{food.grams}g · {food.calories} kcal</span>
          </div>
        ))}
      </div>

      {/* Macro pills */}
      <div className="flex gap-2 pt-1">
        {[
          { label: "P", value: meal.protein, color: "text-blue-400  bg-blue-400/10" },
          { label: "C", value: meal.carbs,   color: "text-yellow-400 bg-yellow-400/10" },
          { label: "F", value: meal.fat,     color: "text-orange-400 bg-orange-400/10" },
        ].map(({ label, value, color }) => (
          <span key={label} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
            {label} {value}g
          </span>
        ))}
      </div>
    </div>
  );
}

export default function WeeklyPlanView({
  planId, selectedFoods, targetCalories, dietType, goal, onBack, onGroceryList,
}: Props) {
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyDay[] | null>(null);
  const [activeDay,  setActiveDay]  = useState("Monday");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { weeklyPlan: plan } = await generateWeeklyPlan({
        planId, selectedFoods, targetCalories, dietType, goal,
      });
      setWeeklyPlan(plan);
      setActiveDay(plan[0]?.day ?? "Monday");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate weekly plan");
    } finally {
      setLoading(false);
    }
  }

  const activeData = weeklyPlan?.find((d) => d.day === activeDay);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-white/40 hover:text-white/70 transition-colors text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div className="text-center">
          <h2 className="text-white font-bold text-base">Weekly Plan</h2>
          <p className="text-white/40 text-xs">Mon – Sun</p>
        </div>
        <div className="w-12" />
      </div>

      {/* Pre-generation state */}
      {!weeklyPlan && !loading && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 border border-emerald-400/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Generate your 7-day plan</p>
            <p className="text-white/40 text-xs mt-1">
              Gemini will create a full week of meals using your {selectedFoods.length} selected foods.
            </p>
          </div>
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          <button
            onClick={handleGenerate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-semibold transition-all duration-200"
          >
            Generate Weekly Plan
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-white text-sm font-medium">Building your week…</p>
            <p className="text-white/40 text-xs mt-1">Gemini is planning 7 days × 5 meals</p>
          </div>
        </div>
      )}

      {/* Weekly plan — day tabs + meal list */}
      {weeklyPlan && !loading && (
        <>
          {/* Day tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {weeklyPlan.map((d) => (
              <button
                key={d.day}
                onClick={() => setActiveDay(d.day)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  activeDay === d.day
                    ? "bg-emerald-500 text-white"
                    : "bg-[#12121a] border border-white/10 text-white/50 hover:text-white/80"
                }`}
              >
                {DAY_ABBR[d.day]}
              </button>
            ))}
          </div>

          {/* Day summary strip */}
          {activeData && (
            <div className="bg-[#12121a] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
              <span className="text-white font-semibold text-sm">{activeData.day}</span>
              <div className="flex gap-3 text-xs">
                <span className="text-white/60">{activeData.dayTotal.calories} kcal</span>
                <span className="text-blue-400">P {activeData.dayTotal.protein}g</span>
                <span className="text-yellow-400">C {activeData.dayTotal.carbs}g</span>
                <span className="text-orange-400">F {activeData.dayTotal.fat}g</span>
              </div>
            </div>
          )}

          {/* Meal blocks */}
          {activeData && (
            <div className="space-y-3">
              {activeData.meals.map((meal) => (
                <MealBlock key={meal.name} meal={meal} />
              ))}
            </div>
          )}

          {/* Grocery list CTA */}
          <button
            onClick={onGroceryList}
            className="w-full py-3 rounded-xl bg-[#12121a] border border-white/10 hover:border-emerald-500/40 text-white/70 hover:text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🛒</span>
            View Grocery List
          </button>
        </>
      )}
    </div>
  );
}
