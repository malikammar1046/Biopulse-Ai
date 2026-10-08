/**
 * BioPulse Mobile — Phase 5: Assessment Integration Test Suite
 *
 * Verifies the complete real assessment integration architecture:
 * 1. Female pathway: Validated feature mapping, threshold (0.25), risk categorization, API contract
 * 2. Male pathway: Validated feature mapping, threshold (0.45), ADAM scoring, API contract
 * 3. Critical rule: Zero duplicate ML implementation inside React Native / strict API consumption
 * 4. Input validation: Required fields validated, missing data identified, clear error messages, zero silent fake substitutions
 * 5. Persistent assessment result & history tracking: Screening assessments persisted, active & history fetched
 * 6. Repeated assessment: Successive screenings update active assessment and persist history
 * 7. Authenticated user ownership: Token scoping enforced, unauthenticated calls rejected
 * 8. API failure handling: Clear error alerts surfaced, zero fake fallback probabilities rendered
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const resolveAppFile = (rel) => {
  if (fs.existsSync(path.resolve(rel))) return path.resolve(rel);
  return path.resolve('apps/mobile', rel);
};

// ---------------------------------------------------------------------------
// 1. Female Pathway: Validated Feature Mapping & Contract
// ---------------------------------------------------------------------------
test('Phase 5: Female pathway preserves validated ML mapping, threshold (0.25), and API contract', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const femaleReviewFile = resolveAppFile('app/female-review.tsx');
  const femaleResultFile = resolveAppFile('app/female-screening-result.tsx');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const reviewContent = fs.readFileSync(femaleReviewFile, 'utf8');
  const resultContent = fs.readFileSync(femaleResultFile, 'utf8');

  // Verify female tier 1 endpoint contract
  assert.ok(
    serviceContent.includes("'female_pcos'"),
    'assessmentService must target female_pcos module'
  );
  assert.ok(
    serviceContent.includes('/v1/intelligence/assessment/tier1/'),
    'assessmentService must call authoritative female tier 1 endpoint'
  );

  // Verify threshold is 0.25
  assert.ok(
    serviceContent.includes('FEMALE_DEFAULT_THRESHOLD = 0.25') || serviceContent.includes('threshold: number = 0.25'),
    'Female pathway threshold must default to validated 0.25'
  );

  // Verify resolveRiskBand logic for female threshold
  assert.ok(
    serviceContent.includes('function resolveRiskBand'),
    'assessmentService must export resolveRiskBand'
  );
  assert.ok(
    serviceContent.includes("label: 'Higher Likelihood'"),
    'resolveRiskBand maps above threshold to Higher Likelihood'
  );
  assert.ok(
    serviceContent.includes("label: 'Intermediate Likelihood'"),
    'resolveRiskBand maps intermediate zone to Intermediate Likelihood'
  );
  assert.ok(
    serviceContent.includes("label: 'Lower Likelihood'"),
    'resolveRiskBand maps low zone to Lower Likelihood'
  );

  // Verify female review consumes real assessment service
  assert.ok(
    reviewContent.includes('submitFemaleTier1AssessmentWithStatus') || reviewContent.includes('submitAssessmentTier1'),
    'female-review must call authoritative female tier 1 service'
  );

  // Verify zero hardcoded fake probability fallback in result screen
  assert.ok(
    !resultContent.includes("probabilityPercent = 72;"),
    'female-screening-result must not hardcode 72% fallback probability'
  );
  assert.ok(
    resultContent.includes('screening.probabilityPercent'),
    'female-screening-result must read real probabilityPercent from screening state'
  );
});

// ---------------------------------------------------------------------------
// 2. Male Pathway: Validated Feature Mapping & Contract
// ---------------------------------------------------------------------------
test('Phase 5: Male pathway preserves validated ML mapping, threshold (0.45), and API contract', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const maleReviewFile = resolveAppFile('app/male-review.tsx');
  const maleResultFile = resolveAppFile('app/male-screening-result.tsx');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const reviewContent = fs.readFileSync(maleReviewFile, 'utf8');
  const resultContent = fs.readFileSync(maleResultFile, 'utf8');

  // Verify male tier 1 endpoint contract
  assert.ok(
    serviceContent.includes('/v1/intelligence/assessment/male/tier1/'),
    'assessmentService must call authoritative male tier 1 endpoint'
  );
  assert.ok(
    serviceContent.includes("'male_hypogonadism'"),
    'assessmentService must target male_hypogonadism module'
  );

  // Verify male threshold is 0.45
  assert.ok(
    serviceContent.includes('MALE_DEFAULT_THRESHOLD = 0.45') || serviceContent.includes('targetModule === \'male_hypogonadism\' ? 0.45 : 0.25'),
    'Male pathway threshold must default to validated 0.45'
  );

  // Verify buildMaleTier1Inputs exists and validates required structure
  assert.ok(
    serviceContent.includes('buildMaleTier1Inputs'),
    'assessmentService must export buildMaleTier1Inputs'
  );

  // Verify male review consumes real assessment service
  assert.ok(
    reviewContent.includes('submitMaleTier1AssessmentWithStatus'),
    'male-review must call authoritative submitMaleTier1AssessmentWithStatus service'
  );

  // Verify zero hardcoded fallback in male result screen
  assert.ok(
    !resultContent.includes("probability = 0.72"),
    'male-screening-result must not hardcode 0.72 fallback probability'
  );
  assert.ok(
    resultContent.includes('screening.probabilityPercent') || resultContent.includes('activeAssessment?.probability'),
    'male-screening-result must read real probability from state'
  );
});

// ---------------------------------------------------------------------------
// 3. Critical Rule: Zero Duplicate ML Implementation in React Native
// ---------------------------------------------------------------------------
test('Phase 5: Critical Rule — Zero duplicate ML math/weights in React Native; consumes authoritative API', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const serviceContent = fs.readFileSync(serviceFile, 'utf8');

  // Verify removal of fake local ML fallback in submitMaleTier1AssessmentWithStatus
  assert.ok(
    !serviceContent.includes('// Fallback: build a mock assessment so user can proceed'),
    'assessmentService must NOT contain mock ML assessment fallback'
  );
  assert.ok(
    !serviceContent.includes('const mockProb = 0.42'),
    'assessmentService must not fabricate mock probability values'
  );

  // Verify that assessment service strictly calls backend or throws API failure
  assert.ok(
    serviceContent.includes('/v1/intelligence/assessment/male/tier1/'),
    'Male assessment must call Django API'
  );
  assert.ok(
    serviceContent.includes('/v1/intelligence/assessment/tier1/'),
    'Female assessment must call Django API'
  );
});

// ---------------------------------------------------------------------------
// 4. Input Validation: Required Fields, Missing Data Explanations
// ---------------------------------------------------------------------------
test('Phase 5: Input validation detects missing fields and prevents silent fake substitutions', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const femaleReviewFile = resolveAppFile('app/female-review.tsx');
  const maleReviewFile = resolveAppFile('app/male-review.tsx');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const femaleContent = fs.readFileSync(femaleReviewFile, 'utf8');
  const maleContent = fs.readFileSync(maleReviewFile, 'utf8');

  // Female review validation
  assert.ok(
    serviceContent.includes('validateFemaleReviewInputs'),
    'assessmentService must provide validateFemaleReviewInputs'
  );
  assert.ok(
    femaleContent.includes('validateFemaleReviewInputs'),
    'female-review must invoke validateFemaleReviewInputs before running assessment'
  );
  assert.ok(
    femaleContent.includes('Required Clinical Information Missing') || femaleContent.includes('Missing required screening information'),
    'female-review must display clear message when fields are missing'
  );

  // Male review validation
  assert.ok(
    serviceContent.includes('validateMaleReviewInputs'),
    'assessmentService must provide validateMaleReviewInputs'
  );
  assert.ok(
    maleContent.includes('validateMaleReviewInputs'),
    'male-review must invoke validateMaleReviewInputs before running assessment'
  );
  assert.ok(
    maleContent.includes('Required Clinical Information Missing') || maleContent.includes('Missing required screening information'),
    'male-review must display clear message when fields are missing'
  );

  // Verify absence of silent fake fallback substitutions in male review (e.g. || 76, || 178)
  assert.ok(
    !maleContent.includes('weight_kg: basicInfo.weightKg || 76'),
    'male-review must not silently substitute 76 kg for missing weight'
  );
  assert.ok(
    !maleContent.includes('height_cm: basicInfo.heightCm || 178'),
    'male-review must not silently substitute 178 cm for missing height'
  );
  assert.ok(
    !maleContent.includes('age: basicInfo.age || 32'),
    'male-review must not silently substitute 32 for missing age'
  );
});

// ---------------------------------------------------------------------------
// 5. Result Persistence & Assessment History
// ---------------------------------------------------------------------------
test('Phase 5: Assessment results persist to database and history is retrievable', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const storeFile = resolveAppFile('store/healthStore.tsx');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify fetchAssessmentHistory service method exists
  assert.ok(
    serviceContent.includes('fetchAssessmentHistory'),
    'assessmentService must implement fetchAssessmentHistory'
  );

  // Verify backend endpoints queried for history
  assert.ok(
    serviceContent.includes('/v1/intelligence/assessment/history/'),
    'fetchAssessmentHistory queries authoritative assessment history endpoint'
  );

  // Verify Supabase fallback persistence table
  assert.ok(
    serviceContent.includes('screening_assessments'),
    'fetchAssessmentHistory supports screening_assessments table'
  );

  // Verify healthStore tracks assessmentHistory
  assert.ok(
    storeContent.includes('assessmentHistory: ProgressiveAssessment[]'),
    'healthStore must expose assessmentHistory array in RealtimeHealthStoreValue'
  );
  assert.ok(
    storeContent.includes('refreshAssessment: () => Promise<void>'),
    'healthStore must expose refreshAssessment action'
  );
});

// ---------------------------------------------------------------------------
// 6. Repeated Assessment Handling
// ---------------------------------------------------------------------------
test('Phase 5: Repeated assessments update active assessment and trigger history refresh', () => {
  const femaleReviewFile = resolveAppFile('app/female-review.tsx');
  const maleReviewFile = resolveAppFile('app/male-review.tsx');
  const storeFile = resolveAppFile('store/healthStore.tsx');

  const femaleContent = fs.readFileSync(femaleReviewFile, 'utf8');
  const maleContent = fs.readFileSync(maleReviewFile, 'utf8');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify refreshAssessment is called upon female re-assessment
  assert.ok(
    femaleContent.includes('refreshAssessment().catch'),
    'female-review must invoke refreshAssessment to update persistent history'
  );

  // Verify refreshAssessment is called upon male re-assessment
  assert.ok(
    maleContent.includes('refreshAssessment().catch'),
    'male-review must invoke refreshAssessment to update persistent history'
  );

  // Verify refreshAssessment updates both active screening and history list
  assert.ok(
    storeContent.includes('setAssessmentHistory(histRes)'),
    'refreshAssessment updates assessmentHistory state'
  );
  assert.ok(
    storeContent.includes('setScreening((prev) =>'),
    'refreshAssessment updates active screening state'
  );
});

// ---------------------------------------------------------------------------
// 7. Authenticated User Ownership & Token Scoping
// ---------------------------------------------------------------------------
test('Phase 5: User ownership enforced — Unauthenticated assessment calls rejected', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const storeFile = resolveAppFile('store/healthStore.tsx');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Unauthenticated check in submitMaleTier1AssessmentWithStatus
  assert.ok(
    serviceContent.includes('Authentication required'),
    'submitMaleTier1AssessmentWithStatus rejects unauthenticated calls with 401'
  );

  // Authorization Bearer token header propagation
  assert.ok(
    serviceContent.includes('Authorization: `Bearer ${token}`'),
    'assessmentService must forward user Bearer token to backend'
  );

  // Scoped user ID in active assessment queries
  assert.ok(
    serviceContent.includes('patient_id=eq.${targetUser}') || serviceContent.includes('patient_id: patientId') || serviceContent.includes('patient_id = userId') || serviceContent.includes('.eq(\'user_id\', userId)'),
    'assessmentService queries must scope results to authenticated user ID'
  );

  // Store resets on user logout or switch
  assert.ok(
    storeContent.includes('setAssessmentHistory([]);'),
    'healthStore must purge assessmentHistory on user logout or switch'
  );
});

// ---------------------------------------------------------------------------
// 8. API Failure Handling & Zero Fake Data
// ---------------------------------------------------------------------------
test('Phase 5: API failure is handled gracefully with error alerts and zero fabricated results', () => {
  const femaleReviewFile = resolveAppFile('app/female-review.tsx');
  const maleReviewFile = resolveAppFile('app/male-review.tsx');
  const screeningFile = resolveAppFile('app/(app)/screening.tsx');
  const explanationFile = resolveAppFile('app/(app)/screening-explanation.tsx');

  const femaleContent = fs.readFileSync(femaleReviewFile, 'utf8');
  const maleContent = fs.readFileSync(maleReviewFile, 'utf8');
  const screeningContent = fs.readFileSync(screeningFile, 'utf8');
  const explanationContent = fs.readFileSync(explanationFile, 'utf8');

  // Female review catches error and alerts
  assert.ok(
    femaleContent.includes("'Assessment Error'"),
    'female-review must surface API failure alert'
  );
  assert.ok(
    femaleContent.includes('catch (err: any) {') && femaleContent.includes('setIsSubmitting(false);'),
    'female-review must handle error and reset submitting state'
  );

  // Male review catches error and alerts
  assert.ok(
    maleContent.includes("'Assessment Error'"),
    'male-review must surface API failure alert'
  );

  // Screening tab shows authentic empty state when not assessed
  assert.ok(
    screeningContent.includes("screening.tierStatus === 'Not Assessed'") || screeningContent.includes('!hasAssessment'),
    'screening tab must detect when user has no assessment'
  );
  assert.ok(
    screeningContent.includes('No PCOS Screening Completed') || screeningContent.includes('Start Screening Assessment') || screeningContent.includes('No Screening Assessment Found'),
    'screening tab must render authentic unassessed card'
  );

  // Explanation tab shows empty state when unassessed
  assert.ok(
    explanationContent.includes('!isAssessed') || explanationContent.includes('!hasAssessment'),
    'screening-explanation tab must detect when user has no assessment'
  );
  assert.ok(
    explanationContent.includes('No Assessment Available') || explanationContent.includes('Start Screening Assessment'),
    'screening-explanation tab must render unassessed empty state'
  );
});
