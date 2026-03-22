import DailyLog, { IDailyLog } from "../models/DailyLog";

export interface StreakResult {
  currentStreak: number;
  lastQualifiedDate: string | null; // most recent date that counted toward streak
}

/**
 * Returns true if a daily log qualifies as a "streak day".
 * Rules (all three must be true):
 *  1. At least 4 of 5 meals checked off
 *  2. Actual calories within ±150 kcal of planned
 *  3. Actual protein >= planned protein - 10g
 */
function dayQualifies(log: IDailyLog): boolean {
  const checkedCount = log.meals.filter((m) => m.checkedOff).length;
  if (checkedCount < 4) return false;

  const { actualCalories, plannedCalories, actualProtein, plannedProtein } =
    log.dayTotals;

  if (Math.abs(actualCalories - plannedCalories) > 150) return false;
  if (actualProtein < plannedProtein - 10) return false;

  return true;
}

/**
 * Calculates the current streak for a user by walking backwards from today.
 *
 * Streak logic:
 * - A qualifying day (all 3 rules met) → increments streak
 * - A day with a log that doesn't qualify → BREAKS streak
 * - A day with NO log at all → FREEZES streak (skipped, does not break)
 *   but only for 1 consecutive no-log day; 2+ consecutive missed days → break
 *
 * We look back at most 90 days.
 */
export async function calcStreak(userId: string): Promise<StreakResult> {
  const today = new Date().toISOString().slice(0, 10);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const logs = await DailyLog.find({
    userId,
    date: { $gte: cutoff, $lte: today },
  }).sort({ date: -1 });

  // Map for O(1) lookups
  const logByDate = new Map<string, IDailyLog>();
  for (const log of logs) {
    logByDate.set(log.date, log);
  }

  let streak = 0;
  let lastQualifiedDate: string | null = null;
  let consecutiveMissed = 0;

  const cursor = new Date(today);

  for (let i = 0; i < 90; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const log = logByDate.get(dateStr);

    if (!log) {
      // No log for this day — freeze for 1 day only
      consecutiveMissed++;
      if (consecutiveMissed > 1) break; // 2+ consecutive no-log days → break
    } else {
      consecutiveMissed = 0; // reset freeze counter on any logged day
      if (dayQualifies(log)) {
        streak++;
        if (!lastQualifiedDate) lastQualifiedDate = dateStr;
      } else {
        break; // logged but didn't qualify → streak breaks
      }
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return { currentStreak: streak, lastQualifiedDate };
}
