interface Props {
  trend: "improving" | "declining" | "stable";
}

const CONFIG = {
  improving: { icon: "↑", label: "Improving",  className: "text-emerald-400 bg-emerald-400/10" },
  declining: { icon: "↓", label: "Declining",  className: "text-red-400    bg-red-400/10"     },
  stable:    { icon: "→", label: "Stable",     className: "text-blue-400   bg-blue-400/10"    },
} as const;

export default function TrendBadge({ trend }: Props) {
  const { icon, label, className } = CONFIG[trend];
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {icon} {label} vs last week
    </span>
  );
}
