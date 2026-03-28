import { Router } from "express";
import passport from "passport";
import { register, login, googleCallback, getMe, updatePreferences } from "../controllers/authController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register",  register);
router.post("/login",     login);

router.get("/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  googleCallback
);

router.get("/me",           requireAuth, getMe);
router.patch("/preferences", requireAuth, updatePreferences);

export default router;
