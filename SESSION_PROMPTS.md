# NutriPlan — Claude Code Session Kickoff Prompts

Copy the entire prompt for the feature you are building today.
Do not modify the rules section. Only update STATUS.md after each session completes.

---

---

## TIER 1 — CORE RETENTION FEATURES

---

## Session 1 — Feature 1.1: Daily Meal Log

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 1.1 — Daily Meal Log

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Use geminiService.ts for all LLM calls. Never use any other AI SDK.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/DailyLog.ts — use IDailyLog interface from CLAUDE.md verbatim
2. server/routes/logs.ts — 4 routes: POST /checkin, POST /log-meal, GET /today, GET /:date
3. server/controllers/logsController.ts — business logic for all 4 routes
4. client/src/components/DailyLogView.tsx — main log screen, all 5 meals
5. client/src/components/MealCard.tsx — single meal: planned vs actual + check-off button
6. client/src/components/DayProgressBar.tsx — real-time calorie + macro progress

Critical rules:
- actualCalories defaults to plannedCalories when user checks off without editing
- Always recalculate dayTotals when any meal is logged or checked off
- Date stored as "YYYY-MM-DD" string — never as Date object
- Register logs routes in server/index.ts after building

Show me server/models/DailyLog.ts first and wait for my approval
before writing any other file.
```

---

## Session 2 — Feature 1.2: Weekly Meal Plan

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 1.2 — Weekly Meal Plan (Mon–Sun)

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Use geminiService.ts for all LLM calls. Never use any other AI SDK.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/DietPlan.ts — extend with weeklyPlan field as defined in CLAUDE.md
2. server/services/geminiService.ts — add generateWeeklyPlan() function
3. server/controllers/plansController.ts — add weekly plan generation logic
4. client/src/components/WeeklyPlanView.tsx — 7-day plan display with day tabs
5. client/src/types/index.ts — add WeeklyPlan and WeeklyDay TypeScript types

Critical rules:
- Use jsonModel (with responseMimeType: "application/json") for generateWeeklyPlan()
- Retry once on JSON parse failure — do not crash
- No food should repeat in the same meal slot more than 3 times across 7 days
- Each day total must be within ±50 kcal of target calories
- Save the structured weeklyPlan object to MongoDB, not just raw text
- generateWeeklyPlan() must match the prompt and schema in CLAUDE.md exactly

Show me the updated server/models/DietPlan.ts first and wait for my
approval before writing any other file.
```

---

## Session 3 — Feature 1.3: Meal Swap

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 1.3 — Meal Swap ("Not feeling this")

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Use geminiService.ts for all LLM calls. Never use any other AI SDK.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/services/geminiService.ts — add swapMeal() function
2. server/routes/plans.ts — add POST /api/plans/swap-meal route
3. server/controllers/plansController.ts — add swapMeal controller
4. client/src/components/MealSwapModal.tsx — shows 2 alternatives, user picks one
5. client/src/lib/api.ts — add swapMeal() fetch function

Critical rules:
- Use jsonModel (with responseMimeType: "application/json") for swapMeal()
- Alternatives must be within ±100 kcal of targetCalories
- Both alternatives must be meaningfully different from each other
- Only use foods from the user's selectedFoods list — never suggest outside foods
- After swap is selected, update the DailyLog for that day's meal
- Request body: { planId, day, mealName, targetCalories, selectedFoods, goal }
- Response: { alternatives: [ meal1, meal2 ] } — exactly 2 options always

Show me server/services/geminiService.ts swapMeal() function first
and wait for my approval before writing any other file.
```

---

## Session 4 — Feature 1.4: Grocery List Generator

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 1.4 — Grocery List Generator

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- NO Gemini API call for this feature — this is pure math only.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/services/groceryService.ts — aggregation logic (pure math, no Gemini)
2. server/routes/plans.ts — add GET /api/plans/:planId/grocery-list
3. server/controllers/plansController.ts — add groceryList controller
4. client/src/components/GroceryListView.tsx — grouped by category display
5. client/src/lib/api.ts — add getGroceryList() fetch function

Critical rules for groceryService.ts:
- Loop all 7 days × 5 meals from weeklyPlan
- Sum grams per food name across the whole week
- Add 10% buffer on top of total (for measuring inaccuracies)
- Group into exactly these categories: Grains, Proteins, Dairy, Fruits, Vegetables, Fats
- Return sorted list with totalGrams and a sensible unit per item
- If weeklyPlan does not exist on the DietPlan, return 400 with clear error message
- Do NOT call Gemini for this — all logic is arithmetic from DB data

Show me server/services/groceryService.ts first and wait for my
approval before writing any other file.
```

