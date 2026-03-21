import type { Macros } from "../types";
import MacroBar from "./MacroBar";

interface DietPlanViewProps {
  plan: string;
  macros: Macros;
  targetCalories: number;
  onReset: () => void;
  onTrack: () => void;
  onWeeklyPlan: () => void;
  onWeightTracker: () => void;
  onWeeklyReport: () => void;
}

export default function DietPlanView({ plan, macros, targetCalories, onReset, onTrack, onWeeklyPlan, onWeightTracker, onWeeklyReport }: DietPlanViewProps) {
  const lines = plan.split("\n");

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="text-center pt-8 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-medium mb-4">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your Plan is Ready
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-1">Your Personalized Diet Plan</h1>
        <p className="text-slate-400 text-sm">Tailored to your body, goals, and food preferences</p>
      </div>

      {/* Calorie + Macro Card */}
      <div className="bg-[#13131a] border border-white/[0.08] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Daily Target</p>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold gradient-text">{targetCalories}</span>
              <span className="text-slate-400 text-sm mb-1">kcal</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 border border-emerald-400/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
        </div>

        <div className="h-px bg-white/[0.06]" />

        <div className="space-y-3">
          <MacroBar label="Protein" value={macros.protein} unit="g" color="bg-gradient-to-r from-emerald-400 to-emerald-500" max={250} />
          <MacroBar label="Carbohydrates" value={macros.carbs} unit="g" color="bg-gradient-to-r from-cyan-400 to-cyan-500" max={400} />
          <MacroBar label="Fat" value={macros.fat} unit="g" color="bg-gradient-to-r from-violet-400 to-violet-500" max={120} />
        </div>
      </div>

      {/* Plan Content */}
      <div className="bg-[#13131a] border border-white/[0.08] rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-5">Meal Plan</h2>
        <div className="space-y-1">
          {lines.map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={i} className="h-3" />;

            // Meal headers (lines with ** or all caps meal names)
            const isMealHeader =
              trimmed.match(/^\*\*?(breakfast|mid-morning|lunch|evening|dinner|snack)/i) ||
              trimmed.match(/^(breakfast|mid-morning|lunch|evening|dinner|snack)/i);

            // Tips section
            const isTipsHeader = trimmed.match(/practical tips|tips/i);

            // Numbered tips
            const isTip = trimmed.match(/^\d+\./);

            if (isMealHeader) {
              const clean = trimmed.replace(/\*\*/g, "");
              return (
                <div key={i} className="flex items-center gap-3 pt-4 pb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex-shrink-0" />
                  <p className="font-semibold text-slate-100">{clean}</p>
                </div>
              );
            }

            if (isTipsHeader) {
              return (
                <div key={i} className="pt-5 pb-2 border-t border-white/[0.06] mt-4">
                  <p className="font-semibold text-slate-100 text-sm uppercase tracking-widest text-cyan-400">
                    {trimmed.replace(/\*\*/g, "")}
                  </p>
                </div>
              );
            }

            if (isTip) {
              return (
                <div key={i} className="flex items-start gap-2.5 py-1">
                  <div className="w-5 h-5 rounded-full bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-cyan-400 text-xs font-bold">{trimmed[0]}</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{trimmed.slice(2).trim()}</p>
                </div>
              );
            }

            return (
              <p key={i} className="text-slate-300 text-sm leading-relaxed pl-4">
                {trimmed.replace(/\*\*/g, "")}
              </p>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onTrack}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Track Today
        </button>
        <button
          onClick={onWeeklyPlan}
          className="w-full py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] text-slate-200 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          See Weekly Plan
        </button>
        <button
          onClick={onWeightTracker}
          className="w-full py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] text-slate-200 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          Weight Tracker
        </button>
        <button
          onClick={onWeeklyReport}
          className="w-full py-3.5 rounded-2xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] text-slate-200 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>🏆</span>
          Weekly Muscle Report
        </button>
        <button
          onClick={onReset}
          className="w-full py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white text-sm font-medium transition-all duration-200"
        >
          Create Another Plan
        </button>
      </div>
    </div>
  );
}
