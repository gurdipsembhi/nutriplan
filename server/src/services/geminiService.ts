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
  fastingProtocol?: "16:8" | "18:6" | "5:2" | "none";
  eatingWindow?: { windowStart: string; windowEnd: string; mealsPerDay: number } | null;
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

function buildFastingConstraints(
  protocol: string,
  eatingWindow: { windowStart: string; windowEnd: string; mealsPerDay: number }
): string {
  if (protocol === "5:2") {
    return `
Fasting Protocol: 5:2 Intermittent Fasting
- Generate TWO plans in your response:
  1. NORMAL DAY PLAN (5 days/week): ${eatingWindow.mealsPerDay} meals, ${eatingWindow.windowStart}–${eatingWindow.windowEnd} window, full calorie target
  2. RESTRICTED DAY PLAN (2 days/week): Maximum 500 kcal total, 2 small meals only, use the lowest-calorie foods from the list
- Clearly label each plan with "--- NORMAL DAY ---" and "--- RESTRICTED DAY ---"`;
  }

  return `
Fasting Protocol: ${protocol} Intermittent Fasting
- Eating window: ${eatingWindow.windowStart} to ${eatingWindow.windowEnd} ONLY
- All meals must be scheduled within this window — no food outside these hours
- Generate exactly ${eatingWindow.mealsPerDay} meals (not 5)
- Include the meal time (e.g. "12:00 — Meal 1") for each meal
- Distribute calories evenly across the ${eatingWindow.mealsPerDay} meals`;
}

