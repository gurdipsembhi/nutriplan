import { Request, Response } from "express";
import Food from "../models/Food";
import { lookupAndSaveNutrition } from "../services/nutritionService";

export const getAllFoods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dietType } = req.query;
    const query = dietType ? { dietType: { $in: [dietType, "both"] } } : {};
    const foods = await Food.find(query).select("name aliases dietType calories protein fat carbs fiber").lean();
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch foods" });
  }
};

export const lookupFoods = async (req: Request, res: Response): Promise<void> => {
  try {
    const { foods, dietType } = req.body as { foods: string[]; dietType: string };

    if (!Array.isArray(foods) || foods.length === 0) {
      res.status(400).json({ error: "foods array is required" });
      return;
    }

    const result = await lookupAndSaveNutrition(foods, dietType);
    res.json(result);
  } catch (err) {
    console.error("lookupFoods error:", err);
    res.status(500).json({ error: "Failed to lookup foods" });
  }
};
