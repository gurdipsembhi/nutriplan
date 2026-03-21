import { useEffect, useState, useCallback } from "react";
import type { DailyLog, Meal, MealPlanned, Macros } from "../types";
import { getTodayLog, checkInMeal, logMealActual } from "../lib/api";
import DayProgressBar from "./DayProgressBar";
import MealCard from "./MealCard";

interface Props {
  planId: string;
  userId: string;
  targetCalories: number;
  macros: Macros;
  onBack: () => void;
}

const MEAL_NAMES = [
  "Breakfast",
  "Mid-Morning Snack",
  "Lunch",
  "Evening Snack",
  "Dinner",
] as const;

// Calorie split across 5 meals (must sum to 1.0)
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

export default function DailyLogView({ planId, userId, targetCalories, macros, onBack }: Props) {
  const [log,     setLog]     = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [init,    setInit]    = useState(true);   // true while fetching initial log

  const today = getTodayString();

  // Fetch today's log on mount. If none exists yet, show planned meals locally
  // until the user checks in their first meal (which creates the DB document).
  const fetchLog = useCallback(async () => {
    try {
      const { log: fetched } = await getTodayLog(userId);
      setLog(fetched);
    } catch {
      // 404 = no log yet for today — that's fine, show planned skeleton
      setLog(null);
    } finally {
      setInit(false);
    }
  }, [userId]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  // The meals to display: either from the fetched log, or a planned skeleton
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
        // First action of the day — create the log document with all planned meals
        const { log: created } = await logMealActual({
          userId,
          planId,
          date:  today,
          mealName,
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
        userId,
        planId,
        date: today,
        mealName,
        actual,
        meals: log ? undefined : displayMeals,   // only seed on first call
      });
      setLog(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
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
        <span className="text-white/40 text-xs w-12 text-right">
          {checkedCount}/5
        </span>
      </div>

      {/* Progress summary */}
      <DayProgressBar dayTotals={dayTotals} />

      {/* Error banner */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
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
    </div>
  );
}