export async function generateDietPlan(params: DietPlanParams): Promise<string> {
  const fastingSection =
    params.fastingProtocol &&
    params.fastingProtocol !== "none" &&
    params.eatingWindow
      ? buildFastingConstraints(params.fastingProtocol, params.eatingWindow)
      : "";

  const mealFormat =
    params.fastingProtocol === "5:2"
      ? "See fasting rules below for meal structure"
      : params.eatingWindow
      ? `${params.eatingWindow.mealsPerDay} meals within the eating window`
      : "5 meals — Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner";

  const prompt = `You are a certified nutritionist. Generate a practical, detailed meal plan.

User Profile:
- Goal: ${params.goal}
- Target Calories: ${params.targetCalories} kcal/day
- Macros: Protein ${params.macros.protein}g | Carbs ${params.macros.carbs}g | Fat ${params.macros.fat}g
- Diet Type: ${params.dietType}
${fastingSection}

Available foods and their nutrition per 100g:
${params.foodsContext}

Rules:
- Use ONLY the foods listed above. Never suggest foods not in the list.
- Format: ${mealFormat}
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

// ─── Call 4: Weekly Insight ───────────────────────────────────────────────────

export interface WeeklyInsightStats {
  calorieStats: {
    daysHit:        number;
    targetCalories: number;
  };
  proteinStats: {
    daysHit:            number;
    targetProteinG:     number;
    weeklyProteinDebtG: number;
  };
}

export interface WeeklyInsightResult {
  interpretation:  string;
  recoveryActions: string[];
}

export async function generateWeeklyInsight(
  stats: WeeklyInsightStats,
  riskLevel: string,
  goal: string,
  selectedFoods: string[]
): Promise<WeeklyInsightResult> {
  const prompt = `You are a sports nutritionist writing a weekly check-in message.
Tone: direct, encouraging, data-driven. Never alarmist. Never vague.

Rules:
- NEVER say the user "lost muscle" on a specific day — muscle synthesis is a weekly process
- Frame protein shortfalls as "missed synthesis opportunities", not "muscle loss"
- If protein daysHit >= 5, lead with positive reinforcement
- If protein daysHit <= 2, be direct about risk without being discouraging
- Always end with 2-3 specific, actionable food suggestions using the user's available foods
- Keep total response under 120 words

Weekly stats:
- Calorie goal hit: ${stats.calorieStats.daysHit}/7 days (target: ${stats.calorieStats.targetCalories} kcal/day)
- Protein goal hit: ${stats.proteinStats.daysHit}/7 days (target: ${stats.proteinStats.targetProteinG}g/day)
- Weekly protein debt: ${stats.proteinStats.weeklyProteinDebtG}g
- Risk level: ${riskLevel}
- User goal: ${goal}
- Available foods: ${selectedFoods.join(", ")}

Return JSON: { "interpretation": string, "recoveryActions": string[] }`;

  async function attempt(): Promise<WeeklyInsightResult> {
    const result = await getJsonModel().generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as WeeklyInsightResult;
    if (!parsed.interpretation || !Array.isArray(parsed.recoveryActions)) {
      throw new Error("Gemini weekly insight response missing required fields");
    }
    return parsed;
  }

  try {
    return await attempt();
  } catch (error) {
    console.error("Gemini weekly insight first attempt failed, retrying:", error);
    try {
      return await attempt();
    } catch (retryError) {
      console.error("Gemini weekly insight failed after retry:", retryError);
      // Return a safe fallback so report generation never blocks
      return {
        interpretation: "Your weekly data has been recorded. Keep logging consistently to unlock personalised insights.",
        recoveryActions: ["Log all 5 meals daily", "Prioritise protein at each meal", "Track your weight each morning"],
      };
    }
  }
}

// ─── Call 6: Recipe Generation ────────────────────────────────────────────────

export interface RecipeMealFood {
  name: string;
  grams: number;
}

export interface RecipeParams {
  meal: { name: string; foods: RecipeMealFood[] };
  goal: string;
}

export interface RecipeResult {
  title: string;
  prepTimeMinutes: number;
  steps: string[];
  tip: string;
}

const SNACK_MEALS = new Set(["Mid-Morning Snack", "Evening Snack"]);

export async function generateRecipe(
  params: RecipeParams
): Promise<RecipeResult> {
  const foodList = params.meal.foods
    .map((f) => `${f.grams}g ${f.name}`)
    .join(", ");

  const isSnack = SNACK_MEALS.has(params.meal.name);
  const maxPrepTime = isSnack ? 20 : 35;

  const prompt = `You are a practical home cook. Generate a simple recipe.

Meal: ${params.meal.name}

Ingredients — use EXACTLY these, no additions or substitutions:
${foodList}

Rules:
- Maximum 5 preparation steps
- Each step must be one sentence, action-oriented (start with a verb)
- Prep time must be under ${maxPrepTime} minutes — be realistic
- The tip must directly relate to the user's goal: ${params.goal}
  - fat_loss: focus on satiety, avoiding cooking oils, or portion timing
  - muscle_gain: focus on protein absorption, eating timing, or pairing
  - maintenance: focus on balance, variety, or consistency

Return JSON with this exact shape:
{
  "title": string,
  "prepTimeMinutes": number,
  "steps": string[],
  "tip": string
}`;

  async function attempt(): Promise<RecipeResult> {
    const result = await getJsonModel().generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as RecipeResult;

    if (
      !parsed.title ||
      typeof parsed.prepTimeMinutes !== "number" ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.length === 0 ||
      !parsed.tip
    ) {
      throw new Error("Gemini recipe response missing required fields");
    }

    // Enforce the 5-step cap server-side regardless of what Gemini returns
    parsed.steps = parsed.steps.slice(0, 5);

    return parsed;
  }

  try {
    return await attempt();
  } catch (error) {
    console.error("Gemini generateRecipe first attempt failed, retrying:", error);
    try {
      return await attempt();
    } catch (retryError) {
      console.error("Gemini generateRecipe failed after retry:", retryError);
      throw retryError;
    }
  }
}

// ─── Call 5: Meal Swap ────────────────────────────────────────────────────────

export interface SwapMealParams {
  mealName: string;
  targetCalories: number;
  selectedFoods: string[];
  dietType: string;
  goal: string;
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

export async function swapMeal(
  params: SwapMealParams
): Promise<SwapMealOption[]> {
  const prompt = `You are a nutritionist. Suggest 2 alternative meals.

Each meal must:
- Use ONLY foods from this list: ${params.selectedFoods.join(", ")}
- Be within ±100 kcal of target: ${params.targetCalories} kcal
- Be meaningfully different from each other
- Match diet type: ${params.dietType}

Return a JSON array of exactly 2 meal objects:
[{ "foods": [{ "name": string, "grams": number, "calories": number }], "totalCalories": number, "protein": number, "carbs": number, "fat": number }]`;

  async function attempt(): Promise<SwapMealOption[]> {
    const result = await getJsonModel().generateContent(prompt);
    const parsed = JSON.parse(result.response.text()) as SwapMealOption[];
    if (!Array.isArray(parsed) || parsed.length !== 2) {
      throw new Error("Gemini did not return exactly 2 alternatives");
    }
    return parsed;
  }

  try {
    return await attempt();
  } catch (error) {
    console.error("Gemini swapMeal first attempt failed, retrying:", error);
    try {
      return await attempt();
    } catch (retryError) {
      console.error("Gemini swapMeal failed after retry:", retryError);
      throw retryError;
    }
  }
}
