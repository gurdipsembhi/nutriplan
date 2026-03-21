import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IWeeklyDay } from "../models/DietPlan";

// ─── SDK setup (lazy) ────────────────────────────────────────────────────────
// Models are created on first call, not at import time.
// This ensures dotenv.config() has already run before the API key is read.

function getJsonModel() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string).getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash-001",
    generationConfig: { responseMimeType: "application/json" },
  });
}

function getTextModel() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string).getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash-001",
  });
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  dietType: "veg" | "nonveg" | "both";
}

export interface DietPlanParams {
  goal: string;
  targetCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  dietType: string;
  foodsContext: string;
}

export interface WeeklyPlanParams {
  selectedFoods: string[];
  targetCalories: number;
  dietType: string;
  goal: string;
}

// Raw shape returned by Gemini — keyed by day name
type WeeklyPlanRaw = Record<
  string,
  {
    meals: {
      name: string;
      foods: { name: string; grams: number; calories: number }[];
      totalCalories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[];
    dayTotal: { calories: number; protein: number; carbs: number; fat: number };
  }
>;

const DAYS_ORDER = [
  "Monday", "Tuesday", "Wednesday", "Thursday",
  "Friday", "Saturday", "Sunday",
] as const;

// ─── Call 1: Nutrition Lookup ─────────────────────────────────────────────────

export async function lookupNutrition(
  unknownFoods: string[]
): Promise<Record<string, NutritionData>> {
  const prompt = `You are a nutrition database API.
Return nutrition data per 100g for these foods: ${unknownFoods.join(", ")}

Return a JSON object with this exact schema:
{
  "food_name": {
    "calories": number,
    "protein": number,
    "fat": number,
    "carbs": number,
    "fiber": number,
    "dietType": "veg" | "nonveg" | "both"
  }
}

All values must be per 100g. Use lowercase food names as keys.`;

  try {
    const result = await getJsonModel().generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    try {
      const retry = await getJsonModel().generateContent(prompt);
      return JSON.parse(retry.response.text());
    } catch {
      console.error("Gemini nutrition lookup failed after retry:", error);
      return {};
    }
  }
}

// ─── Call 2: Diet Plan Generation ────────────────────────────────────────────

export async function generateDietPlan(params: DietPlanParams): Promise<string> {
  const prompt = `You are a certified nutritionist. Generate a practical, detailed meal plan.

User Profile:
- Goal: ${params.goal}
- Target Calories: ${params.targetCalories} kcal/day
- Macros: Protein ${params.macros.protein}g | Carbs ${params.macros.carbs}g | Fat ${params.macros.fat}g
- Diet Type: ${params.dietType}

Available foods and their nutrition per 100g:
${params.foodsContext}

Rules:
- Use ONLY the foods listed above. Never suggest foods not in the list.
- Format: 5 meals — Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
- For each meal: food item, portion in grams, calories for that portion, meal total
- Total daily calories must be within ±50 kcal of target
- End with 3 practical tips tailored to the user's goal
- Be specific. Be realistic.`;

  const result = await getTextModel().generateContent(prompt);
  return result.response.text();
}

// ─── Call 3: Weekly Plan Generation ──────────────────────────────────────────

export async function generateWeeklyPlan(
  params: WeeklyPlanParams
): Promise<IWeeklyDay[]> {
  const prompt = `You are a certified nutritionist. Generate a 7-day meal plan.

Rules:
- Exactly 5 meals per day: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
- Use ONLY foods from this list: ${params.selectedFoods.join(", ")}
- No food item should repeat in the same meal slot more than 3 times across 7 days
- Each day's total calories must be within ±50 kcal of target: ${params.targetCalories} kcal
- Diet type: ${params.dietType}

Return JSON with this schema:
{
  "Monday": {
    "meals": [{ "name": string, "foods": [{ "name": string, "grams": number, "calories": number }], "totalCalories": number, "protein": number, "carbs": number, "fat": number }],
    "dayTotal": { "calories": number, "protein": number, "carbs": number, "fat": number }
  },
  "Tuesday": {},
  "Wednesday": {},
  "Thursday": {},
  "Friday": {},
  "Saturday": {},
  "Sunday": {}
}`;

  async function attempt(): Promise<IWeeklyDay[]> {
    const result = await getJsonModel().generateContent(prompt);
    const raw = JSON.parse(result.response.text()) as WeeklyPlanRaw;

    return DAYS_ORDER.map((day) => ({
      day,
      meals:    raw[day].meals,
      dayTotal: raw[day].dayTotal,
    }));
  }

  try {
    return await attempt();
  } catch (error) {
    console.error("Gemini weekly plan first attempt failed, retrying:", error);
    try {
      return await attempt();
    } catch (retryError) {
      console.error("Gemini weekly plan failed after retry:", retryError);
      throw retryError;  // weekly plan is not optional — surface the error
    }
  }
}
