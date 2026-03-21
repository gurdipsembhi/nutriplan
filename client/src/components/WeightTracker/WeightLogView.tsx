import { useState, useEffect, useCallback } from "react";
import WeightChart from "./WeightChart";
import StalePlanBanner from "./StalePlanBanner";
import { logWeight, getWeightHistory, getWeightTrend } from "../../lib/api";
import type { WeightLog, WeightTrend } from "../../types";

interface Props {
  userId: string;
  planId: string;
  originalWeight: number;
  onBack: () => void;
  onRecalculate: () => void;
}

const DIRECTION_LABEL: Record<string, string> = {
  losing:  "Losing",
  gaining: "Gaining",
  stable:  "Stable",
};

const DIRECTION_COLOR: Record<string, string> = {
  losing:  "text-emerald-400 bg-emerald-400/10",
  gaining: "text-red-400    bg-red-400/10",
  stable:  "text-blue-400   bg-blue-400/10",
};

export default function WeightLogView({
  userId, planId, originalWeight, onBack, onRecalculate,
}: Props) {
  const [logs,           setLogs]           = useState<WeightLog[]>([]);
  const [trend,          setTrend]          = useState<WeightTrend | null>(null);
  const [range,          setRange]          = useState<30 | 60 | 90>(30);
  const [loading,        setLoading]        = useState(true);
  const [isStale,        setIsStale]        = useState(false);
  const [staleDismissed, setStaleDismissed] = useState(false);

  // Form state
  const [inputWeight, setInputWeight] = useState("");
  const [note,        setNote]        = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [formError,   setFormError]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [{ logs: fetched }, trendData] = await Promise.all([
        getWeightHistory(userId, 90),
        getWeightTrend(userId),
      ]);
      setLogs(fetched);
      setTrend(trendData);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(inputWeight);
    if (!w || w < 20 || w > 300) {
      setFormError("Enter a valid weight between 20–300 kg");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const { isStale: stale, weightLog } = await logWeight({ userId, planId, weight: w, note });
      setLogs((prev) => {
        const filtered = prev.filter((l) => l.date !== weightLog.date);
        return [...filtered, weightLog].sort((a, b) => a.date.localeCompare(b.date));
      });
      if (stale) setIsStale(true);
      setInputWeight("");
      setNote("");
      const trendData = await getWeightTrend(userId);
      setTrend(trendData);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to log weight");
    } finally {
      setSubmitting(false);
    }
  }

  const cutoffDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - range);
    return d.toISOString().slice(0, 10);
  })();

  const visibleLogs = logs.filter((l) => l.date >= cutoffDate);
  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weight : null;

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
          <h2 className="text-white font-bold text-base">Weight Tracker</h2>
          {latestWeight && (
            <p className="text-white/40 text-xs">Current: {latestWeight} kg</p>
          )}
        </div>
        <div className="w-12" />
      </div>

      {/* Stale plan banner */}
      {isStale && !staleDismissed && latestWeight && (
        <StalePlanBanner
          originalWeight={originalWeight}
          currentWeight={latestWeight}
          onRecalculate={onRecalculate}
          onDismiss={() => setStaleDismissed(true)}
        />
      )}

      {/* Trend pill */}
      {trend && (
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${DIRECTION_COLOR[trend.direction]}`}>
            {DIRECTION_LABEL[trend.direction]}
          </span>
          <span className="text-white/40 text-xs">
            {trend.avgWeeklyChange > 0 ? "+" : ""}{trend.avgWeeklyChange} kg/week avg
          </span>
        </div>
      )}

      {/* Chart card */}
      <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex gap-2">
          {([30, 60, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                range === d
                  ? "bg-emerald-500 text-white"
                  : "bg-white/5 text-white/40 hover:text-white/70"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <WeightChart logs={visibleLogs} />
      </div>

      {/* Log form */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-3"
      >
        <p className="text-white font-semibold text-sm">Log today's weight</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              value={inputWeight}
              onChange={(e) => setInputWeight(e.target.value)}
              placeholder="e.g. 73.5"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 pr-10"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
              kg
            </span>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-white text-sm font-semibold transition-all duration-200"
        >
          {submitting ? "Saving…" : "Save weight"}
        </button>
      </form>

      {/* Recent entries */}
      {logs.length > 0 && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl overflow-hidden">
          <p className="text-white/40 text-xs px-4 py-3 border-b border-white/5">
            Recent entries
          </p>
          <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
            {[...logs].reverse().slice(0, 10).map((l) => (
              <div key={l.date} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-white/50 text-xs">{l.date}</span>
                <div className="flex items-center gap-3">
                  {l.note && <span className="text-white/30 text-xs">{l.note}</span>}
                  <span className="text-white text-sm font-medium tabular-nums">
                    {l.weight} kg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
