# CLAUDE.md — NutriPlan AI Diet App

This file is the single source of truth for Claude Code.
Read it fully before writing any code, creating files, or making decisions.

---

## Project Overview

**NutriPlan** is an LLM-driven diet planning web app. Users input their diet preference, locally available foods, body metrics, and fitness goal. The app calculates their calorie targets and generates a personalized daily meal plan using Claude AI.

The key intelligence is that the app maintains a growing **nutrition database in MongoDB**. When a user adds a food that doesn't exist in the DB, the LLM looks up its nutritional values and saves them — so future users with the same food never trigger another LLM lookup.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (Vite) + TypeScript | Fast, typed, component-friendly |
| Styling | Tailwind CSS | Utility-first, no CSS bloat |
| Backend | Node.js + Express | Simple REST API |
| Database | MongoDB Atlas (M0 free tier) + Mongoose | Cloud-hosted, no local install, free forever |
| AI | Anthropic Claude API (`claude-sonnet-4-20250514`) | Powers nutrition lookup + diet generation |
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
│       ├── claudeService.ts           ← All Anthropic API calls
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
   - Call `claudeService.lookupNutrition(unknownFoods)`.
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
4. Call `claudeService.generateDietPlan(...)`.
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

## Claude Service — `server/services/claudeService.ts`

### Two Claude calls — keep them separate

**Call 1: Nutrition Lookup**

```typescript
// System prompt
const NUTRITION_SYSTEM = `You are a nutrition database API.
Return ONLY a valid JSON object. No markdown, no explanation, no backticks.
All values must be per 100g.
Schema: { "food_name": { "calories": number, "protein": number, "fat": number, "carbs": number, "fiber": number, "dietType": "veg"|"nonveg"|"both" } }`;

// User message
`Return nutrition data for these foods: ${unknownFoods.join(", ")}`;
```

Parse the response with `JSON.parse()`. If parse fails, retry once. If still fails, log and skip (don't block plan generation).

**Call 2: Diet Plan Generation**

```typescript
// System prompt
const DIET_SYSTEM = `You are a certified nutritionist. Generate practical, detailed meal plans.
Use ONLY the foods provided. Never suggest foods not in the user's list.
Format: 5 meals (Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner).
For each meal: food item, portion in grams, calories for that portion, meal total.
End with 3 practical tips tailored to the user's goal.
Be specific. Be realistic.`;

// User message — inject all calculated values + nutrition context
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
# Get this from: Atlas Dashboard → Connect → Drivers
# Replace <username>, <password> with your DB user credentials (NOT your Atlas login)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/nutriplan?retryWrites=true&w=majority

# ─── Anthropic ─────────────────────────────────────────────
# Get this from: console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# ─── CORS ──────────────────────────────────────────────────
# Local Vite dev server URL — allows frontend to call backend
CLIENT_URL=http://localhost:5173

# ─── Claude Model ──────────────────────────────────────────
# Do not change unless upgrading intentionally
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=1500
```

---

### `client/.env` — local development (NEVER commit)

```bash
# ─── Backend API ───────────────────────────────────────────
# Points to local Express server during development
# Vite requires all custom env vars to start with VITE_
VITE_API_URL=http://localhost:5000

# ─── App Config ────────────────────────────────────────────
VITE_APP_NAME=NutriPlan
```

---

### `server/.env.example` — committed template, no real secrets

```bash
# ─── Server ────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── MongoDB Atlas ─────────────────────────────────────────
# Format: mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
# Get from: cloud.mongodb.com → Connect → Drivers
MONGODB_URI=mongodb+srv://your_db_user:your_db_password@cluster0.xxxxx.mongodb.net/nutriplan?retryWrites=true&w=majority

# ─── Anthropic ─────────────────────────────────────────────
# Get from: console.anthropic.com → API Keys
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here

# ─── CORS ──────────────────────────────────────────────────
# Production: set to your Vercel frontend URL
# Development: http://localhost:5173
CLIENT_URL=https://your-app.vercel.app

# ─── Claude Model ──────────────────────────────────────────
CLAUDE_MODEL=claude-sonnet-4-20250514
CLAUDE_MAX_TOKENS=1500
```

---

### `client/.env.example` — committed template

```bash
# ─── Backend API ───────────────────────────────────────────
# Production: set to your Render backend URL
# Development: http://localhost:5000
VITE_API_URL=https://your-backend.onrender.com

# ─── App Config ────────────────────────────────────────────
VITE_APP_NAME=NutriPlan
```

---

## How to Use Env Vars in Code

### Server (Express) — `process.env.VAR_NAME`
```typescript
// server/config/db.ts
mongoose.connect(process.env.MONGODB_URI as string);

// server/services/claudeService.ts
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model   = process.env.CLAUDE_MODEL      ?? "claude-sonnet-4-20250514";
const maxTok  = parseInt(process.env.CLAUDE_MAX_TOKENS ?? "1500");

// server/index.ts — CORS setup
app.use(cors({ origin: process.env.CLIENT_URL }));
```

### Client (Vite/React) — `import.meta.env.VITE_VAR_NAME`
```typescript
// client/src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL;

export async function lookupFoods(foods: string[], dietType: string) {
  const res = await fetch(`${BASE_URL}/api/foods/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ foods, dietType }),
  });
  return res.json();
}
```

> **Important:** Vite only exposes env vars that start with `VITE_` to the browser. Never put `ANTHROPIC_API_KEY` in the client `.env` — it would be exposed publicly.

---

## Deployment — Env Vars to Set in Dashboard

### Render (Backend — `server/`)

Go to: Render Dashboard → Your Service → Environment

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | Your full Atlas connection string |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `CLIENT_URL` | Your Vercel frontend URL e.g. `https://nutriplan.vercel.app` |
| `CLAUDE_MODEL` | `claude-sonnet-4-20250514` |
| `CLAUDE_MAX_TOKENS` | `1500` |

