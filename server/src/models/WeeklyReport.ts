import mongoose, { Schema, Document } from "mongoose";

export interface IWeeklyReport extends Document {
  userId: string;
  weekStartDate: string;       // "YYYY-MM-DD" — always Monday
  weekEndDate: string;         // "YYYY-MM-DD" — always Sunday

  calorieStats: {
    targetCalories: number;
    daysHit: number;           // days within ±100 kcal of target
    daysOver: number;
    daysUnder: number;
    avgDailyCalories: number;
    totalCalorieDeficitOrSurplus: number; // negative = deficit
  };

  proteinStats: {
    targetProteinG: number;    // daily target
    daysHit: number;           // days protein goal was met
    avgDailyProteinG: number;
    weeklyProteinDebtG: number;    // sum of daily deficits (0 if net surplus)
    weeklyProteinSurplusG: number;
  };

  carbStats: {
    targetCarbsG: number;
    daysHit: number;
    avgDailyCarbsG: number;
  };

  fatStats: {
    targetFatG: number;
    daysHit: number;
    avgDailyFatG: number;
  };

  muscleInsight: {
    riskLevel: "optimal" | "low_risk" | "moderate_risk" | "high_risk";
    proteinDebtG: number;
    interpretation: string;
    recoveryActions: string[];
  };

  overallScore: number;        // 0–100
  trend: "improving" | "declining" | "stable";
  planShouldRegenerate: boolean;
  isPartial: boolean;          // true when fewer than 7 logs exist for the week

  llmInsightText: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyReportSchema = new Schema<IWeeklyReport>(
  {
    userId:        { type: String, required: true },
    weekStartDate: { type: String, required: true },
    weekEndDate:   { type: String, required: true },

    calorieStats: {
      targetCalories:               { type: Number, required: true },
      daysHit:                      { type: Number, required: true },
      daysOver:                     { type: Number, required: true },
      daysUnder:                    { type: Number, required: true },
      avgDailyCalories:             { type: Number, required: true },
      totalCalorieDeficitOrSurplus: { type: Number, required: true },
    },

    proteinStats: {
      targetProteinG:        { type: Number, required: true },
      daysHit:               { type: Number, required: true },
      avgDailyProteinG:      { type: Number, required: true },
      weeklyProteinDebtG:    { type: Number, required: true },
      weeklyProteinSurplusG: { type: Number, required: true },
    },

    carbStats: {
      targetCarbsG:   { type: Number, required: true },
      daysHit:        { type: Number, required: true },
      avgDailyCarbsG: { type: Number, required: true },
    },

    fatStats: {
      targetFatG:   { type: Number, required: true },
      daysHit:      { type: Number, required: true },
      avgDailyFatG: { type: Number, required: true },
    },

    muscleInsight: {
      riskLevel:       { type: String, enum: ["optimal", "low_risk", "moderate_risk", "high_risk"], required: true },
      proteinDebtG:    { type: Number, required: true },
      interpretation:  { type: String, required: true },
      recoveryActions: { type: [String], required: true },
    },

    overallScore:         { type: Number, required: true },
    trend:                { type: String, enum: ["improving", "declining", "stable"], required: true },
    planShouldRegenerate: { type: Boolean, required: true },
    isPartial:            { type: Boolean, default: false },
    llmInsightText:       { type: String, required: true },
  },
  { timestamps: true }
);

// One report per user per week
WeeklyReportSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });
// Fast lookup of latest report per user
WeeklyReportSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IWeeklyReport>("WeeklyReport", WeeklyReportSchema);