---

## Session 5 — Feature 1.5: Weight Progress Tracker

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 1.5 — Weight Progress Tracker

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- No Gemini API call for this feature — pure math and DB operations only.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/WeightLog.ts — IWeightLog interface from CLAUDE.md verbatim
2. server/routes/weight.ts — POST /api/weight, GET /api/weight, GET /api/weight/trend
3. server/controllers/weightController.ts — includes stale plan detection logic
4. client/src/components/WeightTracker/WeightLogView.tsx — log + chart screen
5. client/src/components/WeightTracker/WeightChart.tsx — 30/60/90 day line chart
6. client/src/components/WeightTracker/StalePlanBanner.tsx — shown when isStale = true
7. client/src/lib/api.ts — add logWeight(), getWeightHistory(), getWeightTrend()

Critical rules:
- Date stored as "YYYY-MM-DD" string — never as Date object
- After every new weight log, run stale plan detection
- Stale rule: if |latestWeight - plan.profile.weight| >= 3kg → set DietPlan.isStale = true
- Add isStale: boolean field to DietPlan model if not already present
- GET /api/weight returns last 90 days by default
- GET /api/weight/trend returns: { direction: "losing"|"gaining"|"stable", avgWeeklyChange: number }
- avgWeeklyChange = (latestWeight - weightFrom4WeeksAgo) / 4, rounded to 1 decimal

Show me server/models/WeightLog.ts first and wait for my approval
before writing any other file.
```

---

## Session 6 — Feature 1.6: Water Intake Tracker

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 1.6 — Water Intake Tracker

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- No Gemini API call for this feature — pure math only.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/DailyLog.ts — add waterMl and waterGoalMl fields to existing model
2. server/services/waterService.ts — calcDailyWaterGoal(weightKg) function only
3. server/routes/logs.ts — add POST /api/logs/water (add ml to today's log)
4. server/controllers/logsController.ts — add addWater() controller
5. client/src/components/WaterTracker.tsx — progress ring + +250ml tap button

Critical rules:
- Water goal formula: Math.round(weightKg * 35) — result is in ml
- Display as litres in UI (e.g. 2625ml → "2.6L")
- Store water inside DailyLog — do NOT create a separate collection
- waterMl resets to 0 each new calendar day (new DailyLog document per day)
- +250ml per tap — each button press calls POST /api/logs/water with { ml: 250 }
- waterGoalMl is set once when the daily log is created, from the user's weight
- Progress ring fills from 0% to 100% — does not overflow past 100%

Show me the updated server/models/DailyLog.ts with new water fields
first and wait for my approval before writing any other file.
```

---

---

## TIER 2 — INTELLIGENCE & ENGAGEMENT FEATURES

---

## Session 7 — Feature 2.1: Weekly Muscle Report (FLAGSHIP)

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/,
server/jobs/, and client/src/components/ and summarize what exists.

Feature to build today: Feature 2.1 — Weekly Muscle Report

This is the flagship feature. Read the CLAUDE.md spec for this feature
extremely carefully before writing a single line. Every detail matters.

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Use geminiService.ts for generateWeeklyInsight() only. Everything else is pure math.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/WeeklyReport.ts — full IWeeklyReport interface from CLAUDE.md verbatim
2. server/services/weeklyReportService.ts — aggregateLogs(), calcRiskLevel(), calcWeeklyScore()
3. server/services/geminiService.ts — add generateWeeklyInsight() using jsonModel
4. server/routes/reports.ts — 4 routes as defined in CLAUDE.md
5. server/controllers/reportsController.ts — controller for all 4 routes
6. server/jobs/weeklyReportJob.ts — node-cron Sunday 23:00 IST schedule
7. server/index.ts — register reports routes + start cron job
8. client/src/components/WeeklyReport/WeeklyReportView.tsx
9. client/src/components/WeeklyReport/ScoreRing.tsx — animated 0-100 SVG ring
10. client/src/components/WeeklyReport/MacroComplianceGrid.tsx — 7-day dot grid
11. client/src/components/WeeklyReport/MuscleInsightCard.tsx — risk badge + narrative
12. client/src/components/WeeklyReport/TrendBadge.tsx — improving/declining/stable
13. client/src/components/WeeklyReport/RegeneratePlanBanner.tsx
14. client/src/components/DailyLogView.tsx — add ProteinDebtMeter component

