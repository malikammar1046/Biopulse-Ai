/**
 * apps/mobile/utils/units.ts
 *
 * BioPulse AI — Authoritative Metric & Imperial Unit Conversion Core.
 *
 * Requirements:
 * - Height units: cm, m, ft (and ft/in)
 * - Weight units: kg, lb
 * - Canonical backend storage: ALWAYS height in centimeters (cm), weight in kilograms (kg)
 * - Conversion happens strictly at the UI boundary
 * - Round-trip consistency without precision explosion
 * - Sensible clinical range validation
 */

import { persistentStorage } from '../lib/storage';

export type HeightUnit = 'cm' | 'm' | 'ft';
export type WeightUnit = 'kg' | 'lb';

export interface UnitPreferences {
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
}

const STORAGE_KEY_UNIT_PREFS = 'biopulse_unit_preferences';

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  heightUnit: 'cm',
  weightUnit: 'kg',
};

// ============================================================================
// CONVERSION FORMULAS & CONSTANTS
// ============================================================================

const CM_PER_INCH = 2.54;
const CM_PER_FOOT = 30.48; // 12 * 2.54
const LBS_PER_KG = 2.20462262185;
const KG_PER_LB = 0.45359237;

// ============================================================================
// HEIGHT CONVERSIONS (CANONICAL IS CM)
// ============================================================================

/**
 * Converts any supported height value to canonical centimeters (cm).
 */
export function toCanonicalHeightCm(value: number, fromUnit: HeightUnit): number {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) return 0;
  switch (fromUnit) {
    case 'cm':
      return Math.round(value);
    case 'm':
      return Math.round(value * 100);
    case 'ft':
      return Math.round(value * CM_PER_FOOT);
    default:
      return Math.round(value);
  }
}

/**
 * Converts canonical centimeters (cm) to target display unit.
 */
export function fromCanonicalHeightCm(heightCm: number, toUnit: HeightUnit): number {
  if (typeof heightCm !== 'number' || isNaN(heightCm) || heightCm <= 0) return 0;
  switch (toUnit) {
    case 'cm':
      return Math.round(heightCm);
    case 'm':
      return parseFloat((heightCm / 100).toFixed(2));
    case 'ft':
      return parseFloat((heightCm / CM_PER_FOOT).toFixed(1));
    default:
      return Math.round(heightCm);
  }
}

/**
 * Converts feet to feet and inches tuple [feet, inches].
 */
export function ftToFtIn(feetDec: number): { feet: number; inches: number } {
  const totalInches = Math.round(feetDec * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

/**
 * Converts feet and inches tuple to canonical centimeters.
 */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return Math.round(totalInches * CM_PER_INCH);
}

// ============================================================================
// WEIGHT CONVERSIONS (CANONICAL IS KG)
// ============================================================================

/**
 * Converts any supported weight value to canonical kilograms (kg).
 */
export function toCanonicalWeightKg(value: number, fromUnit: WeightUnit): number {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) return 0;
  switch (fromUnit) {
    case 'kg':
      return Math.round(value * 10) / 10;
    case 'lb':
      return Math.round(value * KG_PER_LB * 10) / 10;
    default:
      return Math.round(value * 10) / 10;
  }
}

/**
 * Converts canonical kilograms (kg) to target display unit.
 */
export function fromCanonicalWeightKg(weightKg: number, toUnit: WeightUnit): number {
  if (typeof weightKg !== 'number' || isNaN(weightKg) || weightKg <= 0) return 0;
  switch (toUnit) {
    case 'kg':
      return Math.round(weightKg * 10) / 10;
    case 'lb':
      return Math.round(weightKg * LBS_PER_KG);
    default:
      return Math.round(weightKg * 10) / 10;
  }
}

// ============================================================================
// AUTHORITATIVE BMI COMPUTATION
// ============================================================================

/**
 * Computes authoritative BMI = weight_kg / (height_m ^ 2) rounded to 1 decimal.
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm || heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

export const calculateBmiCanonical = calculateBmi;

export function getBmiClassification(bmi: number): {
  label: string;
  color: string;
} {
  if (bmi <= 0) return { label: 'Not recorded', color: '#64748B' };
  if (bmi < 18.5) return { label: 'Underweight', color: '#0284C7' };
  if (bmi < 25.0) return { label: 'Normal weight', color: '#10B981' };
  if (bmi < 30.0) return { label: 'Overweight', color: '#F59E0B' };
  return { label: 'Obese', color: '#EF4444' };
}

// ============================================================================
// CLINICAL INPUT VALIDATION
// ============================================================================

export interface UnitValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateHeight(value: number, unit: HeightUnit): UnitValidationResult {
  if (isNaN(value) || value <= 0) {
    return { isValid: false, error: 'Please enter a valid height.' };
  }
  const cm = toCanonicalHeightCm(value, unit);
  if (cm < 60 || cm > 250) {
    return {
      isValid: false,
      error: `Height out of realistic range (${unit === 'cm' ? '60-250 cm' : unit === 'm' ? '0.6-2.5 m' : '2.0-8.2 ft'}).`,
    };
  }
  return { isValid: true };
}

export function validateWeight(value: number, unit: WeightUnit): UnitValidationResult {
  if (isNaN(value) || value <= 0) {
    return { isValid: false, error: 'Please enter a valid weight.' };
  }
  const kg = toCanonicalWeightKg(value, unit);
  if (kg < 20 || kg > 300) {
    return {
      isValid: false,
      error: `Weight out of realistic range (${unit === 'kg' ? '20-300 kg' : '44-660 lb'}).`,
    };
  }
  return { isValid: true };
}

// ============================================================================
// PERSISTENT UNIT PREFERENCES
// ============================================================================

let memoryPrefs: UnitPreferences = { ...DEFAULT_UNIT_PREFERENCES };

export async function loadSavedUnitPreferences(): Promise<UnitPreferences> {
  try {
    const raw = await persistentStorage.getItem(STORAGE_KEY_UNIT_PREFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryPrefs = {
          heightUnit: parsed.heightUnit === 'ft' || parsed.heightUnit === 'm' ? parsed.heightUnit : 'cm',
          weightUnit: parsed.weightUnit === 'lb' ? 'lb' : 'kg',
        };
        return memoryPrefs;
      }
    }
  } catch {
    // fallback to memory
  }
  return memoryPrefs;
}

export function getCachedUnitPreferences(): UnitPreferences {
  return memoryPrefs;
}

export async function saveUnitPreferences(prefs: Partial<UnitPreferences>): Promise<UnitPreferences> {
  memoryPrefs = {
    ...memoryPrefs,
    ...prefs,
  };
  try {
    await persistentStorage.setItem(STORAGE_KEY_UNIT_PREFS, JSON.stringify(memoryPrefs));
  } catch {
    // ignore
  }
  return memoryPrefs;
}
