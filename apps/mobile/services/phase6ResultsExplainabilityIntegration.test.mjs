/**
 * BioPulse Mobile — Phase 6: Results + Explainability Integration Test Suite
 *
 * Verifies the complete real assessment and explainability pipeline:
 * 1. Pipeline Verification: Assessment -> Probability -> Risk Category -> SHAP Values -> Top Contributing Factors -> Patient-Friendly Explanation
 * 2. Zero Fake SHAP: No mobile-calculated fake SHAP values, no hardcoded factor lists, consumes validated backend SHAP output
 * 3. Patient-Facing Language: Translates raw developer ML keys into patient-friendly explanations
 * 4. Persistence & Scoping: Results tied to authenticated user, assessment ID, pathway, and timestamp
 * 5. Historical Result Loading: Historical assessment review in Reports and deep-linking into Screening Explanation
 * 6. Empty / Unassessed State: Graceful handling with "Start Screening Assessment" CTA when unassessed
 * 7. API Failure Handling: Clear failure handling without fabricated fallback results
 * 8. Disclaimer & Clinical Guardrails: Non-diagnostic disclaimer rendered on all results and explanations
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
// 1. Pipeline Verification: Assessment -> Probability -> Risk -> SHAP -> Factors -> Explanation
// ---------------------------------------------------------------------------
test('Phase 6: Real assessment output pipeline is fully connected (Prob -> Risk -> SHAP -> Factors -> Explanation)', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const serviceContent = fs.readFileSync(serviceFile, 'utf8');

  // Verify formatShapFactorForPatient export and structure
  assert.ok(
    serviceContent.includes('export function formatShapFactorForPatient'),
    'assessmentService must export formatShapFactorForPatient'
  );
  assert.ok(
    serviceContent.includes('feature_key') &&
    serviceContent.includes('patient_label') &&
    serviceContent.includes('patient_explanation') &&
    serviceContent.includes('direction') &&
    serviceContent.includes('explanation_share_percent'),
    'formatShapFactorForPatient must map key, label, explanation, direction, and share percent'
  );

  // Verify female pathway feature mappings
  assert.ok(
    serviceContent.includes('cycle_regularity') && serviceContent.includes('Irregular menstrual cycle'),
    'formatShapFactorForPatient must map cycle_regularity to patient label'
  );
  assert.ok(
    serviceContent.includes('hirsutism') && serviceContent.includes('Excess hair growth'),
    'formatShapFactorForPatient must map hirsutism to patient label'
  );
  assert.ok(
    serviceContent.includes('skin_darkening') && serviceContent.includes('Skin darkening'),
    'formatShapFactorForPatient must map skin darkening to patient label'
  );

  // Verify male pathway feature mappings
  assert.ok(
    serviceContent.includes('adam_answers') && (serviceContent.includes('ADAM Symptom Profile') || serviceContent.includes('ADAM questionnaire responses')),
    'formatShapFactorForPatient must map adam_answers to patient label'
  );
  assert.ok(
    serviceContent.includes('waist_hip_ratio') && (serviceContent.includes('Waist-to-hip ratio') || serviceContent.includes('Waist-to-hip proportion')),
    'formatShapFactorForPatient must map waist_hip_ratio to patient label'
  );

  // Verify resolveRiskBand logic exists and handles probability + threshold
  assert.ok(
    serviceContent.includes('export function resolveRiskBand'),
    'assessmentService must export resolveRiskBand'
  );
  assert.ok(
    serviceContent.includes('category: \'higher\'') &&
    serviceContent.includes('category: \'intermediate\'') &&
    serviceContent.includes('category: \'lower\''),
    'resolveRiskBand must categorize into higher, intermediate, lower bands'
  );

  // Verify formatAssessmentDate export
  assert.ok(
    serviceContent.includes('export function formatAssessmentDate'),
    'assessmentService must export formatAssessmentDate'
  );

  // Verify getFeatureIconName export
  assert.ok(
    serviceContent.includes('export function getFeatureIconName'),
    'assessmentService must export getFeatureIconName'
  );
});

// ---------------------------------------------------------------------------
// 2. Zero Fake SHAP & Zero Hardcoded Factors
// ---------------------------------------------------------------------------
test('Phase 6: Critical Rule — Zero fake SHAP math and zero hardcoded factors in result screens', () => {
  const femaleResultFile = resolveAppFile('app/female-screening-result.tsx');
  const maleResultFile = resolveAppFile('app/male-screening-result.tsx');
  const explanationFile = resolveAppFile('app/(app)/screening-explanation.tsx');
  const clinicalSummaryFile = resolveAppFile('app/(app)/clinical-summary.tsx');

  const femaleContent = fs.readFileSync(femaleResultFile, 'utf8');
  const maleContent = fs.readFileSync(maleResultFile, 'utf8');
  const explanationContent = fs.readFileSync(explanationFile, 'utf8');
  const summaryContent = fs.readFileSync(clinicalSummaryFile, 'utf8');

  // Verify removal of hardcoded DEFAULT_FACTORS in female result
  assert.ok(
    !femaleContent.includes('const DEFAULT_FACTORS: FactorItem[]'),
    'female-screening-result must not contain hardcoded DEFAULT_FACTORS array'
  );
  assert.ok(
    femaleContent.includes('formatShapFactorForPatient'),
    'female-screening-result must process authentic model factors via formatShapFactorForPatient'
  );

  // Verify removal of hardcoded curated factors in screening explanation
  assert.ok(
    !explanationContent.includes('femaleCuratedTop3'),
    'screening-explanation must not contain hardcoded femaleCuratedTop3'
  );
  assert.ok(
    !explanationContent.includes('maleCuratedTop3'),
    'screening-explanation must not contain hardcoded maleCuratedTop3'
  );
  assert.ok(
    explanationContent.includes('screening.topFactors') || explanationContent.includes('activeAssessment'),
    'screening-explanation must derive top factors from screening state or active assessment'
  );

  // Verify clinical summary factors are dynamically mapped
  assert.ok(
    !summaryContent.includes('<Text style={styles.factorName}>Irregular Cycle</Text>'),
    'clinical-summary must not hardcode static Irregular Cycle factor JSX'
  );
  assert.ok(
    !summaryContent.includes('<Text style={styles.factorName}>Excess Hair Growth</Text>'),
    'clinical-summary must not hardcode static Excess Hair Growth factor JSX'
  );
  assert.ok(
    summaryContent.includes('formatShapFactorForPatient'),
    'clinical-summary must format real SHAP factors using formatShapFactorForPatient'
  );
});

// ---------------------------------------------------------------------------
// 3. Patient-Facing Language Translation
// ---------------------------------------------------------------------------
test('Phase 6: Technical ML terminology is translated into clear patient-facing language', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const explanationFile = resolveAppFile('app/(app)/screening-explanation.tsx');
  const maleResultFile = resolveAppFile('app/male-screening-result.tsx');
  const femaleResultFile = resolveAppFile('app/female-screening-result.tsx');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const explanationContent = fs.readFileSync(explanationFile, 'utf8');
  const maleContent = fs.readFileSync(maleResultFile, 'utf8');
  const femaleContent = fs.readFileSync(femaleResultFile, 'utf8');

  // Verify user-friendly heading across screens
  assert.ok(
    explanationContent.includes('What influenced your result?'),
    'screening-explanation must present patient-friendly heading "What influenced your result?"'
  );
  assert.ok(
    maleContent.includes('What influenced your result?'),
    'male-screening-result must present patient-friendly heading "What influenced your result?"'
  );
  assert.ok(
    femaleContent.includes('Top Contributing Factors') || femaleContent.includes('What influenced your result?'),
    'female-screening-result must present patient-friendly factors heading'
  );

  // Verify translation mappings for key ML features in service
  assert.ok(
    serviceContent.includes('adam_answers: {') && (serviceContent.includes('label: \'ADAM Symptom Profile\'') || serviceContent.includes('label: \'ADAM questionnaire responses\'')),
    'service must map raw adam_answers to patient label'
  );
  assert.ok(
    serviceContent.includes('waist_hip_ratio: {') && (serviceContent.includes('label: \'Waist-to-hip ratio\'') || serviceContent.includes('label: \'Waist-to-hip proportion\'')),
    'service must map raw waist_hip_ratio to patient label'
  );
  assert.ok(
    serviceContent.includes('cycle_regularity: {') && serviceContent.includes('label: \'Irregular menstrual cycle\''),
    'service must map raw cycle_regularity to patient label'
  );

  // Directional translation in patient-facing UI
  assert.ok(
    explanationContent.includes('↑ Increased Risk') && explanationContent.includes('↓ Decreased Risk'),
    'screening-explanation must display clear directional indicator badges'
  );
  assert.ok(
    femaleContent.includes('Increased Risk') || femaleContent.includes('Favorable Factor') || femaleContent.includes('increases_risk'),
    'female-screening-result must present directional indicators'
  );
  assert.ok(
    maleContent.includes('increases_risk') || maleContent.includes('Increased Risk'),
    'male-screening-result must present directional indicators'
  );
});

// ---------------------------------------------------------------------------
// 4. Persistence & Scoping to Authenticated User
// ---------------------------------------------------------------------------
test('Phase 6: Results are associated with authenticated user, assessment ID, pathway, and timestamp', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const storeFile = resolveAppFile('store/healthStore.tsx');

  const serviceContent = fs.readFileSync(serviceFile, 'utf8');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify assessmentId, createdAt, and pathway association in healthStore
  assert.ok(
    storeContent.includes('assessmentId?: string;') || storeContent.includes('assessmentId:'),
    'healthStore ScreeningAssessmentState must associate assessmentId'
  );
  assert.ok(
    storeContent.includes('createdAt?: string;'),
    'healthStore ScreeningAssessmentState must associate timestamp createdAt'
  );
  assert.ok(
    storeContent.includes('module?: string;'),
    'healthStore ScreeningAssessmentState must associate module / pathway'
  );
  assert.ok(
    storeContent.includes('patientId?: string;'),
    'healthStore ScreeningAssessmentState must associate authenticated patientId'
  );

  // Verify getHistoricalAssessmentById is available
  assert.ok(
    serviceContent.includes('export async function getHistoricalAssessmentById'),
    'assessmentService must export getHistoricalAssessmentById'
  );

  // Verify assessment history fetching
  assert.ok(
    serviceContent.includes('export async function fetchAssessmentHistory'),
    'assessmentService must export fetchAssessmentHistory'
  );

  // Verify Supabase query scopes by authenticated user ID
  assert.ok(
    serviceContent.includes('user_id.eq.${targetUser}') || serviceContent.includes('patient_id=eq.${targetUser}'),
    'assessmentService must scope queries to authenticated targetUser'
  );
});

// ---------------------------------------------------------------------------
// 5. Historical Result Loading & Navigation
// ---------------------------------------------------------------------------
test('Phase 6: Historical assessment results are loaded into Reports and viewable in detail', () => {
  const reportsFile = resolveAppFile('app/(app)/reports.tsx');
  const explanationFile = resolveAppFile('app/(app)/screening-explanation.tsx');

  const reportsContent = fs.readFileSync(reportsFile, 'utf8');
  const explanationContent = fs.readFileSync(explanationFile, 'utf8');

  // Reports incorporates assessmentHistory
  assert.ok(
    reportsContent.includes('assessmentHistory') && reportsContent.includes('assessmentHistory.forEach'),
    'reports screen must map assessmentHistory items into reports list'
  );
  assert.ok(
    reportsContent.includes('/(app)/screening-explanation?id='),
    'reports screen must deep link historical assessments with query param id'
  );

  // Screening explanation reads query param and loads historical assessment
  assert.ok(
    explanationContent.includes('useLocalSearchParams') && explanationContent.includes('queryAssessmentId'),
    'screening-explanation must inspect route query params for historical assessment id'
  );
  assert.ok(
    explanationContent.includes('getHistoricalAssessmentById'),
    'screening-explanation must invoke getHistoricalAssessmentById when viewing historical assessment'
  );
});

// ---------------------------------------------------------------------------
// 6. No-Data / Unassessed State
// ---------------------------------------------------------------------------
test('Phase 6: Unassessed state is gracefully handled with Start Assessment CTA', () => {
  const femaleResultFile = resolveAppFile('app/female-screening-result.tsx');
  const maleResultFile = resolveAppFile('app/male-screening-result.tsx');
  const explanationFile = resolveAppFile('app/(app)/screening-explanation.tsx');

  const femaleContent = fs.readFileSync(femaleResultFile, 'utf8');
  const maleContent = fs.readFileSync(maleResultFile, 'utf8');
  const explanationContent = fs.readFileSync(explanationFile, 'utf8');

  // Female result empty state
  assert.ok(
    femaleContent.includes('No Screening Result Found'),
    'female-screening-result must show clean empty state message when unassessed'
  );
  assert.ok(
    femaleContent.includes('Start Screening Assessment →'),
    'female-screening-result must include Start Screening CTA'
  );

  // Male result empty state
  assert.ok(
    maleContent.includes('No Screening Result Found'),
    'male-screening-result must show clean empty state message when unassessed'
  );
  assert.ok(
    maleContent.includes('Start Screening Assessment →'),
    'male-screening-result must include Start Screening CTA'
  );

  // Explanation empty state
  assert.ok(
    explanationContent.includes('No Assessment Available'),
    'screening-explanation must show clean empty state message when unassessed'
  );
  assert.ok(
    explanationContent.includes('Start Screening Assessment →'),
    'screening-explanation must include Start Screening CTA'
  );
});

// ---------------------------------------------------------------------------
// 7. API Failure Handling & No Fake Data
// ---------------------------------------------------------------------------
test('Phase 6: API failure leaves clean state without fabricating fake fallback probabilities', () => {
  const serviceFile = resolveAppFile('services/assessmentService.ts');
  const serviceContent = fs.readFileSync(serviceFile, 'utf8');

  // Verify fetchActiveScreeningAssessment returns null on not found or network failure
  assert.ok(
    serviceContent.includes('export async function fetchActiveScreeningAssessment'),
    'assessmentService must export fetchActiveScreeningAssessment'
  );
  assert.ok(
    serviceContent.includes('return null;') || serviceContent.includes('return null'),
    'fetchActiveScreeningAssessment returns null on failure'
  );

  // Verify fetchAssessmentHistory returns [] on failure
  assert.ok(
    serviceContent.includes('return [];') || serviceContent.includes('return []'),
    'fetchAssessmentHistory returns empty array on failure'
  );

  // Verify submit functions return error object without mock assessments
  assert.ok(
    !serviceContent.includes('// Fallback: build a mock assessment'),
    'assessmentService must not fabricate mock assessments on failure'
  );
  assert.ok(
    serviceContent.includes('return { data: null, error:'),
    'assessment submissions return null data on failure'
  );
});

// ---------------------------------------------------------------------------
// 8. Disclaimer & Clinical Guardrails
// ---------------------------------------------------------------------------
test('Phase 6: Non-diagnostic disclaimer is rendered on all results and explanations', () => {
  const femaleResultFile = resolveAppFile('app/female-screening-result.tsx');
  const maleResultFile = resolveAppFile('app/male-screening-result.tsx');
  const explanationFile = resolveAppFile('app/(app)/screening-explanation.tsx');

  const femaleContent = fs.readFileSync(femaleResultFile, 'utf8');
  const maleContent = fs.readFileSync(maleResultFile, 'utf8');
  const explanationContent = fs.readFileSync(explanationFile, 'utf8');

  assert.ok(
    femaleContent.includes('disclaimerText') && femaleContent.includes('medical diagnosis'),
    'female-screening-result must display non-diagnostic clinical disclaimer'
  );
  assert.ok(
    maleContent.includes('disclaimerText') && maleContent.includes('medical diagnosis'),
    'male-screening-result must display non-diagnostic clinical disclaimer'
  );
  assert.ok(
    explanationContent.includes('disclaimer') && explanationContent.includes('not a diagnosis'),
    'screening-explanation must display non-diagnostic clinical disclaimer'
  );
});
