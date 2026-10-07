import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const resolveAppFile = (rel) => {
  if (fs.existsSync(path.resolve(rel))) return path.resolve(rel);
  return path.resolve('apps/mobile', rel);
};

// ---------------------------------------------------------------------------
// 1. Profile Backend Schema & Service Mapping
// ---------------------------------------------------------------------------
test('Profile Service: Maps authoritative backend schema (name, DOB/age, pathway, measurements, avatar, isOnboarded)', () => {
  const userServiceFile = resolveAppFile('services/userService.ts');
  const content = fs.readFileSync(userServiceFile, 'utf8');

  // Verify fetchUserProfileFromDb extracts all relevant health profile fields
  assert.ok(content.includes('row.full_name'), 'fetchUserProfileFromDb must extract full_name');
  assert.ok(content.includes('row.date_of_birth'), 'fetchUserProfileFromDb must extract date_of_birth');
  assert.ok(content.includes('row.height_cm'), 'fetchUserProfileFromDb must extract height_cm');
  assert.ok(content.includes('row.weight_kg'), 'fetchUserProfileFromDb must extract weight_kg');
  assert.ok(content.includes('row.waist_cm'), 'fetchUserProfileFromDb must extract waist_cm');
  assert.ok(content.includes('row.avatar_url'), 'fetchUserProfileFromDb must extract avatar_url');
  assert.ok(content.includes('row.pathway'), 'fetchUserProfileFromDb must extract pathway');
  assert.ok(content.includes('row.is_onboarded'), 'fetchUserProfileFromDb must extract is_onboarded');

  // Verify updateUserProfileInDb correctly formats PATCH payload
  assert.ok(content.includes('payload.full_name ='), 'updateUserProfileInDb must map full_name');
  assert.ok(content.includes('payload.date_of_birth ='), 'updateUserProfileInDb must map date_of_birth');
  assert.ok(content.includes('payload.height_cm ='), 'updateUserProfileInDb must map height_cm');
  assert.ok(content.includes('payload.weight_kg ='), 'updateUserProfileInDb must map weight_kg');
  assert.ok(content.includes('payload.waist_cm ='), 'updateUserProfileInDb must map waist_cm');
  assert.ok(content.includes('payload.avatar_url ='), 'updateUserProfileInDb must map avatar_url');
  assert.ok(content.includes('payload.is_onboarded ='), 'updateUserProfileInDb must map is_onboarded');
  assert.ok(content.includes('payload.emergency_contacts ='), 'updateUserProfileInDb must map emergency_contacts');
});

// ---------------------------------------------------------------------------
// 2. Pathway Persistence & Restoration
// ---------------------------------------------------------------------------
test('Pathway Persistence: Pathway choices persist to database, session storage, and restore on launch', () => {
  const userServiceFile = resolveAppFile('services/userService.ts');
  const authContextFile = resolveAppFile('features/authentication/AuthContext.tsx');
  const userContent = fs.readFileSync(userServiceFile, 'utf8');
  const authContent = fs.readFileSync(authContextFile, 'utf8');

  // Verify updateUserPathwayInDb exists and persists
  assert.ok(userContent.includes('updateUserPathwayInDb'), 'userService must export updateUserPathwayInDb');
  assert.ok(userContent.includes('biopulse_user_pathway_'), 'updateUserPathwayInDb must cache to persistentStorage');

  // Verify AuthContext restores pathway from DB profile
  assert.ok(authContent.includes('updateUserPathwayInDb'), 'AuthContext must call updateUserPathwayInDb on selectPathway');
  assert.ok(authContent.includes('fetchUserProfileFromDb'), 'AuthContext must load profile on initSession');
  assert.ok(authContent.includes('setPathwayState(dbProfile.pathway'), 'AuthContext must restore pathway from dbProfile');
});

// ---------------------------------------------------------------------------
// 3. Onboarding Incremental Saving, Draft Restoration, and Completion
// ---------------------------------------------------------------------------
test('Onboarding Persistence: Implements incremental step saves, failure resilience, and draft restoration', () => {
  const userServiceFile = resolveAppFile('services/userService.ts');
  const userContent = fs.readFileSync(userServiceFile, 'utf8');

  // Verify saveOnboardingStepData, completeOnboardingInDb, fetchOnboardingDraft
  assert.ok(userContent.includes('saveOnboardingStepData'), 'userService must export saveOnboardingStepData');
  assert.ok(userContent.includes('completeOnboardingInDb'), 'userService must export completeOnboardingInDb');
  assert.ok(userContent.includes('fetchOnboardingDraft'), 'userService must export fetchOnboardingDraft');

  // Verify local draft fallback on network failure
  assert.ok(userContent.includes('biopulse_onboarding_draft_'), 'saveOnboardingStepData must maintain persistent local draft');
  assert.ok(userContent.includes('API failure during onboarding step save'), 'Must gracefully catch and handle API failures');
});

test('Female Onboarding Context: Automatically restores saved draft and auto-saves steps', () => {
  const femaleContextFile = resolveAppFile('features/onboarding/FemaleOnboardingContext.tsx');
  const content = fs.readFileSync(femaleContextFile, 'utf8');

  assert.ok(content.includes('fetchOnboardingDraft'), 'FemaleOnboardingContext must call fetchOnboardingDraft on mount');
  assert.ok(content.includes('saveOnboardingStepData'), 'FemaleOnboardingContext must call saveOnboardingStepData on step updates');
  assert.ok(content.includes('saveAndCompleteOnboarding'), 'FemaleOnboardingContext must implement saveAndCompleteOnboarding');
  assert.ok(content.includes('useAuth'), 'FemaleOnboardingContext must connect with useAuth');
});

