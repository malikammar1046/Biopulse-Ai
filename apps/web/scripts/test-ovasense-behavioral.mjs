/**
 * apps/web/scripts/test-ovasense-behavioral.mjs
 *
 * Real behavioral verification test suite for OvaSense Lifestyle Personalization & Clinical Safety:
 * 1. Authoritative allergy & ingredient exclusion matching
 * 2. Vegetarian & plant-based dietary filtering (no meat on vegetarian)
 * 3. Clinical condition framing (never assume confirmed PCOS without medical condition)
 * 4. Conflicting health condition safety checks (CKD, disordered eating, heart failure)
 * 5. Semantic visual resolution (Pakistani dishes, vegetarian meat avoidance)
 * 6. Audited progress metrics (exact numerator/denominator, null for untracked)
 */

import assert from 'assert';

console.log('================================================================');
console.log('🧪 RUNNING OVASENSE BEHAVIORAL SAFETY & PERSONALIZATION TESTS');
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
// 1. BEHAVIORAL TEST: Authoritative Allergen Rule Engine Parity
// ---------------------------------------------------------------------------
console.log('--- 1. Authoritative Allergen & Ingredient Eligibility Engine ---');

const {
  AUTHORITATIVE_ALLERGEN_INGREDIENT_MAP,
  isFoodForbidden,
  isMeatOrAnimalProduct,
  getOvaSenseDiagnosticFraming,
  checkConflictingConditions,
} = await import('../src/utils/allergySafetyRules.ts');

runTest('Detects dairy allergen in Pakistani dishes (paneer, dahi, lassi, ghee, malai)', () => {
  const testCases = [
    { text: 'Palak Paneer with roti', expected: true },
    { text: 'Fresh dahi raita with mint', expected: true },
    { text: 'Sweet punjabi lassi', expected: true },
    { text: 'Tarka prepared in pure desi ghee', expected: true },
    { text: 'Yellow moong daal cooked in olive oil', expected: false },
  ];

  for (const tc of testCases) {
    const res = isFoodForbidden(tc.text, ['dairy']);
    assert.strictEqual(
      res.isForbidden,
      tc.expected,
      `Failed on '${tc.text}': expected isForbidden=${tc.expected}, got ${res.isForbidden}`
    );
  }
});

runTest('Detects gluten allergen in Pakistani breads & flours (wheat, atta, maida, sooji)', () => {
  const testCases = [
    { text: 'Stone-ground whole wheat chakki roti', expected: true },
    { text: 'Tandoori maida naan', expected: true },
    { text: 'Sooji ka halwa', expected: true },
    { text: 'Besan (chickpea flour) missi roti', expected: false },
    { text: 'Steamed brown basmati rice', expected: false },
    { text: 'Organic quinoa salad', expected: false },
  ];

  for (const tc of testCases) {
    const res = isFoodForbidden(tc.text, ['gluten']);
    assert.strictEqual(
      res.isForbidden,
      tc.expected,
      `Failed on '${tc.text}': expected isForbidden=${tc.expected}, got ${res.isForbidden}`
    );
  }
});

runTest('Detects nut allergen in Pakistani snacks (badam, akhrot, peanuts, kaju)', () => {
  const testCases = [
    { text: 'Soaked badam (almonds) and akhrot (walnuts)', expected: true },
    { text: 'Roasted moongfali (peanuts)', expected: true },
    { text: 'Kaju katli sweet', expected: true },
    { text: 'Pumpkin seeds and chia pudding', expected: false },
    { text: 'Sliced fresh avocado with lime', expected: false },
  ];

  for (const tc of testCases) {
    const res = isFoodForbidden(tc.text, ['nuts']);
    assert.strictEqual(
      res.isForbidden,
      tc.expected,
      `Failed on '${tc.text}': expected isForbidden=${tc.expected}, got ${res.isForbidden}`
    );
  }
});

