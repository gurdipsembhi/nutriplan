import { forwardRef, useRef, useState } from "react";
import type { UserProfile, Gender } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { lbsToKg, ftInToCm, weightLabel, heightLabel } from "../../lib/unitConversions";

interface Props {
  onNext: (profile: UserProfile) => void;
}

// ✅ Move Field OUTSIDE (important for performance)
const Field = forwardRef<HTMLInputElement, {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit: string;
  error?: string;
  id: string;
  onEnter?: () => void;
}>(
  ({ label, value, onChange, placeholder, unit, error, id, onEnter }, ref) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-slate-400 font-medium">
        {label}
      </label>

      <div className="relative">
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*$/.test(val)) {
              onChange(val);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter?.();
            }
          }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-xl bg-[#13131a] border text-slate-200 placeholder-slate-600 text-sm focus:outline-none transition-colors pr-12 ${
            error
              ? "border-red-400/50 focus:border-red-400"
              : "border-white/[0.08] focus:border-emerald-400/50"
          }`}
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
          {unit}
        </span>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
);

Field.displayName = "Field";

export default function StepProfile({ onNext }: Props) {
  const { units } = useAuth();

  // metric inputs
  const [height,  setHeight]  = useState("");
  const [weight,  setWeight]  = useState("");
  const [age,     setAge]     = useState("");
  const [gender,  setGender]  = useState<Gender>("male");
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  // imperial inputs
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weightLbs, setWeightLbs] = useState("");

  // ✅ refs for navigation
  const heightRef    = useRef<HTMLInputElement>(null);
  const heightInRef  = useRef<HTMLInputElement>(null);
  const weightRef    = useRef<HTMLInputElement>(null);
  const ageRef       = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: Record<string, string> = {};

    if (units === "imperial") {
      const ft = parseFloat(heightFt);
      const inches = parseFloat(heightIn || "0");
      const lbs = parseFloat(weightLbs);
      const a = parseInt(age);

      if (!ft || ft < 3 || ft > 8) e.height = "Enter height between 3–8 ft";
      if (inches < 0 || inches > 11) e.heightIn = "Inches must be 0–11";
      if (!lbs || lbs < 66 || lbs > 660) e.weight = "Enter weight between 66–660 lbs";
      if (!a || a < 10 || a > 100) e.age = "Enter age between 10–100";
    } else {
      const h = parseFloat(height);
      const w = parseFloat(weight);
      const a = parseInt(age);

      if (!h || h < 100 || h > 250) e.height = "Enter height between 100–250 cm";
      if (!w || w < 30 || w > 300) e.weight = "Enter weight between 30–300 kg";
      if (!a || a < 10 || a > 100) e.age = "Enter age between 10–100";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    let finalHeightCm: number;
    let finalWeightKg: number;

    if (units === "imperial") {
      finalHeightCm = ftInToCm(parseFloat(heightFt), parseFloat(heightIn || "0"));
      finalWeightKg = lbsToKg(parseFloat(weightLbs));
    } else {
      finalHeightCm = parseFloat(height);
      finalWeightKg = parseFloat(weight);
    }

    onNext({
      height: finalHeightCm,
      weight: finalWeightKg,
      age: parseInt(age),
      gender,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-100">
          Your body stats
        </h1>
        <p className="text-slate-400 text-sm">
          Used to calculate your precise calorie needs
        </p>
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

        {units === "imperial" ? (
          <>
            {/* Imperial height: ft + in */}
            <div className="space-y-1.5">
              <p className="text-sm text-slate-400 font-medium">{heightLabel(units)}</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={heightRef}
                    id="heightFt"
                    type="text"
                    inputMode="numeric"
                    value={heightFt}
                    onChange={(e) => { if (/^\d*$/.test(e.target.value)) setHeightFt(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); heightInRef.current?.focus(); } }}
                    placeholder="5"
                    className={`w-full px-4 py-3 rounded-xl bg-[#13131a] border text-slate-200 placeholder-slate-600 text-sm focus:outline-none transition-colors pr-10 ${errors.height ? "border-red-400/50" : "border-white/[0.08] focus:border-emerald-400/50"}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">ft</span>
                </div>
                <div className="relative flex-1">
                  <input
                    ref={heightInRef}
                    id="heightIn"
                    type="text"
                    inputMode="numeric"
                    value={heightIn}
                    onChange={(e) => { if (/^\d*$/.test(e.target.value)) setHeightIn(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); weightRef.current?.focus(); } }}
                    placeholder="10"
                    className={`w-full px-4 py-3 rounded-xl bg-[#13131a] border text-slate-200 placeholder-slate-600 text-sm focus:outline-none transition-colors pr-10 ${errors.heightIn ? "border-red-400/50" : "border-white/[0.08] focus:border-emerald-400/50"}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">in</span>
                </div>
              </div>
              {errors.height && <p className="text-red-400 text-xs">{errors.height}</p>}
              {errors.heightIn && <p className="text-red-400 text-xs">{errors.heightIn}</p>}
            </div>

            {/* Imperial weight */}
            <Field
              ref={weightRef}
              id="weight"
              label={weightLabel(units)}
              value={weightLbs}
              onChange={setWeightLbs}
              placeholder="154"
              unit="lbs"
              error={errors.weight}
              onEnter={() => ageRef.current?.focus()}
            />
          </>
        ) : (
          <>
            {/* Metric height */}
            <Field
              ref={heightRef}
              id="height"
              label={heightLabel(units)}
              value={height}
              onChange={setHeight}
              placeholder="170"
              unit="cm"
              error={errors.height}
              onEnter={() => weightRef.current?.focus()}
            />

            {/* Metric weight */}
            <Field
              ref={weightRef}
              id="weight"
              label={weightLabel(units)}
              value={weight}
              onChange={setWeight}
              placeholder="70"
              unit="kg"
              error={errors.weight}
              onEnter={() => ageRef.current?.focus()}
            />
          </>
        )}

        <Field
          ref={ageRef}
          id="age"
          label="Age"
          value={age}
          onChange={setAge}
          placeholder="25"
          unit="yrs"
          error={errors.age}
          onEnter={handleSubmit}
        />
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
