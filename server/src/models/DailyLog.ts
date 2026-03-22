import mongoose, { Schema, Document } from "mongoose";

export interface IMealFood {
  name: string;
  grams: number;
  calories: number;
}

export interface IMealActual {
  foods: IMealFood[];
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IMeal {
  mealName: string;
  planned: {
    foods: IMealFood[];
    totalCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  actual: IMealActual | null;
  checkedOff: boolean;
  loggedAt: Date | null;
}

export interface IDayTotals {
  plannedCalories: number;
  actualCalories: number;
  plannedProtein: number;
  actualProtein: number;
  plannedCarbs: number;
  actualCarbs: number;
  plannedFat: number;
  actualFat: number;
}

export interface IDailyLog extends Document {
  userId: string;
  planId: string;
  date: string;           // "YYYY-MM-DD" — never Date object
  meals: IMeal[];
  dayTotals: IDayTotals;
  waterMl: number;        // total consumed today in ml
  waterGoalMl: number;    // target for the day, set on log creation from user's weight
  streakDay: number;      // running streak count at the time this log was saved
  createdAt: Date;
  updatedAt: Date;
}

const MealFoodSchema = new Schema<IMealFood>(
  {
    name:     { type: String, required: true },
    grams:    { type: Number, required: true },
    calories: { type: Number, required: true },
  },
  { _id: false }
);

const MealActualSchema = new Schema<IMealActual>(
  {
    foods:         { type: [MealFoodSchema], required: true },
    totalCalories: { type: Number, required: true },
    protein:       { type: Number, required: true },
    carbs:         { type: Number, required: true },
    fat:           { type: Number, required: true },
  },
  { _id: false }
);

const MealSchema = new Schema<IMeal>(
  {
    mealName: { type: String, required: true },
    planned: {
      foods:         { type: [MealFoodSchema], required: true },
      totalCalories: { type: Number, required: true },
      protein:       { type: Number, required: true },
      carbs:         { type: Number, required: true },
      fat:           { type: Number, required: true },
    },
    actual:     { type: MealActualSchema, default: null },
    checkedOff: { type: Boolean, default: false },
    loggedAt:   { type: Date, default: null },
  },
  { _id: false }
);

const DailyLogSchema = new Schema<IDailyLog>(
  {
    userId: { type: String, required: true },
    planId: { type: String, required: true },
    date:   { type: String, required: true },   // "YYYY-MM-DD"
    meals:  { type: [MealSchema], required: true },
    dayTotals: {
      plannedCalories: { type: Number, required: true },
      actualCalories:  { type: Number, required: true },
      plannedProtein:  { type: Number, required: true },
      actualProtein:   { type: Number, required: true },
      plannedCarbs:    { type: Number, required: true },
      actualCarbs:     { type: Number, required: true },
      plannedFat:      { type: Number, required: true },
      actualFat:       { type: Number, required: true },
    },
    waterMl:     { type: Number, default: 0 },
    waterGoalMl: { type: Number, default: 0 },
    streakDay:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });
DailyLogSchema.index({ planId: 1 });

export default mongoose.model<IDailyLog>("DailyLog", DailyLogSchema);
