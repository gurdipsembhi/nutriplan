import { Router } from "express";
import { generatePlan, generateWeeklyPlan } from "../controllers/plansController";

const router = Router();

router.post("/generate",         generatePlan);
router.post("/generate-weekly",  generateWeeklyPlan);

export default router;
