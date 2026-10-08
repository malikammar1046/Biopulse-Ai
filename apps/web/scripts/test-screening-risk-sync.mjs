/**
 * apps/web/scripts/test-screening-risk-sync.mjs
 *
 * Verifies that getAuthoritativeAssessmentForPathway and selectAuthoritativeAssessment
 * strictly enforce BioPulse PCOS Screening Policy v2:
 * 1. Unified 0.25 operating threshold across Tier 1 and cumulative Tier 2.
 * 2. Validated 3-tier likelihood bands (< 0.18 Lower, 0.18 - < 0.25 Intermediate, >= 0.25 Higher).
 * 3. Exact unrounded boundary classification (0.2496 displays 25.0% but classifies Intermediate).
 * 4. Missing probability returns 'unavailable', never defaulting to 'lower'.
 * 5. Cumulative Tier 2 strictly overrides Tier 1 on main dashboard without competing cards.
 * 6. Male hypogonadism pathway remains fully preserved.
 */

import assert from 'node:assert';
import {
  getAuthoritativeAssessmentForPathway,
  selectAuthoritativeAssessment,
} from '../src/utils/authoritativeAssessmentSelector.ts';

console.log('🧪 Starting PCOS Screening Policy v2 & Authoritative Selector Tests...\n');

// -----------------------------------------------------------------------------
// Test 1: Exact Boundary Behavior
// -----------------------------------------------------------------------------
{
  console.log('Test 1: Exact boundary behavior for likelihood bands');

  // p = 0.1799 => Lower
  const res1799 = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_1799',
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: 0.1799,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(res1799.riskCategory, 'lower', 'p = 0.1799 must be lower (< 0.18)');
  assert.strictEqual(res1799.riskLabel, 'Lower Likelihood');

  // p = 0.1800 => Intermediate
  const res1800 = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_1800',
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: 0.1800,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(res1800.riskCategory, 'intermediate', 'p = 0.1800 must be intermediate (>= 0.18 and < 0.25)');
  assert.strictEqual(res1800.riskLabel, 'Intermediate Likelihood');

  // p = 0.2499 => Intermediate
  const res2499 = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_2499',
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: 0.2499,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(res2499.riskCategory, 'intermediate', 'p = 0.2499 must be intermediate (< 0.25)');
  assert.strictEqual(res2499.riskLabel, 'Intermediate Likelihood');

  // p = 0.2500 => Higher
  const res2500 = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_2500',
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: 0.2500,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(res2500.riskCategory, 'higher', 'p = 0.2500 must be higher (>= 0.25)');
  assert.strictEqual(res2500.riskLabel, 'Higher Likelihood');

  // p = 0.9000 => Higher
  const res9000 = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_9000',
      module: 'female_pcos',
      assessment_level: 'tier_1_2',
      probability: 0.9000,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(res9000.riskCategory, 'higher', 'p = 0.9000 must be higher (>= 0.25)');
  assert.strictEqual(res9000.riskLabel, 'Higher Likelihood');

  console.log('  ✅ PASSED: All boundary points [0.1799, 0.1800, 0.2499, 0.2500, 0.9000] classify strictly according to policy v2.');
}

// -----------------------------------------------------------------------------
// Test 2: Unrounded Probability Precision Before Classification
// -----------------------------------------------------------------------------
{
  console.log('Test 2: Probability precision (raw = 0.2496 displays 25.0% but classifies Intermediate)');

  const resPrec = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_prec',
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: 0.2496,
      has_assessment: true,
    },
    pathway: 'female',
  });

  assert.strictEqual(resPrec.probabilityPercent, 25.0, 'Display probability percent rounds to 25.0%');
  assert.strictEqual(
    resPrec.riskCategory,
    'intermediate',
    'Classification MUST remain intermediate because raw 0.2496 is strictly < 0.25'
  );
  assert.strictEqual(resPrec.riskLabel, 'Intermediate Likelihood');
  console.log('  ✅ PASSED: Display rounding does not bleed into categorization boundary.');
}

