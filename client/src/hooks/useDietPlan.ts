import { useState, useCallback } from "react";
import type { DietPlanState, DietType, Goal, UserProfile, FastingProtocol } from "../types";
import { lookupFoods, generatePlan } from "../lib/api";

const initialState: DietPlanState = {
  step: 1,
  dietType: null,
  selectedFoods: [],
  profile: null,
  goal: null,
  fastingProtocol: null,
  targetCalories: null,
  macros: null,
  plan: null,
  planId: null,
  error: null,
};

export function useDietPlan() {
  const [state, setState] = useState<DietPlanState>(initialState);

  const setDietType = useCallback((dietType: DietType) => {
    setState((s) => ({ ...s, dietType, step: 2 }));
  }, []);

  const setFoods = useCallback((selectedFoods: string[]) => {
    setState((s) => ({ ...s, selectedFoods, step: 3 }));
  }, []);

  const setProfile = useCallback((profile: UserProfile) => {
    setState((s) => ({ ...s, profile, step: 4 }));
  }, []);

  // Step 4 → 5: save goal, move to fasting step
  const setGoal = useCallback((goal: Goal) => {
    setState((s) => ({ ...s, goal, step: 5, error: null }));
  }, []);

  // Step 5 → generating: save fasting protocol, trigger plan generation
  const setFastingAndGenerate = useCallback(
    async (fastingProtocol: FastingProtocol) => {
      setState((s) => ({ ...s, fastingProtocol, step: "generating", error: null }));

      try {
        const { dietType, selectedFoods, profile, goal } = state;
        if (!dietType || !profile || !goal) throw new Error("Missing state");

        // Step 1: lookup/save nutrition
        await lookupFoods(selectedFoods, dietType);

        // Step 2: generate plan (fastingProtocol omitted when "none")
        const result = await generatePlan({
          dietType,
          foods: selectedFoods,
          profile,
          goal,
          ...(fastingProtocol !== "none" && { fastingProtocol }),
        });

        setState((s) => ({
          ...s,
          step: "done",
          targetCalories: result.targetCalories,
          macros: result.macros,
          plan: result.plan,
          planId: result.id,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          step: 5,
          error: err instanceof Error ? err.message : "Something went wrong",
        }));
      }
    },
    [state]
  );

  const reset = useCallback(() => setState(initialState), []);
  const goBack = useCallback(() => {
    setState((s) => {
      if (typeof s.step !== "number" || s.step <= 1) return s;
      return { ...s, step: (s.step - 1) as 1 | 2 | 3 | 4 | 5 };
    });
  }, []);

  return { state, setDietType, setFoods, setProfile, setGoal, setFastingAndGenerate, reset, goBack };
}
