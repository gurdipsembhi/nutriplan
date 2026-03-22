import { Request, Response } from "express";
import DailyLog, { IMeal, IDayTotals } from "../models/DailyLog";
import { calcDailyWaterGoal } from "../services/waterService";
import { calcStreak } from "../services/streakService";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function recalcDayTotals(meals: IMeal[]): IDayTotals {
  let plannedCalories = 0, actualCalories = 0;
  let plannedProtein = 0,  actualProtein = 0;
  let plannedCarbs = 0,    actualCarbs = 0;
  let plannedFat = 0,      actualFat = 0;

  for (const meal of meals) {
    plannedCalories += meal.planned.totalCalories;
    plannedProtein  += meal.planned.protein;
    plannedCarbs    += meal.planned.carbs;
    plannedFat      += meal.planned.fat;

    // actual defaults to planned when checked off without editing
    const src = meal.actual ?? meal.planned;
    if (meal.checkedOff) {
      actualCalories += src.totalCalories;
      actualProtein  += src.protein;
      actualCarbs    += src.carbs;
      actualFat      += src.fat;
    }
  }

  return {
    plannedCalories, actualCalories,
    plannedProtein,  actualProtein,
    plannedCarbs,    actualCarbs,
    plannedFat,      actualFat,
  };
}

// ─── POST /api/logs/checkin ─────────────────────────────────────────────────
// Body: { userId, planId, date, mealName }
// Marks a meal as checked off. actual defaults to planned values.