Critical rules — read these before coding anything:
- calcWeeklyScore(): calories 40% + protein 40% + carbs 10% + fat 10%
- riskLevel logic:
    protein daysHit >= 6 → "optimal"
    protein daysHit 4-5  → "low_risk"
    protein daysHit 2-3  → "moderate_risk"
    protein daysHit <= 1 → "high_risk"
- generateWeeklyInsight() MUST use jsonModel with responseMimeType: "application/json"
- The insight text MUST NEVER say the user "lost muscle" on a specific day
- Always frame protein shortfalls as "missed synthesis opportunities" — never "muscle loss"
- Generate report even with partial data (fewer than 7 logs) — mark isPartial: true
- planShouldRegenerate = true if compliance < 50% for 2 consecutive weeks
- MacroComplianceGrid dots: green=hit, yellow=within 15%, red=missed >15%, grey=no log
- ProteinDebtMeter on daily screen:
    debt === 0         → "You are on track"
    debt > 0 < 50g     → "Mild protein debt: +Xg needed"
    debt >= 50g        → "High protein debt: consider a high-protein snack today"
- Cron schedule: "0 23 * * 0" — runs every Sunday at 23:00
- Install node-cron: npm install node-cron && npm install -D @types/node-cron --prefix server

Show me server/models/WeeklyReport.ts first and wait for my approval
before writing any other file.
```

---

## Session 8 — Feature 2.2: Streak & Compliance Score

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 2.2 — Streak & Compliance Score

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- No Gemini API call for this feature — pure logic only.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/DailyLog.ts — add streakDay: number field
2. server/services/streakService.ts — streak calculation logic
3. server/controllers/logsController.ts — call streakService after every log
4. client/src/components/StreakBadge.tsx — "5-day streak 🔥" display
5. client/src/components/ComplianceScore.tsx — weekly score display (reuses WeeklyReport data)

Critical rules for streak logic:
- A day COUNTS toward streak if ALL THREE are true:
    1. At least 4 of 5 meals are checked off
    2. Actual calories are within ±150 kcal of target
    3. Actual protein is within -10g of target (some flexibility allowed)
- Streak BREAKS if none of the above are met for a calendar day
- Streak FREEZES (does not break) if user logs nothing at all for 1 day
    — this prevents a missed logging day from destroying a long streak
- Store streakDay as running count at time of log inside DailyLog
- Streak is calculated server-side — never trust client-sent streak values

Show me server/services/streakService.ts first and wait for my
approval before writing any other file.
```

---

## Session 9 — Feature 2.3: Recipe Mode

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 2.3 — Recipe Mode

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Use geminiService.ts for generateRecipe() — use jsonModel.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/services/geminiService.ts — add generateRecipe() using jsonModel
2. server/routes/plans.ts — add POST /api/plans/recipe
3. server/controllers/plansController.ts — add recipe controller
4. client/src/components/RecipeModal.tsx — 5-step recipe overlay on meal tap
5. client/src/lib/api.ts — add getRecipe() fetch function

Critical rules:
- Use jsonModel (responseMimeType: "application/json") for generateRecipe()
- Recipe must use ONLY the exact foods and grams from the meal — no additions
- Maximum 5 preparation steps — enforce this in the prompt
- Prep time must be realistic: snacks < 20 min, main meals < 35 min
- Return shape: { title, prepTimeMinutes, steps: string[], tip: string }
- The tip must be relevant to the user's goal (fat_loss / muscle_gain / maintenance)
- RecipeModal opens as an overlay on the MealCard — does not navigate away
- Show a loading state while Gemini generates — recipe takes 1-2 seconds