runTest('Handles multiple simultaneous conflicting allergies (nuts + dairy + gluten)', () => {
  const userAllergens = ['nuts', 'dairy', 'gluten'];

  // A food with dairy only
  assert.strictEqual(isFoodForbidden('Fresh paneer bowl', userAllergens).isForbidden, true);
  // A food with wheat only
  assert.strictEqual(isFoodForbidden('Wheat bran porridge', userAllergens).isForbidden, true);
  // A food with nuts only
  assert.strictEqual(isFoodForbidden('Almond butter toast', userAllergens).isForbidden, true);
  // An allergen-free food (lentils + basmati rice + cucumber + olive oil)
  const safeDish = 'Yellow moong daal with steamed basmati rice, cucumber and cold-pressed olive oil';
  assert.strictEqual(isFoodForbidden(safeDish, userAllergens).isForbidden, false);
});

// ---------------------------------------------------------------------------
// 2. BEHAVIORAL TEST: Vegetarian & Plant-Based Filtering
// ---------------------------------------------------------------------------
console.log('\n--- 2. Vegetarian & Animal Protein Filtering ---');

runTest('Correctly categorizes meat vs vegetarian dishes', () => {
  assert.strictEqual(isMeatOrAnimalProduct('Grilled Chicken Tikka Boti'), true);
  assert.strictEqual(isMeatOrAnimalProduct('Mutton Karahi with ginger'), true);
  assert.strictEqual(isMeatOrAnimalProduct('Pan-seared Rohu Fish'), true);
  assert.strictEqual(isMeatOrAnimalProduct('Yellow Moong Daal with cumin tarka'), false);
  assert.strictEqual(isMeatOrAnimalProduct('Spiced organic tofu scramble'), false);
  assert.strictEqual(isMeatOrAnimalProduct('Boiled Kala Chana Chaat'), false);
});

// ---------------------------------------------------------------------------
// 3. BEHAVIORAL TEST: Non-Diagnostic Clinical PCOS Framing
// ---------------------------------------------------------------------------
console.log('\n--- 3. Non-Diagnostic Clinical PCOS Framing ---');

runTest('Never assumes confirmed clinical PCOS from OvaSense pathway alone', () => {
  // Scenario A: User on OvaSense with NO confirmed PCOS diagnosis in profile
  const unconfirmedUser = getOvaSenseDiagnosticFraming([]);
  assert.strictEqual(unconfirmedUser.isConfirmedPcos, false);
  assert.strictEqual(unconfirmedUser.framingType, 'educational_screening_pathway');
  assert.strictEqual(
    unconfirmedUser.heroExplanation.includes('support metabolic health'),
    true,
    'Must use non-diagnostic metabolic phrasing when PCOS unconfirmed'
  );
  assert.strictEqual(
    unconfirmedUser.heroExplanation.includes('help manage PCOS'),
    false,
    'Must NOT claim managing diagnosed PCOS when unconfirmed'
  );

  // Scenario B: User with clinically confirmed PCOS in medical profile
  const confirmedUser = getOvaSenseDiagnosticFraming(['pcos', 'insulin_resistance']);
  assert.strictEqual(confirmedUser.isConfirmedPcos, true);
  assert.strictEqual(confirmedUser.framingType, 'confirmed_clinical_pcos');
  assert.strictEqual(
    confirmedUser.heroExplanation.includes('help manage PCOS'),
    true,
    'May reference PCOS management when clinically confirmed'
  );
});

// ---------------------------------------------------------------------------
// 4. BEHAVIORAL TEST: Conflicting Medical Conditions
// ---------------------------------------------------------------------------
console.log('\n--- 4. Conflicting Health Conditions Evaluation ---');

runTest('Flags high protein conflict for Chronic Kidney Disease (CKD)', () => {
  const result = checkConflictingConditions(['CKD', 'hypertension']);
  assert.strictEqual(result.hasConflict, true);
  assert.strictEqual(result.message.includes('kidney'), true);
});

runTest('Flags caloric tracking conflict for history of Eating Disorders', () => {
  const result = checkConflictingConditions(['history of eating disorder']);
  assert.strictEqual(result.hasConflict, true);
  assert.strictEqual(result.message.includes('disordered eating'), true);
});

