import { Router } from "express";
import { generatePlan, generateWeeklyPlan, swapMeal, groceryList } from "../controllers/plansController";

const router = Router();

router.post("/generate",                    generatePlan);
router.post("/generate-weekly",             generateWeeklyPlan);
router.post("/swap-meal",                   swapMeal);
router.get("/:planId/grocery-list",         groceryList);

export default router;
