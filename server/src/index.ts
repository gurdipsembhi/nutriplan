import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import foodsRouter from "./routes/foods";
import plansRouter from "./routes/plans";
import logsRouter   from "./routes/logs";
import weightRouter  from "./routes/weight";
import reportsRouter from "./routes/reports";
import { startWeeklyReportJob } from "./jobs/weeklyReportJob";

dotenv.config();

const required = ["MONGODB_URI", "GEMINI_API_KEY", "CLIENT_URL"];
required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
});

const app = express();
const PORT = process.env.PORT ?? 5000;

connectDB();

// In development allow any localhost port (handles Vite port fallbacks).
// In production restrict to CLIENT_URL only.
const corsOrigin =
  process.env.NODE_ENV === "development"
    ? /^http:\/\/localhost(:\d+)?$/
    : process.env.CLIENT_URL;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/foods", foodsRouter);
app.use("/api/plans", plansRouter);
app.use("/api/logs",   logsRouter);
app.use("/api/weight",  weightRouter);
app.use("/api/reports", reportsRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startWeeklyReportJob();
});
