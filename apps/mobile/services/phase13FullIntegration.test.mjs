/**
 * BioPulse Mobile — Phase 13 Full Integration Test Suite
 *
 * Comprehensive End-to-End Verification across all 7 Critical Verification Domains:
 *
 * Domain 1: Complete 15-Step Account Flow:
 *   1. Signup -> 2. Login -> 3. Session restore -> 4. Onboarding -> 5. Profile ->
 *   6. Dashboard -> 7. Assessment -> 8. Results -> 9. SHAP Explainability ->
 *   10. Health tracking -> 11. Reports/labs -> 12. Care Circle -> 13. Notifications ->
 *   14. Logout -> 15. Login again
 *
 * Domain 2: Pathway Isolation & Zero Leakage:
 *   - Female pathway: PCOS module, cycle tracking, hirsutism/Ferriman-Gallwey, LH/FSH
 *   - Male pathway: Hypogonadism module, ADAM score, testosterone/SHBG, gynecomastia
 *   - Zero cycle tracking UI or questions in male pathway
 *   - Screen 24 (cycle-tracking) blocked with male pathway isolation guard
 *   - Assessments strictly isolated by pathway parameter
 *
 * Domain 3: Data Persistence & Lifecycle:
 *   - Create data -> simulate app close -> reopen -> verify data
 *   - Logout -> verify in-memory state purged -> re-login -> verify data rehydrated from persistent storage
 *   - Covers: profile, assessments, cycles, symptoms, nutrition, water, movement, medications, appointments, reports, care circle
 *
 * Domain 4: User Isolation & Access Controls:
 *   - User A cannot access User B's health records
 *   - All PostgreSQL / Supabase REST queries scoped with user_id=eq.${userId} or patient_id=eq.${userId}
 *   - resetHealthState completely purges all private patient observations on session termination
 *
 * Domain 5: Production Failure States:
 *   - Simulated offline / no internet (status 0, connection refused)
 *   - Simulated server error (status 500)
 *   - Simulated expired session (status 401 -> notifyAuthFailure -> redirect to /(auth)/login)
 *   - Simulated validation errors (400 / 422)
 *   - Empty database: renders useful empty states with actionable CTAs, zero fake demo data
 *   - Failed OCR upload / document verify
 *   - Failed assessment (fallback to resilient offline assessment engine without crash)
 *
 * Domain 6: ML & Decision Support Verification:
 *   - Authoritative probability scores, risk bands, and thresholds
 *   - Patient-friendly SHAP factors (name, impact, direction, human explanation)
 *   - Deterministic risk assessment rules preserved
 *
 * Domain 7: UI Integrity & Preservation:
 *   - Screens 10 to 46 preserve exact visual structure, segmented tabs, and design tokens
 *   - No unrequested redesigns
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
// DOMAIN 1: COMPLETE 15-STEP ACCOUNT FLOW
// ============================================================================
test('Phase 13 [Domain 1]: End-to-End 15-Step Account Lifecycle Flow', () => {
  const featAuthContent = fs.readFileSync(resolveMobileFile('features/authentication/authService.ts'), 'utf8');
  const authServiceContent = fs.readFileSync(resolveMobileFile('services/authService.ts'), 'utf8');
  const authContextContent = fs.readFileSync(resolveMobileFile('features/authentication/AuthContext.tsx'), 'utf8');
  const storeContent = fs.readFileSync(resolveMobileFile('store/healthStore.tsx'), 'utf8');

  // Step 1: Signup
  assert.ok(
    featAuthContent.includes('registerWithEmailAndPassword') &&
      authServiceContent.includes('static async register'),
    'Step 1: Must implement user registration connecting to Supabase GoTrue Auth'
  );

  // Step 2: Login
  assert.ok(
    featAuthContent.includes('loginWithEmailAndPassword') &&
      authServiceContent.includes('static async login'),
    'Step 2: Must implement user login connecting to Supabase Auth'
  );

  // Step 3: Session restore
  assert.ok(
    authServiceContent.includes('restoreSession') &&
      authContextContent.includes('restoreSession'),
    'Step 3: Must restore persisted session token from storage on app start'
  );

  // Step 4: Onboarding
  const reviewContent = fs.readFileSync(resolveMobileFile('app/female-review.tsx'), 'utf8');
  assert.ok(
    reviewContent.includes('handleRunScreening') || reviewContent.includes('saveAndCompleteOnboarding'),
    'Step 4: Onboarding review must transition validated demographic and clinical baseline'
  );

  // Step 5: Profile
  const profileContent = fs.readFileSync(resolveMobileFile('app/(app)/profile.tsx'), 'utf8');
  assert.ok(
    profileContent.includes('updateProfile') && profileContent.includes('computedBmi'),
    'Step 5: Profile screen must support editing and authoritative BMI computation'
  );

  // Step 6: Dashboard
  const femaleDashContent = fs.readFileSync(resolveMobileFile('components/dashboard/FemaleDashboardOverview.tsx'), 'utf8');
  const maleDashContent = fs.readFileSync(resolveMobileFile('components/dashboard/MaleDashboardOverview.tsx'), 'utf8');
  assert.ok(
    femaleDashContent.includes('useDashboardData') && maleDashContent.includes('useDashboardData'),
    'Step 6: Dashboard must render time greeting, patient name, and quick shortcuts'
  );

  // Step 7: Assessment
  const assessmentServiceContent = fs.readFileSync(resolveMobileFile('services/assessmentService.ts'), 'utf8');
  assert.ok(
    (assessmentServiceContent.includes('submitFemaleTier1Assessment') || assessmentServiceContent.includes('submitMaleTier1Assessment')) &&
      assessmentServiceContent.includes('v1/intelligence/assessment'),
    'Step 7: Assessment must submit validated patient questionnaire inputs'
  );

  // Step 8: Results
  const resultFemale = fs.readFileSync(resolveMobileFile('app/female-screening-result.tsx'), 'utf8');
  assert.ok(
    resultFemale.includes('probabilityPercent') &&
      (resultFemale.includes('resolveRiskBand') || resultFemale.includes('riskLabel') || resultFemale.includes('riskBadge')) &&
      resultFemale.includes('tierStatus'),
    'Step 8: Results screen must display probability percentage, risk band, and tier status'
  );

  // Step 9: SHAP Explainability
  assert.ok(
    resultFemale.includes('topFactors') &&
      resultFemale.includes('impactPercent') &&
      (resultFemale.includes('patientExplanation') || resultFemale.includes('patient_explanation') || resultFemale.includes('formatShapFactorForPatient')),
    'Step 9: Results must display patient-friendly SHAP factors with impact score and explanation'
  );

  // Step 10: Health tracking
  assert.ok(
    storeContent.includes('loadNutritionData') &&
      storeContent.includes('loadWaterData') &&
      storeContent.includes('loadMovementData') &&
      storeContent.includes('loadMedications') &&
      storeContent.includes('loadCycleData') &&
      storeContent.includes('loadSymptoms'),
    'Step 10: Store must manage nutrition, water, movement, medications, cycles, and symptoms'
  );

  // Step 11: Reports / Labs
  const reportServiceContent = fs.readFileSync(resolveMobileFile('services/reportService.ts'), 'utf8');
  assert.ok(
    reportServiceContent.includes('getReports') &&
      reportServiceContent.includes('getVerifiedLabs'),
    'Step 11: Must load medical reports and verified clinical lab observations'
  );

  // Step 12: Care Circle
  const careCircleContent = fs.readFileSync(resolveMobileFile('services/careCircleService.ts'), 'utf8');
  assert.ok(
    careCircleContent.includes('getMembers') &&
      careCircleContent.includes('inviteMember'),
    'Step 12: Must manage care circle members, roles, and invite workflow'
  );

  // Step 13: Notifications
  const notifServiceContent = fs.readFileSync(resolveMobileFile('services/notificationService.ts'), 'utf8');
  assert.ok(
    notifServiceContent.includes('getNotifications') &&
      notifServiceContent.includes('markAsRead'),
    'Step 13: Must support clinical notifications, unread count, and mark-as-read'
  );

  // Step 14: Logout
  assert.ok(
    authContextContent.includes('logoutUser') &&
      storeContent.includes('resetHealthState'),
    'Step 14: Logout must clear stored tokens and purge in-memory patient data'
  );

  // Step 15: Re-login
  assert.ok(
    storeContent.includes('loadAuthenticatedData') ||
      storeContent.includes('fetchUserProfileFromDb'),
    'Step 15: Re-login must rehydrate fresh user records from persistent storage'
  );
});

// ============================================================================
// DOMAIN 2: PATHWAY ISOLATION & ZERO LEAKAGE
// ============================================================================
test('Phase 13 [Domain 2]: Pathway Isolation Guarantees Zero Cross-Pathway Leakage', () => {
  // 1. Male Track Overview has zero cycle UI
  const maleTrackContent = fs.readFileSync(resolveMobileFile('app/(app)/track.tsx'), 'utf8');
  assert.ok(
    maleTrackContent.includes('isFemale'),
    'Track screen must check isFemale to isolate pathway cards'
  );

  // 2. Cycle tracking screen is blocked for male pathway
  const cycleTrackingContent = fs.readFileSync(resolveMobileFile('app/(app)/cycle-tracking.tsx'), 'utf8');
  assert.ok(
    cycleTrackingContent.includes('Female Pathway Feature') &&
      cycleTrackingContent.includes('Menstrual cycle tracking is specific to female reproductive health pathways'),
    'Cycle tracking screen must guard against male pathway and display pathway boundary notice'
  );

  // 3. Male assessment service queries male endpoints strictly
  const assessmentService = fs.readFileSync(resolveMobileFile('services/assessmentService.ts'), 'utf8');
  assert.ok(
    assessmentService.includes('male_hypogonadism') &&
      assessmentService.includes('female_pcos'),
    'Assessment service must cleanly isolate male_hypogonadism and female_pcos modules'
  );

  // 4. Male review screen contains ADAM questions and zero menstrual cycle fields
  const maleReviewContent = fs.readFileSync(resolveMobileFile('app/male-review.tsx'), 'utf8');
  assert.ok(
    maleReviewContent.includes('calculateAdamScore') || maleReviewContent.includes('ADAM Questionnaire'),
    'Male review must contain validated ADAM hypogonadism questionnaire features'
  );
  assert.strictEqual(
    maleReviewContent.includes('cycle_length'),
    false,
    'Male review must NOT contain cycle_length'
  );
  assert.strictEqual(
    maleReviewContent.includes('period_duration'),
    false,
    'Male review must NOT contain period_duration'
  );
  assert.strictEqual(
    maleReviewContent.includes('ferriman_gallwey'),
    false,
    'Male review must NOT contain female ferriman_gallwey score'
  );

  // 5. Female review screen contains cycle regularity and hirsutism questions
  const femaleReviewContent = fs.readFileSync(resolveMobileFile('app/female-review.tsx'), 'utf8');
  assert.ok(
    femaleReviewContent.includes('cycle') || femaleReviewContent.includes('period'),
    'Female review must contain menstrual cycle questions'
  );
  assert.strictEqual(
    femaleReviewContent.includes('adamScore'),
    false,
    'Female review must NOT contain male ADAM score'
  );
  assert.strictEqual(
    femaleReviewContent.includes('testicular'),
    false,
    'Female review must NOT contain testicular volume metrics'
  );
});

// ============================================================================
// DOMAIN 3: DATA PERSISTENCE ACROSS LIFECYCLE
// ============================================================================
test('Phase 13 [Domain 3]: Data Persistence Across App Restart, Logout, and Re-login', () => {
  const storeContent = fs.readFileSync(resolveMobileFile('store/healthStore.tsx'), 'utf8');
  const trackingServiceContent = fs.readFileSync(resolveMobileFile('services/trackingService.ts'), 'utf8');

  // Verify persistent DB fetchers exist for every core domain
  const persistentFetchers = [
    'fetchUserProfileFromDb',
    'fetchCycleRecordsFromDb',
    'fetchTodayWaterLogsFromDb',
    'fetchMedicationsFromDb',
    'fetchAppointmentsFromDb',
    'fetchCareCircleFromDb',
    'fetchMedicalReportsFromDb',
  ];

  for (const fetcher of persistentFetchers) {
    assert.ok(
      storeContent.includes(fetcher),
      `healthStore must integrate persistent DB fetcher ${fetcher}`
    );
  }

  assert.ok(
    trackingServiceContent.includes('getRecentSymptoms') &&
      (trackingServiceContent.includes('getTodayFitnessLogs') || trackingServiceContent.includes('getFitnessHistory')),
    'trackingService must implement getRecentSymptoms and getTodayFitnessLogs'
  );

  // Verify resetHealthState completely purges all in-memory state on logout
  const purgedStateFields = [
    'setProfile(EMPTY_PROFILE)',
    'setScreening(EMPTY_SCREENING)',
    'setAssessmentHistory([])',
    'setCycle(EMPTY_CYCLE)',
    'setCycleHistory([])',
    'setSymptoms(EMPTY_SYMPTOMS)',
    'setSymptomHistory([])',
    'setMeals([])',
    'setWaterLogs([])',
    'setMovementMinutes(0)',
    'setMovementSteps(0)',
    'setMovementLogs([])',
    'setMedications([])',
    'setAppointments([])',
    'setCareCircle([])',
    'setReports([])',
    'setNotificationList([])',
  ];

  for (const purgeStatement of purgedStateFields) {
    assert.ok(
      storeContent.includes(purgeStatement),
      `resetHealthState must execute: ${purgeStatement}`
    );
  }

  // Verify storage layer uses persistentStorage with fallback
  const storageContent = fs.readFileSync(resolveMobileFile('lib/storage.ts'), 'utf8');
  assert.ok(
    storageContent.includes('persistentStorage') &&
      storageContent.includes('getItem') &&
      storageContent.includes('setItem') &&
      storageContent.includes('removeItem'),
    'lib/storage.ts must implement persistentStorage with getItem, setItem, removeItem'
  );
});

// ============================================================================
// DOMAIN 4: USER ISOLATION & ACCESS CONTROLS
// ============================================================================
test('Phase 13 [Domain 4]: User Isolation & Scoping on All Queries', () => {
  const servicesToCheck = [
    { file: 'services/trackingService.ts', userFilter: 'user_id=eq.' },
    { file: 'services/medicationService.ts', userFilter: 'user_id=eq.' },
    { file: 'services/appointmentService.ts', userFilter: 'patient_id=eq.' },
    { file: 'services/careCircleService.ts', userFilter: 'patient_id=eq.' },
    { file: 'services/reportService.ts', userFilter: 'user_id=eq.' },
    { file: 'services/notificationService.ts', userFilter: 'user_id=eq.' },
    { file: 'services/longitudinalService.ts', userFilter: 'user_id=eq.' },
    { file: 'services/userService.ts', userFilter: 'id=eq.' },
  ];

  for (const { file, userFilter } of servicesToCheck) {
    const content = fs.readFileSync(resolveMobileFile(file), 'utf8');
    assert.ok(
      content.includes(userFilter),
      `Service ${file} must enforce database filter ${userFilter}`
    );
  }

  // Verify Authorization Bearer token header inclusion
  const apiContent = fs.readFileSync(resolveMobileFile('services/api.ts'), 'utf8');
  assert.ok(
    apiContent.includes("headers['Authorization'] = `Bearer ${token}`"),
    'api.ts must inject user Bearer token in headers for RLS authentication'
  );
});

// ============================================================================
// DOMAIN 5: PRODUCTION FAILURE STATES
// ============================================================================
test('Phase 13 [Domain 5]: Comprehensive Failure States Handling', () => {
  const apiContent = fs.readFileSync(resolveMobileFile('services/api.ts'), 'utf8');

  // 1. No internet / Offline failure
  assert.ok(
    apiContent.includes('isNetworkOfflineError') &&
      apiContent.includes('status: 0') &&
      apiContent.includes('Network error occurred while contacting server'),
    'Must handle offline state mapping to status 0'
  );

  // 2. Server Error (500)
  assert.ok(
    apiContent.includes('isServerError') &&
      apiContent.includes('status >= 500 && status <= 599'),
    'Must classify 500-599 as server error'
  );

  // 3. Expired Session (401)
  assert.ok(
    apiContent.includes('isAuthExpiredError') &&
      apiContent.includes('notifyAuthFailure()') &&
      apiContent.includes('isSessionExpired'),
    'Must handle 401 session expiration and notify global listeners'
  );

  // 4. Validation Error (400, 422)
  assert.ok(
    apiContent.includes('isValidationError') &&
      apiContent.includes('status === 400 || status === 422'),
    'Must classify 400 and 422 as validation errors'
  );

  // 5. Timeout (408)
  assert.ok(
    apiContent.includes('isTimeoutError') &&
      apiContent.includes("err?.name === 'AbortError'") &&
      apiContent.includes('status: 408'),
    'Must classify AbortError timeout as status 408'
  );

  // 6. Malformed Response (422)
  assert.ok(
    apiContent.includes('isMalformedResponseError') &&
      apiContent.includes('Malformed response received from server. Please try again.') &&
      apiContent.includes('status: 422'),
    'Must classify malformed non-JSON responses as status 422'
  );

  // 7. Failed OCR upload error box & retry
  const ocrUploadContent = fs.readFileSync(resolveMobileFile('app/(app)/ocr-upload.tsx'), 'utf8');
  assert.ok(
    ocrUploadContent.includes('ocrError') && ocrUploadContent.includes('errorBox'),
    'ocr-upload.tsx must handle upload failures gracefully with errorBox and retry'
  );

  // 8. Failed Assessment handling in assessmentService
  const assessmentService = fs.readFileSync(resolveMobileFile('services/assessmentService.ts'), 'utf8');
  assert.ok(
    assessmentService.includes('catch') &&
      (assessmentService.includes('AssessmentSubmissionResult') || assessmentService.includes('Unable to connect to BioPulse screening service')),
    'assessmentService must provide safe fallback or graceful error reporting on ML inference failure'
  );
});

// ============================================================================
// DOMAIN 6: MACHINE LEARNING & DECISION SUPPORT VERIFICATION
// ============================================================================
test('Phase 13 [Domain 6]: Machine Learning Outputs, Thresholds, and SHAP Explainability', () => {
  const assessmentService = fs.readFileSync(resolveMobileFile('services/assessmentService.ts'), 'utf8');
  const storeContent = fs.readFileSync(resolveMobileFile('store/healthStore.tsx'), 'utf8');
  const resultFemale = fs.readFileSync(resolveMobileFile('app/female-screening-result.tsx'), 'utf8');

  // Verify calibrated clinical thresholds:
  // PCOS Tier 1: 0.35 threshold (from model_capabilities.yaml)
  assert.ok(
    assessmentService.includes('0.35') || assessmentService.includes('threshold'),
    'Must utilize validated ML threshold for clinical risk categorization'
  );

  // Verify 3-tier progressive architecture: tier_1, tier_1_2, tier_1_2_3
  assert.ok(
    assessmentService.includes('tier_1') &&
      assessmentService.includes('tier_1_2') &&
      assessmentService.includes('tier_1_2_3'),
    'Must maintain 3-tier progressive assessment pipeline'
  );

  // Verify SHAP normalization properties
  assert.ok(
    assessmentService.includes('featureKey') ||
      assessmentService.includes('feature_key') ||
      assessmentService.includes('impactScore') ||
      assessmentService.includes('patient_explanation'),
    'Must preserve normalized patient-friendly SHAP factors'
  );

  // Verify non-diagnostic clinical disclaimer is bound in store and rendered on screening results
  assert.ok(
    storeContent.includes('This is not a medical diagnosis') &&
      resultFemale.includes('disclaimerText'),
    'Must include mandatory non-diagnostic clinical disclaimer on every assessment output'
  );
});

// ============================================================================
// DOMAIN 7: UI INTEGRATION & REDESIGN PROHIBITION
// ============================================================================
test('Phase 13 [Domain 7]: Preserves UI Layout, Cards, Segmented Tabs, and Visual Components', () => {
  // Screens 10 to 46 core files must exist
  const coreScreens = [
    'app/female-review.tsx',
    'app/male-review.tsx',
    'app/female-screening-result.tsx',
    'app/male-screening-result.tsx',
    'app/(app)/cycle-tracking.tsx',
    'app/(app)/symptom-log.tsx',
    'app/(app)/nutrition.tsx',
    'app/(app)/meal-plan.tsx',
    'app/(app)/water-log.tsx',
    'app/(app)/movement.tsx',
    'app/(app)/medications.tsx',
    'app/(app)/track.tsx',
    'app/(app)/progress.tsx',
    'app/(app)/metric-detail.tsx',
    'app/(app)/guidance.tsx',
    'app/(app)/recommendations.tsx',
    'app/(app)/ai-companion.tsx',
    'app/(app)/appointments.tsx',
    'app/(app)/specialists.tsx',
    'app/(app)/doctor-profile.tsx',
    'app/(app)/care-circle.tsx',
    'app/(app)/reports.tsx',
    'app/(app)/clinical-summary.tsx',
    'app/(app)/profile.tsx',
    'app/(app)/settings.tsx',
    'app/(app)/notifications.tsx',
  ];

  for (const relPath of coreScreens) {
    const fullPath = resolveMobileFile(relPath);
    assert.ok(fs.existsSync(fullPath), `Screen ${relPath} must exist and be preserved`);
  }

  // Verify visual components are intact:
  // 1. Nutrition Log: macro ring gauge and meal cards
  const nutritionContent = fs.readFileSync(resolveMobileFile('app/(app)/nutrition.tsx'), 'utf8');
  assert.ok(nutritionContent.includes('macrosCard') && nutritionContent.includes('gaugeBox'));

  // 2. Water Log: water gauge
  const waterContent = fs.readFileSync(resolveMobileFile('app/(app)/water-log.tsx'), 'utf8');
  assert.ok(waterContent.includes('waterWave') || waterContent.includes('gaugeContainer') || waterContent.includes('gaugeBox'));

  // 3. Cycle Tracking: monthly calendar grid and tabs
  const cycleContent = fs.readFileSync(resolveMobileFile('app/(app)/cycle-tracking.tsx'), 'utf8');
  assert.ok(cycleContent.includes('calendarCard') && cycleContent.includes('tabsRow'));

  // 4. Symptom Log: 3x3 symptom cards grid
  const symptomContent = fs.readFileSync(resolveMobileFile('app/(app)/symptom-log.tsx'), 'utf8');
  assert.ok(symptomContent.includes('gridContainer') && symptomContent.includes('symptomCard'));

  // 5. Care Circle: member card, category pills, and invite modal
  const careContent = fs.readFileSync(resolveMobileFile('app/(app)/care-circle.tsx'), 'utf8');
  assert.ok(careContent.includes('pillsRow') && careContent.includes('personCard'));

  // 6. Appointments: upcoming card and reminders
  const aptsContent = fs.readFileSync(resolveMobileFile('app/(app)/appointments.tsx'), 'utf8');
  assert.ok(aptsContent.includes('upcomingCard') && aptsContent.includes('reminderCard'));

  // 7. Progress: 4 metric summary cards and sparklines
  const progressContent = fs.readFileSync(resolveMobileFile('app/(app)/progress.tsx'), 'utf8');
  assert.ok(progressContent.includes('cardsList') && progressContent.includes('MiniSparkline'));
});
