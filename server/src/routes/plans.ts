import { Router } from "express";
import { generatePlan, generateWeeklyPlan, swapMeal, groceryList, recipe } from "../controllers/plansController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/generate",                    requireAuth, generatePlan);
router.post("/generate-weekly",             requireAuth, generateWeeklyPlan);
router.post("/swap-meal",                   requireAuth, swapMeal);
router.post("/recipe",                      requireAuth, recipe);
router.get("/:planId/grocery-list",         requireAuth, groceryList);

export default router;