Show me server/services/geminiService.ts generateRecipe() function
first and wait for my approval before writing any other file.
```

---

## Session 10 — Feature 2.4: Fasting Mode

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 2.4 — Fasting Mode (Intermittent Fasting)

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Gemini is used only for plan generation — pass eating window as a constraint.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/DietPlan.ts — add fastingProtocol and eatingWindow fields
2. client/src/components/steps/StepFasting.tsx — new onboarding step for fasting selection
3. client/src/App.tsx — insert StepFasting between StepGoal and plan generation
4. server/controllers/plansController.ts — pass eatingWindow into Gemini prompt
5. server/services/geminiService.ts — update generateDietPlan() to respect window
6. client/src/types/index.ts — add FastingProtocol and EatingWindow types

Fasting protocols to support:
- "16:8"  → eating window 12:00–20:00, 3 meals
- "18:6"  → eating window 13:00–19:00, 2-3 meals
- "5:2"   → normal 5 days + 2 low-calorie days (500 kcal max)
- "none"  → default, no fasting (existing behaviour unchanged)

Critical rules:
- When fasting is selected, meal times in the plan MUST fall within the eating window
- "5:2" days: generate a separate 500 kcal plan for the 2 restricted days
- fastingProtocol: "none" must keep all existing behaviour exactly as-is
- Add fastingProtocol to POST /api/plans/generate request body — make it optional
- Default fastingProtocol to "none" if not provided

Show me the updated server/models/DietPlan.ts first and wait for my
approval before writing any other file.
```

---

---

## TIER 3 — DIFFERENTIATION FEATURES

---

## Session 11 — Feature 3.1: Photo Meal Analysis

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 3.1 — Photo Meal Analysis

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Use geminiService.ts for analyzeMealPhoto() — use Gemini Vision (multimodal).
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/services/geminiService.ts — add analyzeMealPhoto() using Gemini Vision
2. server/routes/logs.ts — add POST /api/logs/analyze-photo
3. server/controllers/logsController.ts — add analyzePhoto() controller
4. client/src/components/PhotoUpload.tsx — camera/file input + preview
5. client/src/components/PhotoAnalysisResult.tsx — shows detected foods + estimated macros
6. client/src/lib/api.ts — add analyzeMealPhoto() fetch function

Critical rules:
- Use Gemini Vision multimodal: pass image as inlineData with mimeType
- Image arrives as base64 from client — pass directly to Gemini, never store on disk
- Response shape: { detectedFoods: [{name, estimatedGrams, calories}], totalCalories, confidence: "high"|"medium"|"low" }
- Always display this disclaimer in the UI: "Photo estimates have ±25% accuracy. Weigh portions for precision."
- confidence is determined by Gemini — include it in the prompt schema
- If Gemini cannot identify foods, return { detectedFoods: [], totalCalories: 0, confidence: "low" } with a user-friendly message
- Max image size: 4MB client-side validation before upload

Gemini Vision setup in geminiService.ts:
const visionModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// Pass image as: { inlineData: { data: base64String, mimeType: "image/jpeg" } }

Show me server/services/geminiService.ts analyzeMealPhoto() function
first and wait for my approval before writing any other file.
```

---

## Session 12 — Feature 3.2: Lab Report Integration

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 3.2 — Lab Report Integration

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Use geminiService.ts for extractLabReport() — Gemini handles PDF natively.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/services/geminiService.ts — add extractLabReport() using Gemini PDF support
2. server/models/DietPlan.ts — add deficiencies[] field as defined in CLAUDE.md
3. server/routes/profile.ts — add POST /api/profile/lab-report
4. server/controllers/profileController.ts — extractLabReport controller
5. server/controllers/plansController.ts — pass deficiencies into Gemini diet prompt
6. client/src/components/LabReportUpload.tsx — PDF upload + deficiency display
7. client/src/lib/api.ts — add uploadLabReport() fetch function

Critical rules:
- Use Gemini's native PDF support — pass PDF as inlineData with mimeType "application/pdf"
- Never store the PDF on disk or in MongoDB — process in memory and discard
- Response shape: { deficiencies: [{ nutrient: string, level: string, severity: "mild"|"moderate"|"severe" }] }
- Store deficiencies array on the user's active DietPlan
- When deficiencies exist, pass them into generateDietPlan() as additional constraints
- Gemini prompt must emphasise foods rich in deficient nutrients without changing calorie targets
- Max PDF size: 10MB client-side validation before upload
- Show deficiencies clearly in UI with severity badges — mild/moderate/severe

Show me server/services/geminiService.ts extractLabReport() function
first and wait for my approval before writing any other file.
```

