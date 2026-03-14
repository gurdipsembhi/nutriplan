import OpenAI from "openai";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
function getModel()  { return process.env.OPENAI_MODEL ?? "gpt-4o"; }
function getMaxTok() { return parseInt(process.env.OPENAI_MAX_TOKENS ?? "4000"); }

const NUTRITION_SYSTEM = `You are a nutrition database API.
Return ONLY a valid JSON object. No markdown, no explanation, no backticks.
All values must be per 100g.
Schema: { "food_name": { "calories": number, "protein": number, "fat": number, "carbs": number, "fiber": number, "dietType": "veg"|"nonveg"|"both" } }`;

export async function lookupNutrition(unknownFoods: string[]): Promise<Record<string, {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  dietType: "veg" | "nonveg" | "both";
}>> {
  const attempt = async (): Promise<string> => {
    const msg = await getClient().chat.completions.create({
      model: getModel(),
      max_tokens: 1500,
      messages: [
        { role: "system", content: NUTRITION_SYSTEM },
        { role: "user",   content: `Return nutrition data for these foods: ${unknownFoods.join(", ")}` },
      ],
    });
    return msg.choices[0]?.message?.content ?? "{}";
  };

  let raw = await attempt();
  try {
    return JSON.parse(raw);
  } catch {
    console.warn("First nutrition parse failed, retrying...");
    raw = await attempt();
    try {
      return JSON.parse(raw);
    } catch {
      console.error("Nutrition lookup parse failed twice, skipping.");
      return {};
    }
  }
}

interface LeanFood {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  dietType?: string;
}

interface GeneratePlanParams {
  foods: LeanFood[];
  profile: { height: number; weight: number; age: number; gender: string };
  goal: string;
  targetCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  dietType: string;
}

const DIET_SYSTEM = `You are a certified nutritionist. Generate practical, detailed meal plans.
Use ONLY the foods provided. Never suggest foods not in the user's list.
Format: 5 meals (Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner).
For each meal: food item, portion in grams, calories for that portion, meal total.
End with 3 practical tips tailored to the user's goal.
Be specific. Be realistic. Use clear formatting with meal headers.`;

export async function generateDietPlan(params: GeneratePlanParams): Promise<string> {
  const { foods, profile, goal, targetCalories, macros, dietType } = params;

  const foodContext = foods
    .map((f) => `${f.name}: ${f.calories} kcal, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fat}g fat per 100g`)
    .join("\n");

  const userMessage = `
Create a 1-day meal plan for this person:
- Diet type: ${dietType}
- Goal: ${goal.replace("_", " ")}
- Height: ${profile.height}cm, Weight: ${profile.weight}kg, Age: ${profile.age}, Gender: ${profile.gender}
- Target calories: ${targetCalories} kcal/day
- Target macros: Protein ${macros.protein}g | Carbs ${macros.carbs}g | Fat ${macros.fat}g

Available foods and their nutrition (per 100g):
${foodContext}

Generate a detailed 5-meal plan using ONLY these foods.
`;

  const msg = await getClient().chat.completions.create({
    model: getModel(),
    max_tokens: getMaxTok(),
    messages: [
      { role: "system", content: DIET_SYSTEM },
      { role: "user",   content: userMessage },
    ],
  });

  const text = msg.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI");
  return text;
}
