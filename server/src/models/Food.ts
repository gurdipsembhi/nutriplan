import mongoose, { Schema, Document } from "mongoose";

export interface IFood extends Document {
  name: string;
  aliases: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  vitamins: Map<string, number>;
  minerals: Map<string, number>;
  per: string;
  dietType: "veg" | "nonveg" | "both";
  source: "seed" | "llm" | "manual";
  createdAt: Date;
  updatedAt: Date;
}

const FoodSchema = new Schema<IFood>(
  {
    name:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    aliases:  { type: [String], default: [] },
    calories: { type: Number, required: true },
    protein:  { type: Number, required: true },
    fat:      { type: Number, required: true },
    carbs:    { type: Number, required: true },
    fiber:    { type: Number, default: 0 },
    vitamins: { type: Map, of: Number, default: {} },
    minerals: { type: Map, of: Number, default: {} },
    per:      { type: String, default: "100g" },
    dietType: { type: String, enum: ["veg", "nonveg", "both"], required: true },
    source:   { type: String, enum: ["seed", "llm", "manual"], default: "llm" },
  },
  { timestamps: true }
);

FoodSchema.index({ aliases: 1 });

export default mongoose.model<IFood>("Food", FoodSchema);
