import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../../.env") });

import mongoose from "mongoose";
import Food from "../models/Food";

const seeds = [
  { name: "banana",        calories: 89,  protein: 1.1,  fat: 0.3,  carbs: 23.0, fiber: 2.6, dietType: "veg"    as const },
  { name: "egg",           calories: 155, protein: 13.0, fat: 11.0, carbs: 1.1,  fiber: 0.0, dietType: "nonveg" as const },
  { name: "chicken breast",calories: 165, protein: 31.0, fat: 3.6,  carbs: 0.0,  fiber: 0.0, dietType: "nonveg" as const },
  { name: "brown rice",    calories: 216, protein: 4.5,  fat: 1.8,  carbs: 45.0, fiber: 3.5, dietType: "veg"    as const },
  { name: "oats",          calories: 389, protein: 17.0, fat: 7.0,  carbs: 66.0, fiber: 10.6,dietType: "veg"    as const },
  { name: "milk",          calories: 61,  protein: 3.2,  fat: 3.3,  carbs: 4.8,  fiber: 0.0, dietType: "veg"    as const },
  { name: "lentils",       calories: 116, protein: 9.0,  fat: 0.4,  carbs: 20.0, fiber: 7.9, dietType: "veg"    as const },
  { name: "paneer",        calories: 265, protein: 18.0, fat: 20.0, carbs: 3.4,  fiber: 0.0, dietType: "veg"    as const },
  { name: "spinach",       calories: 23,  protein: 2.9,  fat: 0.4,  carbs: 3.6,  fiber: 2.2, dietType: "veg"    as const },
  { name: "apple",         calories: 52,  protein: 0.3,  fat: 0.2,  carbs: 14.0, fiber: 2.4, dietType: "veg"    as const },
  { name: "sweet potato",  calories: 86,  protein: 1.6,  fat: 0.1,  carbs: 20.0, fiber: 3.0, dietType: "veg"    as const },
  { name: "almonds",       calories: 579, protein: 21.0, fat: 50.0, carbs: 22.0, fiber: 12.5,dietType: "veg"    as const },
  { name: "greek yogurt",  calories: 59,  protein: 10.0, fat: 0.4,  carbs: 3.6,  fiber: 0.0, dietType: "veg"    as const },
  { name: "salmon",        calories: 208, protein: 20.0, fat: 13.0, carbs: 0.0,  fiber: 0.0, dietType: "nonveg" as const },
  { name: "broccoli",      calories: 34,  protein: 2.8,  fat: 0.4,  carbs: 7.0,  fiber: 2.6, dietType: "veg"    as const },
  { name: "roti",          calories: 297, protein: 9.0,  fat: 4.0,  carbs: 56.0, fiber: 3.5, dietType: "veg"    as const },
  { name: "dal",           calories: 116, protein: 9.0,  fat: 0.4,  carbs: 20.0, fiber: 8.0, dietType: "veg"    as const },
  { name: "curd",          calories: 98,  protein: 11.0, fat: 4.3,  carbs: 3.4,  fiber: 0.0, dietType: "veg"    as const },
  { name: "peanuts",       calories: 567, protein: 26.0, fat: 49.0, carbs: 16.0, fiber: 8.5, dietType: "veg"    as const },
  { name: "tofu",          calories: 76,  protein: 8.0,  fat: 4.8,  carbs: 1.9,  fiber: 0.3, dietType: "veg"    as const },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  let inserted = 0;
  let skipped  = 0;

  for (const food of seeds) {
    const exists = await Food.findOne({ name: food.name });
    if (exists) { skipped++; continue; }
    await Food.create({ ...food, source: "seed", per: "100g" });
    inserted++;
    console.log(`  + ${food.name}`);
  }

  console.log(`\nSeed complete: ${inserted} inserted, ${skipped} skipped`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