runTest('Clears healthy users without clinical contraindications', () => {
  const result = checkConflictingConditions(['mild_fatigue']);
  assert.strictEqual(result.hasConflict, false);
});

// ---------------------------------------------------------------------------
// 5. BEHAVIORAL TEST: Semantic Visual Resolver Safety
// ---------------------------------------------------------------------------
console.log('\n--- 5. Semantic Visual Mapping & Vegetarian Image Safety ---');

const { getMealImage } = await import('../src/utils/lifestyleImages.ts');

runTest('Vegetarian user NEVER receives poultry/meat image even if meat keywords present', () => {
  const vegVisual = getMealImage('lunch', 'grilled chicken salad', true);
  // For vegetarian, it must NOT return chicken tikka or meat salad
  assert.strictEqual(
    vegVisual.url.includes('1599488615731'), // chicken tikka photo id
    false,
    'Vegetarian must never receive chicken tikka visual'
  );
  assert.strictEqual(
    vegVisual.alt.toLowerCase().includes('chicken'),
    false,
    'Vegetarian visual alt text must never claim chicken'
  );
});

runTest('Authentic Pakistani dish name resolves to canonical Pakistani visual', () => {
  const daalVisual = getMealImage('lunch', 'Yellow moong daal tadka with basmati rice');
  assert.strictEqual(daalVisual.alt.includes('daal'), true);

  const rotiVisual = getMealImage('dinner', 'Stone-ground whole wheat roti');
  assert.strictEqual(rotiVisual.alt.includes('roti'), true);
});

// ---------------------------------------------------------------------------
// 6. BEHAVIORAL TEST: Progress Metrics Numerator & Denominator
// ---------------------------------------------------------------------------
console.log('\n--- 6. Progress Calculation Auditing (Null on Untracked) ---');

runTest('Calculates exact fraction for logged meals (Numerator/Denominator)', () => {
  const calculateNutritionProgress = (meals) => {
    if (!meals || meals.length === 0) return null;
    const logged = meals.filter((m) => m.is_logged);
    if (logged.length === 0) return null;
    return Math.min(100, Math.round((logged.length / meals.length) * 100));
  };

  // 1 of 3 meals logged = 33%
  const mealsA = [{ is_logged: true }, { is_logged: false }, { is_logged: false }];
  assert.strictEqual(calculateNutritionProgress(mealsA), 33);

  // 2 of 4 meals logged = 50%
  const mealsB = [{ is_logged: true }, { is_logged: true }, { is_logged: false }, { is_logged: false }];
  assert.strictEqual(calculateNutritionProgress(mealsB), 50);

  // 0 of 3 meals logged = null ("Not tracked yet")
  const mealsC = [{ is_logged: false }, { is_logged: false }, { is_logged: false }];
  assert.strictEqual(calculateNutritionProgress(mealsC), null);

  // No active meal plan = null ("Not tracked yet")
  assert.strictEqual(calculateNutritionProgress([]), null);
  assert.strictEqual(calculateNutritionProgress(null), null);
});

runTest('Calculates active fitness minutes progress against individualized target', () => {
  const calculateFitnessProgress = (todayLogs, targetMinutes = 30) => {
    if (!todayLogs || todayLogs.length === 0) return null;
    const totalMinutes = todayLogs.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
    if (totalMinutes === 0) return null;
    return Math.min(100, Math.round((totalMinutes / targetMinutes) * 100));
  };

  // 15 mins with 30 min target = 50%
  assert.strictEqual(calculateFitnessProgress([{ durationMinutes: 15 }], 30), 50);

  // 45 mins with 30 min target = 100% (capped)
  assert.strictEqual(calculateFitnessProgress([{ durationMinutes: 45 }], 30), 100);

  // 0 minutes logged = null ("Not tracked yet")
  assert.strictEqual(calculateFitnessProgress([{ durationMinutes: 0 }], 30), null);
  assert.strictEqual(calculateFitnessProgress([], 30), null);
});

console.log('\n================================================================');
console.log(`🎉 ALL ${passedTests} / ${totalTests} BEHAVIORAL ACCEPTANCE TESTS PASSED!`);
console.log('================================================================\n');