### Vercel (Frontend — `client/`)

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

| Key | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL e.g. `https://nutriplan-api.onrender.com` |
| `VITE_APP_NAME` | `NutriPlan` |

---

## Seed Script

Create `server/scripts/seedFoods.ts` to pre-populate MongoDB with common Indian + global foods on first run. Run once with `npx ts-node server/scripts/seedFoods.ts`. Mark all seeded docs with `source: "seed"`.

Seed at minimum: banana, egg, chicken breast, brown rice, oats, milk, lentils, paneer, spinach, apple, sweet potato, almonds, greek yogurt, salmon, broccoli, roti, dal, curd, peanuts, tofu.

---

## Development Commands

```bash
# First time setup — copy env templates and fill in real values
cp server/.env.example server/.env
cp client/.env.example client/.env
# Now edit both .env files with your real Atlas URI and Anthropic key

# Install all dependencies
npm install && npm install --prefix client && npm install --prefix server

# Root: run both client and server together
npm run dev

# Client only (runs on http://localhost:5173)
cd client && npm run dev

# Server only (runs on http://localhost:5000)
cd server && npm run dev

# Seed database — run once after Atlas is set up
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

---

## `.gitignore` — root level

```
# Env files — never commit real secrets
server/.env
client/.env

# Dependencies
node_modules/
client/node_modules/
server/node_modules/

# Build output
client/dist/
server/dist/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db
```

---

## Key Rules for Claude Code

1. **Never hardcode any secret.** `ANTHROPIC_API_KEY`, `MONGODB_URI` — always from `process.env`. Crash on startup if missing.
2. **Never use a local MongoDB URI.** The only valid `MONGODB_URI` format is `mongodb+srv://...` (Atlas). If you see `localhost:27017` anywhere, it is wrong.
3. **Validate all env vars at startup** in `server/index.ts`:
   ```typescript
   const required = ["MONGODB_URI", "ANTHROPIC_API_KEY", "CLIENT_URL"];
   required.forEach(key => {
     if (!process.env[key]) { console.error(`Missing env var: ${key}`); process.exit(1); }
   });
   ```
4. **Client env vars must start with `VITE_`.** Vite strips anything else. Never put secrets in client `.env`.
5. **Always normalize food names to lowercase** before DB queries and before saving.
6. **Check aliases too** when querying MongoDB for a food name:
   `Food.findOne({ $or: [{ name }, { aliases: name }] })`
7. **Batch LLM nutrition lookups.** Never call the API once per food — send all unknown foods in one call.
8. **Save LLM nutrition results immediately** after parsing. Do not wait for plan generation.
9. **The `per` field is always `"100g"`.** All nutrition values in the DB are per 100g. Portion math happens at the prompt level, not in the DB.
10. **Do not store the LLM-generated plan in the client.** Send it from server → client as a response. Save a copy to MongoDB for history.
11. **TypeScript strict mode is on.** No `any` types. All mongoose documents must use their interface.
12. **Tailwind only for styling.** No inline styles, no separate CSS files.
13. **All API calls from frontend go through `client/src/lib/api.ts`** — never scatter fetch calls across components.

---

## Data Flow Summary

```
User selects foods
       ↓
POST /api/foods/lookup
       ↓
MongoDB: which foods exist?
       ↓ (for unknown foods)
Claude API: nutrition lookup → JSON
       ↓
MongoDB: save new foods (source: "llm")
       ↓
Return all nutrition to frontend
       ↓
User confirms → POST /api/plans/generate
       ↓
Server: calc BMR → TDEE → target calories → macros
       ↓
Claude API: generate meal plan (with food nutrition context)
       ↓
MongoDB: save diet plan
       ↓
Return plan text + macros to frontend → render
```
