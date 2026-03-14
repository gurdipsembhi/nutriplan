import { useState } from "react";
import type { UserProfile, Gender } from "../../types";

interface Props {
  onNext: (profile: UserProfile) => void;
}

export default function StepProfile({ onNext }: Props) {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseInt(age);
    if (!h || h < 100 || h > 250) e.height = "Enter height between 100–250 cm";
    if (!w || w < 30 || w > 300) e.weight = "Enter weight between 30–300 kg";
    if (!a || a < 10 || a > 100) e.age = "Enter age between 10–100";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onNext({ height: parseFloat(height), weight: parseFloat(weight), age: parseInt(age), gender });
  };

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
    unit,
    error,
    id,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    unit: string;
    error?: string;
    id: string;
  }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-slate-400 font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl bg-[#13131a] border text-slate-200 placeholder-slate-600 text-sm focus:outline-none transition-colors pr-12 ${
            error
              ? "border-red-400/50 focus:border-red-400"
              : "border-white/[0.08] focus:border-emerald-400/50"
          }`}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">{unit}</span>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">Your body stats</h1>
        <p className="text-slate-400 text-sm">Used to calculate your precise calorie needs</p>
      </div>

      <div className="bg-[#13131a] border border-white/[0.08] rounded-2xl p-6 space-y-5">
        {/* Gender */}
        <div className="space-y-1.5">
          <p className="text-sm text-slate-400 font-medium">Gender</p>
          <div className="grid grid-cols-2 gap-3">
            {(["male", "female"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`py-3 rounded-xl text-sm font-medium capitalize transition-all border ${
                  gender === g
                    ? "bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 border-emerald-400/50 text-emerald-300"
                    : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-white/20"
                }`}
              >
                {g === "male" ? "♂ Male" : "♀ Female"}
              </button>
            ))}
          </div>
        </div>

        <Field id="height" label="Height" value={height} onChange={setHeight} placeholder="170" unit="cm" error={errors.height} />
        <Field id="weight" label="Weight" value={weight} onChange={setWeight} placeholder="70" unit="kg" error={errors.weight} />
        <Field id="age" label="Age" value={age} onChange={setAge} placeholder="25" unit="yrs" error={errors.age} />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-4 rounded-2xl font-semibold text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 text-[#0a0a0f] hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
      >
        Continue →
      </button>
    </div>
  );
}
