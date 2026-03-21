import { Request, Response } from "express";
import Food from "../models/Food";
import DietPlan from "../models/DietPlan";
import { generateDietPlan, generateWeeklyPlan as geminiGenerateWeeklyPlan, swapMeal as geminiSwapMeal } from "../services/geminiService";
import { buildGroceryList } from "../services/groceryService";
import { calcBMR, calcTDEE, goalCalories, calcMacros } from "../utils/calculations";

// ─── POST /api/plans/generate ─────────────────────────────────────────────────
// Unchanged — still uses claudeService for the daily text plan.

export const generatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dietType, foods, profile, goal } = req.body as {
      dietType: "veg" | "nonveg";
      foods: string[];
      profile: { height: number; weight: number; age: number; gender: "male" | "female" };
      goal: "fat_loss" | "muscle_gain" | "maintenance";
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

    const planText = await generateDietPlan({
      goal,
      targetCalories,
      macros,
      dietType,
      foodsContext,
    });

    const savedPlan = await DietPlan.create({
      profile,
      dietType,
      goal,
      selectedFoods: normalizedFoods,
      targetCalories,
      macros,
      generatedPlan: planText,
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

    const plan = await DietPlan.findById(planId);
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

    const plan = await DietPlan.findById(planId);
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

// ─── GET /api/plans/:planId/grocery-list ──────────────────────────────────────
// Pure math — no Gemini call. Aggregates 7 days × 5 meals from weeklyPlan.
// Returns items grouped by category with 10% buffer applied.

export const groceryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId } = req.params;

    const plan = await DietPlan.findById(planId).lean();
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
