import { useState } from "react";
import { useDietPlan } from "./hooks/useDietPlan";
import NavBar from "./components/NavBar";
import StepDietType from "./components/steps/StepDietType";
import StepFoods from "./components/steps/StepFoods";
import StepProfile from "./components/steps/StepProfile";
import StepGoal from "./components/steps/StepGoal";
import StepFasting from "./components/steps/StepFasting";
import GeneratingView from "./components/GeneratingView";
import DietPlanView from "./components/DietPlanView";
import DailyLogView from "./components/DailyLogView";
import WeeklyPlanView from "./components/WeeklyPlanView";
import GroceryListView from "./components/GroceryListView";
import WeightLogView from "./components/WeightTracker/WeightLogView";
import WeeklyReportView from "./components/WeeklyReport/WeeklyReportView";

// Stable device-scoped userId — persisted in localStorage until auth is added
function getOrCreateUserId(): string {
  const key = "nutriplan_user_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

const USER_ID = getOrCreateUserId();

export default function App() {
  const { state, setDietType, setFoods, setProfile, setGoal, setFastingAndGenerate, reset, goBack } = useDietPlan();
  const [showLog,     setShowLog]     = useState(false);
  const [showWeekly,  setShowWeekly]  = useState(false);
  const [showGrocery, setShowGrocery] = useState(false);
  const [showWeight,  setShowWeight]  = useState(false);
  const [showReport,  setShowReport]  = useState(false);

  // Show daily log view
  if (
    showLog &&
    state.step === "done" &&
    state.planId &&
    state.macros &&
    state.targetCalories
  ) {
    return (
      <DailyLogView
        planId={state.planId}
        userId={USER_ID}
        targetCalories={state.targetCalories}
        macros={state.macros}
        selectedFoods={state.selectedFoods}
        goal={state.goal!}
        dietType={state.dietType!}
        weightKg={state.profile!.weight}
        onBack={() => setShowLog(false)}
      />
    );
  }

  // Show weekly plan view
  if (
    showWeekly &&
    state.step === "done" &&
    state.planId &&
    state.dietType &&
    state.goal &&
    state.targetCalories
  ) {
    return (
      <WeeklyPlanView
        planId={state.planId}
        selectedFoods={state.selectedFoods}
        targetCalories={state.targetCalories}
        dietType={state.dietType}
        goal={state.goal}
        onBack={() => setShowWeekly(false)}
        onGroceryList={() => { setShowWeekly(false); setShowGrocery(true); }}
      />
    );
  }

  // Show weight tracker view
  if (showWeight && state.step === "done" && state.planId && state.profile) {
    return (
      <WeightLogView
        userId={USER_ID}
        planId={state.planId}
        originalWeight={state.profile.weight}
        onBack={() => setShowWeight(false)}
        onRecalculate={() => { setShowWeight(false); reset(); }}
      />
    );
  }

  // Show weekly report view
  if (
    showReport &&
    state.step === "done" &&
    state.planId &&
    state.goal
  ) {
    return (
      <WeeklyReportView
        userId={USER_ID}
        planId={state.planId}
        selectedFoods={state.selectedFoods}
        goal={state.goal}
        onBack={() => setShowReport(false)}
        onRecalculate={() => { setShowReport(false); reset(); }}
      />
    );
  }

  // Show grocery list view
  if (showGrocery && state.step === "done" && state.planId) {
    return (
      <GroceryListView
        planId={state.planId}
        onBack={() => { setShowGrocery(false); setShowWeekly(true); }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {state.step !== "done" && state.step !== "generating" && (
        <NavBar currentStep={state.step as 1 | 2 | 3 | 4 | 5} onBack={goBack} />
      )}

      <main className="flex items-center justify-center min-h-screen px-4 py-8">
        {state.step === 1 && <StepDietType onSelect={setDietType} />}
        {state.step === 2 && state.dietType && (
          <StepFoods dietType={state.dietType} onNext={setFoods} />
        )}
        {state.step === 3 && (
          <StepProfile onNext={setProfile} />
        )}
        {state.step === 4 && (
          <StepGoal
            onNext={setGoal}
            error={state.error}
          />
        )}
        {state.step === 5 && (
          <StepFasting
            onNext={setFastingAndGenerate}
            error={state.error}
          />
        )}
        {state.step === "generating" && <GeneratingView />}
        {state.step === "done" && state.plan && state.macros && state.targetCalories && (
          <DietPlanView
            plan={state.plan}
            macros={state.macros}
            targetCalories={state.targetCalories}
            onReset={reset}
            onTrack={() => setShowLog(true)}
            onWeeklyPlan={() => setShowWeekly(true)}
            onWeightTracker={() => setShowWeight(true)}
            onWeeklyReport={() => setShowReport(true)}
          />
        )}
      </main>
    </div>
  );
}
