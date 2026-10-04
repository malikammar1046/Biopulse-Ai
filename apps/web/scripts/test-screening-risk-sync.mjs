/**
 * apps/web/scripts/test-screening-risk-sync.mjs
 *
 * Verifies that getAuthoritativeAssessmentForPathway authoritatively synchronizes
 * probability scores with calibrated clinical cutoffs, eliminating any desync
 * between Screening Workspace and Dashboard Overview cards.
 */

import assert from 'node:assert';
import { getAuthoritativeAssessmentForPathway } from '../src/utils/authoritativeAssessmentSelector.ts';

console.log('🧪 Starting Screening Risk Synchronization & Cutoff Tests...\n');

// -----------------------------------------------------------------------------
// Test 1: 46.6% Female Tier 1 Assessment (User Image 1 vs Image 2 Case)
// -----------------------------------------------------------------------------
{
  console.log('Test 1: 46.6% Female Tier 1 is classified strictly as Higher Screening Risk');

  const assessment = {
    id: 'asm_female_466',
    module: 'female_pcos',
    assessment_level: 'tier_1',
    probability_percent: 46.6,
    // Stale or legacy risk_label / risk_category must NOT override the genuine 46.6% probability!
    risk_label: 'Lower Screening Risk',
    risk_category: 'lower',
    has_assessment: true,
    threshold: 0.38,
  };

  const result = getAuthoritativeAssessmentForPathway({
    activeAssessment: assessment,
    pathway: 'female',
  });

  assert.strictEqual(result.probabilityPercent, 46.6, 'Probability percent should be preserved as 46.6');
  assert.strictEqual(result.riskCategory, 'higher', 'Risk category should be "higher" since 46.6% >= 38%');
  assert.strictEqual(result.riskLabel, 'Higher Screening Risk', 'Risk label should be "Higher Screening Risk"');
  console.log('  ✅ PASSED: 46.6% Female Tier 1 correctly classified as Higher Screening Risk.');
}

// -----------------------------------------------------------------------------
// Test 2: Intermediate Screening Risk (28% Female Tier 1)
// -----------------------------------------------------------------------------
{
  console.log('Test 2: 28% Female Tier 1 is classified as Intermediate Screening Risk');

  const assessment = {
    id: 'asm_female_28',
    module: 'female_pcos',
    assessment_level: 'tier_1',
    probability_percent: 28,
    has_assessment: true,
    threshold: 0.38,
  };

  const result = getAuthoritativeAssessmentForPathway({
    activeAssessment: assessment,
    pathway: 'female',
  });

  assert.strictEqual(result.probabilityPercent, 28);
  assert.strictEqual(result.riskCategory, 'intermediate', 'Risk category should be intermediate (20% - 38%)');
  assert.strictEqual(result.riskLabel, 'Intermediate Screening Risk');
  console.log('  ✅ PASSED: 28% Female Tier 1 correctly classified as Intermediate Screening Risk.');
}

// -----------------------------------------------------------------------------
// Test 3: Lower Screening Risk (14% Female Tier 1)
// -----------------------------------------------------------------------------
{
  console.log('Test 3: 14% Female Tier 1 is classified as Lower Screening Risk');

  const assessment = {
    id: 'asm_female_14',
    module: 'female_pcos',
    assessment_level: 'tier_1',
    probability_percent: 14,
    has_assessment: true,
    threshold: 0.38,
  };

  const result = getAuthoritativeAssessmentForPathway({
    activeAssessment: assessment,
    pathway: 'female',
  });

  assert.strictEqual(result.probabilityPercent, 14);
  assert.strictEqual(result.riskCategory, 'lower', 'Risk category should be lower (< 20%)');
  assert.strictEqual(result.riskLabel, 'Lower Screening Risk');
  console.log('  ✅ PASSED: 14% Female Tier 1 correctly classified as Lower Screening Risk.');
}

// -----------------------------------------------------------------------------
// Test 4: Female Tier 2 / Tier 3 Cutoffs (18% Low, 29% High)
// -----------------------------------------------------------------------------
{
  console.log('Test 4: Female Tier 2 / 3 cutoffs properly applied');

  // Case A: 32% (>= 29%)
  const tier2High = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_tier2_high',
      module: 'female_pcos',
      assessment_level: 'tier_1_2',
      probability_percent: 32,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(tier2High.riskCategory, 'higher');
  assert.strictEqual(tier2High.riskLabel, 'Higher Screening Risk');

  // Case B: 24% (18% - 29%)
  const tier2Inter = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_tier2_inter',
      module: 'female_pcos',
      assessment_level: 'tier_1_2_3',
      probability_percent: 24,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(tier2Inter.riskCategory, 'intermediate');
  assert.strictEqual(tier2Inter.riskLabel, 'Intermediate Screening Risk');

  // Case C: 12% (< 18%)
  const tier2Low = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_tier2_low',
      module: 'female_pcos',
      assessment_level: 'tier_1_3',
      probability_percent: 12,
      has_assessment: true,
    },
    pathway: 'female',
  });
  assert.strictEqual(tier2Low.riskCategory, 'lower');
  assert.strictEqual(tier2Low.riskLabel, 'Lower Screening Risk');

  console.log('  ✅ PASSED: Female Tier 2 / 3 cutoffs applied cleanly.');
}

// -----------------------------------------------------------------------------
// Test 5: Male Hypogonadism Cutoffs (18.08% High Cutoff)
// -----------------------------------------------------------------------------
{
  console.log('Test 5: Male Hypogonadism calibrated cutoffs (18.08%) applied');

  // Above 18.08%
  const maleHigh = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_high',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1',
      probability_percent: 25.4,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(maleHigh.riskCategory, 'higher');
  assert.strictEqual(maleHigh.riskLabel, 'Higher Screening Risk');

  // Below 10%
  const maleLow = getAuthoritativeAssessmentForPathway({
    activeAssessment: {
      id: 'asm_male_low',
      module: 'male_hypogonadism',
      assessment_level: 'tier_1',
      probability_percent: 7.2,
      has_assessment: true,
    },
    pathway: 'male',
  });
  assert.strictEqual(maleLow.riskCategory, 'lower');
  assert.strictEqual(maleLow.riskLabel, 'Lower Screening Risk');

  console.log('  ✅ PASSED: Male Hypogonadism cutoffs applied cleanly.');
}

console.log('\n🎉 ALL 5 SCREENING RISK SYNCHRONIZATION TESTS PASSED PERFECTLY!\n');
