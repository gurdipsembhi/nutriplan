import DailyLog from "../models/DailyLog";
import DietPlan from "../models/DietPlan";
import WeeklyReport, { IWeeklyReport } from "../models/WeeklyReport";
import { generateWeeklyInsight } from "./geminiService";

// ── Date helpers ─────────────────────────────────────────────────────────────

export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

// ── Score / risk helpers ──────────────────────────────────────────────────────

export function calcRiskLevel(
  proteinDaysHit: number
): "optimal" | "low_risk" | "moderate_risk" | "high_risk" {
  if (proteinDaysHit >= 6) return "optimal";
  if (proteinDaysHit >= 4) return "low_risk";
  if (proteinDaysHit >= 2) return "moderate_risk";
  return "high_risk";
}

export function calcWeeklyScore(
  calDaysHit: number,
  protDaysHit: number,
  carbDaysHit: number,
  fatDaysHit: number
): number {
  const calorieScore = (calDaysHit  / 7) * 40;
  const proteinScore = (protDaysHit / 7) * 40;
  const carbScore    = (carbDaysHit / 7) * 10;
  const fatScore     = (fatDaysHit  / 7) * 10;
  return Math.round(calorieScore + proteinScore + carbScore + fatScore);
}

function calcTrend(
  currentScore: number,
  previousScore: number | null
): "improving" | "declining" | "stable" {
  if (previousScore === null) return "stable";
  if (currentScore - previousScore >  5) return "improving";
  if (currentScore - previousScore < -5) return "declining";
  return "stable";
}

// ── Log aggregation (pure math, no Gemini) ────────────────────────────────────

interface AggregatedStats {
  calorieStats: IWeeklyReport["calorieStats"];
  proteinStats:  IWeeklyReport["proteinStats"];
  carbStats:     IWeeklyReport["carbStats"];
  fatStats:      IWeeklyReport["fatStats"];
  logCount: number;
}

