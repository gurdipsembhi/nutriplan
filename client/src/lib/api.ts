import type { FoodItem, GeneratePlanResponse, DietType, Goal, UserProfile } from "../types";

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
