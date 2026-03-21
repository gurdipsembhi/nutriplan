import { Router } from "express";
import { logWeight, getWeightHistory, getWeightTrend } from "../controllers/weightController";

const router = Router();

router.post("/",      logWeight);
router.get("/trend",  getWeightTrend);   // must be before "/" to avoid conflicts
router.get("/",       getWeightHistory);

export default router;
