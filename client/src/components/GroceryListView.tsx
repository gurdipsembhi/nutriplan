import { useEffect, useState } from "react";
import type { GroceryCategory } from "../types";
import { getGroceryList } from "../lib/api";

interface Props {
  planId: string;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Grains:     "🌾",
  Proteins:   "🥩",
  Dairy:      "🥛",
  Fruits:     "🍎",
  Vegetables: "🥦",
  Fats:       "🥑",
  Other:      "🛒",
};

export default function GroceryListView({ planId, onBack }: Props) {
  const [categories, setCategories] = useState<GroceryCategory[] | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    getGroceryList(planId)
      .then(({ categories: cats }) => setCategories(cats))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load grocery list"))
      .finally(() => setLoading(false));
  }, [planId]);

  const totalItems = categories?.reduce((acc, cat) => acc + cat.items.length, 0) ?? 0;

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
          <h2 className="text-white font-bold text-base">Grocery List</h2>
          {categories && (
            <p className="text-white/40 text-xs">{totalItems} items · 7-day supply</p>
          )}
        </div>
        <div className="w-12" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl px-4 py-4 space-y-2">
          <p className="text-red-400 text-sm">{error}</p>
          <p className="text-white/40 text-xs">
            Make sure you've generated the Weekly Plan first — the grocery list is built from it.
          </p>
        </div>
      )}

      {/* Category cards */}
      {categories && categories.map((cat) => (
        <div key={cat.name} className="bg-[#12121a] border border-white/10 rounded-2xl overflow-hidden">
          {/* Category header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <span className="text-lg">{CATEGORY_ICONS[cat.name] ?? "🛒"}</span>
            <span className="text-white font-semibold text-sm">{cat.name}</span>
            <span className="ml-auto text-white/30 text-xs">{cat.items.length} items</span>
          </div>

          {/* Items */}
          <div className="divide-y divide-white/5">
            {cat.items.map((item) => (
              <div key={item.food} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-white/80 text-sm capitalize">{item.food}</span>
                <span className="text-emerald-400 text-xs font-medium tabular-nums">
                  {item.totalGrams} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Empty state (generated but empty) */}
      {categories && categories.length === 0 && (
        <div className="bg-[#12121a] border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-white/40 text-sm">No items found in the weekly plan.</p>
        </div>
      )}
    </div>
  );
}