export function aggregateLogs(
  logs: Array<{
    dayTotals: {
      actualCalories: number; plannedCalories: number;
      actualProtein:  number; plannedProtein:  number;
      actualCarbs:    number; plannedCarbs:    number;
      actualFat:      number; plannedFat:      number;
    };
  }>,
  targetCalories: number,
  targetProteinG: number,
  targetCarbsG:   number,
  targetFatG:     number
): AggregatedStats {
  let calDaysHit = 0, calDaysOver = 0, calDaysUnder = 0;
  let protDaysHit = 0;
  let carbDaysHit = 0;
  let fatDaysHit  = 0;
  let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
  let protDebt = 0, protSurplus = 0;
  let totalCalDiff = 0;

  for (const log of logs) {
    const { actualCalories, actualProtein, actualCarbs, actualFat } = log.dayTotals;

    totalCal   += actualCalories;
    totalProt  += actualProtein;
    totalCarbs += actualCarbs;
    totalFat   += actualFat;

    // Calorie: within ±100 kcal
    const calDiff = actualCalories - targetCalories;
    totalCalDiff += calDiff;
    if (Math.abs(calDiff) <= 100) calDaysHit++;
    else if (calDiff > 0)         calDaysOver++;
    else                          calDaysUnder++;

    // Protein: met or exceeded target
    if (actualProtein >= targetProteinG) {
      protDaysHit++;
      protSurplus += actualProtein - targetProteinG;
    } else {
      protDebt += targetProteinG - actualProtein;
    }

    // Carbs: within 15% below target
    if (actualCarbs >= targetCarbsG * 0.85) carbDaysHit++;

    // Fat: within 15% below target
    if (actualFat >= targetFatG * 0.85) fatDaysHit++;
  }

  const n = logs.length || 1; // avoid div-by-zero

  return {
    calorieStats: {
      targetCalories,
      daysHit:   calDaysHit,
      daysOver:  calDaysOver,
      daysUnder: calDaysUnder,
      avgDailyCalories:             Math.round(totalCal / n),
      totalCalorieDeficitOrSurplus: Math.round(totalCalDiff),
    },
    proteinStats: {
      targetProteinG,
      daysHit:               protDaysHit,
      avgDailyProteinG:      Math.round(totalProt  / n),
      weeklyProteinDebtG:    Math.round(protDebt),
      weeklyProteinSurplusG: Math.round(protSurplus),
    },
    carbStats: {
      targetCarbsG,
      daysHit:        carbDaysHit,
      avgDailyCarbsG: Math.round(totalCarbs / n),
    },
    fatStats: {
      targetFatG,
      daysHit:      fatDaysHit,
      avgDailyFatG: Math.round(totalFat / n),
    },
    logCount: logs.length,
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function generateWeeklyReport(
  userId: string,
  planId: string,
  selectedFoods: string[],
  goal: string,
  weekStartDate?: string
): Promise<IWeeklyReport> {
  const weekStart = weekStartDate ?? getCurrentWeekStart();
  const weekEnd   = getWeekEnd(weekStart);

  // 1. Fetch the diet plan for macro targets
  const plan = await DietPlan.findById(planId).lean();
  if (!plan) throw new Error(`DietPlan not found: ${planId}`);

  const targetCalories = plan.targetCalories;
  const targetProteinG = plan.macros.protein;
  const targetCarbsG   = plan.macros.carbs;
  const targetFatG     = plan.macros.fat;

  // 2. Fetch all daily logs for the week
  const logs = await DailyLog.find({
    userId,
    date: { $gte: weekStart, $lte: weekEnd },
  }).lean();

  const isPartial = logs.length < 7;

  // 3. Aggregate stats (pure math)
  const stats = aggregateLogs(logs, targetCalories, targetProteinG, targetCarbsG, targetFatG);

  const { calorieStats, proteinStats, carbStats, fatStats } = stats;

  // 4. Derive scores and risk
  const riskLevel    = calcRiskLevel(proteinStats.daysHit);
  const overallScore = calcWeeklyScore(
    calorieStats.daysHit,
    proteinStats.daysHit,
    carbStats.daysHit,
    fatStats.daysHit
  );

  // 5. planShouldRegenerate: compliance < 50% for 2 consecutive weeks
  const prevReport = await WeeklyReport.findOne({ userId })
    .sort({ weekStartDate: -1 })
    .lean();

  const prevScore            = prevReport?.overallScore ?? null;
  const trend                = calcTrend(overallScore, prevScore);
  const planShouldRegenerate = overallScore < 50 && prevScore !== null && prevScore < 50;

  // 6. Gemini insight (only LLM call in this service)
  const insight = await generateWeeklyInsight(
    {
      calorieStats: {
        daysHit:        calorieStats.daysHit,
        targetCalories: calorieStats.targetCalories,
      },
      proteinStats: {
        daysHit:            proteinStats.daysHit,
        targetProteinG:     proteinStats.targetProteinG,
        weeklyProteinDebtG: proteinStats.weeklyProteinDebtG,
      },
    },
    riskLevel,
    goal,
    selectedFoods
  );

  // 7. Upsert — one report per user per week
  const report = await WeeklyReport.findOneAndUpdate(
    { userId, weekStartDate: weekStart },
    {
      userId,
      weekStartDate: weekStart,
      weekEndDate:   weekEnd,
      calorieStats,
      proteinStats,
      carbStats,
      fatStats,
      muscleInsight: {
        riskLevel,
        proteinDebtG:    proteinStats.weeklyProteinDebtG,
        interpretation:  insight.interpretation,
        recoveryActions: insight.recoveryActions,
      },
      overallScore,
      trend,
      planShouldRegenerate,
      isPartial,
      llmInsightText: insight.interpretation,
    },
    { upsert: true, new: true }
  );

  // 8. Flag plan as stale if regeneration is needed
  if (planShouldRegenerate) {
    await DietPlan.findByIdAndUpdate(planId, { isStale: true });
  }

  return report;
}

// ── Weekly protein debt for ProteinDebtMeter (used by DailyLogView) ──────────

export async function getWeeklyProteinDebt(
  userId: string,
  targetProteinG: number,
  weekStart: string
): Promise<number> {
  const weekEnd = getWeekEnd(weekStart);
  const logs = await DailyLog.find({
    userId,
    date: { $gte: weekStart, $lte: weekEnd },
  }).lean();

  let debt = 0;
  for (const log of logs) {
    const diff = targetProteinG - log.dayTotals.actualProtein;
    if (diff > 0) debt += diff;
  }
  return Math.round(debt);
}
