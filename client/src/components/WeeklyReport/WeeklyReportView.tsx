import { useState, useEffect } from "react";
import type { WeeklyReport, DailyLog } from "../../types";
import { generateWeeklyReport, getLatestWeeklyReport, getWeekLogs } from "../../lib/api";
import ScoreRing from "./ScoreRing";
import TrendBadge from "./TrendBadge";
import RegeneratePlanBanner from "./RegeneratePlanBanner";
import MacroComplianceGrid from "./MacroComplianceGrid";
import MuscleInsightCard from "./MuscleInsightCard";

interface Props {
  userId:        string;
  planId:        string;
  selectedFoods: string[];
  goal:          string;
  onBack:        () => void;
  onRecalculate: () => void;
}

function getCurrentWeekStart(): string {
  const now = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

export default function WeeklyReportView({
  userId, planId, selectedFoods, goal, onBack, onRecalculate,
}: Props) {
  const [report,      setReport]      = useState<WeeklyReport | null>(null);
  const [weekLogs,    setWeekLogs]    = useState<DailyLog[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const weekStart = getCurrentWeekStart();

  useEffect(() => {
    async function load() {
      try {
        const [{ report: latest }, { logs }] = await Promise.all([
          getLatestWeeklyReport(userId),
          getWeekLogs(userId, weekStart),
        ]);
        setReport(latest);
        setWeekLogs(logs);
      } catch {
        // No report yet — that's fine, show generate button
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [userId, weekStart]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const { report: generated } = await generateWeeklyReport({
        userId, planId, selectedFoods, goal,
      });
      setReport(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
          <h2 className="text-white font-bold text-base">Weekly Report</h2>
          <p className="text-white/40 text-xs">{weekStart}</p>
        </div>
        <div className="w-12" />
      </div>

      {/* No report yet */}
      {!report && !generating && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 border border-emerald-400/20 flex items-center justify-center">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">No report for this week yet</p>
            <p className="text-white/40 text-xs mt-1">
              Generate your weekly muscle report to see how well you hit your targets.
            </p>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleGenerate}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-semibold transition-all duration-200"
          >
            Generate Weekly Report
          </button>
        </div>
      )}

      {/* Generating */}
      {generating && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <p className="text-white text-sm font-medium">Analysing your week…</p>
            <p className="text-white/40 text-xs mt-1">Calculating compliance + generating insight</p>
          </div>
        </div>
      )}

      {/* Report */}
      {report && !generating && (
        <>
          {/* Partial data warning */}
          {report.isPartial && (
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl px-4 py-3">
              <p className="text-blue-300 text-xs">
                ℹ️ This report is based on {weekLogs.length}/7 days of data. Log more days for a complete picture.
              </p>
            </div>
          )}

          {/* Score + trend */}
          <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <ScoreRing score={report.overallScore} />
            <div className="space-y-2">
              <p className="text-white font-bold text-lg">
                {report.overallScore >= 70 ? "Great week! 💪" :
                 report.overallScore >= 40 ? "Decent effort" :
                 "Needs improvement"}
              </p>
              <TrendBadge trend={report.trend} />
            </div>
          </div>

          {/* Regenerate plan banner */}
          {report.planShouldRegenerate && (
            <RegeneratePlanBanner onRecalculate={onRecalculate} />
          )}

          {/* 7-day compliance grid */}
          <MacroComplianceGrid
            logs={weekLogs}
            weekStart={weekStart}
            targetCalories={report.calorieStats.targetCalories}
            targetProteinG={report.proteinStats.targetProteinG}
            targetCarbsG={report.carbStats.targetCarbsG}
            targetFatG={report.fatStats.targetFatG}
          />

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Calories",
                daysHit: report.calorieStats.daysHit,
                detail: `Avg ${report.calorieStats.avgDailyCalories} kcal/day`,
                color: "text-emerald-400",
              },
              {
                label: "Protein",
                daysHit: report.proteinStats.daysHit,
                detail: `Avg ${report.proteinStats.avgDailyProteinG}g/day`,
                color: "text-blue-400",
              },
              {
                label: "Carbs",
                daysHit: report.carbStats.daysHit,
                detail: `Avg ${report.carbStats.avgDailyCarbsG}g/day`,
                color: "text-yellow-400",
              },
              {
                label: "Fat",
                daysHit: report.fatStats.daysHit,
                detail: `Avg ${report.fatStats.avgDailyFatG}g/day`,
                color: "text-orange-400",
              },
            ].map(({ label, daysHit, detail, color }) => (
              <div key={label} className="bg-[#12121a] border border-white/10 rounded-2xl p-3 space-y-1">
                <p className="text-white/40 text-xs">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{daysHit}<span className="text-white/30 text-sm font-normal">/7</span></p>
                <p className="text-white/30 text-[10px]">{detail}</p>
              </div>
            ))}
          </div>

          {/* Muscle insight */}
          <MuscleInsightCard
            riskLevel={report.muscleInsight.riskLevel}
            proteinDebtG={report.muscleInsight.proteinDebtG}
            interpretation={report.muscleInsight.interpretation}
            recoveryActions={report.muscleInsight.recoveryActions}
          />

          {/* Regenerate report button */}
          <button
            onClick={handleGenerate}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/40 text-white/60 hover:text-white text-sm font-medium transition-all duration-200"
          >
            Regenerate report
          </button>
        </>
      )}
    </div>
  );
}
