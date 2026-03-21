import { Router } from "express";
import {
  generateReport,
  getLatestReport,
  getAllReports,
  getReportByWeek,
} from "../controllers/reportsController";

const router = Router();

router.post("/weekly/generate",  generateReport);
router.get("/weekly/latest",     getLatestReport);  // before /:weekStart to avoid conflict
router.get("/weekly",            getAllReports);
router.get("/weekly/:weekStart", getReportByWeek);

export default router;