// -----------------------------------------------------------------------------
// Test 3: Missing Probability Safety
// -----------------------------------------------------------------------------
{
  console.log('Test 3: Missing probability safety (returns unavailable, never automatically lower)');

  // Case A: probability is null
  const resNullProb = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_null',
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: null,
      probability_percent: null,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(resNullProb.hasAssessment, false);
  assert.strictEqual(resNullProb.riskCategory, 'unavailable');
  assert.strictEqual(resNullProb.riskLabel, 'Assessment Unavailable');

  // Case B: activeAssessment is null
  const resNullActive = getAuthoritativeAssessmentForPathway({
    activeAssessment: null,
    pathway: 'female',
  });
  assert.strictEqual(resNullActive.hasAssessment, false);
  assert.strictEqual(resNullActive.riskCategory, 'unavailable');
  assert.strictEqual(resNullActive.riskLabel, 'Assessment Unavailable');

  console.log('  ✅ PASSED: Missing data safely produces unavailable state instead of false Lower diagnosis.');
}

// -----------------------------------------------------------------------------
// Test 4: Authoritative Cumulative Tier Precedence
// -----------------------------------------------------------------------------
{
  console.log('Test 4: Highest valid cumulative completed tier wins');

  const tier1Assessment = {
    id: 'asm_t1',
    module: 'female_pcos',
    assessment_level: 'tier_1',
    probability: 0.22,
    probability_percent: 22.0,
    created_at: '2026-09-01T10:00:00Z',
    has_assessment: true,
  };

  const tier2Assessment = {
    id: 'asm_t2',
    module: 'female_pcos',
    assessment_level: 'tier_1_2',
    probability: 0.31,
    probability_percent: 31.0,
    created_at: '2026-09-02T10:00:00Z',
    has_assessment: true,
  };

  // Case A: Only Tier 1 exists -> Tier 1 is authoritative
  const selectedOnlyT1 = selectAuthoritativeAssessment([tier1Assessment], 'female');
  assert.strictEqual(selectedOnlyT1?.id, 'asm_t1');
  assert.strictEqual(selectedOnlyT1?.assessment_level, 'tier_1');

  // Case B: Tier 1 + valid Tier 2 -> Cumulative Tier 2 wins
  const selectedWithT2 = selectAuthoritativeAssessment([tier1Assessment, tier2Assessment], 'female');
  assert.strictEqual(selectedWithT2?.id, 'asm_t2');
  assert.strictEqual(selectedWithT2?.assessment_level, 'tier_1_2');

  // Case C: Tier 2 is incomplete/invalid -> Tier 1 remains authoritative
  const incompleteT2 = {
    id: 'asm_t2_incomplete',
    module: 'female_pcos',
    assessment_level: 'tier_1_2',
    probability: null,
    has_assessment: false,
  };
  const selectedFallback = selectAuthoritativeAssessment([tier1Assessment, incompleteT2], 'female');
  assert.strictEqual(selectedFallback?.id, 'asm_t1');
  assert.strictEqual(selectedFallback?.assessment_level, 'tier_1');

  console.log('  ✅ PASSED: Cumulative Tier 2 cleanly overrides Tier 1, with fallback on invalid Tier 2.');
}

// -----------------------------------------------------------------------------
// Test 5: Male Hypogonadism Pathway Preservation
// -----------------------------------------------------------------------------
{
  console.log('Test 5: Male Hypogonadism calibrated cutoffs (18.08% / 10.0%) preserved');

  // Above 18.08%
  const maleHigh = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_high',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1',
      probability: 0.254,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(maleHigh.riskCategory, 'higher');
  assert.strictEqual(maleHigh.riskLabel, 'Higher Screening Risk');

  // Between 10.0% and 18.08%
  const maleInter = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_inter',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1',
      probability: 0.145,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(maleInter.riskCategory, 'intermediate');
  assert.strictEqual(maleInter.riskLabel, 'Intermediate Screening Risk');

  // Below 10.0%
  const maleLow = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_low',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1',
      probability: 0.072,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(maleLow.riskCategory, 'lower');
  assert.strictEqual(maleLow.riskLabel, 'Lower Screening Risk');

  console.log('  ✅ PASSED: Male Hypogonadism pathway operates with unchanged calibrated cutoffs.');
}

console.log('\n🎉 ALL 5 COMPREHENSIVE SCREENING POLICY V2 TESTS PASSED PERFECTLY!\n');
