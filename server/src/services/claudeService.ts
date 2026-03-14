import Anthropic from "@anthropic-ai/sdk";
import { IFood } from "../models/Food";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}
function getModel()  { return process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514"; }
function getMaxTok() { return parseInt(process.env.CLAUDE_MAX_TOKENS ?? "4000"); }

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
    const msg = await getClient().messages.create({
      model: getModel(),
      max_tokens: 1500,
      system: NUTRITION_SYSTEM,
      messages: [
        { role: "user", content: `Return nutrition data for these foods: ${unknownFoods.join(", ")}` },
      ],
    });
    const block = msg.content[0];
    if (block.type !== "text") return "{}";
    return block.text;
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

interface GeneratePlanParams {
  foods: Partial<IFood>[];
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

  const msg = await getClient().messages.create({
    model: getModel(),
    max_tokens: getMaxTok(),
    system: DIET_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}
