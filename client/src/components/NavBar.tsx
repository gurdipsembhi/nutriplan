interface NavBarProps {
  currentStep: 1 | 2 | 3 | 4;
  onBack: () => void;
}

const STEPS = ["Diet Type", "Foods", "Profile", "Goal"];

export default function NavBar({ currentStep, onBack }: NavBarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="gradient-text font-bold text-lg tracking-tight">NutriPlan</span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => {
            const stepNum = (i + 1) as 1 | 2 | 3 | 4;
            const isComplete = currentStep > stepNum;
            const isActive = currentStep === stepNum;
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  isActive
                    ? "w-6 h-2 bg-gradient-to-r from-emerald-400 to-cyan-400"
                    : isComplete
                    ? "w-2 h-2 bg-emerald-400/60"
                    : "w-2 h-2 bg-white/10"
                }`}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}
