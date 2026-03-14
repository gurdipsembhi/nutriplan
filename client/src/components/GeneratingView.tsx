import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing your food preferences...",
  "Looking up nutritional data...",
  "Calculating your calorie targets...",
  "Designing your personalized meal plan...",
  "Crafting detailed meal portions...",
  "Adding practical tips just for you...",
  "Almost there — putting it all together...",
];

export default function GeneratingView() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(msgTimer);
  }, []);

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(dotTimer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-10 text-center max-w-sm mx-auto">
      {/* Animated logo / spinner */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-2 border-white/[0.06] flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 flex items-center justify-center">
            <svg className="w-8 h-8 gradient-text" fill="none" viewBox="0 0 24 24" stroke="url(#grad)" strokeWidth={1.5}>
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
        </div>
        {/* Rotating ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-cyan-400 animate-spin" />
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-100">Creating Your Plan</h2>
        <p className="text-slate-400 text-sm min-h-[20px] transition-all duration-500">
          {MESSAGES[msgIndex]}{dots}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
