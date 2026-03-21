import type { DailyLog } from "../../types";

interface Props {
  logs: DailyLog[];           // up to 7 logs for the week
  weekStart: string;          // "YYYY-MM-DD" Monday
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
}

const DAYS   = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MACROS = ["Cal", "Pro", "Carb", "Fat"] as const;

type MacroKey = typeof MACROS[number];

// green = hit, yellow = within 15%, red = missed >15%, grey = no log
function dotColor(actual: number, target: number): string {
  if (target === 0) return "bg-white/10";
  const ratio = actual / target;
  if (ratio >= 0.85) return "bg-emerald-500";
  if (ratio >= 0.70) return "bg-yellow-500";
  return "bg-red-500";
}

function getDayDate(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}

export default function MacroComplianceGrid({
  logs, weekStart, targetCalories, targetProteinG, targetCarbsG, targetFatG,
}: Props) {
  const logByDate = new Map(logs.map((l) => [l.date, l]));

  const targets: Record<MacroKey, number> = {
    Cal:  targetCalories,
    Pro:  targetProteinG,
    Carb: targetCarbsG,
    Fat:  targetFatG,
  };

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-3">
      <p className="text-white/40 text-xs uppercase tracking-wide">7-Day Compliance</p>

      {/* Header row — days */}
      <div className="grid grid-cols-8 gap-1 text-center">
        <div /> {/* spacer for macro labels */}
        {DAYS.map((d) => (
          <p key={d} className="text-white/30 text-[10px]">{d}</p>
        ))}
      </div>

      {/* One row per macro */}
      {MACROS.map((macro) => (
        <div key={macro} className="grid grid-cols-8 gap-1 items-center">
          <p className="text-white/40 text-[10px] text-right pr-1">{macro}</p>
          {Array.from({ length: 7 }, (_, i) => {
            const date = getDayDate(weekStart, i);
            const log  = logByDate.get(date);
            if (!log) {
              return (
                <div key={i} className="flex justify-center">
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>
              );
            }
            const actuals: Record<MacroKey, number> = {
              Cal:  log.dayTotals.actualCalories,
              Pro:  log.dayTotals.actualProtein,
              Carb: log.dayTotals.actualCarbs,
              Fat:  log.dayTotals.actualFat,
            };
            return (
              <div key={i} className="flex justify-center">
                <div className={`w-3 h-3 rounded-full ${dotColor(actuals[macro], targets[macro])}`} />
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex gap-3 pt-1 flex-wrap">
        {[
          { color: "bg-emerald-500", label: "Hit" },
          { color: "bg-yellow-500",  label: "Within 15%" },
          { color: "bg-red-500",     label: "Missed" },
          { color: "bg-white/10",    label: "No log" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-white/30 text-[10px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
