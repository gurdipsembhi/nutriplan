import type { WeeklyReport } from "../types";

interface ComplianceScoreProps {
  report: WeeklyReport;
}

interface StatRowProps {
  label: string;
  daysHit: number;
  weight: string;
  barColor: string;
}

function StatRow({ label, daysHit, weight, barColor }: StatRowProps) {
  const pct = Math.round((daysHit / 7) * 100);

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-white/50 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium text-white/60">
        {daysHit}/7
      </span>
      <span className="w-8 text-right text-xs text-white/25">{weight}</span>
    </div>
  );
}

export default function ComplianceScore({ report }: ComplianceScoreProps) {
  const score = report.overallScore;

  const scoreColor =
    score >= 80 ? "text-emerald-400" : score >= 50 ? "text-yellow-400" : "text-red-400";

  const scoreLabel =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs work";

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-sm">Weekly Compliance</h3>
          <p className="text-xs text-white/30 mt-0.5">
            {report.weekStartDate} → {report.weekEndDate}
            {report.isPartial && (
              <span className="ml-2 text-yellow-400/70">(partial week)</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
          <span className="text-white/30 text-base">/100</span>
          <p className={`text-xs font-medium mt-0.5 ${scoreColor}`}>{scoreLabel}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <StatRow label="Calories" daysHit={report.calorieStats.daysHit}  weight="40%" barColor="bg-emerald-500" />
        <StatRow label="Protein"  daysHit={report.proteinStats.daysHit}  weight="40%" barColor="bg-blue-400"   />
        <StatRow label="Carbs"    daysHit={report.carbStats.daysHit}     weight="10%" barColor="bg-yellow-400" />
        <StatRow label="Fat"      daysHit={report.fatStats.daysHit}      weight="10%" barColor="bg-orange-400" />
      </div>

      <p className="text-[10px] text-white/20 pt-1 border-t border-white/5">
        Score = calories (40%) + protein (40%) + carbs (10%) + fat (10%)
      </p>
    </div>
  );
}
