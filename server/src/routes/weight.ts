import { Router } from "express";
import { logWeight, getWeightHistory, getWeightTrend } from "../controllers/weightController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/",      requireAuth, logWeight);
router.get("/trend",  requireAuth, getWeightTrend);   // must be before "/" to avoid conflicts
router.get("/",       requireAuth, getWeightHistory);

export default router;
