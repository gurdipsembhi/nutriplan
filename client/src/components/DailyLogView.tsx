import { useEffect, useState, useCallback } from "react";
import type { DailyLog, Meal, MealPlanned, Macros, SwapMealOption, DietType, Goal, Recipe } from "../types";
import { getTodayLog, checkInMeal, logMealActual, swapMeal, addWater, getWeekLogs, getRecipe } from "../lib/api";
import DayProgressBar from "./DayProgressBar";
import MealCard from "./MealCard";
import MealSwapModal from "./MealSwapModal";
import WaterTracker from "./WaterTracker";
import StreakBadge from "./StreakBadge";
import RecipeModal from "./RecipeModal";

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

function getCurrentWeekStart(): string {
  const now = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

// ── ProteinDebtMeter ─────────────────────────────────────────────────────────

function ProteinDebtMeter({ debt }: { debt: number }) {
  const { text, color, bg } =
    debt === 0
      ? { text: "You are on track 💪",                                   color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" }
      : debt < 50
      ? { text: `Mild protein debt: +${debt}g needed this week`,         color: "text-yellow-400",  bg: "bg-yellow-400/10  border-yellow-400/20"  }
      : { text: "High protein debt: consider a high-protein snack today", color: "text-red-400",     bg: "bg-red-400/10     border-red-400/20"     };

  return (
    <div className={`border rounded-xl px-4 py-3 flex items-center gap-2 ${bg}`}>
      <span className="text-base">⚡</span>
      <p className={`text-xs font-medium ${color}`}>{text}</p>
    </div>
  );
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

  // Weekly protein debt for ProteinDebtMeter
  const [proteinDebt, setProteinDebt] = useState(0);

  // Swap state
  const [swapMealName,   setSwapMealName]   = useState<string | null>(null);
  const [swapOptions,    setSwapOptions]    = useState<SwapMealOption[] | null>(null);
  const [swapLoading,    setSwapLoading]    = useState(false);
  const [swapError,      setSwapError]      = useState<string | null>(null);

  // Recipe state
  const [recipeMealName, setRecipeMealName] = useState<string | null>(null);
  const [recipe,         setRecipe]         = useState<Recipe | null>(null);
  const [recipeLoading,  setRecipeLoading]  = useState(false);
  const [recipeError,    setRecipeError]    = useState<string | null>(null);

  const today = getTodayString();

  const fetchLog = useCallback(async () => {
    try {
      const weekStart = getCurrentWeekStart();

      // Fetch independently — a 404 on today's log is expected and must not
      // block the week logs fetch used by ProteinDebtMeter.
      const [todayResult, weekResult] = await Promise.allSettled([
        getTodayLog(userId),
        getWeekLogs(userId, weekStart),
      ]);

      if (todayResult.status === "fulfilled") {
        const fetched = todayResult.value.log;
        setLog(fetched);
        setWaterMl(fetched.waterMl ?? 0);
        if (fetched.waterGoalMl > 0) setWaterGoalMl(fetched.waterGoalMl);
      }

      if (weekResult.status === "fulfilled") {
        let debt = 0;
        for (const l of weekResult.value.logs) {
          const diff = macros.protein - l.dayTotals.actualProtein;
          if (diff > 0) debt += diff;
        }
        setProteinDebt(Math.round(debt));
      }
    } finally {
      setInit(false);
    }
  }, [userId, macros.protein]);

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

  async function handleRecipe(mealName: string) {
    const meal = displayMeals.find((m) => m.mealName === mealName);
    if (!meal) return;

    // Use per-meal food data when available (weekly plan meals).
    // Fall back to selectedFoods with 100g default when the daily log
    // was seeded without food-level detail (basic plan view).
    const foods =
      meal.planned.foods.length > 0
        ? meal.planned.foods.map((f) => ({ name: f.name, grams: f.grams }))
        : selectedFoods.slice(0, 4).map((name) => ({ name, grams: 100 }));

    setRecipeMealName(mealName);
    setRecipe(null);
    setRecipeError(null);
    setRecipeLoading(true);
    try {
      const { recipe: result } = await getRecipe({
        meal: { name: mealName, foods },
        goal,
      });
      setRecipe(result);
    } catch (e) {
      setRecipeError(e instanceof Error ? e.message : "Failed to generate recipe");
    } finally {
      setRecipeLoading(false);
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
        <span className="text-white/40 text-xs w-12 text-right">{checkedCount}/5</span>
      </div>

      {/* Streak */}
      <div className="flex justify-center">
        <StreakBadge streak={log?.streakDay ?? 0} />
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

      {/* Weekly protein debt meter */}
      <ProteinDebtMeter debt={proteinDebt} />

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
            onRecipe={handleRecipe}
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

      {/* Recipe modal */}
      {recipeMealName && (
        <RecipeModal
          mealName={recipeMealName}
          recipe={recipeLoading ? null : recipe}
          error={recipeError}
          onClose={() => { setRecipeMealName(null); setRecipe(null); setRecipeError(null); }}
        />
      )}
    </div>
  );
}
