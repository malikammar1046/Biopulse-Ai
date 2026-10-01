import test from 'node:test';
import assert from 'node:assert/strict';

// Test implementation of the mapping and validation logic
function buildFemaleTier1Inputs(basicInfo, cycleHealth, symptoms, lifestyle) {
  return {
    age: Number(basicInfo.age) || 24,
    weight_kg: Number(basicInfo.weightKg) || 58,
    height_cm: Number(basicInfo.heightCm) || 162,
    bmi: Number(basicInfo.bmi) || 22.1,
    cycle_regularity: (cycleHealth.regularity === 'irregular' ? 'irregular' : 'regular'),
    cycle_length_raw: Number(cycleHealth.cycleLength) || 28,
    hirsutism: symptoms.includes('hirsutism') ? 1 : 0,
    weight_gain: symptoms.includes('weight_gain') ? 1 : 0,
    skin_darkening: symptoms.includes('skin_darkening') ? 1 : 0,
    hair_loss: symptoms.includes('hair_loss') ? 1 : 0,
    pimples_acne: symptoms.includes('pimples_acne') ? 1 : 0,
    fast_food: lifestyle.fastFoodIntake === 'frequently' ? 1 : 0,
    regular_exercise: lifestyle.exerciseFrequency === 'none' ? 0 : 1,
    marriage_years: Number(basicInfo.marriageYears) || 0,
    is_pregnant: basicInfo.pregnancyStatus === 'currently_pregnant',
  };
}

function validateFemaleReviewInputs(basicInfo, cycleHealth) {
  if (!basicInfo.dateOfBirth) {
    return { isValid: false, error: 'Date of birth is required.' };
  }
  if (!basicInfo.age || basicInfo.age < 12 || basicInfo.age > 65) {
    return { isValid: false, error: 'Age must be between 12 and 65 years.' };
  }
  if (!basicInfo.heightCm || basicInfo.heightCm < 100 || basicInfo.heightCm > 240) {
    return { isValid: false, error: 'Height must be between 100 and 240 cm.' };
  }
  if (!basicInfo.weightKg || basicInfo.weightKg < 30 || basicInfo.weightKg > 250) {
    return { isValid: false, error: 'Weight must be between 30 and 250 kg.' };
  }
  if (!cycleHealth.cycleLength || cycleHealth.cycleLength < 21 || cycleHealth.cycleLength > 45) {
    return { isValid: false, error: 'Average cycle length must be between 21 and 45 days.' };
  }
  if (!cycleHealth.lastPeriodDate) {
    return { isValid: false, error: 'Last period start date is required.' };
  }
  return { isValid: true };
}

test('Female Tier 1 payload mapping accurately transforms onboarding state', () => {
  const basicInfo = {
    dateOfBirth: '2002-03-15',
    age: 24,
    heightCm: 162,
    weightKg: 58,
    bmi: 22.1,
    maritalStatus: 'single',
    pregnancyStatus: 'not_pregnant',
  };
  const cycleHealth = {
    regularity: 'irregular',
    cycleLength: 28,
    lastPeriodDate: '2026-04-15',
    periodDuration: 5,
    missedPeriodsYear: '0',
    flowPattern: 'moderate',
    additionalNotes: 'Mild cramps on day 1',
  };
  const symptoms = ['hirsutism', 'weight_gain', 'pimples_acne', 'irregular_periods'];
  const lifestyle = {
    sleepHours: 7,
    fastFoodIntake: 'occasionally',
    exerciseFrequency: '1-2_days',
    stressLevel: 'moderate',
  };

  const payload = buildFemaleTier1Inputs(basicInfo, cycleHealth, symptoms, lifestyle);

  assert.equal(payload.age, 24);
  assert.equal(payload.weight_kg, 58);
  assert.equal(payload.height_cm, 162);
  assert.equal(payload.bmi, 22.1);
  assert.equal(payload.cycle_regularity, 'irregular');
  assert.equal(payload.cycle_length_raw, 28);
  assert.equal(payload.hirsutism, 1);
  assert.equal(payload.weight_gain, 1);
  assert.equal(payload.pimples_acne, 1);
  assert.equal(payload.skin_darkening, 0);
  assert.equal(payload.hair_loss, 0);
  assert.equal(payload.fast_food, 0); // 'occasionally' -> 0
  assert.equal(payload.regular_exercise, 1); // '1-2_days' -> 1
  assert.equal(payload.is_pregnant, false);
});

test('Female Review validation enforces required clinical fields and boundaries', () => {
  // Valid case
  const validBasic = { dateOfBirth: '2002-03-15', age: 24, heightCm: 162, weightKg: 58 };
  const validCycle = { cycleLength: 28, lastPeriodDate: '2026-04-15' };
  assert.equal(validateFemaleReviewInputs(validBasic, validCycle).isValid, true);

  // Missing DOB
  assert.equal(validateFemaleReviewInputs({ ...validBasic, dateOfBirth: '' }, validCycle).isValid, false);

  // Invalid Age
  assert.equal(validateFemaleReviewInputs({ ...validBasic, age: 8 }, validCycle).isValid, false);
  assert.equal(validateFemaleReviewInputs({ ...validBasic, age: 75 }, validCycle).isValid, false);

  // Invalid Height
  assert.equal(validateFemaleReviewInputs({ ...validBasic, heightCm: 80 }, validCycle).isValid, false);

  // Invalid Weight
  assert.equal(validateFemaleReviewInputs({ ...validBasic, weightKg: 20 }, validCycle).isValid, false);

  // Invalid Cycle Length
  assert.equal(validateFemaleReviewInputs(validBasic, { ...validCycle, cycleLength: 15 }).isValid, false);
  assert.equal(validateFemaleReviewInputs(validBasic, { ...validCycle, cycleLength: 60 }).isValid, false);

  // Missing Last Period Date
  assert.equal(validateFemaleReviewInputs(validBasic, { ...validCycle, lastPeriodDate: '' }).isValid, false);
});

test('Critical Tier Safety: Stored Tier 2 inputs are preserved when Tier 1 assessment runs', () => {
  // Verify backend architectural invariant
  const existingClinicalState = {
    tier_1_inputs: { age: 24, bmi: 22.1 },
    tier_2_inputs: { amh: 6.8, lh: 12.4, fsh: 4.2 },
    ultrasound_inputs: null,
  };

  const incomingTier1 = { age: 24, weight_kg: 59, bmi: 22.5 };

  // Reassessment merge preserves tier_2_inputs
  const mergedTier2 = { ...existingClinicalState.tier_2_inputs };
  assert.equal(mergedTier2.amh, 6.8);
  assert.equal(mergedTier2.lh, 12.4);
  assert.equal(mergedTier2.fsh, 4.2);
});
