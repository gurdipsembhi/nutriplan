import { Router } from "express";
import {
  generateReport,
  getLatestReport,
  getAllReports,
  getReportByWeek,
} from "../controllers/reportsController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/weekly/generate",  requireAuth, generateReport);
router.get("/weekly/latest",     requireAuth, getLatestReport);  // before /:weekStart to avoid conflict
router.get("/weekly",            requireAuth, getAllReports);
router.get("/weekly/:weekStart", requireAuth, getReportByWeek);

export default router;
