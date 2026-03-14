import { Router } from "express";
import { getAllFoods, lookupFoods } from "../controllers/foodsController";

const router = Router();

router.get("/", getAllFoods);
router.post("/lookup", lookupFoods);

export default router;
