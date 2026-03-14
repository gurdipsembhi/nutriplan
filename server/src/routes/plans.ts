import { Router } from "express";
import { generatePlan } from "../controllers/plansController";

const router = Router();

router.post("/generate", generatePlan);

export default router;
