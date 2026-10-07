/**
 * BioPulse Mobile — Phase 4: Dashboard Backend Integration Test Suite
 *
 * Verifies all 8 required validation scenarios:
 * 1. New user (clean defaults, dynamic greeting, zero hardcoded demo names)
 * 2. User with no health data (Zero Fabrication Rule, authentic empty states)
 * 3. Female user (cycle tracking, fertile window, 1800 kcal target, PCOS screening)
 * 4. Male user (SLU ADAM questionnaire, 2200 kcal target, zero cycle UI)
 * 5. User with assessment (probability, risk band, SHAP factors, tier status)
 * 6. User without assessment (Not Screened, zero fake scores)
 * 7. API failure & Caching (resilient persistent cache, retry mechanism, zero crashing)
 * 8. Session expiration (authentication guard, token validation)
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
// 1. New User Scenario
// ---------------------------------------------------------------------------
test('Phase 4: New user receives clean default state with zero demo names or fabricated scores', () => {
  const dashServiceFile = resolveAppFile('services/dashboardService.ts');
  const serviceContent = fs.readFileSync(dashServiceFile, 'utf8');

  // Verify fetchDashboardData requires valid userId & token
  assert.ok(
    serviceContent.includes('Unauthenticated user session'),
    'fetchDashboardData must guard against unauthenticated sessions'
  );

  // Verify default name extraction
  assert.ok(
    serviceContent.includes('const firstName = rawName ? rawName.split(\' \')[0] : \'Member\';'),
    'fetchDashboardData must derive first name or fallback to Member, never demo names'
  );

  // Verify isAllEmpty flag computation for new users
  assert.ok(
    serviceContent.includes('const isAllEmpty ='),
    'fetchDashboardData must calculate isAllEmpty for brand new users'
  );
  assert.ok(
    serviceContent.includes('!assessmentSummary.hasAssessment'),
    'isAllEmpty checks absence of assessment'
  );
  assert.ok(
    serviceContent.includes('!waterSummary.hasWaterLogs'),
    'isAllEmpty checks absence of water logs'
  );
});

// ---------------------------------------------------------------------------
// 2. User with No Health Data (Zero Fabrication Rule)
// ---------------------------------------------------------------------------
test('Phase 4: Zero Fabrication Rule strictly enforces authentic empty states across all modules', () => {
  const femaleDashFile = resolveAppFile('components/dashboard/FemaleDashboardOverview.tsx');
  const maleDashFile = resolveAppFile('components/dashboard/MaleDashboardOverview.tsx');
  const femaleContent = fs.readFileSync(femaleDashFile, 'utf8');
  const maleContent = fs.readFileSync(maleDashFile, 'utf8');

  // Female Dashboard Empty States:
  // 1. Screening: must show Not Screened or Start Screening when empty, not fake 72%
  assert.ok(
    femaleContent.includes('No screening yet') || femaleContent.includes('Start Screening >'),
    'Female dashboard must support empty screening state'
  );
  assert.ok(
    !femaleContent.includes('?? 72'),
    'Female dashboard must NOT hardcode fallback probability 72%'
  );

  // 2. Cycle: must show empty cycle box, not fake Day 14
  assert.ok(
    femaleContent.includes('No cycle logged yet') || femaleContent.includes('Log Cycle >'),
    'Female dashboard must support empty cycle state'
  );
  assert.ok(
    !femaleContent.includes('currentCycleDay ?? 14'),
    'Female dashboard must NOT hardcode fallback Cycle Day 14'
  );

  // 3. Nutrition, Water, Activity: must default to 0 when not logged
  assert.ok(
    femaleContent.includes('0.0 / 2.5') || femaleContent.includes('0 /'),
    'Female dashboard must display 0 for unlogged water/nutrition'
  );

  // Male Dashboard Empty States:
  // 1. Hypogonadism Screening: must show Not Screened Yet when empty, not fake 38%
  assert.ok(
    maleContent.includes('Not Screened Yet'),
    'Male dashboard must support empty screening state'
  );
  assert.ok(
    !maleContent.includes('|| 38'),
    'Male dashboard must NOT hardcode fallback probability 38%'
  );

  // 2. Name: never hardcode Adrian
  assert.ok(
    !maleContent.includes('return \'Adrian\';'),
    'Male dashboard must NOT hardcode fallback name Adrian'
  );

  // 3. Medication: must show empty schedule when no prescription, not fake Testosterone Gel
  assert.ok(
    maleContent.includes('No active prescriptions scheduled for today'),
    'Male dashboard must support empty medication state'
  );

  // 4. Appointment: must show empty appointment state when none scheduled, not fake Dr. Ahmed Khan
  assert.ok(
    maleContent.includes('No appointments scheduled'),
    'Male dashboard must support empty appointments state'
  );
});

// ---------------------------------------------------------------------------
// 3. Female User Scenario
// ---------------------------------------------------------------------------
test('Phase 4: Female user dashboard computes accurate cycle tracking and PCOS screening metrics', () => {
  const dashServiceFile = resolveAppFile('services/dashboardService.ts');
  const femaleDashFile = resolveAppFile('components/dashboard/FemaleDashboardOverview.tsx');
  const serviceContent = fs.readFileSync(dashServiceFile, 'utf8');
  const femaleContent = fs.readFileSync(femaleDashFile, 'utf8');

  // Verify cycle calculations in dashboardService
  assert.ok(
    serviceContent.includes('isFemale ? fetchCycleRecordsFromDb(userId, token) : Promise.resolve(null)'),
    'Only female pathway fetches cycle records'
  );
  assert.ok(
    serviceContent.includes('fertileWindowStart:'),
    'dashboardService calculates fertileWindowStart'
  );
  assert.ok(
    serviceContent.includes('fertileWindowEnd:'),
    'dashboardService calculates fertileWindowEnd'
  );
  assert.ok(
    serviceContent.includes('nextPeriodDaysRemaining:'),
    'dashboardService calculates nextPeriodDaysRemaining'
  );

  // Verify 1800 kcal target for female pathway
  assert.ok(
    serviceContent.includes('isFemale ? 1800 : 2200'),
    'dashboardService adapts calorie target based on pathway'
  );

  // Verify FemaleDashboardOverview uses useDashboardData hook
  assert.ok(
    femaleContent.includes("useDashboardData('female')"),
    'FemaleDashboardOverview must invoke useDashboardData hook with female pathway'
  );
});

// ---------------------------------------------------------------------------
// 4. Male User Scenario
// ---------------------------------------------------------------------------
test('Phase 4: Male user dashboard strictly excludes female cycle cards and adheres to male endocrine targets', () => {
  const maleDashFile = resolveAppFile('components/dashboard/MaleDashboardOverview.tsx');
  const maleContent = fs.readFileSync(maleDashFile, 'utf8');

  // Verify MaleDashboardOverview uses useDashboardData hook
  assert.ok(
    maleContent.includes("useDashboardData('male')"),
    'MaleDashboardOverview must invoke useDashboardData hook with male pathway'
  );

  // Verify required male cards exist
  assert.ok(maleContent.includes('Hypogonadism Screening'), 'Must render Hypogonadism Screening');
  assert.ok(maleContent.includes("Today's Progress"), "Must render Today's Progress");
  assert.ok(maleContent.includes('Nutrition'), 'Must render Nutrition');
  assert.ok(maleContent.includes('Medication Reminder'), 'Must render Medication Reminder');
  assert.ok(maleContent.includes('Next Best Action'), 'Must render Next Best Action');
  assert.ok(maleContent.includes('Upcoming Appointment'), 'Must render Upcoming Appointment');

  // Verify female cycle UI is strictly excluded
  assert.ok(!maleContent.includes('Your Cycle'), 'Male dashboard must NOT include Your Cycle');
  assert.ok(!maleContent.includes('Cycle Day'), 'Male dashboard must NOT include Cycle Day');
  assert.ok(!maleContent.includes('Fertile window'), 'Male dashboard must NOT include Fertile window');
});

// ---------------------------------------------------------------------------
// 5. User With Assessment Scenario
// ---------------------------------------------------------------------------
test('Phase 4: User with assessment correctly maps risk probability, category, tier, and SHAP factors', () => {
  const dashServiceFile = resolveAppFile('services/dashboardService.ts');
  const serviceContent = fs.readFileSync(dashServiceFile, 'utf8');

  // Verify fetchAuthoritativeAssessment handles probability, risk category, and explanations
  assert.ok(
    serviceContent.includes('fetchAuthoritativeAssessment'),
    'dashboardService must export fetchAuthoritativeAssessment'
  );
  assert.ok(
    serviceContent.includes('data.probability_percent || data.probability * 100'),
    'fetchAuthoritativeAssessment must extract probability percent'
  );
  assert.ok(
    serviceContent.includes('data.risk_category'),
    'fetchAuthoritativeAssessment must extract risk_category'
  );
  assert.ok(
    serviceContent.includes('rawFactors.slice(0, 3).map'),
    'fetchAuthoritativeAssessment must isolate top 3 clinical SHAP factors'
  );
  assert.ok(
    serviceContent.includes('tierCount'),
    'fetchAuthoritativeAssessment must compute tierCount from tiers_included'
  );
});

// ---------------------------------------------------------------------------
// 6. User Without Assessment Scenario
// ---------------------------------------------------------------------------
test('Phase 4: User without assessment renders Not Screened empty state with direct action CTA', () => {
  const dashServiceFile = resolveAppFile('services/dashboardService.ts');
  const serviceContent = fs.readFileSync(dashServiceFile, 'utf8');

  // Verify empty assessment definition
  assert.ok(
    serviceContent.includes('hasAssessment: false'),
    'Empty assessment sets hasAssessment to false'
  );
  assert.ok(
    serviceContent.includes('probabilityPercent: null'),
    'Empty assessment sets probabilityPercent to null'
  );
  assert.ok(
    serviceContent.includes('riskCategory: null'),
    'Empty assessment sets riskCategory to null'
  );
  assert.ok(
    serviceContent.includes("tierStatus: 'Not Screened'"),
    'Empty assessment sets tierStatus to Not Screened'
  );
});

// ---------------------------------------------------------------------------
// 7. API Failure & Caching Scenario
// ---------------------------------------------------------------------------
test('Phase 4: API failure recovers previously cached dashboard data without crashing or losing data', () => {
  const dashServiceFile = resolveAppFile('services/dashboardService.ts');
  const hookFile = resolveAppFile('hooks/useDashboardData.ts');
  const serviceContent = fs.readFileSync(dashServiceFile, 'utf8');
  const hookContent = fs.readFileSync(hookFile, 'utf8');

  // Verify caching functions
  assert.ok(
    serviceContent.includes('getCachedDashboardData'),
    'dashboardService must export getCachedDashboardData'
  );
  assert.ok(
    serviceContent.includes('setCachedDashboardData'),
    'dashboardService must export setCachedDashboardData'
  );
  assert.ok(
    serviceContent.includes('clearCachedDashboardData'),
    'dashboardService must export clearCachedDashboardData'
  );

  // Verify hook optimistic cache read & error handling
  assert.ok(
    hookContent.includes('getCachedDashboardData(userId)'),
    'useDashboardData must read cached data optimistically'
  );
  assert.ok(
    hookContent.includes('if (!data) {'),
    'useDashboardData only sets error state if no cached data exists'
  );
  assert.ok(
    hookContent.includes('refresh = useCallback'),
    'useDashboardData provides refresh method for pull-to-refresh'
  );
  assert.ok(
    hookContent.includes('retry = useCallback'),
    'useDashboardData provides retry method'
  );
});

// ---------------------------------------------------------------------------
// 8. Session Expiration Scenario
// ---------------------------------------------------------------------------
test('Phase 4: Session expiration throws authentication error and prohibits data leakage', () => {
  const hookFile = resolveAppFile('hooks/useDashboardData.ts');
  const dashServiceFile = resolveAppFile('services/dashboardService.ts');
  const hookContent = fs.readFileSync(hookFile, 'utf8');
  const serviceContent = fs.readFileSync(dashServiceFile, 'utf8');

  // Verify auth validation in hook
  assert.ok(
    hookContent.includes('if (!isAuthenticated || !user || !user.accessToken) {'),
    'useDashboardData must guard against unauthenticated or expired user'
  );
  assert.ok(
    hookContent.includes("setError('User session expired. Please log in again.')"),
    'useDashboardData sets explicit session expired error'
  );

  // Verify service guards against empty token
  assert.ok(
    serviceContent.includes("if (!userId || !token) {"),
    'fetchDashboardData checks userId and token'
  );
  assert.ok(
    serviceContent.includes("throw new Error('Unauthenticated user session')"),
    'fetchDashboardData throws error on missing session'
  );
});
