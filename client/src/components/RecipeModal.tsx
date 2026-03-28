import type { Recipe } from "../types";

interface Props {
  mealName: string;
  recipe: Recipe | null;   // null = still loading
  error: string | null;
  onClose: () => void;
}

export default function RecipeModal({ mealName, recipe, error, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#12121a] border border-white/10 rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-base">Recipe</p>
            <p className="text-white/40 text-xs mt-0.5">{mealName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Loading */}
        {!recipe && !error && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Generating recipe…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Recipe content */}
        {recipe && (
          <>
            {/* Title + prep time */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">{recipe.title}</p>
              <div className="flex items-center gap-1.5 text-white/40 text-xs shrink-0 ml-3">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {recipe.prepTimeMinutes} min
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <p className="text-white/50 text-xs uppercase tracking-wide font-medium">Steps</p>
              {recipe.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-white/80 text-sm leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 flex gap-3">
              <span className="text-blue-400 text-base shrink-0">💡</span>
              <p className="text-blue-300/80 text-xs leading-relaxed">{recipe.tip}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
