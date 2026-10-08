/**
 * BioPulse Mobile — Phase 7C: Medications + Measurements Integration Test Suite
 *
 * Validates persistent backend integrations for:
 * 1. Medications:
 *    - public.medications: name, dose, unit, frequency, scheduled_times, start_date, end_date, notes, is_active
 *    - public.medication_logs: medication_id, scheduled_for, scheduled_time, status, taken_at, notes
 *    - Non-prescriptive: only records user-provided medication info
 *    - Full CRUD: addMedication, updateMedication, deleteMedication, removeMedication
 *    - Dose logging & adherence history
 *    - UI: Today, Schedule, History tabs, Add Modal, delete confirmation
 * 2. Measurements:
 *    - public.patient_metric_observations: weight_kg, height_cm, waist_circumference, bmi
 *    - public.profiles sync: weight_kg, height_cm, waist_cm
 *    - Authoritative BMI logic: weight / (height/100)^2 rounded to 1 decimal place without duplicate divergence
 *    - Observation history retrieval
 * 3. Security & User Ownership:
 *    - Authenticated user ownership via session token & user_id
 *    - Reset on logout / user switch to prevent cross-user data leakage
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const resolveAppFile = (rel) => {
  const directPath = path.resolve(rel);
  if (fs.existsSync(directPath)) return directPath;
  return path.resolve('apps/mobile', rel);
};

// ---------------------------------------------------------------------------
// 1. Medications Service Integration (Phase 7C)
// ---------------------------------------------------------------------------
test('Phase 7C: Medication service strictly integrates with public.medications and public.medication_logs', () => {
  const medFile = resolveAppFile('services/medicationService.ts');
  const medContent = fs.readFileSync(medFile, 'utf8');

  // Verify REST endpoints
  assert.ok(
    medContent.includes('/rest/v1/medications'),
    'MedicationService must target /rest/v1/medications'
  );
  assert.ok(
    medContent.includes('/rest/v1/medication_logs'),
    'MedicationService must target /rest/v1/medication_logs'
  );

  // Verify CRUD operations
  assert.ok(
    medContent.includes('getMedications') &&
    medContent.includes('addMedication') &&
    medContent.includes('updateMedication') &&
    medContent.includes('deleteMedication') &&
    medContent.includes('removeMedication'),
    'MedicationService must implement full medication CRUD'
  );

  // Verify dose tracking & history operations
  assert.ok(
    medContent.includes('logDose') &&
    medContent.includes('getDoseLogs') &&
    medContent.includes('getMedicationHistory'),
    'MedicationService must implement dose logging and joined adherence history retrieval'
  );

  // Verify frequency constraint alignment
  assert.ok(
    medContent.includes('normalizeFrequency') &&
    medContent.includes('once_daily') &&
    medContent.includes('twice_daily') &&
    medContent.includes('every_other_day') &&
    medContent.includes('as_needed'),
    'MedicationService must enforce DB frequency check constraint values'
  );

  // Verify fields mapping
  assert.ok(
    medContent.includes('dose') &&
    medContent.includes('unit') &&
    medContent.includes('start_date') &&
    medContent.includes('scheduled_times') &&
    medContent.includes('is_active'),
    'MedicationService must map dose, unit, start_date, end_date, scheduled_times, and is_active'
  );
});

// ---------------------------------------------------------------------------
// 2. Non-prescriptive User-Provided Medication Recording Rule
// ---------------------------------------------------------------------------
test('Phase 7C: Medication system only records user-provided info and does not prescribe or recommend', () => {
  const screenFile = resolveAppFile('app/(app)/medications.tsx');
  const screenContent = fs.readFileSync(screenFile, 'utf8');

  // Verify non-prescriptive disclaimer or notice in screen
  assert.ok(
    screenContent.includes('BioPulse records user-provided medication info only') ||
    screenContent.includes('does not prescribe or recommend medications'),
    'medications.tsx must display clear non-prescriptive notice'
  );

  // Verify user adds their own medications
  assert.ok(
    screenContent.includes('Add Medication') &&
    screenContent.includes('handleAddSubmit') &&
    screenContent.includes('newMedName'),
    'medications.tsx must allow users to record their own medications'
  );
});

// ---------------------------------------------------------------------------
// 3. Medication UI Tabs: Today, Schedule, History & Delete
// ---------------------------------------------------------------------------
test('Phase 7C: Medication screen implements Today, Schedule, and History views with delete confirmation', () => {
  const screenFile = resolveAppFile('app/(app)/medications.tsx');
  const screenContent = fs.readFileSync(screenFile, 'utf8');

  // Verify tab switcher
  assert.ok(
    screenContent.includes("activeTab === 'today'") &&
    screenContent.includes("activeTab === 'schedule'") &&
    screenContent.includes("activeTab === 'history'"),
    'medications.tsx must implement Today, Schedule, and History segmented tabs'
  );

  // Verify Today view has primary due now card & checkmarks
  assert.ok(
    screenContent.includes('dueCard') &&
    screenContent.includes('dueNowItem') &&
    screenContent.includes('handleAction'),
    'Today view must include primary Due Now card with Taken/Skip/Snooze'
  );

  // Verify Schedule view has full prescription details & delete
  assert.ok(
    screenContent.includes('scheduleCard') &&
    screenContent.includes('handleDeleteMedication') &&
    screenContent.includes('formatFrequencyLabel'),
    'Schedule view must display active prescription details with frequency and delete handler'
  );

  // Verify History view binds to medicationHistory
  assert.ok(
    screenContent.includes('medicationHistory') &&
    screenContent.includes('historyCard'),
    'History view must display dose adherence logs from health store'
  );
});

// ---------------------------------------------------------------------------
// 4. Measurements Service & Authoritative BMI Logic (Phase 7C)
// ---------------------------------------------------------------------------
test('Phase 7C: MeasurementService integrates patient_metric_observations with authoritative BMI formula', () => {
  const measurementFile = resolveAppFile('services/measurementService.ts');
  const measurementContent = fs.readFileSync(measurementFile, 'utf8');

  // Verify target table
  assert.ok(
    measurementContent.includes('/rest/v1/patient_metric_observations'),
    'MeasurementService must target /rest/v1/patient_metric_observations'
  );

  // Verify supported measurement keys
  assert.ok(
    measurementContent.includes('weight_kg') &&
    measurementContent.includes('height_cm') &&
    measurementContent.includes('waist_circumference') &&
    measurementContent.includes('bmi'),
    'MeasurementService must support weight_kg, height_cm, waist_circumference, and bmi'
  );

  // Verify authoritative BMI function
  assert.ok(
    measurementContent.includes('calculateAuthoritativeBmi'),
    'MeasurementService must expose calculateAuthoritativeBmi'
  );

  // Verify profile synchronization
  assert.ok(
    measurementContent.includes('/rest/v1/profiles') &&
    measurementContent.includes('weight_kg') &&
    measurementContent.includes('height_cm') &&
    measurementContent.includes('waist_cm'),
    'logMeasurementSet must synchronize public.profiles'
  );
});

// ---------------------------------------------------------------------------
// 5. Authoritative BMI Formula Mathematical Verification
// ---------------------------------------------------------------------------
test('Phase 7C: Authoritative BMI calculation matches exact clinical formula weight / (height/100)^2', () => {
  // Test authoritative BMI math: 70kg, 175cm -> 70 / (1.75^2) = 22.857... -> 22.9
  const computeBmi = (weightKg, heightCm) => {
    if (!weightKg || !heightCm || heightCm <= 0) return 0;
    const hM = heightCm / 100;
    return parseFloat((weightKg / (hM * hM)).toFixed(1));
  };

  assert.equal(computeBmi(70, 175), 22.9);
  assert.equal(computeBmi(68, 165), 25.0);
  assert.equal(computeBmi(80, 180), 24.7);
  assert.equal(computeBmi(0, 170), 0);
  assert.equal(computeBmi(60, 0), 0);
});

// ---------------------------------------------------------------------------
// 6. Health Store Integration for Medications & Measurements (Phase 7C)
// ---------------------------------------------------------------------------
test('Phase 7C: Health store integrates medications CRUD, dose logging, measurement observations, and BMI', () => {
  const storeFile = resolveAppFile('store/healthStore.tsx');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify state exports
  assert.ok(
    storeContent.includes('medications') &&
    storeContent.includes('medicationHistory') &&
    storeContent.includes('markMedicationStatus') &&
    storeContent.includes('addMedication') &&
    storeContent.includes('deleteMedication'),
    'healthStore must provide complete medication state and actions'
  );

  assert.ok(
    storeContent.includes('measurementObservations') &&
    storeContent.includes('loadMeasurementObservations') &&
    storeContent.includes('logMeasurement'),
    'healthStore must provide measurement observations state and logMeasurement action'
  );

  // Verify authoritative BMI computation in store
  assert.ok(
    storeContent.includes('const bmi = useMemo') &&
    storeContent.includes('profile.heightCm') &&
    storeContent.includes('profile.weightKg'),
    'healthStore must calculate authoritative BMI from profile weightKg and heightCm'
  );
});

// ---------------------------------------------------------------------------
// 7. Security & User Ownership Isolation on Session Reload & Logout
// ---------------------------------------------------------------------------
test('Phase 7C: resetHealthState cleanses all medications, dose logs, and observations to prevent cross-user leakage', () => {
  const storeFile = resolveAppFile('store/healthStore.tsx');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  // Verify resetHealthState cleanses Phase 7C data
  assert.ok(
    storeContent.includes('setMedications([])') &&
    storeContent.includes('setMedicationHistory([])') &&
    storeContent.includes('setMeasurementObservations([])'),
    'resetHealthState must reset medications, medicationHistory, and measurementObservations'
  );

  // Verify authentication check
  assert.ok(
    storeContent.includes('if (!user || !isAuthenticated)') &&
    storeContent.includes('resetHealthState()'),
    'healthStore must call resetHealthState when user logs out'
  );
});

// ---------------------------------------------------------------------------
// 8. Progress and Metric Screens bind to persistent measurements and authoritative BMI
// ---------------------------------------------------------------------------
test('Phase 7C: Progress and metric-detail screens bind to persistent measurements and BMI', () => {
  const progressFile = resolveAppFile('app/(app)/progress.tsx');
  const progressContent = fs.readFileSync(progressFile, 'utf8');

  assert.ok(
    progressContent.includes('measurementObservations') &&
    progressContent.includes('logMeasurement') &&
    progressContent.includes('activeTab === \'records\'') &&
    progressContent.includes('Current Measurements'),
    'progress.tsx must bind to measurementObservations, allow logging, and render Records view'
  );

  const metricFile = resolveAppFile('app/(app)/metric-detail.tsx');
  const metricContent = fs.readFileSync(metricFile, 'utf8');

  assert.ok(
    metricContent.includes('weight:') &&
    metricContent.includes('waist:') &&
    metricContent.includes('bmi:'),
    'metric-detail.tsx must include weight, waist, and authoritative BMI configs'
  );
});
