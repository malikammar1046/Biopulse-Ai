/**
 * BioPulse Mobile — Phase 12 Production Data States Test Suite
 *
 * Verifies:
 * 1. Loading States:
 *    - Initial loading indicators across all backend-connected dashboards and screens
 *    - RefreshControl (pull-to-refresh) wired across all core ScrollViews
 *    - Form submission state flags (isSaving / isSubmitting)
 * 2. Empty States:
 *    - Clear, actionable empty states when persistent tables contain 0 records
 *    - Zero fake fallback health data or fabricated demo records
 * 3. Error Handling & Normalization:
 *    - Network failure (status 0, connection refused / offline)
 *    - Server error (status 500)
 *    - Authentication failure (status 401)
 *    - Validation error (status 400 / 422)
 *    - Timeout (status 408)
 *    - Malformed response (non-JSON payload)
 * 4. Retry Capabilities:
 *    - Error banners offer retry actions across all tracking and clinical modules
 * 5. Session Expiration Protocol:
 *    - 401 triggers global auth failure notification bus
 *    - Session is safely cleared (user set to null, logout)
 *    - Route protection automatically redirects unauthenticated users to /(auth)/login
 *    - Cascading unauthorized requests are blocked
 * 6. Offline Architecture Truthfulness:
 *    - Truthful declaration of capabilities (offline read cache vs live clinical mutations)
 *    - No false claims of full offline database write synchronization
 *    - Graceful messaging provided to the user
 * 7. Zero Fabricated Fallback Invariant:
 *    - Backend failures never replace clinical state with fake mock data
 *    - Sparklines render safely without NaN or fabricated historical points
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
// TEST 1: API Error Classification & Normalization in api.ts
// ============================================================================
test('Phase 12: API client defines and normalizes all production error types correctly', () => {
  const apiPath = resolveMobileFile('services/api.ts');
  assert.ok(fs.existsSync(apiPath), 'api.ts must exist');

  const content = fs.readFileSync(apiPath, 'utf8');

  // Verify error classification helpers exist and are exported
  assert.ok(
    content.includes('export function isNetworkOfflineError'),
    'api.ts must export isNetworkOfflineError'
  );
  assert.ok(
    content.includes('export function isAuthExpiredError'),
    'api.ts must export isAuthExpiredError'
  );
  assert.ok(
    content.includes('export function isValidationError'),
    'api.ts must export isValidationError'
  );
  assert.ok(
    content.includes('export function isServerError'),
    'api.ts must export isServerError'
  );
  assert.ok(
    content.includes('export function isTimeoutError'),
    'api.ts must export isTimeoutError'
  );
  assert.ok(
    content.includes('export function isMalformedResponseError'),
    'api.ts must export isMalformedResponseError'
  );

  // Verify normalizeResponse handles malformed body and maps to 422
  assert.ok(
    content.includes('Malformed response received from server. Please try again.') &&
      content.includes('status: 422'),
    'normalizeResponse must normalize malformed non-JSON payloads to status 422 with clear message'
  );

  // Verify safeRequest handles AbortError timeout
  assert.ok(
    content.includes("err?.name === 'AbortError'") &&
      content.includes('status: 408'),
    'safeRequest must map AbortError to status 408 timeout'
  );

  // Verify safeRequest handles general network failure
  assert.ok(
    content.includes('status: 0') &&
      content.includes('Network error occurred while contacting server'),
    'safeRequest must map network exceptions to status 0'
  );
});

// ============================================================================
// TEST 2: Session Expiration & Route Redirection Protocol
// ============================================================================
test('Phase 12: Session expiration safely notifies listeners, blocks unauthorized calls, and redirects to login', () => {
  const apiContent = fs.readFileSync(resolveMobileFile('services/api.ts'), 'utf8');

  // 1. Event bus defined in api.ts
  assert.ok(
    apiContent.includes('registerAuthFailureListener') &&
      apiContent.includes('notifyAuthFailure') &&
      apiContent.includes('isAuthExpired') &&
      apiContent.includes('setAuthExpired'),
    'api.ts must provide global auth failure event bus'
  );

  // 2. 401 triggers notifyAuthFailure()
  assert.ok(
    apiContent.includes('res.status === 401') && apiContent.includes('notifyAuthFailure()'),
    'normalizeResponse must notify auth failure on 401 response'
  );

  // 3. safeRequest halts cascading unauthorized calls
  assert.ok(
    apiContent.includes('isSessionExpired') &&
      apiContent.includes('User session has expired. Please sign in again.') &&
      apiContent.includes('status: 401'),
    'safeRequest must block cascading unauthorized requests when session is expired'
  );

  // 4. AuthContext registers listener and calls logoutUser() + setUser(null)
  const authContextContent = fs.readFileSync(resolveMobileFile('features/authentication/AuthContext.tsx'), 'utf8');
  assert.ok(
    authContextContent.includes('registerAuthFailureListener'),
    'AuthContext must subscribe to registerAuthFailureListener'
  );
  assert.ok(
    authContextContent.includes('logoutUser') && authContextContent.includes('setUser(null)'),
    'AuthContext must log out user and clear state on auth failure'
  );

  // 5. App route layout enforces automatic redirect to /(auth)/login
  const layoutContent = fs.readFileSync(resolveMobileFile('app/(app)/_layout.tsx'), 'utf8');
  assert.ok(
    layoutContent.includes('<Redirect href="/(auth)/login" />'),
    'app/(app)/_layout.tsx must automatically redirect unauthenticated user to /(auth)/login'
  );
});

// ============================================================================
// TEST 3: Offline Architecture Truthfulness
// ============================================================================
test('Phase 12: Truthfully declares offline capabilities without false claims of full offline sync', () => {
  const apiContent = fs.readFileSync(resolveMobileFile('services/api.ts'), 'utf8');

  // Verify strict truthfulness
  assert.ok(
    apiContent.includes('supportsOfflineReading: true'),
    'Offline reading of persistent local cache must be supported'
  );
  assert.ok(
    apiContent.includes('supportsOfflineMutations: false'),
    'Must NOT falsely claim offline mutations are supported without full sync queue'
  );
  assert.ok(
    apiContent.includes('cachingLayer') && apiContent.includes('persistentStorage'),
    'Must declare persistentStorage as the caching layer'
  );
  assert.ok(
    apiContent.includes('gracefulOfflineMessage') &&
      apiContent.includes('You appear to be offline'),
    'Must provide a clear, empathetic offline message to the user'
  );
});

// ============================================================================
// TEST 4: Initial Loading & Pull-to-Refresh across All Screens
// ============================================================================
test('Phase 12: Every backend-connected screen implements RefreshControl and initial loading indicator', () => {
  const screensToVerify = [
    { file: 'app/(app)/progress.tsx', refreshFunc: 'handleRefresh', loaderCheck: 'isRefreshing' },
    { file: 'app/(app)/nutrition.tsx', refreshFunc: 'loadNutritionData', loaderCheck: 'isLoadingNutrition' },
    { file: 'app/(app)/movement.tsx', refreshFunc: 'loadMovementData', loaderCheck: 'isLoadingMovement' },
    { file: 'app/(app)/cycle-tracking.tsx', refreshFunc: 'loadCycleData', loaderCheck: 'isLoadingCycle' },
    { file: 'app/(app)/symptom-log.tsx', refreshFunc: 'loadSymptoms', loaderCheck: 'isLoadingSymptoms' },
    { file: 'app/(app)/medications.tsx', refreshFunc: 'loadMedications', loaderCheck: 'isLoadingMedications' },
    { file: 'app/(app)/water-log.tsx', refreshFunc: 'loadWaterData', loaderCheck: 'isLoadingWater' },
    { file: 'app/(app)/appointments.tsx', refreshFunc: 'loadAppointments', loaderCheck: 'isLoadingAppointments' },
    { file: 'app/(app)/care-circle.tsx', refreshFunc: 'loadCareCircle', loaderCheck: 'isLoadingCareCircle' },
    { file: 'app/(app)/reports.tsx', refreshFunc: 'loadReports', loaderCheck: 'isLoadingReports' },
    { file: 'app/(app)/notifications.tsx', refreshFunc: 'loadNotifications', loaderCheck: 'isLoadingNotifications' },
    { file: 'app/(app)/profile.tsx', refreshFunc: 'loadMeasurementObservations', loaderCheck: 'isLoadingMeasurements' },
  ];

  for (const { file, refreshFunc, loaderCheck } of screensToVerify) {
    const fullPath = resolveMobileFile(file);
    assert.ok(fs.existsSync(fullPath), `Screen ${file} must exist`);

    const content = fs.readFileSync(fullPath, 'utf8');

    // 1. RefreshControl imported and configured
    assert.ok(
      content.includes('RefreshControl'),
      `Screen ${file} must import and use RefreshControl`
    );
    assert.ok(
      content.includes('refreshControl='),
      `Screen ${file} must configure refreshControl prop on ScrollView`
    );
    assert.ok(
      content.includes(refreshFunc),
      `Screen ${file} refreshControl must call ${refreshFunc}`
    );

    // 2. Loading state checking
    assert.ok(
      content.includes(loaderCheck),
      `Screen ${file} must reference loading flag ${loaderCheck}`
    );
  }

  // Also verify female and male dashboard overviews have initial loading spinners
  const femaleDash = fs.readFileSync(resolveMobileFile('components/dashboard/FemaleDashboardOverview.tsx'), 'utf8');
  assert.ok(
    femaleDash.includes('ActivityIndicator') && femaleDash.includes('Loading Health Dashboard'),
    'Female dashboard must render initial loading state with ActivityIndicator'
  );

  const maleDash = fs.readFileSync(resolveMobileFile('components/dashboard/MaleDashboardOverview.tsx'), 'utf8');
  assert.ok(
    maleDash.includes('ActivityIndicator') && maleDash.includes('Loading Health Dashboard'),
    'Male dashboard must render initial loading state with ActivityIndicator'
  );
});

// ============================================================================
// TEST 5: Actionable Empty States across Core Screens
// ============================================================================
test('Phase 12: Every screen presents a useful, actionable empty state when no data exists', () => {
  // 1. Nutrition: Empty meal log state with "Log a Meal" button
  const nutrition = fs.readFileSync(resolveMobileFile('app/(app)/nutrition.tsx'), 'utf8');
  assert.ok(
    nutrition.includes('No meals logged') &&
      nutrition.includes('Log a Meal') &&
      nutrition.includes('View Meal Plan'),
    'Nutrition must render actionable empty state with CTAs'
  );

  // 2. Medications: Empty medications state with "Add Medication" button
  const meds = fs.readFileSync(resolveMobileFile('app/(app)/medications.tsx'), 'utf8');
  assert.ok(
    meds.includes('No medications scheduled') || meds.includes('No medications added yet'),
    'Medications must render empty state'
  );

  // 3. Appointments: Empty appointments state with "Find Specialist" button
  const apts = fs.readFileSync(resolveMobileFile('app/(app)/appointments.tsx'), 'utf8');
  assert.ok(
    apts.includes('No Upcoming Appointments') && apts.includes('Find Specialist'),
    'Appointments must render empty state with find specialist CTA'
  );

  // 4. Care Circle: Empty care circle with "Invite someone" button
  const care = fs.readFileSync(resolveMobileFile('app/(app)/care-circle.tsx'), 'utf8');
  assert.ok(
    care.includes('No Members Connected') && care.includes('Invite someone'),
    'Care Circle must render empty state with invite CTA'
  );

  // 5. Reports: Empty reports with "Start Assessment" CTA
  const reports = fs.readFileSync(resolveMobileFile('app/(app)/reports.tsx'), 'utf8');
  assert.ok(
    reports.includes('No Reports Available') && reports.includes('Start Assessment'),
    'Reports must render empty state with start assessment CTA'
  );

  // 6. Notifications: Empty notifications message
  const notifs = fs.readFileSync(resolveMobileFile('app/(app)/notifications.tsx'), 'utf8');
  assert.ok(
    notifs.includes('No Notifications Yet'),
    'Notifications must render empty state'
  );
});

// ============================================================================
// TEST 6: User-Facing Error Banners and Retry Handlers
// ============================================================================
test('Phase 12: Screens render error banners and provide retry buttons to recover from failure', () => {
  const screensWithRetry = [
    { file: 'app/(app)/nutrition.tsx', errorProp: 'nutritionError', retryCall: 'loadNutritionData' },
    { file: 'app/(app)/movement.tsx', errorProp: 'movementError', retryCall: 'loadMovementData' },
    { file: 'app/(app)/cycle-tracking.tsx', errorProp: 'cycleError', retryCall: 'loadCycleData' },
    { file: 'app/(app)/symptom-log.tsx', errorProp: 'symptomError', retryCall: 'loadSymptoms' },
    { file: 'app/(app)/appointments.tsx', errorProp: 'appointmentError', retryCall: 'loadAppointments' },
    { file: 'app/(app)/care-circle.tsx', errorProp: 'careCircleError', retryCall: 'loadCareCircle' },
    { file: 'app/(app)/medications.tsx', errorProp: 'medicationError', retryCall: 'loadMedications' },
  ];

  for (const { file, errorProp, retryCall } of screensWithRetry) {
    const content = fs.readFileSync(resolveMobileFile(file), 'utf8');
    assert.ok(
      content.includes(errorProp),
      `Screen ${file} must monitor error property ${errorProp}`
    );
    assert.ok(
      content.includes('Retry') || content.includes('retryBtn'),
      `Screen ${file} must render Retry button on error`
    );
    assert.ok(
      content.includes(retryCall),
      `Screen ${file} must invoke ${retryCall} on retry press`
    );
  }
});

// ============================================================================
// TEST 7: Zero Fake Health Data / Zero Fallback Demo Records Invariant
// ============================================================================
test('Phase 12: Strictly prohibits fake fallback health data and fabricated historical values', () => {
  const progressContent = fs.readFileSync(resolveMobileFile('app/(app)/progress.tsx'), 'utf8');

  // Verify that fake fallback numbers were eliminated from sparklines
  assert.strictEqual(
    progressContent.includes('[30, 40, 55, 60, 58, 62, 65]'),
    false,
    'progress.tsx must NOT contain hardcoded fake sparkline points for weight'
  );
  assert.strictEqual(
    progressContent.includes('[90, 85, 88, 82, 80, 81, 79]'),
    false,
    'progress.tsx must NOT contain hardcoded fake sparkline points for waist'
  );
  assert.strictEqual(
    progressContent.includes("'14 Sep 2026'"),
    false,
    'progress.tsx must NOT contain hardcoded fake observation dates'
  );

  // Verify MiniSparkline renders cleanly when points are empty or length < 2
  assert.ok(
    progressContent.includes('points.length < 2'),
    'MiniSparkline must safely handle empty or single point datasets without crashing'
  );

  // Verify clean truthful text when unrecorded
  assert.ok(
    progressContent.includes("'Not tested'") &&
      progressContent.includes("'Not logged'") &&
      progressContent.includes("'Not screened'"),
    'progress.tsx must display truthful status strings when data is absent'
  );
});
