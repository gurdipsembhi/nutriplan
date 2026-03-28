import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatar?: string;
  preferences: {
    units: "metric" | "imperial";
  };
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId:     { type: String, sparse: true },
    avatar:       { type: String },
    preferences: {
      units: { type: String, enum: ["metric", "imperial"], default: "metric" },
    },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);


export default mongoose.model<IUser>("User", UserSchema);
