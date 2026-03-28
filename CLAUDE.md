# CLAUDE.md — NutriPlan AI Diet App

This file is the single source of truth for Claude Code.
Read it fully before writing any code, creating files, or making decisions.

---

## Project Overview

**NutriPlan** is an LLM-driven diet planning web app. Users input their diet preference, locally available foods, body metrics, and fitness goal. The app calculates their calorie targets and generates a personalized daily meal plan using Google Gemini AI.

The key intelligence is that the app maintains a growing **nutrition database in MongoDB**. When a user adds a food that doesn't exist in the DB, the LLM looks up its nutritional values and saves them — so future users with the same food never trigger another LLM lookup.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (Vite) + TypeScript | Fast, typed, component-friendly |
| Styling | Tailwind CSS | Utility-first, no CSS bloat |
| Backend | Node.js + Express | Simple REST API |
| Database | MongoDB Atlas (M0 free tier) + Mongoose | Cloud-hosted, no local install, free forever |
| AI | Google Gemini API (`gemini-2.0-flash`) | Powers nutrition lookup + diet generation. Fast, cheap, generous free tier. |
| Auth | JWT (optional, add later) | Stateless, scalable |
| Env vars | dotenv | Keep secrets out of code |

---

## File Structure

```
nutriplan/
├── CLAUDE.md                          ← You are here
│
├── client/                            ← React frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   └── src/
│       ├── main.tsx                   ← React entry point
│       ├── App.tsx                    ← Root component, step router
│       │
│       ├── components/
│       │   ├── steps/
│       │   │   ├── StepDietType.tsx   ← Step 1: Veg / Non-veg
│       │   │   ├── StepFoods.tsx      ← Step 2: Food selection
│       │   │   ├── StepProfile.tsx    ← Step 3: Height, weight, age
│       │   │   └── StepGoal.tsx       ← Step 4: Fat loss / muscle gain
│       │   ├── DietPlanView.tsx       ← Final plan display
│       │   ├── GeneratingView.tsx     ← Loading/status screen
│       │   ├── MacroBar.tsx           ← Calorie/macro progress bars
│       │   └── NavBar.tsx             ← Top nav with step dots
│       │
│       ├── hooks/
│       │   └── useDietPlan.ts         ← Main state machine hook
│       │
│       ├── lib/
│       │   ├── api.ts                 ← All fetch calls to backend
│       │   └── calculations.ts        ← BMR, TDEE, goal calorie math
│       │
│       └── types/
│           └── index.ts               ← Shared TypeScript types
│
├── server/                            ← Express backend
│   ├── index.ts                       ← Entry: starts Express server
│   ├── .env                           ← NEVER commit. See .env.example
│   ├── .env.example                   ← Committed template
│   │
│   ├── config/
│   │   └── db.ts                      ← MongoDB connection via Mongoose
│   │
│   ├── models/
│   │   ├── Food.ts                    ← Mongoose model: nutrition DB
│   │   └── DietPlan.ts                ← Mongoose model: saved plans
│   │
│   ├── routes/
│   │   ├── foods.ts                   ← GET/POST /api/foods
│   │   └── plans.ts                   ← POST /api/plans/generate
│   │
│   ├── controllers/
│   │   ├── foodsController.ts         ← Business logic for food routes
│   │   └── plansController.ts         ← Business logic for plan generation
│   │
│   └── services/
│       ├── geminiService.ts           ← All Google Gemini API calls
│       └── nutritionService.ts        ← DB lookup + LLM fallback logic
│
├── package.json                       ← Root: concurrently runs client + server
└── .gitignore
```

---

## MongoDB Schemas

### `foods` collection — `server/models/Food.ts`

This is the shared nutrition database. It grows over time as users add new foods.

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IFood extends Document {
  name: string;          // lowercase, trimmed. e.g. "banana"
  aliases: string[];     // ["plantain", "kela"] — alternate names that map here
  calories: number;      // kcal per 100g
  protein: number;       // grams per 100g
  fat: number;           // grams per 100g
  carbs: number;         // grams per 100g
  fiber: number;         // grams per 100g
  vitamins: Record<string, number>;   // e.g. { "C": 8.7, "B6": 0.4 }
  minerals: Record<string, number>;   // e.g. { "potassium": 358, "magnesium": 27 }
  per: string;           // always "100g" — all values normalized to 100g
  dietType: "veg" | "nonveg" | "both";
  source: "seed" | "llm" | "manual";  // how it entered the DB
  createdAt: Date;
  updatedAt: Date;
}

const FoodSchema = new Schema<IFood>(
  {
    name:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    aliases:  { type: [String], default: [] },
    calories: { type: Number, required: true },
    protein:  { type: Number, required: true },
    fat:      { type: Number, required: true },
    carbs:    { type: Number, required: true },
    fiber:    { type: Number, default: 0 },
    vitamins: { type: Map, of: Number, default: {} },
    minerals: { type: Map, of: Number, default: {} },
    per:      { type: String, default: "100g" },
    dietType: { type: String, enum: ["veg", "nonveg", "both"], required: true },
    source:   { type: String, enum: ["seed", "llm", "manual"], default: "llm" },
  },
  { timestamps: true }
);

// Index for fast name lookups and alias searches
FoodSchema.index({ name: 1 });
FoodSchema.index({ aliases: 1 });

