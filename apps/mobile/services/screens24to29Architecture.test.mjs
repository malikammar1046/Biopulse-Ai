import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const resolveAppFile = (rel) => {
  if (fs.existsSync(path.resolve(rel))) return path.resolve(rel);
  return path.resolve('apps/mobile', rel);
};

const cycleFile = resolveAppFile('app/(app)/cycle-tracking.tsx');
const symptomFile = resolveAppFile('app/(app)/symptom-log.tsx');
const nutritionFile = resolveAppFile('app/(app)/nutrition.tsx');
const mealPlanFile = resolveAppFile('app/(app)/meal-plan.tsx');
const waterFile = resolveAppFile('app/(app)/water-log.tsx');
const movementFile = resolveAppFile('app/(app)/movement.tsx');

test('Screen 24: Cycle Tracking validates PCOS monitoring and calendar indicators', () => {
  const content = fs.readFileSync(cycleFile, 'utf8');

  // Verify headers and tabs
  assert.ok(content.includes('Cycle Tracking'), 'Header title must be Cycle Tracking');
  assert.ok(content.includes('Calendar'), 'Must have Calendar tab');
  assert.ok(content.includes('Insights'), 'Must have Insights tab');
  assert.ok(content.includes('History'), 'Must have History tab');

  // Verify PCOS focus and flow states
  assert.ok(content.includes('Cycle Day 14') || content.includes('currentCycleDay'), 'Must track current cycle day');
  assert.ok(content.includes('follicular phase') || content.includes('phase'), 'Must show cycle phase');
  assert.ok(content.includes('Next Period (Predicted)'), 'Must show predicted next period');
  assert.ok(content.includes('Light') && content.includes('Moderate') && content.includes('Heavy'), 'Must have flow options');
  assert.ok(content.includes('Save Update'), 'Must have Save Update CTA');
});

test('Screen 25: Symptom Log validates 9 PCOS symptoms and 3 intensity levels', () => {
  const content = fs.readFileSync(symptomFile, 'utf8');

  // 9 Required Symptoms
  const expectedSymptoms = [
    'Acne',
    'Hair growth',
    'Hair loss',
    'Bloating',
    'Mood',
    'Cramps',
    'Fatigue',
    'Skin darkening',
    'Irregular periods',
  ];
  for (const s of expectedSymptoms) {
    assert.ok(content.includes(s), `Must include symptom: ${s}`);
  }

  // Intensity levels
  assert.ok(content.includes('Mild'), 'Must have Mild intensity');
  assert.ok(content.includes('Moderate'), 'Must have Moderate intensity');
  assert.ok(content.includes('Severe'), 'Must have Severe intensity');

  // CTA
  assert.ok(content.includes('Save Check-in'), 'Must have Save Check-in CTA');
  assert.ok(content.includes('saveSymptomCheckIn'), 'Must call store saveSymptomCheckIn');
});

test('Screen 26: Nutrition Log validates macro breakdown and non-overwhelming logging', () => {
  const content = fs.readFileSync(nutritionFile, 'utf8');

  assert.ok(content.includes('Nutrition Log'), 'Must have Nutrition Log header');
  assert.ok(content.includes('Protein'), 'Must track Protein');
  assert.ok(content.includes('Carbs'), 'Must track Carbs');
  assert.ok(content.includes('Fats'), 'Must track Fats');
  assert.ok(content.includes('Meals Logged'), 'Must show Meals Logged section');
  assert.ok(content.includes('View Meal Plan'), 'Must include View Meal Plan CTA');
  assert.ok(content.includes('Add Meal'), 'Must include Add Meal CTA');
});

test('Screen 27: Meal Plan validates Pakistani/South Asian, Vegetarian, Low-Cost options', () => {
  const content = fs.readFileSync(mealPlanFile, 'utf8');

  assert.ok(content.includes('South Asian'), 'Must include South Asian / Pakistani cuisine filter');
  assert.ok(content.includes('Vegetarian'), 'Must include Vegetarian filter');
  assert.ok(content.includes('Low-cost'), 'Must include Low-cost filter');
  assert.ok(content.includes('Breakfast') && content.includes('Lunch') && content.includes('Dinner') && content.includes('Snacks'),
    'Must include 4 primary meal slots');
  assert.ok(content.includes('Personalized for your goals'), 'Must have personalization heading');
});

test('Screen 28: Water Log validates simple 1.6 / 2.5 L gauge and quick increments', () => {
  const content = fs.readFileSync(waterFile, 'utf8');

  assert.ok(content.includes('Water Log'), 'Must have Water Log header');
  assert.ok(content.includes('+ 250 ml') || content.includes('+250 ml'), 'Must include +250 ml quick button');
  assert.ok(content.includes('+ 500 ml') || content.includes('+500 ml'), 'Must include +500 ml quick button');
  assert.ok(content.includes('Daily Goal'), 'Must show Daily Goal');
  assert.ok(content.includes("Today's History"), 'Must show Today History list');
});

test('Screen 29: Exercise / Movement validates non-gym focus, weekly trends, and walking/strength/stretching', () => {
  const content = fs.readFileSync(movementFile, 'utf8');

  assert.ok(content.includes('Exercise & Movement'), 'Header must be Exercise & Movement');
  assert.ok(content.includes('Activity Time'), 'Must track Activity Time');
  assert.ok(content.includes('Steps'), 'Must track Steps');
  assert.ok(content.includes('Weekly Activity'), 'Must show Weekly Activity chart');
  assert.ok(content.includes('Walking'), 'Must recommend Walking');
  assert.ok(content.includes('Light Strength'), 'Must recommend Light Strength');
  assert.ok(content.includes('Stretching'), 'Must recommend Stretching');
  assert.ok(content.includes('insulin sensitivity'), 'Must focus on insulin sensitivity / PCOS health');
  assert.ok(content.includes('Log Activity'), 'Must have Log Activity CTA');
});
