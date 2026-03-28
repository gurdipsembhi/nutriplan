import Food from "../models/Food";
import { lookupNutrition } from "./geminiService";

interface LookupResult {
  found: Record<string, unknown>[];
  added: string[];
}

export async function lookupAndSaveNutrition(
  foodNames: string[],
  dietType: string
): Promise<LookupResult> {
  const normalized = foodNames.map((f) => f.toLowerCase().trim());

  const existingFoods = await Food.find({
    $or: [
      { name: { $in: normalized } },
      { aliases: { $in: normalized } },
    ],
  }).lean();

  const foundNames = new Set<string>();
  existingFoods.forEach((f) => {
    foundNames.add(f.name);
    f.aliases.forEach((a) => foundNames.add(a));
  });

  const unknownFoods = normalized.filter((n) => !foundNames.has(n));
  const added: string[] = [];

  if (unknownFoods.length > 0) {
    const nutritionData = await lookupNutrition(unknownFoods);

    for (const [foodName, data] of Object.entries(nutritionData)) {
      const name = foodName.toLowerCase().trim();
      try {
        await Food.create({
          name,
          calories: data.calories,
          protein:  data.protein,
          fat:      data.fat,
          carbs:    data.carbs,
          fiber:    data.fiber ?? 0,
          dietType: data.dietType ?? dietType ?? "both",
          source:   "llm",
        });
        added.push(name);
      } catch (err) {
        console.warn(`Could not save food "${name}":`, err);
      }
    }
  }

  const allFoods = await Food.find({
    $or: [
      { name: { $in: normalized } },
      { aliases: { $in: normalized } },
    ],
  })
    .select("name calories protein fat carbs fiber dietType")
    .lean();

  return { found: allFoods, added };
}
