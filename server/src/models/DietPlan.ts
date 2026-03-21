import mongoose, { Schema, Document } from "mongoose";

// ─── Weekly Plan types ───────────────────────────────────────────────────────

export interface IWeeklyMealFood {
  name: string;
  grams: number;
  calories: number;
}

export interface IWeeklyMeal {
  name: string;
  foods: IWeeklyMealFood[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IWeeklyDay {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  meals: IWeeklyMeal[];
  dayTotal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// ─── DietPlan document ───────────────────────────────────────────────────────

export interface IDietPlan extends Document {
  profile: {
    height: number;
    weight: number;
    age: number;
    gender: "male" | "female";
  };
  dietType: "veg" | "nonveg";
  goal: "fat_loss" | "muscle_gain" | "maintenance";
  selectedFoods: string[];
  targetCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  generatedPlan: string;
  weeklyPlan: IWeeklyDay[];       // populated by Feature 1.2; empty array until generated
  createdAt: Date;
  updatedAt: Date;
}

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const WeeklyMealFoodSchema = new Schema<IWeeklyMealFood>(
  {
    name:     { type: String, required: true },
    grams:    { type: Number, required: true },
    calories: { type: Number, required: true },
  },
  { _id: false }
);

const WeeklyMealSchema = new Schema<IWeeklyMeal>(
  {
    name:          { type: String, required: true },
    foods:         { type: [WeeklyMealFoodSchema], default: [] },
    totalCalories: { type: Number, required: true },
    protein:       { type: Number, required: true },
    carbs:         { type: Number, required: true },
    fat:           { type: Number, required: true },
  },
  { _id: false }
);

const WeeklyDaySchema = new Schema<IWeeklyDay>(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    meals: { type: [WeeklyMealSchema], required: true },
    dayTotal: {
      calories: { type: Number, required: true },
      protein:  { type: Number, required: true },
      carbs:    { type: Number, required: true },
      fat:      { type: Number, required: true },
    },
  },
  { _id: false }
);

// ─── Main schema ─────────────────────────────────────────────────────────────

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
    weeklyPlan:    { type: [WeeklyDaySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IDietPlan>("DietPlan", DietPlanSchema);
