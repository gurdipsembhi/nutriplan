import { Request, Response } from "express";
import {
  generateWeeklyReport,
} from "../services/weeklyReportService";
import WeeklyReport from "../models/WeeklyReport";

// POST /api/reports/weekly/generate
// Body: { planId, selectedFoods, goal, weekStartDate? }
export async function generateReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!._id.toString();
    const { planId, selectedFoods, goal, weekStartDate } = req.body as {
      planId: string;
      selectedFoods: string[];
      goal: string;
      weekStartDate?: string;
    };

    if (!planId || !Array.isArray(selectedFoods) || !goal) {
      res.status(400).json({ error: "planId, selectedFoods, and goal are required" });
      return;
    }

    const report = await generateWeeklyReport(
      userId,
      planId,
      selectedFoods,
      goal,
      weekStartDate
    );

    res.json({ report });
  } catch (err) {
    console.error("generateReport error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to generate report" });
  }
}

// GET /api/reports/weekly/latest
export async function getLatestReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!._id.toString();

    const report = await WeeklyReport.findOne({ userId })
      .sort({ weekStartDate: -1 })
      .lean();

    res.json({ report: report ?? null });
  } catch (err) {
    console.error("getLatestReport error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
}

// GET /api/reports/weekly
export async function getAllReports(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!._id.toString();

    const reports = await WeeklyReport.find({ userId })
      .sort({ weekStartDate: -1 })
      .lean();

    res.json({ reports });
  } catch (err) {
    console.error("getAllReports error:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
}

// GET /api/reports/weekly/:weekStart
export async function getReportByWeek(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!._id.toString();
    const { weekStart } = req.params as { weekStart: string };

    const report = await WeeklyReport.findOne({ userId, weekStartDate: weekStart }).lean();

    if (!report) {
      res.status(404).json({ error: "Report not found for this week" });
      return;
    }

    res.json({ report });
  } catch (err) {
    console.error("getReportByWeek error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
}