export async function checkIn(req: Request, res: Response): Promise<void> {
  try {
    const { userId, planId, date, mealName } = req.body as {
      userId: string;
      planId: string;
      date: string;
      mealName: string;
    };

    if (!userId || !planId || !date || !mealName) {
      res.status(400).json({ error: "userId, planId, date, and mealName are required" });
      return;
    }

    let log = await DailyLog.findOne({ userId, date });

    if (!log) {
      res.status(404).json({ error: "No log found for this date. Create one via /api/logs/log-meal first." });
      return;
    }

    const meal = log.meals.find((m) => m.mealName === mealName);
    if (!meal) {
      res.status(404).json({ error: `Meal "${mealName}" not found in log` });
      return;
    }

    // actual defaults to planned when checking off without portion edits
    if (!meal.actual) {
      meal.actual = {
        foods:         meal.planned.foods,
        totalCalories: meal.planned.totalCalories,
        protein:       meal.planned.protein,
        carbs:         meal.planned.carbs,
        fat:           meal.planned.fat,
      };
    }

    meal.checkedOff = true;
    meal.loggedAt   = new Date();
    log.dayTotals   = recalcDayTotals(log.meals);

    await log.save();

    const { currentStreak } = await calcStreak(userId);
    log.streakDay = currentStreak;
    await log.save();

    res.json({ log, currentStreak });
  } catch (err) {
    console.error("checkIn error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─── POST /api/logs/log-meal ────────────────────────────────────────────────
// Body: { userId, planId, date, mealName, actual }
// Logs actual portions. Creates the daily log doc if it doesn't exist yet.
// If this is the first meal being logged, `meals` must be provided to seed the log.

export async function logMeal(req: Request, res: Response): Promise<void> {
  try {
    const { userId, planId, date, mealName, actual, meals: seedMeals } = req.body as {
      userId: string;
      planId: string;
      date: string;
      mealName: string;
      actual: {
        foods: { name: string; grams: number; calories: number }[];
        totalCalories: number;
        protein: number;
        carbs: number;
        fat: number;
      };
      meals?: IMeal[];
    };

    if (!userId || !planId || !date || !mealName || !actual) {
      res.status(400).json({ error: "userId, planId, date, mealName, and actual are required" });
      return;
    }

    let log = await DailyLog.findOne({ userId, date });

    if (!log) {
      // First meal log of the day — seed all 5 planned meals from request
      if (!seedMeals || seedMeals.length === 0) {
        res.status(400).json({
          error: "No log exists for this date. Provide `meals` array to initialise the daily log.",
        });
        return;
      }

      const dayTotals = recalcDayTotals(seedMeals);
      log = new DailyLog({ userId, planId, date, meals: seedMeals, dayTotals });
    }

    const meal = log.meals.find((m) => m.mealName === mealName);
    if (!meal) {
      res.status(404).json({ error: `Meal "${mealName}" not found in log` });
      return;
    }

    meal.actual     = actual;
    meal.checkedOff = true;
    meal.loggedAt   = new Date();
    log.dayTotals   = recalcDayTotals(log.meals);

    await log.save();

    const { currentStreak } = await calcStreak(userId);
    log.streakDay = currentStreak;
    await log.save();

    res.json({ log, currentStreak });
  } catch (err) {
    console.error("logMeal error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─── POST /api/logs/water ───────────────────────────────────────────────────
// Body: { userId, planId, ml, weightKg? }
// Increments waterMl on today's log, clamped to waterGoalMl.
// Creates the log document if it doesn't exist yet.

export async function addWater(req: Request, res: Response): Promise<void> {
  try {
    const { userId, planId, ml, weightKg } = req.body as {
      userId: string;
      planId: string;
      ml: number;
      weightKg?: number;
    };

    if (!userId || !planId || ml == null) {
      res.status(400).json({ error: "userId, planId, and ml are required" });
      return;
    }

    const today = getTodayString();
    let log = await DailyLog.findOne({ userId, date: today });

    if (!log) {
      // First action of the day — create a bare log with water fields initialised
      const waterGoalMl = weightKg ? calcDailyWaterGoal(weightKg) : 0;
      const clampedMl   = waterGoalMl > 0 ? Math.min(ml, waterGoalMl) : ml;
      log = await DailyLog.create({
        userId,
        planId,
        date: today,
        meals: [],
        dayTotals: {
          plannedCalories: 0, actualCalories: 0,
          plannedProtein:  0, actualProtein:  0,
          plannedCarbs:    0, actualCarbs:    0,
          plannedFat:      0, actualFat:      0,
        },
        waterMl:     clampedMl,
        waterGoalMl,
      });
    } else {
      // Increment, clamped to goal (no overflow past 100%)
      const goal      = log.waterGoalMl ?? 0;
      const newWaterMl = goal > 0
        ? Math.min((log.waterMl ?? 0) + ml, goal)
        : (log.waterMl ?? 0) + ml;
      log.waterMl = newWaterMl;
      await log.save();
    }

    res.json({ waterMl: log.waterMl, waterGoalMl: log.waterGoalMl });
  } catch (err) {
    console.error("addWater error:", err);
    res.status(500).json({ error: "Failed to log water" });
  }
}

// ─── GET /api/logs ──────────────────────────────────────────────────────────
// Query: ?userId=xxx&weekStart=YYYY-MM-DD
// Returns all logs for a user within a week (Mon–Sun).

export async function getWeekLogs(req: Request, res: Response): Promise<void> {
  try {
    const { userId, weekStart } = req.query as { userId: string; weekStart: string };

    if (!userId || !weekStart) {
      res.status(400).json({ error: "userId and weekStart query params are required" });
      return;
    }

    const weekEnd = (() => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 6);
      return d.toISOString().slice(0, 10);
    })();

    const logs = await DailyLog.find({
      userId,
      date: { $gte: weekStart, $lte: weekEnd },
    }).sort({ date: 1 });

    res.json({ logs });
  } catch (err) {
    console.error("getWeekLogs error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─── GET /api/logs/today ────────────────────────────────────────────────────
// Query: ?userId=xxx
// Returns today's log for the user, or 404 if none exists yet.

export async function getTodayLog(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.query as { userId: string };

    if (!userId) {
      res.status(400).json({ error: "userId query param is required" });
      return;
    }

    const today = getTodayString();
    const log   = await DailyLog.findOne({ userId, date: today });

    if (!log) {
      res.status(404).json({ error: "No log found for today" });
      return;
    }

    res.json({ log });
  } catch (err) {
    console.error("getTodayLog error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// ─── GET /api/logs/:date ────────────────────────────────────────────────────
// Params: date = "YYYY-MM-DD"
// Query:  ?userId=xxx

export async function getLogByDate(req: Request, res: Response): Promise<void> {
  try {
    const { date } = req.params;
    const { userId } = req.query as { userId: string };

    if (!userId) {
      res.status(400).json({ error: "userId query param is required" });
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
      return;
    }

    const log = await DailyLog.findOne({ userId, date });

    if (!log) {
      res.status(404).json({ error: `No log found for ${date}` });
      return;
    }

    res.json({ log });
  } catch (err) {
    console.error("getLogByDate error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
