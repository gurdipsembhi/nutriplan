import { useDietPlan } from "./hooks/useDietPlan";
import NavBar from "./components/NavBar";
import StepDietType from "./components/steps/StepDietType";
import StepFoods from "./components/steps/StepFoods";
import StepProfile from "./components/steps/StepProfile";
import StepGoal from "./components/steps/StepGoal";
import GeneratingView from "./components/GeneratingView";
import DietPlanView from "./components/DietPlanView";

export default function App() {
  const { state, setDietType, setFoods, setProfile, setGoalAndGenerate, reset, goBack } = useDietPlan();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100">
      {state.step !== "done" && state.step !== "generating" && (
        <NavBar currentStep={state.step as 1 | 2 | 3 | 4} onBack={goBack} />
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
            onNext={setGoalAndGenerate}
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
          />
        )}
      </main>
    </div>
  );
}
