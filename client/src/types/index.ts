export type DietType = "veg" | "nonveg";
export type Goal = "fat_loss" | "muscle_gain" | "maintenance";
export type Gender = "male" | "female";

export interface UserProfile {
  height: number;
  weight: number;
  age: number;
  gender: Gender;
}

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  dietType: DietType | "both";
}

export interface DietPlanState {
  step: 1 | 2 | 3 | 4 | "generating" | "done";
  dietType: DietType | null;
  selectedFoods: string[];
  profile: UserProfile | null;
  goal: Goal | null;
  targetCalories: number | null;
  macros: Macros | null;
  plan: string | null;
  error: string | null;
}

export interface GeneratePlanResponse {
  id: string;
  plan: string;
  targetCalories: number;
  macros: Macros;
}
