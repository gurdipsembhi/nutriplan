import { Router } from "express";
import { checkIn, logMeal, getTodayLog, getLogByDate, addWater } from "../controllers/logsController";

const router = Router();

// POST /api/logs/checkin     — check off a meal (actual = planned, no portion edit)
router.post("/checkin", checkIn);

// POST /api/logs/log-meal    — log actual portions for a meal
router.post("/log-meal", logMeal);

// GET  /api/logs/today       — get today's log for current user
router.get("/today", getTodayLog);

// POST /api/logs/water       — add ml to today's water total
router.post("/water", addWater);

// GET  /api/logs/:date       — get log for a specific date (YYYY-MM-DD)
router.get("/:date", getLogByDate);

export default router;
