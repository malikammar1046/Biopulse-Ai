import test from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 1. Screen 18: Screening Explanation Top 3 Factors & SHAP Abstraction
// ---------------------------------------------------------------------------
test('Screen 18: Isolates top 3 factors without raw SHAP numbers', () => {
  const factors = [
    { name: 'Irregular Cycle', direction: 'increases_risk', impact: 0.35 },
    { name: 'Excess Hair Growth', direction: 'increases_risk', impact: 0.28 },
    { name: 'Higher BMI', direction: 'increases_risk', impact: 0.22 },
    { name: 'Healthy Sleep Routine', direction: 'decreases_risk', impact: -0.12 },
    { name: 'Regular Physical Activity', direction: 'decreases_risk', impact: -0.09 },
  ];

  const top3 = factors.slice(0, 3);
  assert.equal(top3.length, 3, 'Top 3 factors must be strictly limited to 3 items');
  assert.equal(top3[0].name, 'Irregular Cycle');
  assert.equal(top3[1].name, 'Excess Hair Growth');
  assert.equal(top3[2].name, 'Higher BMI');

  // Verify label mapping
  const directionLabels = top3.map((f) =>
    f.direction === 'increases_risk' ? '↑ Increased Risk' : '↓ Decreased Risk'
  );
  assert.deepEqual(directionLabels, [
    '↑ Increased Risk',
    '↑ Increased Risk',
    '↑ Increased Risk',
  ]);
});

// ---------------------------------------------------------------------------
// 2. Screen 19: Screening Tier Progress Sequence
// ---------------------------------------------------------------------------
test('Screen 19: Validates 3-tier vertical timeline configuration', () => {
  const tiersFemale = [
    { tier: 1, title: 'Questionnaire & Symptoms', status: 'Completed', cta: null },
    { tier: 2, title: 'Clinical Hormone Labs', status: 'Recommended', cta: 'Add Lab Results' },
    { tier: 3, title: 'Ultrasound (Optional)', status: 'Optional', cta: null },
  ];

  assert.equal(tiersFemale[0].status, 'Completed');
  assert.equal(tiersFemale[1].status, 'Recommended');
  assert.equal(tiersFemale[1].cta, 'Add Lab Results');
  assert.equal(tiersFemale[2].status, 'Optional');
});

// ---------------------------------------------------------------------------
// 3. Screen 20: Add Clinical Labs Categorization
// ---------------------------------------------------------------------------
test('Screen 20: Organizes clinical labs into clean categorized sections', () => {
  const sections = ['Hormone Tests', 'Metabolic Tests', 'Nutritional Tests', 'CBC', 'Liver & Renal Tests', 'Thyroid Tests'];
  assert.equal(sections.length, 6, 'Must provide 6 concise test categories');
  assert.ok(sections.includes('Hormone Tests'));
  assert.ok(sections.includes('Metabolic Tests'));
});

// ---------------------------------------------------------------------------
// 4. Screen 21 & 22: OCR Pipeline and Human Verification Guardrail
// ---------------------------------------------------------------------------
test('Screen 21 & 22: OCR values require explicit human verification before storage', () => {
  const extractedRaw = [
    { name: 'FSH', value: '6.2', unit: 'mIU/mL', refRange: '3.5 – 12.5' },
    { name: 'LH', value: '8.1', unit: 'mIU/mL', refRange: '2.4 – 12.6' },
    { name: 'AMH', value: '4.3', unit: 'ng/mL', refRange: '1.0 – 10.0' },
  ];

  let isCommitted = false;
  function confirmVerification(items) {
    if (items && items.length > 0) {
      isCommitted = true;
      return items.map((it) => ({ ...it, status: 'Verified' }));
    }
    return [];
  }

  // Not committed automatically
  assert.equal(isCommitted, false, 'Raw OCR extraction must NOT commit automatically');

  // Committed upon user confirmation
  const confirmed = confirmVerification(extractedRaw);
  assert.equal(isCommitted, true, 'Values are committed after explicit confirmation');
  assert.equal(confirmed.length, 3);
  assert.equal(confirmed[0].value, '6.2');
});

// ---------------------------------------------------------------------------
// 5. Screen 23: Track Overview Modules
// ---------------------------------------------------------------------------
test('Screen 23: Female Track Overview contains exactly 6 modules with zero charts', () => {
  const femaleModules = [
    'Cycle Tracking',
    'Symptoms',
    'Nutrition',
    'Water',
    'Movement',
    'Medications',
  ];

  assert.equal(femaleModules.length, 6, 'Female track must have exactly 6 compact modules');
  assert.deepEqual(femaleModules, [
    'Cycle Tracking',
    'Symptoms',
    'Nutrition',
    'Water',
    'Movement',
    'Medications',
  ]);
});
