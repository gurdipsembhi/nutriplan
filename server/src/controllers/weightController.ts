import { Request, Response } from "express";
import WeightLog from "../models/WeightLog";
import DietPlan from "../models/DietPlan";

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// ─── POST /api/weight ─────────────────────────────────────────────────────────
// Body: { planId?, weight, date?, note? }
// Upserts one log per user per day. Runs stale plan detection after logging.

export const logWeight = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const { planId, weight, date, note } = req.body as {
      planId?: string;
      weight: number;
      date?: string;
      note?: string;
    };

    if (weight == null) {
      res.status(400).json({ error: "weight is required" });
      return;
    }

    const logDate = date ?? getTodayString();

    // Upsert — one log per user per day
    const weightLog = await WeightLog.findOneAndUpdate(
      { userId, date: logDate },
      { weight, note: note ?? "" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Stale plan detection
    let isStale = false;
    if (planId) {
      const plan = await DietPlan.findById(planId);
      if (plan) {
        const delta = Math.abs(weight - plan.profile.weight);
        if (delta >= 3) {
          await DietPlan.findByIdAndUpdate(planId, { isStale: true });
          isStale = true;
        }
      }
    }

    res.json({ weightLog, isStale });
  } catch (err) {
    console.error("logWeight error:", err);
    res.status(500).json({ error: "Failed to log weight" });
  }
};

// ─── GET /api/weight ──────────────────────────────────────────────────────────
// Query: { days? }  — defaults to last 90 days
// Returns logs sorted oldest → newest for chart rendering

export const getWeightHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();
    const { days } = req.query as { days?: string };

    const lookbackDays = days ? parseInt(days, 10) : 90;
    const cutoff = dateNDaysAgo(lookbackDays);

    const logs = await WeightLog.find({
      userId,
      date: { $gte: cutoff },
    })
      .sort({ date: 1 })
      .lean();

    res.json({ logs });
  } catch (err) {
    console.error("getWeightHistory error:", err);
    res.status(500).json({ error: "Failed to fetch weight history" });
  }
};

// ─── GET /api/weight/trend ────────────────────────────────────────────────────
// avgWeeklyChange = (latestWeight - weightFrom4WeeksAgo) / weeksSpanned, rounded to 1dp
// direction: "losing" < -0.1, "gaining" > 0.1, else "stable"

export const getWeightTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    const logs = await WeightLog.find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .lean();

    if (logs.length < 2) {
      res.json({ direction: "stable", avgWeeklyChange: 0 });
      return;
    }

    const latestWeight = logs[0].weight;
    const fourWeeksAgo = dateNDaysAgo(28);

    // Find the closest log at or before 4 weeks ago
    const olderLog = logs.find((l) => l.date <= fourWeeksAgo);
    const referenceWeight = olderLog ? olderLog.weight : logs[logs.length - 1].weight;

    const weeksSpanned = olderLog
      ? Math.max(
          1,
          Math.round(
            (new Date(logs[0].date).getTime() - new Date(olderLog.date).getTime()) /
              (7 * 24 * 60 * 60 * 1000)
          )
        )
      : Math.max(1, Math.round(logs.length / 7));

    const avgWeeklyChange =
      Math.round(((latestWeight - referenceWeight) / weeksSpanned) * 10) / 10;

    const direction =
      avgWeeklyChange < -0.1 ? "losing" :
      avgWeeklyChange >  0.1 ? "gaining" :
      "stable";

    res.json({ direction, avgWeeklyChange });
  } catch (err) {
    console.error("getWeightTrend error:", err);
    res.status(500).json({ error: "Failed to calculate weight trend" });
  }
};
