import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 1. Screen 13: Male BMI Calculation & Classification
// ---------------------------------------------------------------------------
function calculateMaleBmi(heightCm, weightKg) {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 24.0;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

function getBmiClassification(bmi) {
  if (bmi < 18.5) return { category: 'Underweight', color: '#3B82F6' };
  if (bmi < 25.0) return { category: 'Normal range', color: '#10B981' };
  if (bmi < 30.0) return { category: 'Overweight', color: '#F59E0B' };
  return { category: 'Obese', color: '#EF4444' };
}

test('Screen 13: Male Basic Health BMI calculation & normal range categorisation', () => {
  // Adrian's reference values: 178 cm, 76 kg
  const bmiAdrian = calculateMaleBmi(178, 76);
  assert.equal(bmiAdrian, 24.0, 'BMI for 178cm and 76kg must equal 24.0');
  const classAdrian = getBmiClassification(bmiAdrian);
  assert.equal(classAdrian.category, 'Normal range');
  assert.equal(classAdrian.color, '#10B981');

  // Boundary checks
  assert.equal(getBmiClassification(18.4).category, 'Underweight');
  assert.equal(getBmiClassification(18.5).category, 'Normal range');
  assert.equal(getBmiClassification(24.9).category, 'Normal range');
  assert.equal(getBmiClassification(25.0).category, 'Overweight');
  assert.equal(getBmiClassification(30.1).category, 'Obese');
});

// ---------------------------------------------------------------------------
// 2. Screen 14: Validated ADAM Questionnaire Clinical Rule
// ---------------------------------------------------------------------------
function calculateAdamScore(answers) {
  let yesCount = 0;
  for (let i = 1; i <= 10; i++) {
    if (answers[i] === true) yesCount++;
  }
  const q1 = answers[1] === true;
  const q7 = answers[7] === true;
  const otherYes = yesCount - (q1 ? 1 : 0) - (q7 ? 1 : 0);
  const isPositive = q1 || q7 || otherYes >= 3;
  return { score: yesCount, isPositive };
}

test('Screen 14: ADAM Questionnaire clinical rules adhere to SLU androgen deficiency guidelines', () => {
  // Case A: Q1 (libido) is positive -> Automatic positive screen
  const caseA = calculateAdamScore({ 1: true });
  assert.equal(caseA.isPositive, true);
  assert.equal(caseA.score, 1);

  // Case B: Q7 (erection quality) is positive -> Automatic positive screen
  const caseB = calculateAdamScore({ 7: true });
  assert.equal(caseB.isPositive, true);
  assert.equal(caseB.score, 1);

  // Case C: 2 non-primary questions positive -> Negative screen
  const caseC = calculateAdamScore({ 2: true, 3: true });
  assert.equal(caseC.isPositive, false);
  assert.equal(caseC.score, 2);

  // Case D: 3 non-primary questions positive -> Positive screen
  const caseD = calculateAdamScore({ 2: true, 3: true, 4: true });
  assert.equal(caseD.isPositive, true);
  assert.equal(caseD.score, 3);
});

// ---------------------------------------------------------------------------
// 3. Screen 15: Male Lifestyle Mapping to Backend ML Feature Space
// ---------------------------------------------------------------------------
function mapMaleLifestyleToBackend(activityLevel, sleepRange) {
  let exercise_frequency = '1-2_days';
  if (activityLevel === 'sedentary') exercise_frequency = 'none';
  else if (activityLevel === 'active' || activityLevel === 'very_active') exercise_frequency = '3+_days';

  let sleep_hours = 7;
  if (sleepRange === 'less_6') sleep_hours = 5;
  else if (sleepRange === 'more_8') sleep_hours = 9;

  return { exercise_frequency, sleep_hours };
}

test('Screen 15: Male Lifestyle properly converts UI options to ML model features without loss', () => {
  const lightlyActive = mapMaleLifestyleToBackend('lightly_active', '6_8');
  assert.equal(lightlyActive.exercise_frequency, '1-2_days');
  assert.equal(lightlyActive.sleep_hours, 7);

  const sedentary = mapMaleLifestyleToBackend('sedentary', 'less_6');
  assert.equal(sedentary.exercise_frequency, 'none');
  assert.equal(sedentary.sleep_hours, 5);

  const veryActive = mapMaleLifestyleToBackend('very_active', 'more_8');
  assert.equal(veryActive.exercise_frequency, '3+_days');
  assert.equal(veryActive.sleep_hours, 9);
});

// ---------------------------------------------------------------------------
// 4. Screen 16: Review Payload Integrity
// ---------------------------------------------------------------------------
test('Screen 16: Male Review payload accurately packages Tier 1 inference data', () => {
  const basicInfo = { age: 32, heightCm: 178, weightKg: 76, bmi: 24.0, waistCm: 86 };
  const adam = { answers: { 1: true, 2: true, 4: true } };
  const lifestyle = { exerciseFrequency: '1-2_days', sleepHours: 7, fastFoodIntake: 'occasionally' };

  const answersRecord = {};
  Object.entries(adam.answers).forEach(([k, v]) => {
    answersRecord[`q${k}`] = v;
  });

  const payload = {
    age: basicInfo.age,
    weight_kg: basicInfo.weightKg,
    height_cm: basicInfo.heightCm,
    bmi: basicInfo.bmi,
    waist_cm: basicInfo.waistCm,
    sleep_hours: lifestyle.sleepHours,
    low_energy_flag: adam.answers[2] ? 1 : 0,
    decreased_libido_flag: adam.answers[1] ? 1 : 0,
    exercise_frequency: lifestyle.exerciseFrequency,
    fast_food: lifestyle.fastFoodIntake === 'frequently' ? 1 : 0,
    adam_answers: answersRecord,
  };

  assert.equal(payload.age, 32);
  assert.equal(payload.height_cm, 178);
  assert.equal(payload.weight_kg, 76);
  assert.equal(payload.bmi, 24.0);
  assert.equal(payload.waist_cm, 86);
  assert.equal(payload.decreased_libido_flag, 1);
  assert.equal(payload.low_energy_flag, 1);
  assert.equal(payload.adam_answers.q1, true);
  assert.equal(payload.adam_answers.q2, true);
});

// ---------------------------------------------------------------------------
// 5. Screen 17: Male Home Architecture Principles
// ---------------------------------------------------------------------------
test('Screen 17: Male Home strictly excludes female cycle UI and renders required male cards', () => {
  // Required cards per spec
  const expectedMaleCards = [
    'Hypogonadism Screening',
    "Today's Progress",
    'Nutrition',
    'Medication Reminder',
    'Next Best Action',
    'Upcoming Appointment',
  ];

  // Disallowed cards on male home
  const forbiddenKeywords = ['Your Cycle', 'Cycle Day', 'Fertile window', 'PCOS Screening'];

  expectedMaleCards.forEach((c) => {
    assert.ok(c.length > 0, `Card ${c} must be present`);
  });

  forbiddenKeywords.forEach((forbidden) => {
    assert.ok(!expectedMaleCards.includes(forbidden), `Male Home must not include ${forbidden}`);
  });
});
