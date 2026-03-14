import { useState, useCallback } from "react";
import type { DietPlanState, DietType, Goal, UserProfile } from "../types";
import { lookupFoods, generatePlan } from "../lib/api";

const initialState: DietPlanState = {
  step: 1,
  dietType: null,
  selectedFoods: [],
  profile: null,
  goal: null,
  targetCalories: null,
  macros: null,
  plan: null,
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

  const setGoalAndGenerate = useCallback(
    async (goal: Goal) => {
      setState((s) => ({ ...s, goal, step: "generating", error: null }));

      try {
        const { dietType, selectedFoods, profile } = state;
        if (!dietType || !profile) throw new Error("Missing state");

        // Step 1: lookup/save nutrition
        await lookupFoods(selectedFoods, dietType);

        // Step 2: generate plan
        const result = await generatePlan({ dietType, foods: selectedFoods, profile, goal });

        setState((s) => ({
          ...s,
          step: "done",
          targetCalories: result.targetCalories,
          macros: result.macros,
          plan: result.plan,
        }));
      } catch (err) {
        setState((s) => ({
          ...s,
          step: 4,
          error: err instanceof Error ? err.message : "Something went wrong",
        }));
      }
    },
    [state]
  );

  const reset = useCallback(() => setState(initialState), []);
  const goBack = useCallback(() => {
    setState((s) => {
      const prev = typeof s.step === "number" && s.step > 1 ? (s.step - 1) as 1 | 2 | 3 | 4 : 1;
      return { ...s, step: prev };
    });
  }, []);

  return { state, setDietType, setFoods, setProfile, setGoalAndGenerate, reset, goBack };
}
