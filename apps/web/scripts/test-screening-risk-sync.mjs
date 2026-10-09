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
import { deriveMaleTier1InputsFromProfile } from '../src/utils/tier1InputMappers.ts';

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

  // Exact 10.6% test case from user prompt:
  const male106 = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_106',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1',
      probability: 0.106,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(male106.riskCategory, 'intermediate');
  assert.strictEqual(male106.riskLabel, 'Intermediate Screening Risk');
  assert.strictEqual(male106.probabilityPercent, 10.6);

  // Male Tier 2 threshold check (33.79%)
  const maleTier2Inter = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_t2_inter',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1_2',
      probability: 0.25,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(maleTier2Inter.riskCategory, 'intermediate');

  const maleTier2High = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_t2_high',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1_2',
      probability: 0.35,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(maleTier2High.riskCategory, 'higher');

  console.log('  ✅ PASSED: Male Hypogonadism pathway operates with unchanged calibrated cutoffs, including 10.6% -> intermediate.');
}

// -----------------------------------------------------------------------------
// Test 6: Legacy & Current PCOM Status Normalization and Fail-Safe Fallback
// -----------------------------------------------------------------------------
{
  console.log('Test 6: PCOM status normalization & safe fallback upon loading saved assessment');

  // Helper simulating the UI badge class resolution in AssessmentPage and ProgressiveAssessmentCard
  const getPcomBadgeStyle = (status) => {
    if (status === 'PCOM Detected') return 'detected';
    if (status === 'PCOM Not Detected') return 'not_detected';
    return 'indeterminate_or_safe_fallback';
  };

  // Case 6A: Current canonical detected
  const currentDetected = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_curr_det',
      module: 'female_pcos',
      assessment_level: 'tier_1_2_3',
      probability: 0.28,
      has_assessment: true,
      pcom_status: 'PCOM Detected',
      pcom_probability: 0.85,
    },
    pathway: 'female',
  });
  assert.strictEqual(currentDetected.pcomStatus, 'PCOM Detected');
  assert.strictEqual(currentDetected.probability, 0.28, 'Historical probability must remain unchanged');
  assert.strictEqual(getPcomBadgeStyle(currentDetected.pcomStatus), 'detected');

  // Case 6B: Legacy "PCOM Visible" -> normalizes to "PCOM Detected"
  const legacyVisible = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_leg_vis',
      module: 'female_pcos',
      assessment_level: 'tier_1_2_3',
      probability: 0.28,
      has_assessment: true,
      pcom_status: 'PCOM Visible',
      pcom_probability: 0.82,
    },
    pathway: 'female',
  });
  assert.strictEqual(legacyVisible.pcomStatus, 'PCOM Detected', 'Legacy "PCOM Visible" must normalize to "PCOM Detected"');
  assert.strictEqual(legacyVisible.probability, 0.28, 'Historical probability must remain unchanged');
  assert.strictEqual(legacyVisible.pcomProbability, 0.82, 'Historical PCOM probability must remain unchanged');
  assert.strictEqual(getPcomBadgeStyle(legacyVisible.pcomStatus), 'detected');

  // Case 6C: Current canonical not detected
  const currentNotDetected = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_curr_not_det',
      module: 'female_pcos',
      assessment_level: 'tier_1_2_3',
      probability: 0.12,
      has_assessment: true,
      pcom_status: 'PCOM Not Detected',
      pcom_probability: 0.15,
    },
    pathway: 'female',
  });
  assert.strictEqual(currentNotDetected.pcomStatus, 'PCOM Not Detected');
  assert.strictEqual(getPcomBadgeStyle(currentNotDetected.pcomStatus), 'not_detected');

  // Case 6D: Legacy "PCOM Not Visible" -> normalizes to "PCOM Not Detected"
  const legacyNotVisible = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_leg_not_vis',
      module: 'female_pcos',
      assessment_level: 'tier_1_2_3',
      probability: 0.12,
      has_assessment: true,
      pcom_status: 'PCOM Not Visible',
      pcom_probability: 0.14,
    },
    pathway: 'female',
  });
  assert.strictEqual(legacyNotVisible.pcomStatus, 'PCOM Not Detected', 'Legacy "PCOM Not Visible" must normalize to "PCOM Not Detected"');
  assert.strictEqual(legacyNotVisible.probability, 0.12, 'Historical probability must remain unchanged');
  assert.strictEqual(getPcomBadgeStyle(legacyNotVisible.pcomStatus), 'not_detected');

  // Case 6E: Genuine Indeterminate state preserved
  const genuineIndeterminate = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_indet',
      module: 'female_pcos',
      assessment_level: 'tier_1_2_3',
      probability: 0.18,
      has_assessment: true,
      pcom_status: 'Indeterminate',
      pcom_probability: 0.50,
    },
    pathway: 'female',
  });
  assert.strictEqual(genuineIndeterminate.pcomStatus, 'Indeterminate', 'Genuine Indeterminate state must be preserved');
  assert.strictEqual(getPcomBadgeStyle(genuineIndeterminate.pcomStatus), 'indeterminate_or_safe_fallback');

  // Case 6F: Unexpected / unmapped legacy value fails safely to Indeterminate (NEVER negative)
  const unexpectedStatuses = ['PCOM Ambiguous', 'Unknown Finding', 'Malformed Status', 'Corrupted_123'];
  for (const raw of unexpectedStatuses) {
    const unexpRes = getAuthoritativeAssessmentForPathway({
      activeAssessment: {
        id: `asm_unexp_${raw}`,
        module: 'female_pcos',
        assessment_level: 'tier_1_2_3',
        probability: 0.20,
        has_assessment: true,
        pcom_status: raw,
      },
      pathway: 'female',
    });
    assert.strictEqual(
      unexpRes.pcomStatus,
      'Indeterminate',
      `Unexpected status "${raw}" must fail safely to "Indeterminate"`
    );
    assert.notStrictEqual(
      unexpRes.pcomStatus,
      'PCOM Not Detected',
      `Unexpected status "${raw}" must NEVER fail to negative (PCOM Not Detected)`
    );
    assert.strictEqual(
      getPcomBadgeStyle(unexpRes.pcomStatus),
      'indeterminate_or_safe_fallback',
      `Unexpected status "${raw}" UI display must be amber warning, never emerald negative`
    );
  }

  // Case 6G: Missing / null / undefined PCOM status
  const missingPcom = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_t1_only',
      module: 'female_pcos',
      assessment_level: 'tier_1',
      probability: 0.15,
      has_assessment: true,
      pcom_status: null,
    },
    pathway: 'female',
  });
  assert.strictEqual(missingPcom.pcomStatus, null, 'Missing PCOM status must remain null');

  console.log('  ✅ PASSED: Current and legacy PCOM statuses normalize correctly; unexpected values fail safely to Indeterminate.');
}

