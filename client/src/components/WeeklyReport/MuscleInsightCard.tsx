interface Props {
  riskLevel:       "optimal" | "low_risk" | "moderate_risk" | "high_risk";
  proteinDebtG:    number;
  interpretation:  string;
  recoveryActions: string[];
}

const RISK_CONFIG = {
  optimal:         { label: "Optimal",         className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  low_risk:        { label: "Low Risk",         className: "text-blue-400   bg-blue-400/10   border-blue-400/20"    },
  moderate_risk:   { label: "Moderate Risk",    className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"  },
  high_risk:       { label: "High Risk",        className: "text-red-400    bg-red-400/10    border-red-400/20"     },
} as const;

export default function MuscleInsightCard({
  riskLevel, proteinDebtG, interpretation, recoveryActions,
}: Props) {
  const { label, className } = RISK_CONFIG[riskLevel];

  return (
    <div className="bg-[#12121a] border border-white/10 rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm">Muscle Synthesis Insight</p>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>
          {label}
        </span>
      </div>

      {/* Protein debt row — only show if there's debt */}
      {proteinDebtG > 0 && (
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2.5">
          <span className="text-yellow-400 text-sm">⚡</span>
          <div>
            <p className="text-white/70 text-xs">Weekly protein debt</p>
            <p className="text-yellow-400 text-sm font-semibold">{proteinDebtG}g missed</p>
          </div>
        </div>
      )}

      {/* Gemini narrative */}
      <p className="text-white/60 text-xs leading-relaxed">{interpretation}</p>

      {/* Recovery actions */}
      {recoveryActions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-white/40 text-[10px] uppercase tracking-wide">Recovery actions</p>
          {recoveryActions.map((action, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
              <p className="text-white/60 text-xs">{action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