export default mongoose.model<IFood>("Food", FoodSchema);
```

### `dietplans` collection — `server/models/DietPlan.ts`

Stores generated plans for optional history/sharing features.

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IDietPlan extends Document {
  profile: {
    height: number;    // cm
    weight: number;    // kg
    age: number;
    gender: "male" | "female";
  };
  dietType: "veg" | "nonveg";
  goal: "fat_loss" | "muscle_gain" | "maintenance";
  selectedFoods: string[];    // food names from the DB
  targetCalories: number;
  macros: {
    protein: number;   // grams
    carbs: number;     // grams
    fat: number;       // grams
  };
  generatedPlan: string;      // raw LLM output text
  createdAt: Date;
}

const DietPlanSchema = new Schema<IDietPlan>(
  {
    profile: {
      height: { type: Number, required: true },
      weight: { type: Number, required: true },
      age:    { type: Number, required: true },
      gender: { type: String, enum: ["male", "female"], required: true },
    },
    dietType:       { type: String, enum: ["veg", "nonveg"], required: true },
    goal:           { type: String, enum: ["fat_loss", "muscle_gain", "maintenance"], required: true },
    selectedFoods:  { type: [String], required: true },
    targetCalories: { type: Number, required: true },
    macros: {
      protein: Number,
      carbs:   Number,
      fat:     Number,
    },
    generatedPlan: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDietPlan>("DietPlan", DietPlanSchema);
```

---

## API Routes

### `GET /api/foods`
Returns all foods in DB. Optionally filter by `?dietType=veg`.

### `POST /api/foods/lookup`
Called before diet generation. Frontend sends the list of food names the user selected.

**Request:**
```json
{ "foods": ["banana", "roti", "dragon fruit"], "dietType": "veg" }
```

**Logic (in `nutritionService.ts`):**
1. Query MongoDB for each food name (also check `aliases` array).
2. Collect any foods NOT found in DB → these are `unknownFoods`.
3. If `unknownFoods.length > 0`:
   - Call `geminiService.lookupNutrition(unknownFoods)`.
   - Parse the returned JSON.
   - Save each new food to MongoDB with `source: "llm"`.
4. Return full nutrition data for ALL requested foods.

**Response:**
```json
{
  "found": [
    { "name": "banana", "calories": 89, "protein": 1.1, "fat": 0.3, "carbs": 23 }
  ],
  "added": ["dragon fruit"]
}
```

### `POST /api/plans/generate`
Generates the full diet plan.

**Request:**
```json
{
  "dietType": "veg",
  "foods": ["banana", "oats", "paneer", "dal"],
  "profile": { "height": 170, "weight": 75, "age": 25, "gender": "male" },
  "goal": "fat_loss"
}
```

**Logic (in `plansController.ts`):**
1. Fetch full nutrition data for all selected foods from MongoDB.
2. Calculate BMR → TDEE → target calories (see Calculations section).
3. Build the prompt with food nutrition context.
4. Call `geminiService.generateDietPlan(...)`.
5. Save the plan to `dietplans` collection.
6. Return the plan + macros to the client.

---

## Calorie Calculations — `client/src/lib/calculations.ts`

```typescript
// Mifflin-St Jeor formula
export function calcBMR(weight: number, height: number, age: number, gender: "male" | "female"): number {
  if (gender === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

// Sedentary to lightly active (1.4 multiplier)
export function calcTDEE(bmr: number): number {
  return Math.round(bmr * 1.4);
}

// Adjust for goal
export function goalCalories(tdee: number, goal: string): number {
  if (goal === "fat_loss")    return tdee - 500;
  if (goal === "muscle_gain") return tdee + 300;
  return tdee; // maintenance
}

// Macro split: 30% protein / 45% carbs / 25% fat
export function calcMacros(calories: number) {
  return {
    protein: Math.round((calories * 0.30) / 4),
    carbs:   Math.round((calories * 0.45) / 4),
    fat:     Math.round((calories * 0.25) / 9),
  };
}
```

---

## Gemini Service — `server/services/geminiService.ts`

### SDK Setup

```bash
npm install @google/generative-ai --prefix server
```

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// Two model instances — one for JSON-only calls, one for text generation
const jsonModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",  // Forces pure JSON — never use prompt-only JSON instructions
  },
});

const textModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
});
```

> **Critical:** Always use `responseMimeType: "application/json"` for JSON calls. Gemini's JSON-via-prompting alone is less reliable. This parameter enforces it at the API level.

---

### Two Gemini calls — keep them separate

**Call 1: Nutrition Lookup** — uses `jsonModel`

```typescript
export async function lookupNutrition(unknownFoods: string[]): Promise<Record<string, NutritionData>> {
  const prompt = `You are a nutrition database API.
Return nutrition data per 100g for these foods: ${unknownFoods.join(", ")}

Return a JSON object with this exact schema:
{
  "food_name": {
    "calories": number,
    "protein": number,
    "fat": number,
    "carbs": number,
    "fiber": number,
    "dietType": "veg" | "nonveg" | "both"
  }
}

All values must be per 100g. Use lowercase food names as keys.`;

  try {
    const result = await jsonModel.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    // Retry once on failure
    try {
      const retry = await jsonModel.generateContent(prompt);
      return JSON.parse(retry.response.text());
    } catch {
      console.error("Gemini nutrition lookup failed after retry:", error);
      return {}; // Do not block plan generation
    }
  }
}
```

**Call 2: Diet Plan Generation** — uses `textModel`

```typescript
export async function generateDietPlan(params: DietPlanParams): Promise<string> {
  const prompt = `You are a certified nutritionist. Generate a practical, detailed meal plan.

User Profile:
- Goal: ${params.goal}
- Target Calories: ${params.targetCalories} kcal/day
- Macros: Protein ${params.macros.protein}g | Carbs ${params.macros.carbs}g | Fat ${params.macros.fat}g
- Diet Type: ${params.dietType}

Available foods and their nutrition per 100g:
${params.foodsContext}

Rules:
- Use ONLY the foods listed above. Never suggest foods not in the list.
- Format: 5 meals — Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
- For each meal: food item, portion in grams, calories for that portion, meal total
- Total daily calories must be within ±50 kcal of target
- End with 3 practical tips tailored to the user's goal
- Be specific. Be realistic.`;

  const result = await textModel.generateContent(prompt);
  return result.response.text();
}
```

---

## Database — MongoDB Atlas (Production)

We use **MongoDB Atlas M0 free tier** as the production database. There is no local MongoDB. All environments (dev + prod) connect to Atlas.

### One-time Atlas Setup (do this before running the app)

1. Sign up at **cloud.mongodb.com** (free, no credit card)
2. Create a cluster → choose **M0 Free** → region: **Mumbai (ap-south-1)** for India users
3. **Database Access** → Add user → username + password → role: `Read and write to any database`
4. **Network Access** → Add IP → `0.0.0.0/0` (allow all — required for Render deployment)
5. **Connect** → Drivers → copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nutriplan?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your DB user credentials
7. The database name `nutriplan` is created automatically on first write

### Atlas connection in `server/config/db.ts`

```typescript
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // crash fast — do not run app without DB
  }
};

