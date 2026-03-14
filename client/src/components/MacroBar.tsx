interface MacroBarProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  max: number;
}

export default function MacroBar({ label, value, unit, color, max }: MacroBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-slate-200">
          {value}
          <span className="text-slate-500 font-normal ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
