import { Router } from "express";
import { generatePlan, generateWeeklyPlan, swapMeal, groceryList, recipe } from "../controllers/plansController";

const router = Router();

router.post("/generate",                    generatePlan);
router.post("/generate-weekly",             generateWeeklyPlan);
router.post("/swap-meal",                   swapMeal);
router.post("/recipe",                      recipe);
router.get("/:planId/grocery-list",         groceryList);

export default router;