export default connectDB;
```

Call `connectDB()` at the top of `server/index.ts` before registering any routes.

---

## Environment Variables

There are three env files. Read carefully — each serves a different purpose.

---

### `server/.env` — local development (NEVER commit)

```bash
# ─── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB Atlas ─────────────────────────────────────────
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nutriplan?retryWrites=true&w=majority

# ─── Google Gemini ─────────────────────────────────────────
# Get from: aistudio.google.com → Get API Key (free tier available)
GEMINI_API_KEY=AIzaSy...

# ─── CORS ──────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ─── Gemini Model ──────────────────────────────────────────
# gemini-2.0-flash → fastest + cheapest, recommended for production
# gemini-1.5-pro   → more capable, use if output quality needs improvement
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_TOKENS=1500
```

---

### `client/.env` — local development (NEVER commit)

```bash
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=NutriPlan
```

---

### `server/.env.example` — committed template, no real secrets

```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://your_db_user:your_db_password@cluster0.xxxxx.mongodb.net/nutriplan?retryWrites=true&w=majority
# Get from: aistudio.google.com → Get API Key
GEMINI_API_KEY=AIzaSy_your_key_here
CLIENT_URL=https://your-app.vercel.app
GEMINI_MODEL=gemini-2.0-flash
GEMINI_MAX_TOKENS=1500
```

---

### `client/.env.example` — committed template

```bash
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=NutriPlan
```

---

## How to Use Env Vars in Code

### Server (Express) — `process.env.VAR_NAME`
```typescript
mongoose.connect(process.env.MONGODB_URI as string);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model  = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
app.use(cors({ origin: process.env.CLIENT_URL }));
```

### Client (Vite/React) — `import.meta.env.VITE_VAR_NAME`
```typescript
const BASE_URL = import.meta.env.VITE_API_URL;
```

> **Important:** Vite only exposes env vars that start with `VITE_` to the browser. Never put `GEMINI_API_KEY` in the client `.env`.

---

## Deployment

### Render (Backend) Environment Variables

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your full Atlas connection string |
| `GEMINI_API_KEY` | Your Google AI Studio API key |
| `CLIENT_URL` | Your Vercel frontend URL |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `GEMINI_MAX_TOKENS` | `1500` |

### Vercel (Frontend) Environment Variables

| Key | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL |
| `VITE_APP_NAME` | `NutriPlan` |

---

## Seed Script

Create `server/scripts/seedFoods.ts` to pre-populate MongoDB with common Indian + global foods on first run. Run once with `npx ts-node server/scripts/seedFoods.ts`. Mark all seeded docs with `source: "seed"`.

Seed at minimum: banana, egg, chicken breast, brown rice, oats, milk, lentils, paneer, spinach, apple, sweet potato, almonds, greek yogurt, salmon, broccoli, roti, dal, curd, peanuts, tofu.

---

## Development Commands

```bash
# First time setup
cp server/.env.example server/.env
cp client/.env.example client/.env

# Install all dependencies (includes @google/generative-ai)
npm install && npm install --prefix client && npm install --prefix server

# Verify Gemini SDK is installed on server
npm list @google/generative-ai --prefix server

# Run both client and server
npm run dev

# Seed database — run once
npm run seed
```

### Root `package.json` scripts
```json
{
  "scripts": {
    "dev":   "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "build": "npm run build --prefix client && npm run build --prefix server",
    "seed":  "npx ts-node server/scripts/seedFoods.ts"
  }
}
```

### Server dependencies (key packages)
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "node-cron": "^3.0.3"
  }
}
```

---

## `.gitignore`

```
server/.env
client/.env
node_modules/
client/node_modules/
server/node_modules/
client/dist/
server/dist/
*.log
npm-debug.log*
.DS_Store
Thumbs.db
```

---

## Key Rules for Claude Code

1. **Never hardcode any secret.** Always from `process.env`. Crash on startup if missing. Required vars: `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL`.
2. **Never use a local MongoDB URI.** Only `mongodb+srv://...` (Atlas) is valid.
3. **Validate all env vars at startup** in `server/index.ts`.
4. **Client env vars must start with `VITE_`.** Never put secrets in client `.env`.
5. **Always normalize food names to lowercase** before DB queries and saving.
6. **Check aliases too** when querying: `Food.findOne({ $or: [{ name }, { aliases: name }] })`
7. **Batch LLM nutrition lookups.** Never call the API once per food.
8. **Save LLM nutrition results immediately** after parsing.
9. **The `per` field is always `"100g"`.** Portion math happens at prompt level.
10. **Do not store the LLM-generated plan in the client.**
11. **TypeScript strict mode is on.** No `any` types.
12. **Tailwind only for styling.** No inline styles, no separate CSS files.
13. **All API calls from frontend go through `client/src/lib/api.ts`.**