---

## Session 13 — Feature 3.3: Regional Cuisine Mode

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 3.3 — Regional Cuisine Mode

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Gemini is used only inside existing generateDietPlan() — add cuisineRegion constraint.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/DietPlan.ts — add cuisineRegion field
2. server/models/Food.ts — add tags: string[] field for regional tagging
3. server/scripts/seedFoods.ts — extend with 20 region-specific foods per cuisine
4. client/src/components/steps/StepCuisine.tsx — cuisine region selection UI
5. client/src/App.tsx — insert StepCuisine into onboarding flow
6. server/controllers/plansController.ts — pass cuisineRegion into Gemini prompt
7. client/src/types/index.ts — add CuisineRegion type

Supported regions (Phase 1):
- "punjabi"       — roti, sarson da saag, lassi, makki di roti, rajma, chole
- "south_indian"  — idli, dosa, sambar, rasam, rice, coconut chutney, upma
- "gujarati"      — dhokla, thepla, khichdi, kadhi, fafda, undhiyu
- "bengali"       — rice, fish curry, dal, posto, mishti doi, luchi
- "maharashtrian" — bhakri, varan, pitla, misal, puran poli, modak
- "general"       — default, existing behaviour unchanged

Critical rules:
- cuisineRegion defaults to "general" — must not break existing plans
- Add region as a hard constraint in the Gemini prompt: "Prioritise [region] cuisine foods"
- Seed script must mark regional foods with appropriate tags[]
- If a regional food is not in the DB → Gemini nutrition lookup saves it as usual
- StepCuisine shows flag/icon for each region — make it visually appealing

Show me the updated server/models/DietPlan.ts and server/models/Food.ts
first and wait for my approval before writing any other file.
```

---

## Session 14 — Feature 3.4: Festival / Fasting Mode

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 3.4 — Festival / Fasting Mode

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Gemini constraint is passed via existing generateDietPlan() — no new AI function.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/Food.ts — ensure tags[] field exists (from Feature 3.3 or add now)
2. server/scripts/seedFoods.ts — add fasting-safe foods with appropriate tags
3. server/models/DietPlan.ts — add fastingType field
4. client/src/components/steps/StepFestival.tsx — fasting type selection UI
5. client/src/App.tsx — insert StepFestival into onboarding
6. server/controllers/plansController.ts — filter allowed foods by fasting type before Gemini call

Fasting types and their allowed food rules:
- "navratri"     → only: sabudana, kuttu, singhara, samak rice, fruits, milk, curd, nuts, sweet potato, sendha namak
- "ekadashi"     → no grains, no beans. Allow: fruits, milk, curd, nuts, root vegetables
- "ramadan"      → two meals only (sehri before dawn, iftar after sunset). Normal foods allowed.
- "monday_fast"  → one full meal allowed + fruits. No meat.
- "custom"       → user selects allowed foods manually from their food list

Critical rules:
- Each fasting type must have an allowedFoods list seeded in the DB with tags
- Gemini prompt must say: "Use ONLY these fasting-approved foods: [list]"
- If allowed foods cannot meet calorie target → Gemini explains the gap in the plan
- fastingType is completely separate from intermittent fasting (Feature 2.4)
- "custom" fasting shows a checkbox list of the user's current food selection

Show me the fasting food seed data structure in server/scripts/seedFoods.ts
first and wait for my approval before writing any other file.
```

---

## Session 15 — Feature 3.5: Budget-Aware Planning

