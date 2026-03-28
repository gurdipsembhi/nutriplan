import cron from "node-cron";
import DailyLog from "../models/DailyLog";
import DietPlan from "../models/DietPlan";
import { generateWeeklyReport, getCurrentWeekStart } from "../services/weeklyReportService";

// Runs every Sunday at 23:00 IST (UTC+5:30 → 17:30 UTC)
// cron schedule in server local time — IST servers use "0 23 * * 0"
const CRON_SCHEDULE = "0 23 * * 0";

async function runWeeklyReports(): Promise<void> {
  const weekStart = getCurrentWeekStart();
  console.log(`[WeeklyReportJob] Starting report generation for week: ${weekStart}`);

  try {
    // Find all distinct userIds that have logs this week
    const weekEnd = (() => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 6);
      return d.toISOString().slice(0, 10);
    })();

    const userIds: string[] = await DailyLog.distinct("userId", {
      date: { $gte: weekStart, $lte: weekEnd },
    });

    console.log(`[WeeklyReportJob] Found ${userIds.length} active user(s) this week`);

    for (const userId of userIds) {
      try {
        // Find the most recent diet plan for this user
        const plan = await DietPlan.findOne({ "profile.weight": { $exists: true } })
          .sort({ createdAt: -1 })
          .lean();

        // We store userId on DailyLog but not on DietPlan yet (no auth).
        // Best effort: find the plan whose planId is referenced in logs.
        const log = await DailyLog.findOne({ userId }).sort({ createdAt: -1 }).lean();
        if (!log) continue;

        const planForUser = await DietPlan.findById(log.planId).lean();
        if (!planForUser) {
          console.warn(`[WeeklyReportJob] No plan found for userId: ${userId}`);
          continue;
        }

        await generateWeeklyReport(
          userId,
          String(planForUser._id),
          planForUser.selectedFoods,
          planForUser.goal,
          weekStart
        );

        console.log(`[WeeklyReportJob] Report generated for userId: ${userId}`);
      } catch (userErr) {
        // Log per-user failures but continue processing other users
        console.error(`[WeeklyReportJob] Failed for userId ${userId}:`, userErr);
      }
    }

    console.log(`[WeeklyReportJob] Completed for week: ${weekStart}`);
  } catch (err) {
    console.error("[WeeklyReportJob] Fatal error:", err);
  }
}

export function startWeeklyReportJob(): void {
  cron.schedule(CRON_SCHEDULE, () => {
    void runWeeklyReports();
  });

  console.log(`[WeeklyReportJob] Scheduled — runs every Sunday at 23:00 (${CRON_SCHEDULE})`);
}
