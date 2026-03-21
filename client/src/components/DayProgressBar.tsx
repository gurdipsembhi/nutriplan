import type { DayTotals } from "../types";
import MacroBar from "./MacroBar";

interface Props {
  dayTotals: DayTotals;
}

export default function DayProgressBar({ dayTotals }: Props) {
  const {
    plannedCalories, actualCalories,
    plannedProtein,  actualProtein,
    plannedCarbs,    actualCarbs,
    plannedFat,      actualFat,
  } = dayTotals;

  const pct = plannedCalories > 0
    ? Math.min(100, Math.round((actualCalories / plannedCalories) * 100))
    : 0;

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Today's Progress</h3>
        <span className="text-xs text-white/50">{pct}% of daily target</span>
      </div>

      {/* Calorie ring summary */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="#ffffff0d" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke={pct >= 100 ? "#f87171" : "#10b981"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
            {pct}%
          </span>
        </div>

        <div>
          <p className="text-white text-xl font-bold">
            {actualCalories}
            <span className="text-white/40 text-sm font-normal"> / {plannedCalories} kcal</span>
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            {plannedCalories - actualCalories > 0
              ? `${plannedCalories - actualCalories} kcal remaining`
              : `${actualCalories - plannedCalories} kcal over target`}
          </p>
        </div>
      </div>

      {/* Macro bars */}
      <div className="space-y-2">
        <MacroBar label="Protein" value={actualProtein} max={plannedProtein} unit="g" color="bg-blue-500" />
        <MacroBar label="Carbs"   value={actualCarbs}   max={plannedCarbs}   unit="g" color="bg-yellow-500" />
        <MacroBar label="Fat"     value={actualFat}     max={plannedFat}     unit="g" color="bg-orange-500" />
      </div>
    </div>
  );
}
