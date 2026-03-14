export function calcBMR(weight: number, height: number, age: number, gender: "male" | "female"): number {
  if (gender === "male") return 10 * weight + 6.25 * height - 5 * age + 5;
  return 10 * weight + 6.25 * height - 5 * age - 161;
}

export function calcTDEE(bmr: number): number {
  return Math.round(bmr * 1.4);
}

export function goalCalories(tdee: number, goal: string): number {
  if (goal === "fat_loss")    return tdee - 500;
  if (goal === "muscle_gain") return tdee + 300;
  return tdee;
}

export function calcMacros(calories: number) {
  return {
    protein: Math.round((calories * 0.30) / 4),
    carbs:   Math.round((calories * 0.45) / 4),
    fat:     Math.round((calories * 0.25) / 9),
  };
}
