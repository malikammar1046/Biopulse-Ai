import test from 'node:test';
import assert from 'node:assert/strict';

// Canonical transformation logic matching assessmentService.ts
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

// Canonical reconciliation logic matching female-symptoms.tsx
function reconcileCycleStateOnToggle(id, isSelected, currentCycleHealth) {
  const next = { ...currentCycleHealth };
  if (id === 'irregular_periods') {
    next.regularity = !isSelected ? 'irregular' : 'regular';
  } else if (id === 'long_cycles') {
    next.cycleLength = !isSelected
      ? (currentCycleHealth.cycleLength > 35 ? currentCycleHealth.cycleLength : 36)
      : (currentCycleHealth.cycleLength > 35 ? 28 : currentCycleHealth.cycleLength);
  } else if (id === 'missed_periods') {
    next.missedPeriodsYear = !isSelected
      ? (currentCycleHealth.missedPeriodsYear !== '0' ? currentCycleHealth.missedPeriodsYear : '1-2')
      : '0';
  }
  return next;
}

test('Screen 11: Multi-select symptom toggle works correctly', () => {
  let selected = ['weight_gain', 'pimples_acne'];

  // Toggle on hirsutism
  if (!selected.includes('hirsutism')) {
    selected = [...selected, 'hirsutism'];
  }
  assert.deepEqual(selected, ['weight_gain', 'pimples_acne', 'hirsutism']);

  // Toggle off weight_gain
  selected = selected.filter((s) => s !== 'weight_gain');
  assert.deepEqual(selected, ['pimples_acne', 'hirsutism']);
});

test('Screen 11: Canonical Cycle Health Reconciliation guarantees zero contradictory state', () => {
  let cycleHealth = {
    regularity: 'regular',
    cycleLength: 28,
    missedPeriodsYear: '0',
  };

  // User selects 'irregular_periods' on Symptoms screen
  cycleHealth = reconcileCycleStateOnToggle('irregular_periods', false, cycleHealth);
  assert.equal(cycleHealth.regularity, 'irregular');

  // User unselects 'irregular_periods'
  cycleHealth = reconcileCycleStateOnToggle('irregular_periods', true, cycleHealth);
  assert.equal(cycleHealth.regularity, 'regular');

  // User selects 'long_cycles'
  cycleHealth = reconcileCycleStateOnToggle('long_cycles', false, cycleHealth);
  assert.ok(cycleHealth.cycleLength > 35, 'Long cycles must set cycle length > 35');
  assert.equal(cycleHealth.cycleLength, 36);

  // User unselects 'long_cycles'
  cycleHealth = reconcileCycleStateOnToggle('long_cycles', true, cycleHealth);
  assert.equal(cycleHealth.cycleLength, 28, 'Unselecting long cycles resets to standard 28 days');

  // User selects 'missed_periods'
  cycleHealth = reconcileCycleStateOnToggle('missed_periods', false, cycleHealth);
  assert.notEqual(cycleHealth.missedPeriodsYear, '0');

  // User unselects 'missed_periods'
  cycleHealth = reconcileCycleStateOnToggle('missed_periods', true, cycleHealth);
  assert.equal(cycleHealth.missedPeriodsYear, '0');
});

test('Screen 11: Critical Model Mapping binds ONLY supported ML features and isolates optional context', () => {
  const basicInfo = { age: 24, weightKg: 58, heightCm: 162, bmi: 22.1 };
  const cycleHealth = { regularity: 'irregular', cycleLength: 36 };
  const lifestyle = { fastFoodIntake: 'never', exerciseFrequency: '1-2_days' };

  // All 12 selectable symptoms from Screen 11 selected
  const allReportedSymptoms = [
    'weight_gain',
    'hirsutism',
    'skin_darkening',
    'hair_loss',
    'pimples_acne',
    'oily_skin',       // Optional context
    'irregular_periods',
    'long_cycles',
    'missed_periods',
    'bloating',        // Optional context
    'mood_changes',     // Optional context
    'fatigue',         // Optional context
  ];

  const mlPayload = buildFemaleTier1Inputs(basicInfo, cycleHealth, allReportedSymptoms, lifestyle);

  // Real ML features are properly bound as binary flags
  assert.equal(mlPayload.weight_gain, 1);
  assert.equal(mlPayload.hirsutism, 1);
  assert.equal(mlPayload.skin_darkening, 1);
  assert.equal(mlPayload.hair_loss, 1);
  assert.equal(mlPayload.pimples_acne, 1);
  assert.equal(mlPayload.cycle_regularity, 'irregular');
  assert.equal(mlPayload.cycle_length_raw, 36);

  // Verify that optional context symptoms are NOT added as arbitrary fields to ML payload
  assert.equal(mlPayload.oily_skin, undefined, 'oily_skin must not silently become an ML payload key');
  assert.equal(mlPayload.bloating, undefined, 'bloating must not silently become an ML payload key');
  assert.equal(mlPayload.mood_changes, undefined, 'mood_changes must not silently become an ML payload key');
  assert.equal(mlPayload.fatigue, undefined, 'fatigue must not silently become an ML payload key');
});

test('Screen 11: Legitimate reporting of zero symptoms is accepted without blocking', () => {
  const basicInfo = { age: 24, weightKg: 55, heightCm: 165, bmi: 20.2 };
  const cycleHealth = { regularity: 'regular', cycleLength: 28 };
  const lifestyle = { fastFoodIntake: 'never', exerciseFrequency: '3+_days' };

  // User legitimately reports zero symptoms
  const emptySymptoms = [];

  const mlPayload = buildFemaleTier1Inputs(basicInfo, cycleHealth, emptySymptoms, lifestyle);

  assert.equal(mlPayload.hirsutism, 0);
  assert.equal(mlPayload.weight_gain, 0);
  assert.equal(mlPayload.skin_darkening, 0);
  assert.equal(mlPayload.hair_loss, 0);
  assert.equal(mlPayload.pimples_acne, 0);
  assert.equal(mlPayload.cycle_regularity, 'regular');
});
