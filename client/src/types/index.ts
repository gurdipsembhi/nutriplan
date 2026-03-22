export type DietType = "veg" | "nonveg";
export type Goal = "fat_loss" | "muscle_gain" | "maintenance";
export type Gender = "male" | "female";
export type FastingProtocol = "16:8" | "18:6" | "5:2" | "none";

export interface EatingWindow {
  windowStart: string;
  windowEnd: string;
  mealsPerDay: number;
}

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  dietType: DietType | "both";
}

export interface DietPlanState {
  step: 1 | 2 | 3 | 4 | 5 | "generating" | "done";
  dietType: DietType | null;
  selectedFoods: string[];
  profile: UserProfile | null;
  goal: Goal | null;
  fastingProtocol: FastingProtocol | null;
  targetCalories: number | null;
  macros: Macros | null;
  plan: string | null;
  planId: string | null;
  error: string | null;
}

export interface GeneratePlanResponse {
  id: string;
  plan: string;
  targetCalories: number;
  macros: Macros;
}

export interface MealFood {
  name: string;
  grams: number;
  calories: number;
}

export interface MealPlanned {
  foods: MealFood[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  mealName: string;
  planned: MealPlanned;
  actual: MealPlanned | null;
  checkedOff: boolean;
  loggedAt: string | null;
}

export interface DayTotals {
  plannedCalories: number;
  actualCalories: number;
  plannedProtein: number;
  actualProtein: number;
  plannedCarbs: number;
  actualCarbs: number;
  plannedFat: number;
  actualFat: number;
}

export interface DailyLog {
  _id: string;
  userId: string;
  planId: string;
  date: string;
  meals: Meal[];
  dayTotals: DayTotals;
  waterMl: number;
  waterGoalMl: number;
  streakDay: number;
}

export interface SwapMealFood {
  name: string;
  grams: number;
  calories: number;
}

export interface SwapMealOption {
  foods: SwapMealFood[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeeklyMealFood {
  name: string;
  grams: number;
  calories: number;
}

export interface WeeklyMeal {
  name: string;
  foods: WeeklyMealFood[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightLog {
  _id: string;
  userId: string;
  weight: number;
  date: string;    // "YYYY-MM-DD"
  note: string;
  createdAt: string;
}

export interface WeightTrend {
  direction: "losing" | "gaining" | "stable";
  avgWeeklyChange: number;
}

export interface GroceryItem {
  food: string;
  totalGrams: number;
  unit: string;
}

export interface GroceryCategory {
  name: string;
  items: GroceryItem[];
}

export interface WeeklyReport {
  _id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  calorieStats: {
    targetCalories: number;
    daysHit: number;
    daysOver: number;
    daysUnder: number;
    avgDailyCalories: number;
    totalCalorieDeficitOrSurplus: number;
  };
  proteinStats: {
    targetProteinG: number;
    daysHit: number;
    avgDailyProteinG: number;
    weeklyProteinDebtG: number;
    weeklyProteinSurplusG: number;
  };
  carbStats: {
    targetCarbsG: number;
    daysHit: number;
    avgDailyCarbsG: number;
  };
  fatStats: {
    targetFatG: number;
    daysHit: number;
    avgDailyFatG: number;
  };
  muscleInsight: {
    riskLevel: "optimal" | "low_risk" | "moderate_risk" | "high_risk";
    proteinDebtG: number;
    interpretation: string;
    recoveryActions: string[];
  };
  overallScore: number;
  trend: "improving" | "declining" | "stable";
  planShouldRegenerate: boolean;
  isPartial: boolean;
  llmInsightText: string;
  createdAt: string;
}

export interface RecipeMealFood {
  name: string;
  grams: number;
}

export interface Recipe {
  title: string;
  prepTimeMinutes: number;
  steps: string[];
  tip: string;
}

export interface WeeklyDay {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  meals: WeeklyMeal[];
  dayTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}
