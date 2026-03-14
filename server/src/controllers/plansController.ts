import { Request, Response } from "express";
import Food from "../models/Food";
import DietPlan from "../models/DietPlan";
import { generateDietPlan } from "../services/claudeService";
import { calcBMR, calcTDEE, goalCalories, calcMacros } from "../utils/calculations";

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
    }).lean();

    const bmr = calcBMR(profile.weight, profile.height, profile.age, profile.gender);
    const tdee = calcTDEE(bmr);
    const targetCalories = goalCalories(tdee, goal);
    const macros = calcMacros(targetCalories);

    const planText = await generateDietPlan({
      foods: foodDocs,
      profile,
      goal,
      targetCalories,
      macros,
      dietType,
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
