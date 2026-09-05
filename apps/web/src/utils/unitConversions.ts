/**
 * Unit Conversion Helpers for Clinical Biometrics
 */

export function cmToFtIn(cm: number | null | undefined): { feet: number; inches: number } {
  if (!cm || isNaN(cm) || cm <= 0) return { feet: 5, inches: 9 };
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

export function ftInToCm(feet: number, inches: number): number {
  const safeFeet = Math.max(0, feet || 0);
  const safeInches = Math.max(0, inches || 0);
  const totalInches = safeFeet * 12 + safeInches;
  return Math.round(totalInches * 2.54);
}

export function kgToLbs(kg: number | null | undefined): number | null {
  if (kg === null || kg === undefined || isNaN(kg) || kg <= 0) return null;
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number | null | undefined): number | null {
  if (lbs === null || lbs === undefined || isNaN(lbs) || lbs <= 0) return null;
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToInches(cm: number | null | undefined): number | null {
  if (cm === null || cm === undefined || isNaN(cm) || cm <= 0) return null;
  return Math.round((cm / 2.54) * 10) / 10;
}

export function inchesToCm(inches: number | null | undefined): number | null {
  if (inches === null || inches === undefined || isNaN(inches) || inches <= 0) return null;
  return Math.round(inches * 2.54);
}