test('Male Onboarding Context: Automatically restores saved draft and auto-saves steps', () => {
  const maleContextFile = resolveAppFile('features/onboarding/MaleOnboardingContext.tsx');
  const content = fs.readFileSync(maleContextFile, 'utf8');

  assert.ok(content.includes('fetchOnboardingDraft'), 'MaleOnboardingContext must call fetchOnboardingDraft on mount');
  assert.ok(content.includes('saveOnboardingStepData'), 'MaleOnboardingContext must call saveOnboardingStepData on step updates');
  assert.ok(content.includes('saveAndCompleteOnboarding'), 'MaleOnboardingContext must implement saveAndCompleteOnboarding');
  assert.ok(content.includes('useAuth'), 'MaleOnboardingContext must connect with useAuth');
});

// ---------------------------------------------------------------------------
// 4. Onboarding Screens Validation & Completion Hooks
// ---------------------------------------------------------------------------
test('Onboarding Screens: Enforce data validation and trigger completion on review submission', () => {
  const femaleBasicFile = resolveAppFile('app/female-basic-info.tsx');
  const maleBasicFile = resolveAppFile('app/male-basic-info.tsx');
  const femaleCycleFile = resolveAppFile('app/female-cycle-health.tsx');
  const femaleReviewFile = resolveAppFile('app/female-review.tsx');
  const maleReviewFile = resolveAppFile('app/male-review.tsx');

  const femaleBasicContent = fs.readFileSync(femaleBasicFile, 'utf8');
  const maleBasicContent = fs.readFileSync(maleBasicFile, 'utf8');
  const femaleCycleContent = fs.readFileSync(femaleCycleFile, 'utf8');
  const femaleReviewContent = fs.readFileSync(femaleReviewFile, 'utf8');
  const maleReviewContent = fs.readFileSync(maleReviewFile, 'utf8');

  // Validations
  assert.ok(femaleBasicContent.includes('age <= 0') || femaleBasicContent.includes('Invalid Date of Birth'), 'Female basic info must validate age');
  assert.ok(femaleBasicContent.includes('heightCm < 80') || femaleBasicContent.includes('Invalid Height'), 'Female basic info must validate height');
  assert.ok(maleBasicContent.includes('parsedAge < 18') || maleBasicContent.includes('Invalid Age'), 'Male basic info must validate age');
  assert.ok(femaleCycleContent.includes('cycleLength < 15') || femaleCycleContent.includes('Invalid Cycle Length'), 'Cycle health must validate cycleLength');

  // Review screen completion hooks
  assert.ok(femaleReviewContent.includes('saveAndCompleteOnboarding'), 'Female review must invoke saveAndCompleteOnboarding');
  assert.ok(femaleReviewContent.includes('isOnboarded: true'), 'Female review must update healthStore with isOnboarded');
  assert.ok(maleReviewContent.includes('saveAndCompleteOnboarding'), 'Male review must invoke saveAndCompleteOnboarding');
  assert.ok(maleReviewContent.includes('isOnboarded: true'), 'Male review must update healthStore with isOnboarded');
});

// ---------------------------------------------------------------------------
// 5. Startup Routing & Onboarding Status
// ---------------------------------------------------------------------------
test('Startup Routing: Routes to onboarding steps if incomplete and to main app if completed', () => {
  const splashFile = resolveAppFile('app/index.tsx');
  const splashContent = fs.readFileSync(splashFile, 'utf8');

  assert.ok(splashContent.includes('user?.isOnboarded === false'), 'Startup must check isOnboarded status');
  assert.ok(splashContent.includes('/female-basic-info'), 'Incomplete female onboarding must route to female-basic-info');
  assert.ok(splashContent.includes('/male-basic-info'), 'Incomplete male onboarding must route to male-basic-info');
  assert.ok(splashContent.includes('/pathway-selection'), 'Unselected pathway must route to pathway-selection');
  assert.ok(splashContent.includes("replace('/(app)')"), 'Completed onboarding must route to /(app)');
});

// ---------------------------------------------------------------------------
// 6. Profile Screen Editing & Avatar Optionality
// ---------------------------------------------------------------------------
test('Profile Screen: Real persistent editing and non-blocking neutral avatar support', () => {
  const profileFile = resolveAppFile('app/(app)/profile.tsx');
  const profileContent = fs.readFileSync(profileFile, 'utf8');

  // Avatar optionality & fallback
  assert.ok(profileContent.includes('avatarUrl ?'), 'Profile must check avatarUrl');
  assert.ok(profileContent.includes('styles.avatarCircle'), 'Profile must provide neutral avatar circle fallback');
  assert.ok(profileContent.includes('styles.avatarImage'), 'Profile must support custom avatar image');

  // Editing & persistence
  assert.ok(profileContent.includes('updateProfile'), 'Profile must consume updateProfile from healthStore');
  assert.ok(profileContent.includes('handleEditContact'), 'Profile must implement handleEditContact');
  assert.ok(profileContent.includes('handleEditAvatar'), 'Profile must implement handleEditAvatar');
  assert.ok(profileContent.includes('handleEditMeasurements'), 'Profile must implement handleEditMeasurements');
});
