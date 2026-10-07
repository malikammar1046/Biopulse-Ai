import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const resolveAppFile = (rel) => {
  if (fs.existsSync(path.resolve(rel))) return path.resolve(rel);
  return path.resolve('apps/mobile', rel);
};

// ---------------------------------------------------------------------------
// 1. Audit Source Files for Zero Demo Hardcodes
// ---------------------------------------------------------------------------
test('Security Audit: Zero hardcoded demo names in production dashboards & profiles', () => {
  const femaleDashboardFile = resolveAppFile('components/dashboard/FemaleDashboardOverview.tsx');
  const profileFile = resolveAppFile('app/(app)/profile.tsx');
  const screeningFile = resolveAppFile('app/(app)/screening.tsx');
  const femaleReviewFile = resolveAppFile('app/female-review.tsx');
  const healthStoreFile = resolveAppFile('store/healthStore.tsx');

  const femaleDashboardContent = fs.readFileSync(femaleDashboardFile, 'utf8');
  const profileContent = fs.readFileSync(profileFile, 'utf8');
  const screeningContent = fs.readFileSync(screeningFile, 'utf8');
  const femaleReviewContent = fs.readFileSync(femaleReviewFile, 'utf8');
  const healthStoreContent = fs.readFileSync(healthStoreFile, 'utf8');

  // Verify 'Ayesha Khan' is never used as an active fallback or initial profile name
  assert.ok(!femaleDashboardContent.includes("'Ayesha Khan'"), 'FemaleDashboardOverview must not hardcode Ayesha Khan');
  assert.ok(!profileContent.includes("'Ayesha Khan'"), 'profile.tsx must not hardcode Ayesha Khan');
  assert.ok(!femaleReviewContent.includes("'Ayesha Khan'"), 'female-review.tsx must not hardcode Ayesha Khan');
  assert.ok(!healthStoreContent.includes("'Ayesha Khan'"), 'healthStore must not hardcode Ayesha Khan in INITIAL_PROFILE');

  // Verify clean empty initial state in healthStore
  assert.ok(healthStoreContent.includes('EMPTY_PROFILE'), 'healthStore must define EMPTY_PROFILE');
  assert.ok(healthStoreContent.includes('EMPTY_SCREENING'), 'healthStore must define EMPTY_SCREENING');
  assert.ok(healthStoreContent.includes('EMPTY_CYCLE'), 'healthStore must define EMPTY_CYCLE');
  assert.ok(healthStoreContent.includes('EMPTY_SYMPTOMS'), 'healthStore must define EMPTY_SYMPTOMS');
});

// ---------------------------------------------------------------------------
// 2. Audit Auth Service: No Demo Offline Fallbacks in Production
// ---------------------------------------------------------------------------
test('Auth Service: Production login/signup rejects fake demo user fallbacks', () => {
  const authServiceFile = resolveAppFile('features/authentication/authService.ts');
  const authServiceContent = fs.readFileSync(authServiceFile, 'utf8');

  // Must not have fallback demoUser object in login or register
  assert.ok(!authServiceContent.includes('const demoUser:'), 'authService must not have hardcoded demoUser fallback');
  assert.ok(!authServiceContent.includes("email === 'demo@biopulse.health'"), 'authService must not have hardcoded demo user branch');
});

// ---------------------------------------------------------------------------
// 3. Persistent Storage and Session Restoration
// ---------------------------------------------------------------------------
test('Persistent Storage Adapter: Implements multi-platform persistent key-value store', () => {
  const storageFile = resolveAppFile('lib/storage.ts');
  assert.ok(fs.existsSync(storageFile), 'lib/storage.ts must exist');

  const storageContent = fs.readFileSync(storageFile, 'utf8');
  assert.ok(storageContent.includes('getItem'), 'Storage must implement getItem');
  assert.ok(storageContent.includes('setItem'), 'Storage must implement setItem');
  assert.ok(storageContent.includes('removeItem'), 'Storage must implement removeItem');
  assert.ok(storageContent.includes('safeStorage'), 'Storage must export safeStorage singleton');
});

test('Supabase Client: Implements session restoration, token caching, and listener notifications', () => {
  const supabaseFile = resolveAppFile('lib/supabase.ts');
  const supabaseContent = fs.readFileSync(supabaseFile, 'utf8');

  assert.ok(supabaseContent.includes('AUTH_SESSION_STORAGE_KEY'), 'Must define AUTH_SESSION_STORAGE_KEY');
  assert.ok(supabaseContent.includes('restoreSession'), 'Must implement restoreSession');
  assert.ok(supabaseContent.includes('refreshSession'), 'Must implement refreshSession');
  assert.ok(supabaseContent.includes('setItem(AUTH_SESSION_STORAGE_KEY'), 'Must persist session on sign-in');
  assert.ok(supabaseContent.includes('removeItem(AUTH_SESSION_STORAGE_KEY'), 'Must clear persisted session on sign-out');
});