// -----------------------------------------------------------------------------
// Test 7: Male Age Null-Safety & Prevention of Stale Historical Resurrection
// -----------------------------------------------------------------------------
{
  console.log('Test 7: Male age null-safety & prevention of stale historical resurrection');

  // Case 7A: deriveMaleTier1InputsFromProfile emits null age when DOB is missing (never fabricates 35)
  const profileNoDob = {
    heightCm: 180,
    weightKg: 80,
  };
  const inputsNoDob = deriveMaleTier1InputsFromProfile(profileNoDob);
  assert.strictEqual(inputsNoDob.age, null, 'deriveMaleTier1InputsFromProfile must NOT default missing DOB to 35');

  // Case 7B: When active assessment is unavailable, older candidates with valid probabilities must NOT overwrite it
  const activeUnavailable = {
    id: 'asm_active_unavail',
    module: 'male_hypogonadism',
    assessment_level: 'tier_1',
    probability: null,
    risk_category: 'unavailable',
    risk_label: 'Assessment Unavailable',
    has_assessment: false,
    summary_text: 'Age is required for male hypogonadism screening.',
  };

  const olderCandidateWithProb = {
    id: 'asm_older_candidate',
    module: 'male_hypogonadism',
    assessment_level: 'tier_1',
    probability: 0.22,
    risk_category: 'higher',
    risk_label: 'Higher Screening Risk',
    has_assessment: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  const resUnavail = getAuthoritativeAssessmentForPathway({
    activeAssessment: activeUnavailable,
    candidateAssessments: [olderCandidateWithProb],
    pathway: 'male',
  });

  assert.strictEqual(resUnavail.riskCategory, 'unavailable', 'Active unavailable assessment must not be replaced by older candidate');
  assert.strictEqual(resUnavail.probability, null, 'Active unavailable probability must remain null');
  assert.strictEqual(resUnavail.riskLabel, 'Assessment Unavailable');
  assert.strictEqual(resUnavail.hasAssessment, false);

  // Case 7C: A genuinely new valid assessment CAN become authoritative over an older result
  const newValidAssessment = {
    id: 'asm_new_valid',
    module: 'male_hypogonadism',
    assessment_level: 'tier_1',
    probability: 0.145,
    risk_category: 'intermediate',
    risk_label: 'Intermediate Screening Risk',
    has_assessment: true,
    created_at: '2026-03-01T00:00:00Z',
  };

  const resNewValid = getAuthoritativeAssessmentForPathway({
    activeAssessment: newValidAssessment,
    candidateAssessments: [olderCandidateWithProb],
    pathway: 'male',
  });

  assert.strictEqual(resNewValid.riskCategory, 'intermediate', 'Genuinely new valid assessment becomes authoritative');
  assert.strictEqual(resNewValid.probability, 0.145);
  assert.strictEqual(resNewValid.assessmentId, 'asm_new_valid');
  assert.strictEqual(resNewValid.hasAssessment, true);

  console.log('  ✅ PASSED: Male missing age emits null, active unavailable assessments never resurrect stale historical candidates, and genuinely new valid assessments become authoritative.');
}

console.log('\n🎉 ALL 7 COMPREHENSIVE SCREENING POLICY & STATUS TESTS PASSED PERFECTLY!\n');
