import { useEffect, useState, useCallback } from "react";
import type { DailyLog, Meal, MealPlanned, Macros, SwapMealOption, DietType, Goal } from "../types";
import { getTodayLog, checkInMeal, logMealActual, swapMeal, addWater } from "../lib/api";
import DayProgressBar from "./DayProgressBar";
import MealCard from "./MealCard";
import MealSwapModal from "./MealSwapModal";
import WaterTracker from "./WaterTracker";

interface Props {
  planId: string;
  userId: string;
  targetCalories: number;
  macros: Macros;
  selectedFoods: string[];
  goal: Goal;
  dietType: DietType;
  weightKg: number;
  onBack: () => void;
}

const MEAL_NAMES = [
  "Breakfast",
  "Mid-Morning Snack",
  "Lunch",
  "Evening Snack",
  "Dinner",
] as const;

const MEAL_SPLITS: Record<string, number> = {
  "Breakfast":         0.25,
  "Mid-Morning Snack": 0.10,
  "Lunch":             0.35,
  "Evening Snack":     0.10,
  "Dinner":            0.20,
};

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildPlannedMeals(targetCalories: number, macros: Macros): Meal[] {
  return MEAL_NAMES.map((name) => {
    const split = MEAL_SPLITS[name];
    return {
      mealName: name,
      planned: {
        foods:         [],
        totalCalories: Math.round(targetCalories * split),
        protein:       Math.round(macros.protein * split),
        carbs:         Math.round(macros.carbs * split),
        fat:           Math.round(macros.fat * split),
      },
      actual:     null,
      checkedOff: false,
      loggedAt:   null,
    };
  });
}

export default function DailyLogView({
  planId, userId, targetCalories, macros,
  selectedFoods, goal, dietType, weightKg, onBack,
}: Props) {
  const [log,          setLog]          = useState<DailyLog | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [init,         setInit]         = useState(true);

  // Water state
  const [waterMl,      setWaterMl]      = useState(0);
  const [waterGoalMl,  setWaterGoalMl]  = useState(Math.round(weightKg * 35));
  const [waterLoading, setWaterLoading] = useState(false);

  // Swap state
  const [swapMealName,   setSwapMealName]   = useState<string | null>(null);
  const [swapOptions,    setSwapOptions]    = useState<SwapMealOption[] | null>(null);
  const [swapLoading,    setSwapLoading]    = useState(false);
  const [swapError,      setSwapError]      = useState<string | null>(null);

  const today = getTodayString();

  const fetchLog = useCallback(async () => {
    try {
      const { log: fetched } = await getTodayLog(userId);
      setLog(fetched);
      setWaterMl(fetched.waterMl ?? 0);
      if (fetched.waterGoalMl > 0) setWaterGoalMl(fetched.waterGoalMl);
    } catch {
      setLog(null);
    } finally {
      setInit(false);
    }
  }, [userId]);

  async function handleAddWater() {
    setWaterLoading(true);
    try {
      const { waterMl: updated, waterGoalMl: goal } = await addWater({
        userId, planId, ml: 250, weightKg,
      });
      setWaterMl(updated);
      setWaterGoalMl(goal);
    } catch {
      // silent — water logging is non-critical
    } finally {
      setWaterLoading(false);
    }
  }

  useEffect(() => { fetchLog(); }, [fetchLog]);

  const displayMeals: Meal[] = log?.meals ?? buildPlannedMeals(targetCalories, macros);

  const dayTotals = log?.dayTotals ?? {
    plannedCalories: targetCalories,
    actualCalories:  0,
    plannedProtein:  macros.protein,
    actualProtein:   0,
    plannedCarbs:    macros.carbs,
    actualCarbs:     0,
    plannedFat:      macros.fat,
    actualFat:       0,
  };

  async function handleCheckIn(mealName: string) {
    setLoading(true);
    setError(null);
    try {
      if (!log) {
        const { log: created } = await logMealActual({
          userId, planId, date: today, mealName,
          actual: (() => {
            const m = displayMeals.find((x) => x.mealName === mealName)!;
            return { ...m.planned };
          })(),
          meals: displayMeals,
        });
        setLog(created);
      } else {
        const { log: updated } = await checkInMeal({ userId, planId, date: today, mealName });
        setLog(updated);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogActual(mealName: string, actual: MealPlanned) {
    setLoading(true);
    setError(null);
    try {
      const { log: updated } = await logMealActual({
        userId, planId, date: today, mealName, actual,
        meals: log ? undefined : displayMeals,
      });
      setLog(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Step 1: user taps Swap — fetch 2 alternatives from Gemini
  async function handleSwap(mealName: string) {
    setSwapMealName(mealName);
    setSwapOptions(null);
    setSwapError(null);
    setSwapLoading(true);
    try {
      const meal = displayMeals.find((m) => m.mealName === mealName);
      const mealTargetCalories = meal?.planned.totalCalories ?? Math.round(targetCalories * MEAL_SPLITS[mealName]);
      const { alternatives } = await swapMeal({
        planId,
        mealName,
        targetCalories: mealTargetCalories,
        selectedFoods,
        goal,
        dietType,
      });
      setSwapOptions(alternatives);
    } catch (e) {
      setSwapError(e instanceof Error ? e.message : "Failed to get alternatives");
      setSwapMealName(null);
    } finally {
      setSwapLoading(false);
    }
  }

  // Step 2: user picks an alternative — log it as actual
  async function handleSwapSelect(option: SwapMealOption) {
    if (!swapMealName) return;
    setSwapOptions(null);
    const actual: MealPlanned = {
      foods:         option.foods,
      totalCalories: option.totalCalories,
      protein:       option.protein,
      carbs:         option.carbs,
      fat:           option.fat,
    };
    await handleLogActual(swapMealName, actual);
    setSwapMealName(null);
  }

  if (init) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const checkedCount = displayMeals.filter((m) => m.checkedOff).length;

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
          <h2 className="text-white font-bold text-base">Daily Log</h2>
          <p className="text-white/40 text-xs">{today}</p>
        </div>
        <span className="text-white/40 text-xs w-12 text-right">{checkedCount}/5</span>
      </div>

      {/* Progress summary */}
      <DayProgressBar dayTotals={dayTotals} />

      {/* Water tracker */}
      <WaterTracker
        waterMl={waterMl}
        waterGoalMl={waterGoalMl}
        onAdd={handleAddWater}
        loading={waterLoading}
      />

      {/* Error banner */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Swap loading banner */}
      {swapLoading && (
        <div className="bg-[#12121a] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <p className="text-white/60 text-sm">Finding alternatives…</p>
        </div>
      )}

      {/* Swap error */}
      {swapError && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {swapError}
        </div>
      )}

      {/* Meal cards */}
      <div className="space-y-3">
        {displayMeals.map((meal) => (
          <MealCard
            key={meal.mealName}
            meal={meal}
            loading={loading}
            onCheckIn={handleCheckIn}
            onLogActual={handleLogActual}
            onSwap={handleSwap}
          />
        ))}
      </div>

      {/* All done state */}
      {checkedCount === 5 && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 text-center">
          <p className="text-emerald-400 font-semibold text-sm">All meals logged</p>
          <p className="text-white/40 text-xs mt-1">Great work today. See you tomorrow.</p>
        </div>
      )}

      {/* Swap modal */}
      {swapOptions && swapMealName && (
        <MealSwapModal
          mealName={swapMealName}
          alternatives={swapOptions}
          onSelect={handleSwapSelect}
          onClose={() => { setSwapOptions(null); setSwapMealName(null); }}
        />
      )}
    </div>
  );
}
