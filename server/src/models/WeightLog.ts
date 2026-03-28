import mongoose, { Schema, Document } from "mongoose";

export interface IWeightLog extends Document {
  userId: string;
  weight: number;   // kg
  date: string;     // "YYYY-MM-DD"
  note: string;     // optional context: "post-workout", "morning", etc.
  createdAt: Date;
}

const WeightLogSchema = new Schema<IWeightLog>(
  {
    userId: { type: String, required: true },
    weight: { type: Number, required: true },
    date:   { type: String, required: true },   // "YYYY-MM-DD" — never Date object
    note:   { type: String, default: "" },
  },
  { timestamps: true }
);

// One log per user per day — prevent duplicates
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// Fast range queries for history/trend
WeightLogSchema.index({ userId: 1, date: -1 });

export default mongoose.model<IWeightLog>("WeightLog", WeightLogSchema);