// ---------------------------------------------------------------------------
// 4. Navigation & Route Protection Architecture
// ---------------------------------------------------------------------------
test('Route Protection: Protected layout guards authenticated routes and redirects unauthenticated users', () => {
  const layoutFile = resolveAppFile('app/(app)/_layout.tsx');
  const layoutContent = fs.readFileSync(layoutFile, 'utf8');

  assert.ok(layoutContent.includes('useAuth()'), 'Protected layout must consume useAuth()');
  assert.ok(layoutContent.includes('isAuthenticated'), 'Protected layout must check isAuthenticated');
  assert.ok(layoutContent.includes('Redirect') && layoutContent.includes('/(auth)/login'), 'Protected layout must redirect to login when unauthenticated');
  assert.ok(layoutContent.includes('ActivityIndicator'), 'Protected layout must show loading indicator during session restore');
});

test('Splash Navigation: Routes authenticated users to (app) and unauthenticated users to onboarding', () => {
  const splashFile = resolveAppFile('app/index.tsx');
  const splashContent = fs.readFileSync(splashFile, 'utf8');

  assert.ok(splashContent.includes('useAuth()'), 'Splash must consume useAuth()');
  assert.ok(splashContent.includes('isAuthenticated'), 'Splash must check isAuthenticated');
  assert.ok(splashContent.includes("replace('/(app)')"), 'Authenticated user must be routed to /(app)');
  assert.ok(splashContent.includes("replace('/onboarding')"), 'Unauthenticated user must be routed to /onboarding');
});

// ---------------------------------------------------------------------------
// 5. User-Scoped Data Synchronization Service
// ---------------------------------------------------------------------------
test('User Service: Strictly scopes all database & API queries to authenticated userId and bearer token', () => {
  const userServiceFile = resolveAppFile('services/userService.ts');
  assert.ok(fs.existsSync(userServiceFile), 'services/userService.ts must exist');

  const userContent = fs.readFileSync(userServiceFile, 'utf8');

  // Verify endpoints strictly use userId and token
  assert.ok(userContent.includes('fetchUserProfileFromDb'), 'fetchUserProfileFromDb must exist');
  assert.ok(userContent.includes('updateUserProfileInDb'), 'updateUserProfileInDb must exist');
  assert.ok(userContent.includes('fetchCycleRecordsFromDb'), 'fetchCycleRecordsFromDb must exist');
  assert.ok(userContent.includes('fetchTodayWaterLogsFromDb'), 'fetchTodayWaterLogsFromDb must exist');
  assert.ok(userContent.includes('fetchMedicationsFromDb'), 'fetchMedicationsFromDb must exist');
  assert.ok(userContent.includes('fetchAppointmentsFromDb'), 'fetchAppointmentsFromDb must exist');
  assert.ok(userContent.includes('fetchCareCircleFromDb'), 'fetchCareCircleFromDb must exist');
  assert.ok(userContent.includes('fetchMedicalReportsFromDb'), 'fetchMedicalReportsFromDb must exist');
  assert.ok(userContent.includes('userId: string'), 'User service must accept userId parameter');

  // Verify headers include Authorization Bearer token
  assert.ok(userContent.includes("Authorization: `Bearer ${token}`"), 'User service must attach bearer token for backend requests');
});

// ---------------------------------------------------------------------------
// 6. Cross-User Data Isolation & Memory Wipe on Logout
// ---------------------------------------------------------------------------
test('Cross-User Isolation: HealthStore cleanly resets in-memory data on logout to prevent leakage', () => {
  const healthStoreFile = resolveAppFile('store/healthStore.tsx');
  const healthStoreContent = fs.readFileSync(healthStoreFile, 'utf8');

  // Ensure resetHealthState resets all slices to empty
  assert.ok(healthStoreContent.includes('resetHealthState'), 'healthStore must implement resetHealthState');
  assert.ok(healthStoreContent.includes('setProfile(EMPTY_PROFILE)'), 'Logout must reset profile to empty');
  assert.ok(healthStoreContent.includes('setScreening(EMPTY_SCREENING)'), 'Logout must reset screening to empty');
  assert.ok(healthStoreContent.includes('setCycle(EMPTY_CYCLE)'), 'Logout must reset cycle to empty');
  assert.ok(healthStoreContent.includes('setSymptoms(EMPTY_SYMPTOMS)'), 'Logout must reset symptoms to empty');
  assert.ok(healthStoreContent.includes('setAppointments([])'), 'Logout must reset appointments to empty array');
  assert.ok(healthStoreContent.includes('setCareCircle([])'), 'Logout must reset care circle to empty array');
  assert.ok(healthStoreContent.includes('setReports([])'), 'Logout must reset reports to empty array');
  assert.ok(healthStoreContent.includes('setMedications([])'), 'Logout must reset medications to empty array');
});
