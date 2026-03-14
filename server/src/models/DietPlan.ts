import mongoose, { Schema, Document } from "mongoose";

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
