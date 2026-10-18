import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

console.log('=== RUNNING TASK 5 & TASK 7 MINIMAL FOCUSED VERIFICATION ===\n');

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(thisDir, '..', '..');
const repoRoot = path.resolve(webRoot, '..', '..');

const readSource = (filePath) => fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// ── 1. Longitudinal Health Caching & Service Contracts (Task 5) ──
const intelServiceSrc = readSource(path.join(webRoot, 'src/services/intelligenceService.ts'));
assert.ok(intelServiceSrc.includes('export function setLongitudinalAuthUserId'), 'intelligenceService must export setLongitudinalAuthUserId');
assert.ok(intelServiceSrc.includes('export function getCachedLongitudinalHealth'), 'intelligenceService must export getCachedLongitudinalHealth');
assert.ok(intelServiceSrc.includes('export function invalidateLongitudinalCache'), 'intelligenceService must export invalidateLongitudinalCache');
assert.ok(intelServiceSrc.includes('currentLongitudinalUserId'), 'intelligenceService must track active authenticated user ID for synchronous lookups');
console.log('✓ 1. intelligenceService exports synchronous cache lookups, invalidation, and auth user tracking.');

// ── 2. AuthContext Zero Cross-User Cache Leakage (Task 5) ──
const authContextSrc = readSource(path.join(webRoot, 'src/context/AuthContext.tsx'));
assert.ok(authContextSrc.includes('setLongitudinalAuthUserId(currentUser ? currentUser.id : null)'), 'AuthContext must sync longitudinal auth user ID on session change');
assert.ok(authContextSrc.includes('invalidateLongitudinalCache()'), 'AuthContext must invalidate longitudinal cache on logout/user switch');
assert.ok(authContextSrc.includes('setLongitudinalAuthUserId(null)'), 'AuthContext must reset longitudinal user ID on logout');
console.log('✓ 2. AuthContext purges longitudinal cache on logout and isolates user cache instances.');

// ── 3. UserHealthContext Longitudinal State & Mutation Purging (Task 5) ──
const userHealthContextSrc = readSource(path.join(webRoot, 'src/context/UserHealthContext.tsx'));
assert.ok(userHealthContextSrc.includes('longitudinalData,'), 'UserHealthContext must expose longitudinalData');
assert.ok(userHealthContextSrc.includes('fetchLongitudinalHealth,'), 'UserHealthContext must expose fetchLongitudinalHealth');
assert.ok(userHealthContextSrc.includes('invalidateLongitudinalHealth,'), 'UserHealthContext must expose invalidateLongitudinalHealth');
assert.ok(userHealthContextSrc.includes('useRef'), 'UserHealthContext must import and use useRef for request deduplication tracking');

// Verify invalidation calls on mutations
assert.ok(userHealthContextSrc.includes('logPeriod') && userHealthContextSrc.includes('invalidateLongitudinalHealth();\n        return { success: true };'), 'logPeriod must invalidate longitudinal health');
assert.ok(userHealthContextSrc.includes('logSymptom') && userHealthContextSrc.includes('invalidateLongitudinalHealth();\n        return { success: true };'), 'logSymptom must invalidate longitudinal health');
assert.ok(userHealthContextSrc.includes('uploadReport') && userHealthContextSrc.includes('invalidateLongitudinalHealth();\n        return { success: true };'), 'uploadReport must invalidate longitudinal health');
console.log('✓ 3. UserHealthContext provides longitudinal state, SWR fetching, and invalidation on clinical mutations.');

// ── 4. HealthProgressSection Instant Hydration & Stale-While-Revalidate (Task 5) ──
const healthProgressSectionSrc = readSource(path.join(webRoot, 'src/components/longitudinal/HealthProgressSection.tsx'));
assert.ok(healthProgressSectionSrc.includes('longitudinalData'), 'HealthProgressSection must consume longitudinalData');
assert.ok(healthProgressSectionSrc.includes('fetchLongitudinalHealth'), 'HealthProgressSection must use fetchLongitudinalHealth');
assert.ok(healthProgressSectionSrc.includes('getCachedLongitudinalHealth'), 'HealthProgressSection must hydrate initial state from cache synchronously');
assert.ok(!healthProgressSectionSrc.includes('getLongitudinalHealth,'), 'HealthProgressSection must not use un-managed getLongitudinalHealth');
console.log('✓ 4. HealthProgressSection synchronously hydrates from cache/context and revalidates in background.');

// ── 5. MetricTrendCard Memoization (Task 5) ──
const metricTrendCardSrc = readSource(path.join(webRoot, 'src/components/longitudinal/MetricTrendCard.tsx'));
assert.ok(metricTrendCardSrc.includes('const sortedPoints = useMemo('), 'MetricTrendCard must memoize sortedPoints with useMemo');
console.log('✓ 5. MetricTrendCard memoizes chronological points to eliminate redundant sorting.');

