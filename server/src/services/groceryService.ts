import type { IWeeklyDay } from "../models/DietPlan";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GroceryItem {
  food: string;
  totalGrams: number;
  unit: string;
}

export interface GroceryCategory {
  name: string;
  items: GroceryItem[];
}

// ─── Category keyword map ─────────────────────────────────────────────────────
// Keyword matching — first match wins. Order matters: more specific first.

const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  {
    category: "Grains",
    keywords: [
      "rice", "oat", "roti", "bread", "wheat", "corn", "quinoa",
      "barley", "pasta", "noodle", "millet", "flour", "cereal",
      "poha", "upma", "dalia", "semolina", "maida",
    ],
  },
  {
    category: "Proteins",
    keywords: [
      "chicken", "egg", "fish", "meat", "beef", "pork", "lamb",
      "turkey", "salmon", "tuna", "tofu", "lentil", "dal", "bean",
      "chickpea", "soy", "paneer", "tempeh", "shrimp", "prawn",
      "mutton", "moong", "rajma", "chana",
    ],
  },
  {
    category: "Dairy",
    keywords: [
      "milk", "curd", "yogurt", "yoghurt", "cheese", "butter",
      "cream", "ghee", "whey", "lassi", "cottage",
    ],
  },
  {
    category: "Fruits",
    keywords: [
      "banana", "apple", "mango", "orange", "grape", "watermelon",
      "papaya", "pear", "strawberry", "blueberry", "dragon fruit",
      "pomegranate", "guava", "kiwi", "pineapple", "melon",
      "cherry", "plum", "peach", "lychee",
    ],
  },
  {
    category: "Vegetables",
    keywords: [
      "spinach", "broccoli", "carrot", "tomato", "potato",
      "sweet potato", "onion", "garlic", "cucumber", "lettuce",
      "cabbage", "kale", "pea", "capsicum", "pepper", "mushroom",
      "zucchini", "beetroot", "cauliflower", "beans", "ladyfinger",
      "okra", "palak", "methi", "gourd", "radish", "turnip",
    ],
  },
  {
    category: "Fats",
    keywords: [
      "almond", "peanut", "cashew", "walnut", "pistachio",
      "olive oil", "coconut oil", "oil", "seed", "avocado",
      "nut", "flaxseed", "chia", "sesame", "tahini",
    ],
  },
];

const CATEGORY_ORDER = ["Grains", "Proteins", "Dairy", "Fruits", "Vegetables", "Fats", "Other"];

function categorize(foodName: string): string {
  const lower = foodName.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

function formatUnit(grams: number): { totalGrams: number; unit: string } {
  if (grams >= 1000) {
    return { totalGrams: Math.round(grams / 10) / 100, unit: "kg" };
  }
  return { totalGrams: Math.round(grams), unit: "g" };
}

// ─── Main aggregation function ────────────────────────────────────────────────

export function buildGroceryList(weeklyPlan: IWeeklyDay[]): GroceryCategory[] {
  // Step 1: sum grams per food name across all 7 days × 5 meals
  const totals = new Map<string, number>();

  for (const day of weeklyPlan) {
    for (const meal of day.meals) {
      for (const food of meal.foods) {
        const name = food.name.toLowerCase().trim();
        totals.set(name, (totals.get(name) ?? 0) + food.grams);
      }
    }
  }

  // Step 2: add 10% buffer for measuring inaccuracies
  const withBuffer = new Map<string, number>();
  for (const [name, grams] of totals) {
    withBuffer.set(name, grams * 1.1);
  }

  // Step 3: group into categories
  const grouped = new Map<string, GroceryItem[]>();

  for (const [name, grams] of withBuffer) {
    const category = categorize(name);
    const { totalGrams, unit } = formatUnit(grams);
    const item: GroceryItem = { food: name, totalGrams, unit };

    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category)!.push(item);
  }

  // Step 4: sort items within each category alphabetically
  for (const items of grouped.values()) {
    items.sort((a, b) => a.food.localeCompare(b.food));
  }

  // Step 5: return in canonical category order, skip empty categories
  return CATEGORY_ORDER
    .filter((cat) => grouped.has(cat))
    .map((cat) => ({ name: cat, items: grouped.get(cat)! }));
}
