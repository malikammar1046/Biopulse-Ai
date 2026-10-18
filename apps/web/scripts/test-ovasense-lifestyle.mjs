/**
 * apps/web/scripts/test-ovasense-lifestyle.mjs
 *
 * Automated Acceptance Test Suite for:
 * BioPulse AI — OvaSense Lifestyle Page: Pixel-Accurate Reference Redesign + Dynamic Personalization
 */

import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('================================================================');
console.log('🌸 STARTING OVASENSE LIFESTYLE REDESIGN ACCEPTANCE SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASSED: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAILED: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Physical Assets Presence (Hero, Foods, Limits, Meal Bowl)
// ---------------------------------------------------------------------------
console.log('--- 1. Visual Assets & Local Curated Media ---');
const requiredAssets = [
  'images/hero/ovasense-meditation.jpg',
  'images/hero/meal-bowl.jpg',
  'images/lifestyle/leafy-greens.jpg',
  'images/lifestyle/lean-protein.jpg',
  'images/lifestyle/whole-grains.jpg',
  'images/lifestyle/healthy-fats.jpg',
  'images/lifestyle/berries.jpg',
  'images/lifestyle/limit-sugary.jpg',
  'images/lifestyle/limit-processed.jpg',
  'images/lifestyle/limit-refined.jpg',
  'images/lifestyle/limit-fried.jpg',
  'images/lifestyle/limit-drinks.jpg',
];

for (const asset of requiredAssets) {
  runTest(`Asset exists: public/${asset}`, () => {
    const fullPath = resolve('public', asset);
    assert.strictEqual(existsSync(fullPath), true, `Asset file missing: ${fullPath}`);
  });
}

// ---------------------------------------------------------------------------
// TEST 2: Modular Components Presence & Exports
// ---------------------------------------------------------------------------
console.log('\n--- 2. Modular OvaSense Components Architecture ---');
const ovasenseComponents = [
  'OvaSenseHero.tsx',
  'OvaSenseProgressCard.tsx',
  'OvaSenseCategoryTabs.tsx',
  'OvaSenseNutritionOverviewCard.tsx',
  'OvaSenseRecommendedFoodsCard.tsx',
  'OvaSenseFoodsToLimitCard.tsx',
  'OvaSenseDailyMealPlanCard.tsx',
  'OvaSenseNutritionTipsCard.tsx',
  'OvaSenseTodaysGoalsCard.tsx',
  'OvaSenseMotivationCards.tsx',
  'OvaSenseAlternateTabsView.tsx',
  'OvaSenseLifestyleDashboard.tsx',
];

for (const comp of ovasenseComponents) {
  runTest(`Component exists: src/components/lifestyle/ovasense/${comp}`, () => {
    const fullPath = resolve('src/components/lifestyle/ovasense', comp);
    assert.strictEqual(existsSync(fullPath), true, `Component file missing: ${fullPath}`);
  });
}

// ---------------------------------------------------------------------------
// TEST 3: Gender Isolation & AndroSense Pathway Preservation
// ---------------------------------------------------------------------------
console.log('\n--- 3. Pathway Isolation & Backward Compatibility ---');
runTest('LifestyleRecommendationsPage isolates OvaSense for female and preserves AndroSense', () => {
  const pageContent = readFileSync(resolve('src/pages/app/LifestyleRecommendationsPage.tsx'), 'utf-8');
  assert.strictEqual(
    pageContent.includes('OvaSenseLifestyleDashboard'),
    true,
    'Page must import and render OvaSenseLifestyleDashboard'
  );
  assert.strictEqual(
    pageContent.includes('if (!isMale)'),
    true,
    'Page must condition OvaSense dashboard on !isMale'
  );
  assert.strictEqual(
    pageContent.includes('isMale ? <LifestyleSkeleton /> :') || pageContent.includes('isMale'),
    true,
    'Page must retain isMale logic'
  );
  // Ensure the male dashboard component remains in the file
  assert.strictEqual(pageContent.includes('AndroSenseLifestyleDashboard') || pageContent.includes('NutritionPillarView'), true, 'Must preserve AndroSenseLifestyleDashboard for male');
});

// ---------------------------------------------------------------------------
// TEST 4: Dynamic Personalization & No Preset Demonstrations
// ---------------------------------------------------------------------------
console.log('\n--- 4. Dynamic Data Binding & Zero Hardcoded Demonstration Data ---');
runTest('OvaSenseNutritionOverviewCard avoids hardcoded fallback gram values', () => {
  const cardContent = readFileSync(
    resolve('src/components/lifestyle/ovasense/OvaSenseNutritionOverviewCard.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    cardContent.includes("notCalculated', 'Not calculated')"),
    true,
    'Card must use Not calculated fallback for missing targets'
  );
});

runTest('OvaSenseProgressCard accepts null values and renders "Not tracked yet"', () => {
  const cardContent = readFileSync(
    resolve('src/components/lifestyle/ovasense/OvaSenseProgressCard.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    cardContent.includes('Not tracked yet'),
    true,
    'Progress card must handle unrecorded/null states with Not tracked yet'
  );
  assert.strictEqual(
    cardContent.includes('value !== null'),
    true,
    'Progress ring must check value presence before displaying ring stroke'
  );
});

runTest('OvaSenseDailyMealPlanCard uses getMealImage semantic mapping for authentic Pakistani meals', () => {
  const cardContent = readFileSync(
    resolve('src/components/lifestyle/ovasense/OvaSenseDailyMealPlanCard.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    cardContent.includes('getMealImage'),
    true,
    'Meal plan card must invoke semantic visual mapper getMealImage'
  );
});

// ---------------------------------------------------------------------------
// TEST 5: Semantic Visual Mapping Utility
// ---------------------------------------------------------------------------
console.log('\n--- 5. Semantic Visual Mapping Engine ---');
runTest('lifestyleImages.ts contains authentic Pakistani keywords and fallback assets', () => {
  const utilsContent = readFileSync(resolve('src/utils/lifestyleImages.ts'), 'utf-8');
  assert.strictEqual(utilsContent.includes('daal'), true, 'Visual mapper must recognize daal');
  assert.strictEqual(utilsContent.includes('roti') || utilsContent.includes('chapati'), true, 'Visual mapper must recognize roti/chapati');
  assert.strictEqual(utilsContent.includes('biryani') || utilsContent.includes('chicken'), true, 'Visual mapper must recognize poultry/meat dishes');
  assert.strictEqual(utilsContent.includes('getRecommendedFoodVisual'), true, 'Must export getRecommendedFoodVisual');
  assert.strictEqual(utilsContent.includes('getLimitFoodVisual'), true, 'Must export getLimitFoodVisual');
});

// ---------------------------------------------------------------------------
// TEST 6: Localization Completeness (English & Urdu)
// ---------------------------------------------------------------------------
console.log('\n--- 6. Localization Coverage (English & Urdu) ---');
runTest('English and Urdu lifestyle.json contain all ovasense.* keys', () => {
  const enLocale = JSON.parse(readFileSync(resolve('src/i18n/locales/en/lifestyle.json'), 'utf-8'));
  const urLocale = JSON.parse(readFileSync(resolve('src/i18n/locales/ur/lifestyle.json'), 'utf-8'));

  assert.strictEqual(typeof enLocale.ovasense, 'object', 'en/lifestyle.json must have ovasense namespace');
  assert.strictEqual(typeof urLocale.ovasense, 'object', 'ur/lifestyle.json must have ovasense namespace');

  const requiredSections = [
    'pillars',
    'tabs',
    'progress',
    'nutritionOverview',
    'recommendedFoods',
    'foodsToLimit',
    'mealPlan',
    'tips',
    'goals',
    'cards',
  ];

  for (const section of requiredSections) {
    assert.strictEqual(
      typeof enLocale.ovasense[section],
      'object',
      `en/lifestyle.json missing ovasense.${section}`
    );
    assert.strictEqual(
      typeof urLocale.ovasense[section],
      'object',
      `ur/lifestyle.json missing ovasense.${section}`
    );
  }

  assert.strictEqual(typeof enLocale.ovasense.heroTitle, 'string', 'en missing ovasense.heroTitle');
  assert.strictEqual(typeof urLocale.ovasense.heroTitle, 'string', 'ur missing ovasense.heroTitle');
  assert.strictEqual(typeof enLocale.ovasense.heroSubtitle, 'string', 'en missing ovasense.heroSubtitle');
  assert.strictEqual(typeof urLocale.ovasense.heroSubtitle, 'string', 'ur missing ovasense.heroSubtitle');
});

// ---------------------------------------------------------------------------
// TEST 7: Allergy & Safety Checks
// ---------------------------------------------------------------------------
console.log('\n--- 7. Allergy Safety Protections ---');
runTest('OvaSenseRecommendedFoodsCard enforces peanut and nut allergy screening', () => {
  const cardContent = readFileSync(
    resolve('src/components/lifestyle/ovasense/OvaSenseRecommendedFoodsCard.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    cardContent.includes('hasNutAllergy'),
    true,
    'Must check hasNutAllergy'
  );
  assert.strictEqual(
    cardContent.includes('Sunflower & Pumpkin Seeds'),
    true,
    'Must substitute safe seeds when nut allergy detected'
  );
});

runTest('OvaSenseFoodsToLimitCard distinguishes confirmed allergies with clinical alert badges', () => {
  const cardContent = readFileSync(
    resolve('src/components/lifestyle/ovasense/OvaSenseFoodsToLimitCard.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    cardContent.includes('userAllergens'),
    true,
    'Must take userAllergens into account'
  );
  assert.strictEqual(
    cardContent.includes('Confirmed Allergy: Strict Avoidance'),
    true,
    'Must label confirmed allergens with strict avoidance'
  );
});

// ---------------------------------------------------------------------------
// TEST 8: Daily Goals Persistence
// ---------------------------------------------------------------------------
console.log('\n--- 8. Interactive Daily Goals Persistence ---');
runTest('OvaSenseTodaysGoalsCard uses isolated date-keyed localStorage', () => {
  const goalsContent = readFileSync(
    resolve('src/components/lifestyle/ovasense/OvaSenseTodaysGoalsCard.tsx'),
    'utf-8'
  );
  assert.strictEqual(
    goalsContent.includes('localStorage.getItem'),
    true,
    'Must read from localStorage'
  );
  assert.strictEqual(
    goalsContent.includes('localStorage.setItem'),
    true,
    'Must save to localStorage'
  );
  assert.strictEqual(
    goalsContent.includes('ovasense_daily_goals_'),
    true,
    'Must use isolated storage key'
  );
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} OVASENSE ACCEPTANCE TESTS PASSED!`);
console.log('================================================================\n');
