// ─── Water Intake Service ─────────────────────────────────────────────────────
// Pure math — no DB calls, no Gemini calls.

/**
 * Calculate daily water intake goal based on body weight.
 * Formula: 35ml per kg of body weight.
 * e.g. 75kg → 2625ml → display as "2.6L"
 */
export function calcDailyWaterGoal(weightKg: number): number {
  return Math.round(weightKg * 35); // ml
}
