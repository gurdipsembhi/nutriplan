import type { FoodItem, GeneratePlanResponse, DietType, Goal, UserProfile, DailyLog, Meal, MealPlanned, WeeklyDay, SwapMealOption, GroceryCategory, WeightLog, WeightTrend, WeeklyReport, Recipe, RecipeMealFood, FastingProtocol } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("nutriplan_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...((options.method && options.method !== "GET") ? { "Content-Type": "application/json" } : {}),
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> ?? {}),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("nutriplan_token");
    window.location.href = "/login";
  }
  return res;
}

export async function fetchFoods(dietType?: DietType): Promise<FoodItem[]> {
  const url = dietType
    ? `${BASE_URL}/api/foods?dietType=${dietType}`
    : `${BASE_URL}/api/foods`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch foods");
  return res.json();
}

export async function lookupFoods(
  foods: string[],
  dietType: DietType
): Promise<{ found: FoodItem[]; added: string[] }> {
  const res = await apiFetch(`${BASE_URL}/api/foods/lookup`, {
    method: "POST",
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
  fastingProtocol?: FastingProtocol;
}): Promise<GeneratePlanResponse> {
  const res = await apiFetch(`${BASE_URL}/api/plans/generate`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate plan");
  return res.json();
}

export async function getTodayLog(_userId: string): Promise<{ log: DailyLog }> {
  const res = await apiFetch(`${BASE_URL}/api/logs/today`);
  if (!res.ok) throw new Error("No log found for today");
  return res.json();
}

export async function getLogByDate(_userId: string, date: string): Promise<{ log: DailyLog }> {
  const res = await apiFetch(`${BASE_URL}/api/logs/${date}`);
  if (!res.ok) throw new Error(`No log found for ${date}`);
  return res.json();
}

export async function checkInMeal(params: {
  userId: string;
  planId: string;
  date: string;
  mealName: string;
}): Promise<{ log: DailyLog }> {
  const { planId, date, mealName } = params;
  const res = await apiFetch(`${BASE_URL}/api/logs/checkin`, {
    method: "POST",
    body: JSON.stringify({ planId, date, mealName }),
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
  const res = await apiFetch(`${BASE_URL}/api/plans/generate-weekly`, {
    method: "POST",
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
  const res = await apiFetch(`${BASE_URL}/api/plans/swap-meal`, {
    method: "POST",
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
  const { planId, ml, weightKg } = params;
  const res = await apiFetch(`${BASE_URL}/api/logs/water`, {
    method: "POST",
    body: JSON.stringify({ planId, ml, weightKg }),
  });
  if (!res.ok) throw new Error("Failed to log water");
  return res.json();
}

export async function getGroceryList(planId: string): Promise<{ categories: GroceryCategory[] }> {
  const res = await apiFetch(`${BASE_URL}/api/plans/${encodeURIComponent(planId)}/grocery-list`);
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
  const { planId, weight, date, note } = params;
  const res = await apiFetch(`${BASE_URL}/api/weight`, {
    method: "POST",
    body: JSON.stringify({ planId, weight, date, note }),
  });
  if (!res.ok) throw new Error("Failed to log weight");
  return res.json();
}

export async function getWeightHistory(
  _userId: string,
  days = 90
): Promise<{ logs: WeightLog[] }> {
  const res = await apiFetch(
    `${BASE_URL}/api/weight?days=${days}`
  );
  if (!res.ok) throw new Error("Failed to fetch weight history");
  return res.json();
}

export async function getWeightTrend(_userId: string): Promise<WeightTrend> {
  const res = await apiFetch(
    `${BASE_URL}/api/weight/trend`
  );
  if (!res.ok) throw new Error("Failed to fetch weight trend");
  return res.json();
}

export async function generateWeeklyReport(params: {
  userId: string;
  planId: string;
  selectedFoods: string[];
  goal: string;
  weekStartDate?: string;
}): Promise<{ report: WeeklyReport }> {
  const { planId, selectedFoods, goal, weekStartDate } = params;
  const res = await apiFetch(`${BASE_URL}/api/reports/weekly/generate`, {
    method: "POST",
    body: JSON.stringify({ planId, selectedFoods, goal, weekStartDate }),
  });
  if (!res.ok) throw new Error("Failed to generate weekly report");
  return res.json();
}

export async function getLatestWeeklyReport(
  _userId: string
): Promise<{ report: WeeklyReport | null }> {
  const res = await apiFetch(
    `${BASE_URL}/api/reports/weekly/latest`
  );
  if (!res.ok) throw new Error("Failed to fetch weekly report");
  return res.json();
}

export async function getRecipe(params: {
  meal: { name: string; foods: RecipeMealFood[] };
  goal: string;
}): Promise<{ recipe: Recipe }> {
  const res = await apiFetch(`${BASE_URL}/api/plans/recipe`, {
    method: "POST",
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to generate recipe");
  return res.json();
}

export async function getWeekLogs(
  _userId: string,
  weekStart: string
): Promise<{ logs: DailyLog[] }> {
  const res = await apiFetch(
    `${BASE_URL}/api/logs?weekStart=${weekStart}`
  );
  if (!res.ok) throw new Error("Failed to fetch week logs");
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
  const { planId, date, mealName, actual, meals } = params;
  const res = await apiFetch(`${BASE_URL}/api/logs/log-meal`, {
    method: "POST",
    body: JSON.stringify({ planId, date, mealName, actual, meals }),
  });
  if (!res.ok) throw new Error("Log meal failed");
  return res.json();
}