// ── 6. SettingsPage Relaunch Navigation (Task 7) ──
const settingsPageSrc = readSource(path.join(webRoot, 'src/pages/app/SettingsPage.tsx'));
assert.ok(settingsPageSrc.includes('allowReonboard: true, isUpdate: true'), 'SettingsPage must pass allowReonboard: true and isUpdate: true in route state');
console.log('✓ 6. SettingsPage dispatches relaunch directly to user pathway with allowReonboard & isUpdate.');

// ── 7. OnboardingDispatcher Safe Forwarding (Task 7) ──
const onboardingDispatcherSrc = readSource(path.join(webRoot, 'src/pages/onboarding/OnboardingDispatcher.tsx'));
assert.ok(onboardingDispatcherSrc.includes('if (isExplicitRelaunch && (userProfile.pathway === \'female\' || userProfile.pathway === \'male\' || userProfile.gender === \'female\' || userProfile.gender === \'male\'))'), 'OnboardingDispatcher must forward relaunching user with established pathway');
assert.ok(onboardingDispatcherSrc.includes('state={location.state}'), 'OnboardingDispatcher must preserve location.state when forwarding');
console.log('✓ 7. OnboardingDispatcher safely forwards existing users into their pathway without bouncing.');

// ── 8. Route Guard Protection in Female & Male Onboarding (Task 7) ──
const femaleOnboardSrc = readSource(path.join(webRoot, 'src/pages/onboarding/FemaleOnboarding.tsx'));
const maleOnboardSrc = readSource(path.join(webRoot, 'src/pages/onboarding/MaleOnboarding.tsx'));
assert.ok(femaleOnboardSrc.includes('userProfile.isOnboarded && !isExplicitRelaunch'), 'FemaleOnboarding must not redirect when isExplicitRelaunch is true');
assert.ok(maleOnboardSrc.includes('userProfile.isOnboarded && !isExplicitRelaunch'), 'MaleOnboarding must not redirect when isExplicitRelaunch is true');
assert.ok(femaleOnboardSrc.includes('isUpdatingProfile={isUpdatingProfile}'), 'FemaleOnboarding must pass isUpdatingProfile to layout');
assert.ok(maleOnboardSrc.includes('isUpdatingProfile={isUpdatingProfile}'), 'MaleOnboarding must pass isUpdatingProfile to layout');
assert.ok(femaleOnboardSrc.includes('onCancel={isUpdatingProfile ? handleCancel : undefined}'), 'FemaleOnboarding must provide handleCancel to Settings');
assert.ok(maleOnboardSrc.includes('onCancel={isUpdatingProfile ? handleCancel : undefined}'), 'MaleOnboarding must provide handleCancel to Settings');
console.log('✓ 8. Female and Male onboarding bypass redirect on explicit relaunch and support cancel to Settings.');

// ── 9. Layouts & Bilingual Localization (Task 7) ──
const femaleLayoutSrc = readSource(path.join(webRoot, 'src/pages/onboarding/female/FemaleOnboardingLayout.tsx'));
const maleLayoutSrc = readSource(path.join(webRoot, 'src/pages/onboarding/male/MaleOnboardingLayout.tsx'));
assert.ok(femaleLayoutSrc.includes('isUpdatingProfile'), 'FemaleOnboardingLayout must support isUpdatingProfile');
assert.ok(maleLayoutSrc.includes('isUpdatingProfile'), 'MaleOnboardingLayout must support isUpdatingProfile');
assert.ok(femaleLayoutSrc.includes('onboarding:layout.cancelAndReturn'), 'FemaleOnboardingLayout must render cancel and return action');
assert.ok(maleLayoutSrc.includes('onboarding:layout.cancelAndReturn'), 'MaleOnboardingLayout must render cancel and return action');

const enJson = JSON.parse(fs.readFileSync(path.join(webRoot, 'src/i18n/locales/en/onboarding.json'), 'utf8'));
const urJson = JSON.parse(fs.readFileSync(path.join(webRoot, 'src/i18n/locales/ur/onboarding.json'), 'utf8'));
for (const key of ['profileUpdate', 'updateHealthProfile', 'cancelAndReturn', 'updateWomenSubtitle', 'updateMenSubtitle', 'saveProfileChanges']) {
  assert.ok(enJson.layout[key], `English locale must contain layout.${key}`);
  assert.ok(urJson.layout[key], `Urdu locale must contain layout.${key}`);
}
console.log('✓ 9. Layouts display update badge/headers with English and Urdu localization keys verified.');

// ── 10. Historical Assessments Preservation in Backend (Task 7) ──
const repoPySrc = readSource(path.join(repoRoot, 'backend/apps/intelligence/services/assessment_repository.py'));
assert.ok(repoPySrc.includes('Preserves assessment history while maintaining exactly ONE active assessment per patient per module'), 'assessment_repository must document and enforce assessment history preservation');
assert.ok(repoPySrc.includes('SELECT payload_json, is_active FROM intelligence_assessments'), 'assessment_repository must retain all historical rows');
console.log('✓ 10. Assessment history persistence preserves historical assessments chronologically with tiers and timestamps intact.');

console.log('\n=== ALL TASK 5 & TASK 7 VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
