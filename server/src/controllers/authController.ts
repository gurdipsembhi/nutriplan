import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import User, { IUser } from "../models/User";
import { signToken } from "../utils/jwt";

function safeUser(user: IUser) {
  return {
    _id:         user._id,
    name:        user.name,
    email:       user.email,
    avatar:      user.avatar,
    preferences: user.preferences,
  };
}

// POST /api/auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    if (!name || !email || !password) {
      res.status(400).json({ error: "name, email, and password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: email.toLowerCase(), passwordHash });

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  passport.authenticate("local", { session: false }, (err: Error | null, user: IUser | false) => {
    if (err) return next(err);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken(user._id.toString());
    res.json({ token, user: safeUser(user) });
  })(req, res, next);
}

// GET /api/auth/google/callback
export async function googleCallback(req: Request, res: Response): Promise<void> {
  const user = req.user as IUser;
  const token = signToken(user._id.toString());
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
}

// GET /api/auth/me
export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ user: safeUser(req.user as IUser) });
}

// PATCH /api/auth/preferences
export async function updatePreferences(req: Request, res: Response): Promise<void> {
  try {
    const { units } = req.body as { units: "metric" | "imperial" };
    if (units !== "metric" && units !== "imperial") {
      res.status(400).json({ error: "units must be 'metric' or 'imperial'" });
      return;
    }
    const user = req.user as IUser;
    user.preferences.units = units;
    await user.save();
    res.json({ user: safeUser(user) });
  } catch (err) {
    console.error("updatePreferences error:", err);
    res.status(500).json({ error: "Failed to update preferences" });
  }
}
