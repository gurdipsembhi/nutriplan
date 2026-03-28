import { Request, Response } from "express";
import { IUser } from "../models/User";
import Food from "../models/Food";
import DietPlan from "../models/DietPlan";
import { generateDietPlan, generateWeeklyPlan as geminiGenerateWeeklyPlan, swapMeal as geminiSwapMeal, generateRecipe as geminiGenerateRecipe } from "../services/geminiService";
import type { RecipeMealFood } from "../services/geminiService";
import { buildGroceryList } from "../services/groceryService";
import { calcBMR, calcTDEE, goalCalories, calcMacros } from "../utils/calculations";

// ─── Eating window lookup ─────────────────────────────────────────────────────

type FastingProtocol = "16:8" | "18:6" | "5:2" | "none";

const EATING_WINDOWS: Record<
  Exclude<FastingProtocol, "none">,
  { windowStart: string; windowEnd: string; mealsPerDay: number }
> = {
  "16:8": { windowStart: "12:00", windowEnd: "20:00", mealsPerDay: 3 },
  "18:6": { windowStart: "13:00", windowEnd: "19:00", mealsPerDay: 2 },
  "5:2":  { windowStart: "08:00", windowEnd: "20:00", mealsPerDay: 5 },
};

// ─── POST /api/plans/generate ─────────────────────────────────────────────────

export const generatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dietType, foods, profile, goal, fastingProtocol = "none" } = req.body as {
      dietType: "veg" | "nonveg";
      foods: string[];
      profile: { height: number; weight: number; age: number; gender: "male" | "female" };
      goal: "fat_loss" | "muscle_gain" | "maintenance";
      fastingProtocol?: FastingProtocol;
    };

    if (!dietType || !foods || !profile || !goal) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const normalizedFoods = foods.map((f) => f.toLowerCase().trim());
    const foodDocs = await Food.find({
      $or: [
        { name: { $in: normalizedFoods } },
        { aliases: { $in: normalizedFoods } },
      ],
    }).select("name calories protein carbs fat fiber dietType").lean();

    const bmr = calcBMR(profile.weight, profile.height, profile.age, profile.gender);
    const tdee = calcTDEE(bmr);
    const targetCalories = goalCalories(tdee, goal);
    const macros = calcMacros(targetCalories);

    const foodsContext = foodDocs
      .map((f) => `${f.name}: ${f.calories} kcal, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fat}g fat, ${f.fiber}g fiber`)
      .join("\n");

    const eatingWindow =
      fastingProtocol !== "none" ? EATING_WINDOWS[fastingProtocol] : null;

    const planText = await generateDietPlan({
      goal,
      targetCalories,
      macros,
      dietType,
      foodsContext,
      fastingProtocol,
      eatingWindow,
    });

    const userId = (req.user as IUser)._id.toString();

    const savedPlan = await DietPlan.create({
      userId,
      profile,
      dietType,
      goal,
      selectedFoods: normalizedFoods,
      targetCalories,
      macros,
      generatedPlan: planText,
      fastingProtocol,
      eatingWindow,
    });

    res.json({
      id: savedPlan._id,
      plan: planText,
      targetCalories,
      macros,
    });
  } catch (err) {
    console.error("generatePlan error:", err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
};

// ─── POST /api/plans/generate-weekly ─────────────────────────────────────────
// Generates a 7-day structured meal plan and saves it to the existing DietPlan doc.
//
// Body: { planId, selectedFoods, targetCalories, dietType, goal }
// Response: { weeklyPlan }

export const generateWeeklyPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, selectedFoods, targetCalories, dietType, goal } = req.body as {
      planId: string;
      selectedFoods: string[];
      targetCalories: number;
      dietType: string;
      goal: string;
    };

    if (!planId || !selectedFoods || !targetCalories || !dietType || !goal) {
      res.status(400).json({ error: "planId, selectedFoods, targetCalories, dietType, and goal are required" });
      return;
    }

    const userId = (req.user as IUser)._id.toString();
    const plan = await DietPlan.findOne({ _id: planId, userId });
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const weeklyPlan = await geminiGenerateWeeklyPlan({
      selectedFoods,
      targetCalories,
      dietType,
      goal,
    });

    plan.weeklyPlan = weeklyPlan;
    await plan.save();

    res.json({ weeklyPlan });
  } catch (err) {
    console.error("generateWeeklyPlan error:", err);
    res.status(500).json({ error: "Failed to generate weekly plan" });
  }
};

// ─── POST /api/plans/swap-meal ────────────────────────────────────────────────
// Body: { planId, mealName, targetCalories, selectedFoods, goal, dietType }
// Response: { alternatives: [ meal1, meal2 ] }

export const swapMeal = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, mealName, targetCalories, selectedFoods, goal, dietType } = req.body as {
      planId: string;
      mealName: string;
      targetCalories: number;
      selectedFoods: string[];
      goal: string;
      dietType: string;
    };

    if (!planId || !mealName || !targetCalories || !selectedFoods || !goal || !dietType) {
      res.status(400).json({ error: "planId, mealName, targetCalories, selectedFoods, goal, and dietType are required" });
      return;
    }

    const userId = (req.user as IUser)._id.toString();
    const plan = await DietPlan.findOne({ _id: planId, userId });
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    const alternatives = await geminiSwapMeal({
      mealName,
      targetCalories,
      selectedFoods,
      dietType,
      goal,
    });

    res.json({ alternatives });
  } catch (err) {
    console.error("swapMeal error:", err);
    res.status(500).json({ error: "Failed to generate meal alternatives" });
  }
};

// ─── POST /api/plans/recipe ───────────────────────────────────────────────────
// Body: { meal: { name, foods: [{name, grams}] }, goal }
// Response: { recipe: { title, prepTimeMinutes, steps, tip } }

export const recipe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meal, goal } = req.body as {
      meal: { name: string; foods: RecipeMealFood[] };
      goal: string;
    };

    if (!meal?.name || !Array.isArray(meal?.foods) || meal.foods.length === 0 || !goal) {
      res.status(400).json({ error: "meal (name + foods) and goal are required" });
      return;
    }

    const result = await geminiGenerateRecipe({ meal, goal });
    res.json({ recipe: result });
  } catch (err) {
    console.error("recipe error:", err);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
};

// ─── GET /api/plans/:planId/grocery-list ──────────────────────────────────────
// Pure math — no Gemini call. Aggregates 7 days × 5 meals from weeklyPlan.
// Returns items grouped by category with 10% buffer applied.

export const groceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const userId = (req.user as IUser)._id.toString();
    const plan = await DietPlan.findOne({ _id: planId, userId }).lean();
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    if (!plan.weeklyPlan || plan.weeklyPlan.length === 0) {
      res.status(400).json({
        error: "Weekly plan not generated yet. Generate it first via POST /api/plans/generate-weekly.",
      });
      return;
    }

    const categories = buildGroceryList(plan.weeklyPlan);
    res.json({ categories });
  } catch (err) {
    console.error("groceryList error:", err);
    res.status(500).json({ error: "Failed to build grocery list" });
  }
};
