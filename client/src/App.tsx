import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthCallback from "./pages/AuthCallback";
import SettingsPage from "./pages/SettingsPage";
import { useAuth } from "./context/AuthContext";

function MainApp() {
  const { user } = useAuth();
  const { state, setDietType, setFoods, setProfile, setGoal, setFastingAndGenerate, reset, goBack } = useDietPlan();
  const [showLog,     setShowLog]     = useState(false);
  const [showWeekly,  setShowWeekly]  = useState(false);
  const [showGrocery, setShowGrocery] = useState(false);
  const [showWeight,  setShowWeight]  = useState(false);
  const [showReport,  setShowReport]  = useState(false);

  // Use the authenticated user's ID
  const userId = user?._id ?? "";

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
        userId={userId}
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
        userId={userId}
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
        userId={userId}
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
