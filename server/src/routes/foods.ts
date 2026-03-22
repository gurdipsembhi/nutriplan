import { Router } from "express";
import { getAllFoods, lookupFoods } from "../controllers/foodsController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/",        requireAuth, getAllFoods);
router.post("/lookup", requireAuth, lookupFoods);

export default router;