---

## Data Flow Summary

```
User selects foods
       ↓
POST /api/foods/lookup
       ↓
MongoDB: which foods exist?
       ↓ (for unknown foods)
Gemini API: nutrition lookup → JSON
       ↓
MongoDB: save new foods (source: "llm")
       ↓
Return all nutrition to frontend
       ↓
User confirms → POST /api/plans/generate
       ↓
Server: calc BMR → TDEE → target calories → macros
       ↓
Gemini API: generate meal plan (with food nutrition context)
       ↓
MongoDB: save diet plan
       ↓
Return plan text + macros to frontend → render
```

---

---

# 🗺️ NutriPlan — Feature Roadmap

This section documents all planned features. Each feature includes its pain point, data model changes, API changes, and Gemini prompt strategy where relevant.

Build features in the order listed within each tier. Do not skip ahead.

---

## Tier 1 — Core Retention Features

These features close the biggest drop-off gaps. Build these immediately after MVP.

---

### Feature 1.1 — Daily Meal Log

**Pain point solved:** Users have no way to track what they actually ate vs. what was planned. Without logging, there is no feedback loop and motivation collapses within 2–3 days.

**What it does:** User checks off each meal in their plan. They can log actual portion if different from planned. App shows real-time calorie + macro progress bars for the day.

**New Mongoose model — `server/models/DailyLog.ts`**

```typescript
export interface IDailyLog extends Document {
  userId: string;           // temporary: device fingerprint until auth is added
  planId: string;           // reference to DietPlan._id
  date: string;             // "YYYY-MM-DD"
  meals: {
    mealName: string;       // "Breakfast", "Lunch", etc.
    planned: {
      foods: { name: string; grams: number; calories: number }[];
      totalCalories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    actual: {
      foods: { name: string; grams: number; calories: number }[];
      totalCalories: number;
      protein: number;
      carbs: number;
      fat: number;
    } | null;               // null = not logged yet
    checkedOff: boolean;
    loggedAt: Date | null;
  }[];
  dayTotals: {
    plannedCalories: number;
    actualCalories: number;
    plannedProtein: number;
    actualProtein: number;
    plannedCarbs: number;
    actualCarbs: number;
    plannedFat: number;
    actualFat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**New API routes — `server/routes/logs.ts`**

```
POST /api/logs/checkin          — Check off a meal (no portion change)
POST /api/logs/log-meal         — Log actual portions for a meal
GET  /api/logs/today            — Get today's log for current user
GET  /api/logs/:date            — Get log for specific date (YYYY-MM-DD)
```

**Frontend components**

```
client/src/components/
  DailyLogView.tsx              — Main log screen, shows all 5 meals
  MealCard.tsx                  — Single meal: planned vs actual, check-off button
  DayProgressBar.tsx            — Real-time calorie + macro progress (reuse MacroBar)
