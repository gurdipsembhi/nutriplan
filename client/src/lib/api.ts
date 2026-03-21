import type { FoodItem, GeneratePlanResponse, DietType, Goal, UserProfile, DailyLog, Meal, MealPlanned, WeeklyDay, SwapMealOption, GroceryCategory, WeightLog, WeightTrend } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function fetchFoods(dietType?: DietType): Promise<FoodItem[]> {
  const url = dietType
    ? `${BASE_URL}/api/foods?dietType=${dietType}`
    : `${BASE_URL}/api/foods`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch foods");
  return res.json();
}

export async function lookupFoods(
  foods: string[],
  dietType: DietType
): Promise<{ found: FoodItem[]; added: string[] }> {
  const res = await fetch(`${BASE_URL}/api/foods/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foods, dietType }),
  });
  if (!res.ok) throw new Error("Failed to lookup foods");
  return res.json();
}

export async function generatePlan(params: {
  dietType: DietType;
  foods: string[];
  profile: UserProfile;
  goal: Goal;
}): Promise<GeneratePlanResponse> {
  const res = await fetch(`${BASE_URL}/api/plans/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate plan");
  return res.json();
}

export async function getTodayLog(userId: string): Promise<{ log: DailyLog }> {
  const res = await fetch(`${BASE_URL}/api/logs/today?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("No log found for today");
  return res.json();
}

export async function getLogByDate(userId: string, date: string): Promise<{ log: DailyLog }> {
  const res = await fetch(`${BASE_URL}/api/logs/${date}?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`No log found for ${date}`);
  return res.json();
}

export async function checkInMeal(params: {
  userId: string;
  planId: string;
  date: string;
  mealName: string;
}): Promise<{ log: DailyLog }> {
  const res = await fetch(`${BASE_URL}/api/logs/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Check-in failed");
  return res.json();
}

export async function generateWeeklyPlan(params: {
  planId: string;
  selectedFoods: string[];
  targetCalories: number;
  dietType: string;
  goal: string;
}): Promise<{ weeklyPlan: WeeklyDay[] }> {
  const res = await fetch(`${BASE_URL}/api/plans/generate-weekly`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate weekly plan");
  return res.json();
}

export async function swapMeal(params: {
  planId: string;
  mealName: string;
  targetCalories: number;
  selectedFoods: string[];
  goal: string;
  dietType: string;
}): Promise<{ alternatives: SwapMealOption[] }> {
  const res = await fetch(`${BASE_URL}/api/plans/swap-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to get swap alternatives");
  return res.json();
}

export async function addWater(params: {
  userId: string;
  planId: string;
  ml: number;
  weightKg?: number;
}): Promise<{ waterMl: number; waterGoalMl: number }> {
  const res = await fetch(`${BASE_URL}/api/logs/water`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to log water");
  return res.json();
}

export async function getGroceryList(planId: string): Promise<{ categories: GroceryCategory[] }> {
  const res = await fetch(`${BASE_URL}/api/plans/${encodeURIComponent(planId)}/grocery-list`);
  if (!res.ok) throw new Error("Failed to fetch grocery list");
  return res.json();
}

export async function logWeight(params: {
  userId: string;
  planId: string;
  weight: number;
  date?: string;
  note?: string;
}): Promise<{ weightLog: WeightLog; isStale: boolean }> {
  const res = await fetch(`${BASE_URL}/api/weight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to log weight");
  return res.json();
}

export async function getWeightHistory(
  userId: string,
  days = 90
): Promise<{ logs: WeightLog[] }> {
  const res = await fetch(
    `${BASE_URL}/api/weight?userId=${encodeURIComponent(userId)}&days=${days}`
  );
  if (!res.ok) throw new Error("Failed to fetch weight history");
  return res.json();
}

export async function getWeightTrend(userId: string): Promise<WeightTrend> {
  const res = await fetch(
    `${BASE_URL}/api/weight/trend?userId=${encodeURIComponent(userId)}`
  );
  if (!res.ok) throw new Error("Failed to fetch weight trend");
  return res.json();
}

export async function logMealActual(params: {
  userId: string;
  planId: string;
  date: string;
  mealName: string;
  actual: MealPlanned;
  meals?: Meal[];
}): Promise<{ log: DailyLog }> {
  const res = await fetch(`${BASE_URL}/api/logs/log-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Log meal failed");
  return res.json();
}