```
Read CLAUDE.md fully.

Current status: Read the existing codebase and tell me what is already
built. Check server/models/, server/routes/, server/services/, and
client/src/components/ and summarize what exists.

Feature to build today: Feature 3.5 — Budget-Aware Planning

Rules for this session:
- Follow the schema defined in CLAUDE.md exactly. Do not invent fields.
- Gemini is used inside generateDietPlan() — add budget as a hard constraint.
- All env vars from process.env only. No hardcoding.
- TypeScript strict mode. No `any` types.
- Do not start the next feature even if this one finishes early.

Build order:
1. server/models/Food.ts — add pricePerKgINR: number | null field
2. server/models/DietPlan.ts — add dailyBudgetINR: number | null field
3. server/scripts/seedFoods.ts — add pricePerKgINR for all seeded foods (approximate market prices)
4. server/routes/foods.ts — add PATCH /api/foods/:name/price for admin price updates
5. client/src/components/steps/StepBudget.tsx — optional budget input step
6. client/src/App.tsx — insert StepBudget into onboarding (optional, skippable)
7. server/controllers/plansController.ts — calculate budget constraint before Gemini call
8. client/src/types/index.ts — update types

Budget constraint logic in plansController.ts:
- Before calling Gemini, calculate cost per 100g for each selected food
- Pass to Gemini: "Daily food budget: ₹[X]. Total plan cost must not exceed this."
- If budget makes hitting calorie target impossible → Gemini must explain the tradeoff
  and suggest the minimum daily budget needed to meet the goal
- dailyBudgetINR: null means no budget constraint → existing behaviour unchanged

Approximate seed prices (INR per kg) to use:
- Roti/atta: 40, Rice: 60, Dal: 100, Oats: 120, Banana: 50, Egg: 120,
  Chicken breast: 300, Paneer: 350, Milk: 60, Curd: 80, Peanuts: 120,
  Spinach: 40, Sweet potato: 50, Apple: 150, Almonds: 1200, Tofu: 200

Critical rules:
- pricePerKgINR can be null — not all foods will have prices set initially
- If a food has no price, exclude it from budget calculation and note it to Gemini
- StepBudget is optional — user can skip it with a "No budget limit" button
- Show estimated daily cost in the generated plan view

Show me the updated server/models/Food.ts with pricePerKgINR first
and wait for my approval before writing any other file.
```

---

---

## Quick Reference — Session Prompt Index

| Session | Feature | Tier | Key Tech |
|---|---|---|---|
| 1 | Daily Meal Log | 1 | MongoDB DailyLog model |
| 2 | Weekly Meal Plan | 1 | Gemini jsonModel, weeklyPlan schema |
| 3 | Meal Swap | 1 | Gemini jsonModel, swapMeal() |
| 4 | Grocery List | 1 | Pure math, no Gemini |
| 5 | Weight Tracker | 1 | WeightLog model, isStale detection |
| 6 | Water Tracker | 1 | DailyLog extension, pure math |
| 7 | Weekly Muscle Report | 2 | WeeklyReport model, cron job, ScoreRing |
| 8 | Streak & Score | 2 | streakService, freeze logic |
| 9 | Recipe Mode | 2 | Gemini jsonModel, generateRecipe() |
| 10 | Fasting Mode | 2 | DietPlan extension, eating window |
| 11 | Photo Meal Analysis | 3 | Gemini Vision multimodal |
| 12 | Lab Report | 3 | Gemini PDF support |
| 13 | Regional Cuisine | 3 | Food tags, seed expansion |
| 14 | Festival Fasting | 3 | Allowed food lists, seed tags |
| 15 | Budget Planning | 3 | pricePerKgINR, budget constraint |

---

## STATUS.md Template — Keep This Updated After Every Session

Copy this into a new file called `STATUS.md` in your project root.

```markdown
# NutriPlan — Build Status

Last updated: [date]

## ✅ Complete
- MVP: Food lookup, nutrition DB, diet plan generation, basic 4-step UI

## 🔄 In Progress
- 

## ⏳ Queue
- Feature 1.1 — Daily Meal Log
- Feature 1.2 — Weekly Meal Plan
- Feature 1.3 — Meal Swap
- Feature 1.4 — Grocery List Generator
- Feature 1.5 — Weight Progress Tracker
- Feature 1.6 — Water Intake Tracker
- Feature 2.1 — Weekly Muscle Report ← FLAGSHIP
- Feature 2.2 — Streak & Compliance Score
- Feature 2.3 — Recipe Mode
- Feature 2.4 — Fasting Mode
- Feature 3.1 — Photo Meal Analysis
- Feature 3.2 — Lab Report Integration
- Feature 3.3 — Regional Cuisine Mode
- Feature 3.4 — Festival / Fasting Mode
- Feature 3.5 — Budget-Aware Planning
```
