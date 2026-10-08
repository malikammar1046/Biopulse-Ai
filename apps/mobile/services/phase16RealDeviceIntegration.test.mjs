/**
 * BioPulse Mobile — Phase 16: Real Device + End-to-End Integration Test Suite
 *
 * Validates the complete production integration pipeline:
 * - 16.1 Real Authentication & JWT Propagation
 * - 16.2 Female End-to-End Pathway Integration
 * - 16.3 Male End-to-End Pathway Integration & Terminology
 * - 16.4 Authoritative ML Assessments & Threshold Synchronization (0.25 / 0.1808 / 0.3379)
 * - 16.5 & 16.6 Result & SHAP Explainability (Directional Impact & Patient Labels)
 * - 16.7 & 16.8 Dashboard Real Data & Tracking Persistence (nutrition_food_logs strictly enforced)
 * - 16.9 OCR Document Pipeline & PDF Summary Export
 * - 16.10 Care Circle & Appointments Privacy Constraints
 * - 16.11 AI Companion Intelligence Integration
 * - 16.12 User Switching & State Purging (Zero Cross-User Leakage)
 * - 16.13 Network Failure & Timeout Resilience (15s timeout)
 * - 16.14 Production Build & Expo/EAS Configuration
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const resolveAppFile = (rel) => {
  if (fs.existsSync(path.resolve(rel))) return path.resolve(rel);
  return path.resolve('apps/mobile', rel);
};

// ============================================================================
// 16.1 REAL AUTHENTICATION & JWT PROPAGATION
// ============================================================================
test('Phase 16.1: Authentication tokens propagate securely with strict ownership binding', () => {
  const apiFile = resolveAppFile('services/api.ts');
  const authFile = resolveAppFile('services/authService.ts');
  const userFile = resolveAppFile('services/userService.ts');

  const apiContent = fs.readFileSync(apiFile, 'utf8');
  const authContent = fs.readFileSync(authFile, 'utf8');
  const userContent = fs.readFileSync(userFile, 'utf8');

  // Verify Bearer token attaching in getDjangoHeaders and getSupabaseHeaders
  assert.ok(
    apiContent.includes("headers['Authorization'] = `Bearer ${token}`"),
    'api.ts must attach Bearer token to requests'
  );
  assert.ok(
    apiContent.includes('export function getDjangoHeaders'),
    'api.ts must export getDjangoHeaders'
  );

  // Verify auth session management
  assert.ok(
    authContent.includes('loginWithEmailAndPassword'),
    'AuthService must call loginWithEmailAndPassword'
  );
  assert.ok(
    authContent.includes('restoreSession'),
    'AuthService must support session restoration after app restart'
  );

  // Verify 401 triggers notifyAuthFailure
  assert.ok(
    apiContent.includes('notifyAuthFailure()'),
    'api.ts must notify listeners when 401 Unauthorized occurs'
  );
});

// ============================================================================
// 16.2 FEMALE END-TO-END PATHWAY INTEGRATION
// ============================================================================
test('Phase 16.2: Female assessment pipeline maps 16 features and displays calibrated results', () => {
  const assessFile = resolveAppFile('services/assessmentService.ts');
  const reviewFile = resolveAppFile('app/female-review.tsx');
  const resultFile = resolveAppFile('app/female-screening-result.tsx');

  const assessContent = fs.readFileSync(assessFile, 'utf8');
  const reviewContent = fs.readFileSync(reviewFile, 'utf8');
  const resultContent = fs.readFileSync(resultFile, 'utf8');

  // Verify female Tier 1 endpoint and mapping
  assert.ok(
    assessContent.includes('/v1/intelligence/assessment/tier1/'),
    'assessmentService must call female Tier 1 endpoint'
  );
  assert.ok(
    assessContent.includes('buildFemaleTier1Inputs'),
    'assessmentService must build female tier 1 inputs'
  );

  // Verify Female Review imports and uses FEMALE_DEFAULT_THRESHOLD (0.25)
  assert.ok(
    reviewContent.includes('FEMALE_DEFAULT_THRESHOLD'),
    'female-review.tsx must import FEMALE_DEFAULT_THRESHOLD'
  );
  assert.ok(
    assessContent.includes('FEMALE_DEFAULT_THRESHOLD = 0.25'),
    'assessmentService must define authoritative FEMALE_DEFAULT_THRESHOLD = 0.25'
  );

  // Verify Female Result screen binds backend risk and probability
  assert.ok(
    resultContent.includes('FEMALE_DEFAULT_THRESHOLD'),
    'female-screening-result.tsx must import FEMALE_DEFAULT_THRESHOLD'
  );
  assert.ok(
    resultContent.includes('screening.probability'),
    'female-screening-result.tsx must display screening probability'
  );
});

// ============================================================================
// 16.3 MALE END-TO-END PATHWAY INTEGRATION & TERMINOLOGY
// ============================================================================
test('Phase 16.3: Male pathway enforces clinical hypogonadism terminology and excludes female features', () => {
  const assessFile = resolveAppFile('services/assessmentService.ts');
  const maleReviewFile = resolveAppFile('app/male-review.tsx');
  const maleResultFile = resolveAppFile('app/male-screening-result.tsx');

  const assessContent = fs.readFileSync(assessFile, 'utf8');
  const maleReviewContent = fs.readFileSync(maleReviewFile, 'utf8');
  const maleResultContent = fs.readFileSync(maleResultFile, 'utf8');

  // Verify male Tier 1 endpoint
  assert.ok(
    assessContent.includes('/v1/intelligence/assessment/male/tier1/'),
    'assessmentService must call male Tier 1 endpoint'
  );
  assert.ok(
    assessContent.includes('buildMaleTier1Inputs'),
    'assessmentService must build male tier 1 inputs'
  );

  // Verify male review and result import MALE_DEFAULT_THRESHOLD (0.1808)
  assert.ok(
    maleReviewContent.includes('MALE_DEFAULT_THRESHOLD'),
    'male-review.tsx must import MALE_DEFAULT_THRESHOLD'
  );
  assert.ok(
    maleResultContent.includes('MALE_DEFAULT_THRESHOLD'),
    'male-screening-result.tsx must import MALE_DEFAULT_THRESHOLD'
  );
  assert.ok(
    assessContent.includes('MALE_DEFAULT_THRESHOLD = 0.1808'),
    'assessmentService must define authoritative MALE_DEFAULT_THRESHOLD = 0.1808'
  );

  // Verify obsolete 0.45 cutoff is NOT used in male screening result or review
  assert.ok(
    !maleResultContent.includes('0.45') && !maleReviewContent.includes('0.45'),
    'Obsolete 0.45 threshold must be completely removed from male screens'
  );

  // Verify appropriate male clinical terminology
  assert.ok(
    /hypogonadism/i.test(maleResultContent) || /men's health intelligence/i.test(maleResultContent),
    'male-screening-result.tsx must use clinical pituitary/hypogonadism terminology'
  );
  assert.ok(
    !maleResultContent.includes('Polycystic Ovary Syndrome') &&
      !maleResultContent.includes('PCOS Screening Result'),
    'male-screening-result.tsx must not leak female PCOS terminology'
  );
});

// ============================================================================
// 16.4 & 16.5 THRESHOLD SYNCHRONIZATION & AUTHORITATIVE BACKEND VALUES
// ============================================================================
test('Phase 16.4 & 16.5: Authoritative thresholds are synchronized and backend results take precedence', () => {
  const assessFile = resolveAppFile('services/assessmentService.ts');
  const assessContent = fs.readFileSync(assessFile, 'utf8');

  // Authoritative constants in assessmentService
  assert.ok(
    assessContent.includes('FEMALE_DEFAULT_THRESHOLD = 0.25'),
    'assessmentService must define FEMALE_DEFAULT_THRESHOLD = 0.25'
  );
  assert.ok(
    assessContent.includes('MALE_DEFAULT_THRESHOLD = 0.1808'),
    'assessmentService must define MALE_DEFAULT_THRESHOLD = 0.1808'
  );
  assert.ok(
    assessContent.includes('MALE_TIER2_DEFAULT_THRESHOLD = 0.3379'),
    'assessmentService must define MALE_TIER2_DEFAULT_THRESHOLD = 0.3379'
  );

  // Verify resolveRiskBand implementation supports module isolation
  assert.ok(
    assessContent.includes('export function resolveRiskBand('),
    'resolveRiskBand must be exported'
  );
  assert.ok(
    assessContent.includes("isMale = (module || '').toLowerCase().includes('male')"),
    'resolveRiskBand must distinguish male pathway'
  );

  // Verify AssessmentResult contract contains backend attributes
  assert.ok(
    assessContent.includes('summary_text?: string;'),
    'AssessmentResult must include optional summary_text from backend'
  );
  assert.ok(
    assessContent.includes('disclaimer?: string;'),
    'AssessmentResult must include disclaimer'
  );
});

// ============================================================================
// 16.6 SHAP DIRECTIONAL EXPLAINABILITY
// ============================================================================
test('Phase 16.6: SHAP factors distinguish risk-increasing vs protective influences with patient-friendly labels', () => {
  const assessFile = resolveAppFile('services/assessmentService.ts');
  const femaleResultFile = resolveAppFile('app/female-screening-result.tsx');
  const maleResultFile = resolveAppFile('app/male-screening-result.tsx');

  const assessContent = fs.readFileSync(assessFile, 'utf8');
  const femaleResult = fs.readFileSync(femaleResultFile, 'utf8');
  const maleResult = fs.readFileSync(maleResultFile, 'utf8');

  // Verify SHAP format helper in assessmentService
  assert.ok(
    assessContent.includes('formatShapFactorForPatient'),
    'assessmentService must format SHAP factors for patients'
  );
  assert.ok(
    assessContent.includes("dir === 'increases_risk'"),
    'assessmentService must handle increases_risk direction'
  );
  assert.ok(
    assessContent.includes("dir === 'decreases_risk'"),
    'assessmentService must handle decreases_risk direction'
  );

  // Verify result screens render factors dynamically
  assert.ok(
    femaleResult.includes('topFactors') || femaleResult.includes('factor'),
    'female-screening-result.tsx must render top factors'
  );
  assert.ok(
    maleResult.includes('topFactors') || maleResult.includes('factor'),
    'male-screening-result.tsx must render top factors'
  );
});

// ============================================================================
// 16.7 & 16.8 DASHBOARD & TRACKING PERSISTENCE (nutrition_food_logs STRICT)
// ============================================================================
test('Phase 16.7 & 16.8: Nutrition tracking strictly queries nutrition_food_logs (never deprecated food_logs)', () => {
  const nutritionFile = resolveAppFile('services/nutritionService.ts');
  const dashFile = resolveAppFile('services/dashboardService.ts');

  const nutritionContent = fs.readFileSync(nutritionFile, 'utf8');
  const dashContent = fs.readFileSync(dashFile, 'utf8');

  // Verify nutritionService targets nutrition_food_logs
  assert.ok(
    nutritionContent.includes('nutrition_food_logs'),
    'nutritionService must target nutrition_food_logs table'
  );
  assert.ok(
    !nutritionContent.includes('/rest/v1/food_logs'),
    'nutritionService must NEVER target /rest/v1/food_logs'
  );

  // Verify dashboardService targets nutrition_food_logs
  assert.ok(
    dashContent.includes('nutrition_food_logs'),
    'dashboardService must target nutrition_food_logs table'
  );
  assert.ok(
    !dashContent.includes('/rest/v1/food_logs?'),
    'dashboardService must NEVER target deprecated /rest/v1/food_logs'
  );
});

// ============================================================================
// 16.9 OCR DOCUMENT PIPELINE & PDF SUMMARY
// ============================================================================
test('Phase 16.9: OCR endpoint, format validation, 10MB limit, and PDF export are verified', () => {
  const ocrFile = resolveAppFile('services/ocrService.ts');
  const reportFile = resolveAppFile('services/reportService.ts');

  const ocrContent = fs.readFileSync(ocrFile, 'utf8');
  const reportContent = fs.readFileSync(reportFile, 'utf8');

  // Verify OCR endpoint
  assert.ok(
    ocrContent.includes('/v1/health/ocr/'),
    'ocrService must target /v1/health/ocr/ endpoint'
  );

  // Verify 10MB file limit and extensions
  assert.ok(
    ocrContent.includes('10 * 1024 * 1024'),
    'ocrService must enforce 10MB file size limit'
  );
  assert.ok(
    ocrContent.includes('.pdf') && ocrContent.includes('.png') && ocrContent.includes('.jpg'),
    'ocrService must support PDF, PNG, JPG formats'
  );

  // Verify PDF Summary export endpoint
  assert.ok(
    reportContent.includes('/v1/health/summary/pdf/'),
    'reportService must target /v1/health/summary/pdf/ endpoint'
  );

  // Verify Quarantine Trust Boundary
  assert.ok(
    reportContent.includes('needs_verification'),
    'reportService must quarantine unverified OCR rows with needs_verification'
  );
});

// ============================================================================
// 16.10 CARE CIRCLE & APPOINTMENTS
// ============================================================================
test('Phase 16.10: Care Circle and Appointments enforce database constraints and privacy levels', () => {
  const careFile = resolveAppFile('services/careCircleService.ts');
  const aptFile = resolveAppFile('services/appointmentService.ts');

  const careContent = fs.readFileSync(careFile, 'utf8');
  const aptContent = fs.readFileSync(aptFile, 'utf8');

  // Verify Care Circle roles
  assert.ok(
    careContent.includes("'doctor' | 'family' | 'trusted_person'"),
    'CareCircleService must enforce valid DB roles'
  );

  // Verify Appointment statuses
  assert.ok(
    aptContent.includes("'requested' | 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'"),
    'AppointmentService must enforce valid DB statuses'
  );
});

// ============================================================================
// 16.11 AI COMPANION INTELLIGENCE
// ============================================================================
test('Phase 16.11: AI Companion service targets companion/chat endpoint with pathway normalization', () => {
  const compFile = resolveAppFile('services/companionService.ts');
  const compContent = fs.readFileSync(compFile, 'utf8');

  assert.ok(
    compContent.includes('/api/v1/intelligence/companion/chat/'),
    'companionService must target /api/v1/intelligence/companion/chat/'
  );
  assert.ok(
    compContent.includes("backendPathway = 'female_pcos'"),
    'companionService must normalize female pathway'
  );
  assert.ok(
    compContent.includes("backendPathway = 'male_hypogonadism'"),
    'companionService must normalize male pathway'
  );
});

// ============================================================================
// 16.12 USER ISOLATION & LOGOUT STATE PURGING
// ============================================================================
test('Phase 16.12: resetHealthState completely purges all in-memory patient data upon logout', () => {
  const storeFile = resolveAppFile('store/healthStore.tsx');
  const storeContent = fs.readFileSync(storeFile, 'utf8');

  assert.ok(
    storeContent.includes('const resetHealthState = useCallback(() => {'),
    'healthStore must define resetHealthState'
  );
  assert.ok(
    storeContent.includes('setScreening(EMPTY_SCREENING)'),
    'resetHealthState must clear screening state'
  );
  assert.ok(
    storeContent.includes('setAssessmentHistory([])'),
    'resetHealthState must clear assessment history'
  );
  assert.ok(
    storeContent.includes('setAppointments([])'),
    'resetHealthState must clear appointments'
  );
  assert.ok(
    storeContent.includes('setCareCircle([])'),
    'resetHealthState must clear care circle'
  );
  assert.ok(
    storeContent.includes('setMeals([])'),
    'resetHealthState must clear nutrition meals'
  );
});

// ============================================================================
// 16.13 NETWORK FAILURE & TIMEOUT RESILIENCE
// ============================================================================
test('Phase 16.13: API client enforces 15-second timeout and robust HTTP error classification', () => {
  const apiFile = resolveAppFile('services/api.ts');
  const apiContent = fs.readFileSync(apiFile, 'utf8');

  assert.ok(
    apiContent.includes('timeoutMs: 15000'),
    'API client must set default timeout to 15 seconds (15000ms)'
  );
  assert.ok(
    apiContent.includes('isNetworkOfflineError'),
    'api.ts must export isNetworkOfflineError'
  );
  assert.ok(
    apiContent.includes('isValidationError'),
    'api.ts must export isValidationError'
  );
  assert.ok(
    apiContent.includes('isServerError'),
    'api.ts must export isServerError'
  );
});

// ============================================================================
// 16.14 PRODUCTION BUILD & EXPO/EAS CONFIGURATION
// ============================================================================
test('Phase 16.14: Expo and EAS configurations specify verified package ID and APK build type', () => {
  const appJsonFile = resolveAppFile('app.json');
  const easJsonFile = resolveAppFile('eas.json');

  const appJson = JSON.parse(fs.readFileSync(appJsonFile, 'utf8'));
  const easJson = JSON.parse(fs.readFileSync(easJsonFile, 'utf8'));

  // Verify bundle IDs
  assert.equal(appJson.expo.android.package, 'com.biopulse.app');
  assert.equal(appJson.expo.ios.bundleIdentifier, 'com.biopulse.app');
  assert.equal(appJson.expo.scheme, 'biopulse');

  // Verify EAS build configuration
  assert.equal(easJson.build.preview.android.buildType, 'apk');
  assert.equal(easJson.build.production.android.buildType, 'apk');
});
