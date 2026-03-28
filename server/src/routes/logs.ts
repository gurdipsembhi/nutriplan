import { Router } from "express";
import { checkIn, logMeal, getTodayLog, getLogByDate, addWater, getWeekLogs } from "../controllers/logsController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET  /api/logs             — get all logs for a week (?weekStart=YYYY-MM-DD)
router.get("/", requireAuth, getWeekLogs);

// POST /api/logs/checkin     — check off a meal (actual = planned, no portion edit)
router.post("/checkin", requireAuth, checkIn);

// POST /api/logs/log-meal    — log actual portions for a meal
router.post("/log-meal", requireAuth, logMeal);

// GET  /api/logs/today       — get today's log for current user
router.get("/today", requireAuth, getTodayLog);

// POST /api/logs/water       — add ml to today's water total
router.post("/water", requireAuth, addWater);

// GET  /api/logs/:date       — get log for a specific date (YYYY-MM-DD)
router.get("/:date", requireAuth, getLogByDate);

export default router;
