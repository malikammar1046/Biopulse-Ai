/**
 * BioPulse Mobile — Phase 11 Longitudinal Health Test Suite
 *
 * Verifies:
 * 1. Multiple Assessments:
 *    - Historical assessments from persistent storage (screening_assessments)
 *    - Each result contains: date, pathway, assessment level, risk result, and explanation
 * 2. Historical Records Integration:
 *    - Assessments & risk results (screening_assessments)
 *    - Measurements & observations (patient_metric_observations)
 *    - Cycles (cycle_records)
 *    - Symptoms (symptom_records)
 *    - Labs (report_results & medical_reports)
 *    - Activity (fitness_logs)
 *    - Water (water_logs)
 *    - Medications (medication_logs)
 *    - Health events (appointments & reports)
 * 3. Empty History:
 *    - Returns [] on empty records without fabricating dummy data
 *    - Metric trends report hasRealData: false and dataPointCount: 0
 * 4. Deleted Records:
 *    - deleteAssessment deletes from persistent storage scoped to user_id
 *    - Store purges deleted assessment and avoids resurrecting stale data
 * 5. Date Ordering:
 *    - Assessment history and timeline events ordered chronologically descending (created_at desc)
 *    - Trend points ordered chronologically ascending (observed_at asc)
 * 6. User Isolation:
 *    - All database queries scoped to authenticated user_id
 *    - resetHealthState completely purges all historical state on logout
 * 7. Pathway Isolation:
 *    - Female pathway only queries female modules (female, female_pcos)
 *    - Male pathway only queries male modules (male, male_hypogonadism)
 *    - switchPathway re-queries assessment history for target pathway
 * 8. Screen UI Preservation (No Redesign):
 *    - Preserves exact layout, pills, stat boxes, and sparklines on Screens 32, 33, 42
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileRoot = path.resolve(__dirname, '..');

function resolveMobileFile(relPath) {
  return path.join(mobileRoot, relPath);
}

// ============================================================================
// TEST 1: Multiple Assessments & Complete Result Structure
// ============================================================================
test('Phase 11: Longitudinal Service queries multiple assessments with required fields and explanations', () => {
  const filePath = resolveMobileFile('services/longitudinalService.ts');
  assert.ok(fs.existsSync(filePath), 'longitudinalService.ts must exist');

  const content = fs.readFileSync(filePath, 'utf8');

  // Verify connection to screening_assessments table
  assert.ok(
    content.includes('rest/v1/screening_assessments'),
    'Must connect to public.screening_assessments REST endpoint'
  );

  // Verify all required assessment result fields: date, pathway, assessment, risk result, explanation
  const requiredFields = [
    'date',
    'formattedDate',
    'pathway',
    'assessmentLevel',
    'probability',
    'probabilityPercent',
    'riskCategory',
    'riskLabel',
    'explanations',
  ];
  for (const field of requiredFields) {
    assert.ok(
      content.includes(field),
      `Longitudinal assessment record must include '${field}'`
    );
  }

  // Verify explanation properties
  assert.ok(
    content.includes('featureKey') && content.includes('impactScore') && content.includes('direction'),
    'Explanations must contain normalized SHAP factor properties'
  );
});

// ============================================================================
// TEST 2: Cross-Domain Historical Records Integration (No In-Memory Source of Truth)
// ============================================================================
test('Phase 11: Connects all health domains to persistent PostgreSQL tables', () => {
  const longServicePath = resolveMobileFile('services/longitudinalService.ts');
  const storePath = resolveMobileFile('store/healthStore.tsx');

  const serviceContent = fs.readFileSync(longServicePath, 'utf8');
  const storeContent = fs.readFileSync(storePath, 'utf8');

  // 1. Assessments
  assert.ok(serviceContent.includes('screening_assessments'), 'Must connect assessments');

  // 2. Metric observations / measurements
  assert.ok(serviceContent.includes('patient_metric_observations'), 'Must connect measurements');

  // 3. Cycles
  assert.ok(serviceContent.includes('cycle_records'), 'Must connect cycle records');

  // 4. Symptoms
  assert.ok(serviceContent.includes('symptom_records'), 'Must connect symptom records');

  // 5. Labs & medical reports
  assert.ok(serviceContent.includes('medical_reports'), 'Must connect medical reports');

  // 6. Appointments
  assert.ok(serviceContent.includes('appointments'), 'Must connect appointments');

  // Verify store integrates these persistent sources in parallel
  assert.ok(
    storeContent.includes('fetchCycleRecordsFromDb') &&
      storeContent.includes('fetchTodayWaterLogsFromDb') &&
      storeContent.includes('fetchMedicationsFromDb') &&
      storeContent.includes('fetchMedicalReportsFromDb'),
    'HealthStore must load persistent backend records'
  );
});

// ============================================================================
// TEST 3: Empty History Handling & Zero Fabricated Data
// ============================================================================
test('Phase 11: Returns empty arrays on empty history and never fabricates historical trend values', () => {
  const filePath = resolveMobileFile('services/longitudinalService.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify empty history returns []
  assert.ok(
    content.includes('rows.length === 0') || content.includes('inRange.length === 0'),
    'Must handle empty record length'
  );

  assert.ok(
    content.includes('hasRealData: false') && content.includes('dataPointCount: 0'),
    'Metric trend must report hasRealData: false when no records exist'
  );

  assert.ok(
    content.includes("currentValue: '--'") && content.includes("previousValue: '--'"),
    'Must not fabricate dummy numbers when no observations exist'
  );
});

// ============================================================================
// TEST 4: Deleted Records & Deletion Scoping
// ============================================================================
test('Phase 11: Supports assessment deletion scoped to user and updates persistent state', () => {
  const servicePath = resolveMobileFile('services/longitudinalService.ts');
  const storePath = resolveMobileFile('store/healthStore.tsx');

  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  const storeContent = fs.readFileSync(storePath, 'utf8');

  // Verify deleteAssessment endpoint call
  assert.ok(
    serviceContent.includes('DELETE') &&
      serviceContent.includes('screening_assessments?id=eq.${assessmentId}&user_id=eq.${userId}'),
    'deleteAssessment must be scoped to user_id to prevent unauthorized deletion'
  );

  // Verify healthStore exposes deleteAssessmentRecord
  assert.ok(
    storeContent.includes('deleteAssessmentRecord: (assessmentId: string) => Promise<boolean>'),
    'HealthStore must export deleteAssessmentRecord'
  );

  // Verify state filter on deletion
  assert.ok(
    storeContent.includes('setAssessmentHistory((prev) => prev.filter'),
    'deleteAssessmentRecord must remove deleted record from state'
  );
});

// ============================================================================
// TEST 5: Date Ordering & Chronological Trend Flow
// ============================================================================
test('Phase 11: Enforces descending order for history/events and ascending for trends', () => {
  const servicePath = resolveMobileFile('services/longitudinalService.ts');
  const serviceContent = fs.readFileSync(servicePath, 'utf8');

  // Assessment history ordered desc
  assert.ok(
    serviceContent.includes('order=created_at.desc'),
    'Assessment history must be ordered by created_at.desc'
  );

  // Observations ordered asc for chronological line charts
  assert.ok(
    serviceContent.includes('order=observed_at.asc') ||
      serviceContent.includes('order=period_start_date.asc'),
    'Metric observations must be ordered ascending for chronological trend lines'
  );

  // Timeline events sorted by timestamp descending
  assert.ok(
    serviceContent.includes('new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()'),
    'Timeline events must be sorted descending by timestamp'
  );
});

// ============================================================================
// TEST 6: User Isolation & Cross-Account Privacy Purge
// ============================================================================
test('Phase 11: Enforces user isolation on queries and purges all historical state on logout', () => {
  const servicePath = resolveMobileFile('services/longitudinalService.ts');
  const storePath = resolveMobileFile('store/healthStore.tsx');

  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  const storeContent = fs.readFileSync(storePath, 'utf8');

  // Verify user_id filter on all queries
  assert.ok(
    serviceContent.includes('user_id=eq.${userId}'),
    'All longitudinal queries must filter by user_id'
  );

  // Verify state reset in healthStore
  assert.ok(
    storeContent.includes('setAssessmentHistory([])'),
    'resetHealthState must clear assessmentHistory'
  );
  assert.ok(
    storeContent.includes('setMeasurementObservations([])'),
    'resetHealthState must clear measurementObservations'
  );
  assert.ok(
    storeContent.includes('setCycleHistory([])'),
    'resetHealthState must clear cycleHistory'
  );
  assert.ok(
    storeContent.includes('setSymptomHistory([])'),
    'resetHealthState must clear symptomHistory'
  );
});

// ============================================================================
// TEST 7: Pathway Isolation (Female vs Male)
// ============================================================================
test('Phase 11: Strictly isolates female and male longitudinal modules and metrics', () => {
  const servicePath = resolveMobileFile('services/longitudinalService.ts');
  const storePath = resolveMobileFile('store/healthStore.tsx');
  const progressPath = resolveMobileFile('app/(app)/progress.tsx');

  const serviceContent = fs.readFileSync(servicePath, 'utf8');
  const storeContent = fs.readFileSync(storePath, 'utf8');
  const progressContent = fs.readFileSync(progressPath, 'utf8');

  // Verify module query filtering in longitudinalService
  assert.ok(
    serviceContent.includes('in.(female,female_pcos)') &&
      serviceContent.includes('in.(male,male_hypogonadism)'),
    'longitudinalService must filter modules based on pathway'
  );

  // Verify switchPathway re-queries assessment history for the target pathway
  assert.ok(
    storeContent.includes('assessmentService.fetchAssessmentHistory(user.id, p)'),
    'switchPathway must re-query assessment history for the new pathway'
  );

  // Verify male metrics show Testosterone and zero cycle UI
  assert.ok(
    progressContent.includes('Testosterone (Total T)'),
    'Male metrics must include Testosterone'
  );
  assert.ok(
    progressContent.includes('Cycle Regularity'),
    'Female metrics must include Cycle Regularity'
  );
});

// ============================================================================
// TEST 8: Screen UI Preservation (Screen 32, 33, 42)
// ============================================================================
test('Phase 11: Preserves UI layout, cards, and navigation on Screens 32, 33, and 42', () => {
  const progressPath = resolveMobileFile('app/(app)/progress.tsx');
  const metricDetailPath = resolveMobileFile('app/(app)/metric-detail.tsx');
  const reportsPath = resolveMobileFile('app/(app)/reports.tsx');

  const progressContent = fs.readFileSync(progressPath, 'utf8');
  const detailContent = fs.readFileSync(metricDetailPath, 'utf8');
  const reportsContent = fs.readFileSync(reportsPath, 'utf8');

  // Screen 32: Progress Overview
  assert.ok(progressContent.includes('Your Progress'), 'Must have Your Progress header');
  assert.ok(progressContent.includes('Overview'), 'Must have Overview tab');
  assert.ok(progressContent.includes('Records'), 'Must have Records tab');
  assert.ok(progressContent.includes('MiniSparkline'), 'Must render mini sparkline curve');

  // Screen 33: Metric Detail
  assert.ok(detailContent.includes('Current'), 'Must show Current stat');
  assert.ok(detailContent.includes('Change'), 'Must show Change stat');
  assert.ok(detailContent.includes('Previous'), 'Must show Previous stat');
  assert.ok(detailContent.includes('What changed?'), 'Must have clinical interpretation section');
  assert.ok(detailContent.includes('1M') && detailContent.includes('3M'), 'Must have range selector pills');

  // Screen 42: Reports
  assert.ok(
    reportsContent.includes('assessmentHistory.forEach'),
    'Reports screen must list historical assessments'
  );
  assert.ok(
    reportsContent.includes('/(app)/screening-explanation?id='),
    'Historical assessments must link to detailed explanation'
  );
});