```

**Rules**
- `actualCalories` defaults to `plannedCalories` when user just checks off without editing portions
- Always recalculate `dayTotals` when any meal is logged or checked off
- Date is stored as `"YYYY-MM-DD"` string, never as Date object, to avoid timezone bugs

---

### Feature 1.2 — Weekly Meal Plan (Mon–Sun)

**Pain point solved:** A single-day plan feels thin. Users need to see variety across the week and not wonder "what do I eat tomorrow."

**What it does:** Gemini generates 7 days of meals in one call. Each day has 5 meals. No food repeats more than 3 times across the week in the same meal slot.

**Changes to `DietPlan` model:** Add `weeklyPlan` field alongside existing `generatedPlan`.

```typescript
weeklyPlan: {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  meals: {
    name: string;        // "Breakfast", "Lunch", etc.
    foods: { name: string; grams: number; calories: number }[];
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  dayTotal: { calories: number; protein: number; carbs: number; fat: number };
}[]
```

**Gemini prompt strategy — `geminiService.generateWeeklyPlan()`**

```typescript
export async function generateWeeklyPlan(params: WeeklyPlanParams): Promise<WeeklyPlanResult> {
  const prompt = `You are a certified nutritionist. Generate a 7-day meal plan.

Rules:
- Exactly 5 meals per day: Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner
- Use ONLY foods from this list: ${params.selectedFoods.join(", ")}
- No food item should repeat in the same meal slot more than 3 times across 7 days
- Each day's total calories must be within ±50 kcal of target: ${params.targetCalories} kcal
- Diet type: ${params.dietType}

Return JSON with this schema:
{
  "Monday": {
    "meals": [{ "name": string, "foods": [{ "name": string, "grams": number, "calories": number }], "totalCalories": number, "protein": number, "carbs": number, "fat": number }],
    "dayTotal": { "calories": number, "protein": number, "carbs": number, "fat": number }
  },
  "Tuesday": { ... },
  ...all 7 days
}`;

  try {
    const result = await jsonModel.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch {
    const retry = await jsonModel.generateContent(prompt);
    return JSON.parse(retry.response.text());
  }
}

---

### Feature 1.3 — Meal Swap ("Not feeling this")

**Pain point solved:** Rigid plans are the #1 reason users abandon apps. Real life means some foods aren't available or the user just doesn't want that meal today.

**What it does:** User taps "Swap" on any meal. Gemini suggests 2 alternative meals using the same food list with approximately the same calories (±100 kcal). User picks one. Log updates.

**New API route**

```
POST /api/plans/swap-meal
Body: { planId, day, mealName, targetCalories, selectedFoods, goal }
Response: { alternatives: [ meal1, meal2 ] }
```

**Gemini prompt strategy — `geminiService.swapMeal()`**

```typescript
export async function swapMeal(params: SwapMealParams): Promise<SwapMealResult[]> {
  const prompt = `You are a nutritionist. Suggest 2 alternative meals.

Each meal must:
- Use ONLY foods from this list: ${params.selectedFoods.join(", ")}
- Be within ±100 kcal of target: ${params.targetCalories} kcal
- Be meaningfully different from each other
- Match diet type: ${params.dietType}

Return a JSON array of exactly 2 meal objects:
[{ "foods": [{ "name": string, "grams": number, "calories": number }], "totalCalories": number, "protein": number, "carbs": number, "fat": number }]`;

  const result = await jsonModel.generateContent(prompt);
  return JSON.parse(result.response.text());
}

---

### Feature 1.4 — Grocery List Generator

**Pain point solved:** After getting a weekly plan, users have no easy way to know what to buy. Manual calculation is friction that prevents people from starting.

**What it does:** After weekly plan generation, auto-compute a consolidated grocery list. Group by food category. Show total quantity needed for the week per food item.

**Logic — `server/services/groceryService.ts`**

```typescript
// 1. Loop through all 7 days × 5 meals
// 2. Sum grams per food name
// 3. Add 10% buffer for measuring inaccuracies
// 4. Group into categories: Grains, Proteins, Dairy, Fruits, Vegetables, Fats
// 5. Return sorted list with total grams per item
```

No Gemini call needed — this is pure math from the structured weekly plan data.

**New API route**

```
GET /api/plans/:planId/grocery-list
Response: {
  categories: {
    name: string;
    items: { food: string; totalGrams: number; unit: string }[]
  }[]
}
```

---

### Feature 1.5 — Weight Progress Tracker

**Pain point solved:** Users have no visibility into body changes over time. Without a graph, the plan feels disconnected from results.

**What it does:** Simple daily weight logging. Line chart shows weight trend over 30/60/90 days. When weight changes by ±3kg from original, app prompts user to recalculate TDEE and regenerate plan.

**New Mongoose model — `server/models/WeightLog.ts`**

```typescript
export interface IWeightLog extends Document {
  userId: string;
  weight: number;        // kg
  date: string;          // "YYYY-MM-DD"
  note: string;          // optional: "post-workout", "morning"
  createdAt: Date;
}
```

**New API routes**

```
POST /api/weight          — Log today's weight
GET  /api/weight          — Get weight history (last 90 days default)
GET  /api/weight/trend    — Returns: { direction: "losing"|"gaining"|"stable", avgWeeklyChange: number }
```

**TDEE recalculation trigger rule**

```typescript
// In weightController.ts — check after every log
const originalWeight = plan.profile.weight;
const latestWeight   = newLog.weight;
const delta          = Math.abs(latestWeight - originalWeight);

if (delta >= 3) {
  // Flag the plan as stale — frontend shows "Your weight has changed significantly.
  // Recalculate your plan?" banner
  await DietPlan.findByIdAndUpdate(plan._id, { isStale: true });
}
```

---

### Feature 1.6 — Water Intake Tracker

**Pain point solved:** Hydration is always ignored in diet apps. It directly affects energy, hunger signals, and workout performance.

**What it does:** Daily water goal based on body weight (35ml/kg). Simple +250ml tap button. Visual progress ring. Resets at midnight.

**Calculation**

```typescript
// server/services/waterService.ts
export function calcDailyWaterGoal(weightKg: number): number {
  return Math.round(weightKg * 35); // ml
}
// e.g. 75kg → 2625ml → show as 2.6L
```

Store water logs inside `DailyLog` model — add a `waterMl` field to avoid a separate collection.

```typescript
// Add to IDailyLog
waterMl: number;           // total consumed today in ml
waterGoalMl: number;       // target for the day
```

---

---

## Tier 2 — Intelligence & Engagement Features

Build these after all Tier 1 features are stable and tested.

---

### Feature 2.1 — 🏆 Weekly Muscle Report  ← FLAGSHIP FEATURE

**Pain point solved:** Macro goals feel abstract. Users don't understand the real-world consequence of consistently missing protein. This feature makes it visceral and urgent.

**What it does:** Every Sunday, generate a weekly analysis report. Core insight: translate weekly protein compliance into a scientifically accurate muscle synthesis opportunity score. Never claim daily muscle loss (inaccurate). Always frame as weekly risk and opportunity.

---

#### Why weekly, not daily

Muscle Protein Synthesis (MPS) responds to weekly averages, not single-day snapshots. One low-protein day after 6 good days has near-zero muscle impact. The body's amino acid pool buffers single-day shortfalls. Claiming daily muscle loss would be scientifically inaccurate and would destroy user trust the moment any fitness-literate user sees it.

---

#### New Mongoose model — `server/models/WeeklyReport.ts`

```typescript
export interface IWeeklyReport extends Document {
  userId: string;
  weekStartDate: string;         // "YYYY-MM-DD" — always Monday
  weekEndDate: string;           // "YYYY-MM-DD" — always Sunday

  calorieStats: {
    targetCalories: number;
    daysHit: number;             // days within ±100 kcal of target
    daysOver: number;
    daysUnder: number;
    avgDailyCalories: number;
    totalCalorieDeficitOrSurplus: number; // negative = deficit
  };

  proteinStats: {
    targetProteinG: number;      // daily target
    daysHit: number;             // days protein goal was met
    avgDailyProteinG: number;
    weeklyProteinDebtG: number;  // sum of daily deficits (0 if surplus)
    weeklyProteinSurplusG: number;
  };

  carbStats: {
    targetCarbsG: number;
    daysHit: number;
    avgDailyCarbsG: number;
  };

  fatStats: {
    targetFatG: number;
    daysHit: number;
    avgDailyFatG: number;
  };

  muscleInsight: {
    // Risk level based on weekly protein compliance
    riskLevel: "optimal" | "low_risk" | "moderate_risk" | "high_risk";

    // How riskLevel is calculated:
    // protein daysHit >= 6 → "optimal"
    // protein daysHit = 4-5 → "low_risk"
    // protein daysHit = 2-3 → "moderate_risk"
    // protein daysHit <= 1 → "high_risk"

    proteinDebtG: number;        // total grams missed this week
    interpretation: string;      // Gemini-generated plain English summary
    recoveryActions: string[];   // Gemini-generated: 2-3 specific food suggestions to fix the gap
  };

  overallScore: number;          // 0–100. Formula below.
  trend: "improving" | "declining" | "stable";  // vs last week's overallScore
  planShouldRegenerate: boolean; // true if compliance < 50% for 2 consecutive weeks

  llmInsightText: string;        // Full Gemini-generated narrative paragraph
  createdAt: Date;
}
```

**Overall Score formula**

```typescript
function calcWeeklyScore(report: Partial<IWeeklyReport>): number {
  const calorieScore  = (report.calorieStats!.daysHit / 7) * 40;   // 40% weight
  const proteinScore  = (report.proteinStats!.daysHit / 7) * 40;   // 40% weight
  const carbScore     = (report.carbStats!.daysHit / 7) * 10;      // 10% weight
  const fatScore      = (report.fatStats!.daysHit / 7) * 10;       // 10% weight
  return Math.round(calorieScore + proteinScore + carbScore + fatScore);
}
// Protein weighted equally to calories — signals to users that protein is not optional
```

---

#### New API routes — `server/routes/reports.ts`

```
POST /api/reports/weekly/generate    — Trigger report generation (called by cron or manually)
GET  /api/reports/weekly/latest      — Get most recent weekly report
GET  /api/reports/weekly             — Get all weekly reports (history)
GET  /api/reports/weekly/:weekStart  — Get report for specific week
```

---

#### Weekly Report generation logic — `server/services/weeklyReportService.ts`

```typescript
// Step 1: Aggregate 7 DailyLog records for the week
// Step 2: Calculate all stats (pure math, no Gemini)
// Step 3: Determine riskLevel from protein daysHit
// Step 4: Call geminiService.generateWeeklyInsight() for narrative text
// Step 5: Save to WeeklyReport collection
// Step 6: If planShouldRegenerate === true, set DietPlan.isStale = true

async function generateWeeklyReport(userId: string, weekStartDate: string): Promise<IWeeklyReport> {
  const logs = await DailyLog.find({
    userId,
    date: { $gte: weekStartDate, $lte: weekEndDate }
  });

  // If fewer than 4 logs exist for the week, mark report as partial
  // Still generate — partial data is better than no insight

  const stats = aggregateLogs(logs);         // pure math
  const riskLevel = calcRiskLevel(stats);    // enum logic
  const score = calcWeeklyScore(stats);      // 0-100
  const insight = await geminiService.generateWeeklyInsight(stats, riskLevel, goal);

  return WeeklyReport.create({ userId, weekStartDate, ...stats, muscleInsight: { riskLevel, ...insight }, overallScore: score });
}
```

---

#### Gemini prompt — `geminiService.generateWeeklyInsight()`

```typescript
export async function generateWeeklyInsight(
  stats: WeeklyStats,
  riskLevel: string,
  goal: string,
  selectedFoods: string[]
): Promise<{ interpretation: string; recoveryActions: string[] }> {

  const prompt = `You are a sports nutritionist writing a weekly check-in message.
Tone: direct, encouraging, data-driven. Never alarmist. Never vague.

Rules:
- NEVER say the user "lost muscle" on a specific day — muscle synthesis is a weekly process
- Frame protein shortfalls as "missed synthesis opportunities", not "muscle loss"
- If protein daysHit >= 5, lead with positive reinforcement
- If protein daysHit <= 2, be direct about risk without being discouraging
- Always end with 2-3 specific, actionable food suggestions using the user's available foods
- Keep total response under 120 words

Weekly stats:
- Calorie goal hit: ${stats.calorieStats.daysHit}/7 days
- Protein goal hit: ${stats.proteinStats.daysHit}/7 days (target: ${stats.proteinStats.targetProteinG}g/day)
- Weekly protein debt: ${stats.proteinStats.weeklyProteinDebtG}g
- Risk level: ${riskLevel}
- User goal: ${goal}
- Available foods: ${selectedFoods.join(", ")}

Return JSON: { "interpretation": string, "recoveryActions": string[] }`;

  const result = await jsonModel.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

---

#### Frontend components

```
client/src/components/
  WeeklyReport/
    WeeklyReportView.tsx        — Main report screen
    ScoreRing.tsx               — Animated 0-100 score ring (SVG)
    MacroComplianceGrid.tsx     — 7-day grid: each day = colored dot (hit/miss/partial)
    MuscleInsightCard.tsx       — Risk level badge + Gemini narrative + recovery actions
    TrendBadge.tsx              — "↑ Improving vs last week" / "↓ Declining"
    RegeneratePlanBanner.tsx    — Shown when planShouldRegenerate === true
```

**MacroComplianceGrid visual logic**

```
Each day = one dot per macro (calorie / protein / carbs / fat)
🟢 green  = goal hit
🟡 yellow = within 15% of goal
🔴 red    = missed by >15%
⚪ grey   = no log for that day
```

---

#### Cron job for automated weekly generation

```typescript
// server/jobs/weeklyReportJob.ts
// Runs every Sunday at 23:00 IST
// Uses node-cron: '0 23 * * 0'
import cron from "node-cron";
import { generateWeeklyReport } from "../services/weeklyReportService";

cron.schedule("0 23 * * 0", async () => {
  const users = await getActiveUsersThisWeek();
  for (const userId of users) {
    await generateWeeklyReport(userId, getCurrentWeekStart());
  }
});
```

Install: `npm install node-cron --prefix server` + types: `npm install -D @types/node-cron --prefix server`

---

#### Protein Debt Meter — running visual on daily log screen

Show this on the `DailyLogView` as a running indicator, not just in the weekly report.

```typescript
// Displayed on the daily log view, updated in real time
interface ProteinDebtMeter {
  weeklyTarget:   number;   // targetProteinG × 7
  weeklyConsumed: number;   // sum of actual protein across logged days this week
  debt:           number;   // weeklyTarget - weeklyConsumed (clamped to 0 minimum)
  surplusDays:    number;   // days where protein was hit or exceeded
}

// Display logic:
// debt === 0           → "You're on track 💪"
// debt > 0 && debt < 50 → "Mild protein debt: +Xg needed to stay on track"
// debt >= 50           → "High protein debt: consider a high-protein snack today"
```

---

### Feature 2.2 — Streak & Compliance Score

**Pain point solved:** No accountability beyond the plan itself. Users have no external reason to stay consistent.

**What it does:** Track a daily adherence streak. Show "5-day streak 🔥" prominently. Score based on: calories hit + protein hit + at least 4/5 meals logged.

**Streak rules**

```typescript
// A day "counts" toward streak if:
// 1. At least 4 of 5 meals are checked off
// 2. Actual calories are within ±150 kcal of target
// 3. Actual protein is within -10g of target (some flexibility)

// Streak breaks if: none of the above are met for a calendar day
// Streak freezes (does not break) if: user logs nothing at all for 1 day
//   — this prevents a missed logging day from destroying a long streak
```

Store streak data inside `DailyLog` — add `streakDay: number` field (running count at time of log).

---

### Feature 2.3 — Recipe Mode

**Pain point solved:** Plans say "200g oats + milk" but give no instruction. Many users, especially beginners, don't know how to prepare meals.

**What it does:** User taps any meal → "Show Recipe" → Gemini generates a quick 5-step recipe using exactly the foods and quantities in that meal.

**New API route**

```
POST /api/plans/recipe
Body: { meal: { name, foods: [{name, grams}] }, goal }
Response: { recipe: { title, prepTime, steps: string[], tips: string } }
```

**Gemini prompt strategy**

```typescript
export async function generateRecipe(
  meal: { name: string; foods: { name: string; grams: number }[] },
  goal: string
): Promise<RecipeResult> {
  const foodList = meal.foods.map(f => `${f.grams}g ${f.name}`).join(", ");

  const prompt = `You are a practical home cook. Generate a simple recipe for: ${meal.name}

Ingredients (use EXACTLY these, no additions or substitutions):
${foodList}

Rules:
- Maximum 5 preparation steps
- Each step: one sentence, action-oriented
- Prep time must be realistic (under 20 minutes for snacks, under 35 for main meals)
- End with 1 practical tip relevant to user goal: ${goal}

Return JSON: { "title": string, "prepTimeMinutes": number, "steps": string[], "tip": string }`;

  const result = await jsonModel.generateContent(prompt);
  return JSON.parse(result.response.text());
}

---

### Feature 2.4 — Fasting Mode (Intermittent Fasting)

**Pain point solved:** A significant portion of fitness-conscious users in India practice IF. Current app ignores eating windows entirely.

**What it does:** User selects a fasting protocol (16:8, 18:6, or 5:2). Meal plan is restructured to fit only within the eating window. Meal timing is shown explicitly.

**Fasting protocols**

```typescript
type FastingProtocol = "16:8" | "18:6" | "5:2" | "none";

interface EatingWindow {
  protocol: FastingProtocol;
  windowStart: string;   // "12:00"
  windowEnd: string;     // "20:00"
  mealsPerDay: number;   // 16:8 = 3 meals, 18:6 = 2-3 meals, 5:2 = normal + 500 kcal days
}
```

Add `fastingProtocol` field to the `DietPlan` model and to `POST /api/plans/generate` request body.

Pass eating window into the diet generation Gemini prompt so meal times are respected.

---

---

## Tier 3 — Differentiation Features

Build these after Tier 2 is complete. These create the product moat.

---

### Feature 3.1 — Photo Meal Analysis

**Pain point solved:** Manual portion logging is tedious. Users who don't want to weigh food need a frictionless alternative.

**What it does:** User uploads a photo of their meal. Gemini Vision estimates the foods present, approximate portions, and total calories/macros.

**API route**

```
POST /api/logs/analyze-photo
Body: { image: base64string, mealName: string }
Response: { detectedFoods: [{name, estimatedGrams, calories}], totalCalories, confidence: "high"|"medium"|"low" }
```

**Important caveat to display in UI:** "Photo estimates have ±25% accuracy. Weigh portions for precision."

---

### Feature 3.2 — Lab Report Integration

**Pain point solved:** Users with iron deficiency, vitamin D deficiency, or thyroid issues get generic plans that actively miss their needs.

**What it does:** User uploads a blood test PDF. Gemini extracts flagged deficiencies. Plan generation is adjusted to emphasize foods high in those micronutrients.

**API route**

```
POST /api/profile/lab-report
Body: { pdf: base64string }
Response: { deficiencies: [{ nutrient, level, severity: "mild"|"moderate"|"severe" }] }
```

Store `deficiencies` in the user profile. Pass them into `POST /api/plans/generate` as additional constraints.

---

### Feature 3.3 — Regional Cuisine Mode

**Pain point solved:** HealthifyMe, MyFitnessPal, and similar apps handle Indian regional cuisine poorly. This is a genuine market gap.

**What it does:** User selects their cuisine region. Food suggestions and meal structures adapt accordingly. Seed database expands with region-specific foods.

**Supported regions (Phase 1)**

```typescript
type CuisineRegion = "punjabi" | "south_indian" | "gujarati" | "bengali" | "maharashtrian" | "general";
```

Add `cuisineRegion` to user profile and `DietPlan` model. Pass into diet generation prompt as a hard constraint.

Expand seed script with 20 region-specific foods per cuisine (e.g., idli, dosa, sambar, rasam for south_indian).

---

### Feature 3.4 — Festival / Fasting Mode

**Pain point solved:** Navratri, Ekadashi, Ramadan, and other religious fasting periods have strict food rules that no mainstream app handles correctly.

**What it does:** User marks a fasting period with its type. App generates a compliant plan using only allowed foods, maintaining calorie targets within the constraints.

```typescript
type FastingType = "navratri" | "ekadashi" | "ramadan" | "monday_fast" | "custom";

// Each type has an allowed food list stored in the seed DB
// marked with: dietType: "veg", tags: ["navratri_safe"] etc.
```

---

### Feature 3.5 — Budget-Aware Planning

**Pain point solved:** "Plan my diet under ₹150/day" — massive pain point for students and young professionals. No existing diet app in India addresses food cost.

**What it does:** User sets a daily food budget. Each food in the DB gets a price-per-100g field (user-contributed or admin-set). Plan generator constrains meal selection to fit the budget.

**Add to Food model**

```typescript
pricePerKgINR: number | null;   // null = price not yet set
```

**Add to plan generation request**

```typescript
dailyBudgetINR: number | null;  // null = no budget constraint
```

Pass budget into Gemini prompt as a hard constraint. If budget makes it impossible to hit calorie targets, Gemini should explain the tradeoff and suggest the minimum budget needed.

---

---

## Feature Priority Matrix

| Feature | Tier | Impact | Effort | Build Order |
|---|---|---|---|---|
| Daily Meal Log | 1 | 🔴 Critical | Medium | 1st |
| Weekly Meal Plan | 1 | 🔴 Critical | Medium | 2nd |
| Meal Swap | 1 | 🟠 High | Low | 3rd |
| Grocery List | 1 | 🟠 High | Low | 4th |
| Weight Tracker | 1 | 🟠 High | Low | 5th |
| Water Tracker | 1 | 🟡 Medium | Very Low | 6th |
| Weekly Muscle Report | 2 | 🔴 Critical | Medium | 7th |
| Streak & Score | 2 | 🟠 High | Low | 8th |
| Recipe Mode | 2 | 🟠 High | Low | 9th |
| Fasting Mode | 2 | 🟡 Medium | Medium | 10th |
| Photo Analysis | 3 | 🟠 High | High | 11th |
| Lab Report | 3 | 🟡 Medium | High | 12th |
| Regional Cuisine | 3 | 🔴 Critical (India) | Medium | 13th |
| Festival Fasting | 3 | 🟡 Medium (India) | Low | 14th |
| Budget Planning | 3 | 🔴 Critical (India) | Medium | 15th |

---

## New Models Summary (Features Roadmap)

```
server/models/
  Food.ts            ← exists. Add: pricePerKgINR, tags[]
  DietPlan.ts        ← exists. Add: weeklyPlan, isStale, fastingProtocol, cuisineRegion, dailyBudgetINR, deficiencies[]
  DailyLog.ts        ← NEW (Feature 1.1)
  WeightLog.ts       ← NEW (Feature 1.5)
  WeeklyReport.ts    ← NEW (Feature 2.1)
```

---

## New Services Summary (Features Roadmap)

```
server/services/
  geminiService.ts        ← exists. Add: generateWeeklyPlan(), swapMeal(), generateWeeklyInsight(), generateRecipe(), analyzePhoto(), extractLabReport()
  nutritionService.ts     ← exists
  groceryService.ts       ← NEW (Feature 1.4)
  waterService.ts         ← NEW (Feature 1.6, simple calc only)
  weeklyReportService.ts  ← NEW (Feature 2.1)
  streakService.ts        ← NEW (Feature 2.2)

server/jobs/
  weeklyReportJob.ts      ← NEW (Feature 2.1, node-cron)
```

---

## Rules for Feature Development

1. **Build in tier order.** Do not start Tier 2 features until all Tier 1 features are tested.
2. **Weekly Muscle Report never claims daily muscle loss.** Frame all muscle-related insights as weekly risk levels and synthesis opportunities. This is non-negotiable for scientific accuracy.
3. **All new models follow existing patterns.** Timestamps via `{ timestamps: true }`, strict TypeScript interfaces, no `any` types.
4. **Gemini is not called for pure math.** Grocery list aggregation, streak calculation, water goals, calorie totals — all pure server-side math. Gemini is only called when natural language insight or meal generation is needed.
5. **New routes follow existing naming.** Plural nouns, `/api/` prefix, controller + service separation.
6. **All dates stored as `"YYYY-MM-DD"` strings.** Never as Date objects in log/report models. Avoids timezone bugs across IST and UTC.
7. **Protein is weighted equally to calories in scoring.** This communicates to users that hitting protein is as important as hitting calorie targets — which is true for any body composition goal.
8. **Weekly report is always generated even with partial data.** If a user only logged 4/7 days, generate with available data and mark `isPartial: true`. Partial insight is more useful than no insight.