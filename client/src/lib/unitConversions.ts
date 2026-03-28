export type Units = "metric" | "imperial";

export function displayWeight(kg: number, units: Units): string {
  if (units === "imperial") return `${(kg * 2.20462).toFixed(1)} lbs`;
  return `${kg} kg`;
}

export function displayHeight(cm: number, units: Units): string {
  if (units === "imperial") {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${cm} cm`;
}

export function lbsToKg(lbs: number): number {
  return parseFloat((lbs / 2.20462).toFixed(2));
}

export function ftInToCm(feet: number, inches: number): number {
  return parseFloat(((feet * 12 + inches) * 2.54).toFixed(1));
}

export function weightLabel(units: Units): string {
  return units === "imperial" ? "Weight (lbs)" : "Weight (kg)";
}

export function heightLabel(units: Units): string {
  return units === "imperial" ? "Height (ft / in)" : "Height (cm)";
}
