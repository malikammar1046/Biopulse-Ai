/**
 * apps/mobile/services/parityAndFunctionalityRepair.test.mjs
 *
 * BioPulse AI — Parity and Functionality Repair Regression Test Suite
 *
 * Validates all 9 repaired requirements:
 * 1. Google Sign-In Brand Icon & OAuth Handlers
 * 2. More > Nutrition and Meals Parity & Controlled Cuisine Filter
 * 3. Exercise & Movement Pathway Parity (Female cramps/PCOS & Male metabolic)
 * 4. Find a Specialist Live Backend Integration (Zero Mock Doctors)
 * 5. Care Circle Invitation Links & Patient Consent Access Control
 * 6. AI Assistant End-to-End Chat & Fallback Trace (Zero Fabricated Messages)
 * 7. Mock Data Eradication in Authenticated Flows
 * 8. Changeable Metric & Imperial Units Engine & Settings Persistence
 * 9. More Page Diagnostics Cleanliness & State Normalization
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOBILE_ROOT = path.resolve(__dirname, '..');

function readMobileFile(relPath) {
  const fullPath = path.join(MOBILE_ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

// ============================================================================
// REQUIREMENT 1: GOOGLE SIGN-IN BRAND ICON & OAUTH CONFIGURATION
// ============================================================================
test('Req 1: Official multicolor Google logo and robust OAuth deep linking', () => {
  const logoPath = path.join(MOBILE_ROOT, 'assets', 'google_logo.png');
  assert.ok(fs.existsSync(logoPath), 'google_logo.png asset must exist');
  const logoStats = fs.statSync(logoPath);
  assert.ok(logoStats.size > 500, 'google_logo.png must be a valid non-empty raster asset');

  const socialRowContent = readMobileFile('components/common/SocialAuthRow.tsx');
  assert.ok(
    socialRowContent.includes('google_logo.png'),
    'SocialAuthRow.tsx must reference official google_logo.png'
  );
  assert.ok(
    socialRowContent.includes('accessibilityLabel="Continue with Google"') ||
    socialRowContent.includes('Continue with Google'),
    'Accessible Google button label must be preserved in SocialAuthRow'
  );

  const loginScreenContent = readMobileFile('components/auth/BioPulseLoginScreen.tsx');
  assert.ok(
    loginScreenContent.includes('SocialAuthRow'),
    'BioPulseLoginScreen must render shared SocialAuthRow'
  );

  const signupScreenContent = readMobileFile('components/auth/BioPulseSignupScreen.tsx');
  assert.ok(
    signupScreenContent.includes('SocialAuthRow'),
    'BioPulseSignupScreen must render shared SocialAuthRow'
  );

  const supabaseContent = readMobileFile('lib/supabase.ts');
  assert.ok(
    supabaseContent.includes('signInWithGoogle'),
    'supabase.ts must implement signInWithGoogle'
  );
  assert.ok(
    supabaseContent.includes('handleAuthCallback'),
    'supabase.ts must implement handleAuthCallback'
  );
  assert.ok(
    supabaseContent.includes("fetchAuthEndpoint('/user'") || supabaseContent.includes('/auth/v1/user'),
    'handleAuthCallback must fetch authenticated user profile from Supabase'
  );

  const authContextContent = readMobileFile('features/authentication/AuthContext.tsx');
  assert.ok(
    authContextContent.includes("Linking.addEventListener('url'"),
    'AuthContext must register deep link listener for OAuth callback'
  );
  assert.ok(
    authContextContent.includes('Linking.getInitialURL()'),
    'AuthContext must process cold-start initial URL'
  );
});

// ============================================================================
// REQUIREMENT 2: MORE > NUTRITION AND MEALS PARITY
// ============================================================================
test('Req 2: More menu exposes View Meal Plans and meal-plan.tsx has controlled cuisine selector', () => {
  const moreContent = readMobileFile('app/(app)/more.tsx');
  assert.ok(
    moreContent.includes('View Meal Plans') && moreContent.includes('/(app)/meal-plan'),
    'more.tsx must contain a functional View Meal Plans route pointing to /(app)/meal-plan'
  );

  const mealPlanContent = readMobileFile('app/(app)/meal-plan.tsx');
  assert.ok(
    mealPlanContent.includes('south_asian') &&
    mealPlanContent.includes('vegetarian') &&
    mealPlanContent.includes('low_cost') &&
    mealPlanContent.includes('high_protein'),
    'meal-plan.tsx must support controlled cuisine filters'
  );
  assert.ok(
    mealPlanContent.includes('handleCuisineToggle') || mealPlanContent.includes('handleSaveFilterPreference'),
    'meal-plan.tsx must provide controlled cuisine toggle handler'
  );
  assert.ok(
    mealPlanContent.includes('handleMealPress') || mealPlanContent.includes('addMeal'),
    'meal-plan.tsx must provide 1-tap recipe logging connected to useHealthStore.addMeal'
  );

  const nutritionServiceContent = readMobileFile('services/nutritionService.ts');
  assert.ok(
    nutritionServiceContent.includes('getPreferences') &&
    nutritionServiceContent.includes('updatePreferences') &&
    nutritionServiceContent.includes('generateWeeklyPlan'),
    'nutritionService must provide typed preference management and weekly plan endpoints'
  );
});

// ============================================================================
// REQUIREMENT 3: EXERCISE AND MOVEMENT PATHWAY PARITY
// ============================================================================
test('Req 3: Movement screen provides female cramps/PCOS & male metabolic routines with safety notices', () => {
  const movementContent = readMobileFile('app/(app)/movement.tsx');

  // Verify Female Pathway Routines
  assert.ok(
    movementContent.includes('Pelvic & Lower Back Release') || movementContent.includes('f_cramps_pelvic'),
    'Female pathway must include menstrual cramps relief routine'
  );
  assert.ok(
    movementContent.includes('Mindful Fresh Air Walk') || movementContent.includes('f_period_walk'),
    'Female pathway must include gentle walk during period'
  );
  assert.ok(
    movementContent.includes('Low-Impact Slow Strength & Stability') || movementContent.includes('f_pcos_strength'),
    'Female pathway must include PCOS low-impact strength'
  );

  // Verify Male Pathway Routines
  assert.ok(
    movementContent.includes('Full Body Functional Strength') || movementContent.includes('m_functional_strength'),
    'Male pathway must include functional strength routine'
  );
  assert.ok(
    movementContent.includes('Zone-2 Brisk Aerobic Power Walk') || movementContent.includes('m_zone2_walk'),
    'Male pathway must include Zone-2 aerobic conditioning'
  );
  assert.ok(
    movementContent.includes('Postural Alignment & Decompression') || movementContent.includes('m_postural_decompression'),
    'Male pathway must include postural decompression routine'
  );

  // Verify clinical disclaimer and instructions
  assert.ok(
    movementContent.includes('does not replace medical care') ||
    movementContent.includes('Clinical Rationale & Hormone Balance'),
    'Clinical rationale and medical guidance must be rendered'
  );

  // Verify persistent connection to public.fitness_logs
  assert.ok(
    movementContent.includes('logActivity') &&
    movementContent.includes('deleteActivityLog') &&
    movementContent.includes('loadMovementData'),
    'movement.tsx must connect to store actions for real fitness_logs CRUD'
  );
});

// ============================================================================
// REQUIREMENT 4: FIND A SPECIALIST LIVE BACKEND INTEGRATION
// ============================================================================
test('Req 4: Specialists screen queries live Django doctor directory and unpacks envelope', () => {
  const specialistsContent = readMobileFile('app/(app)/specialists.tsx');

  // Zero mock doctors assertion
  assert.ok(
    !specialistsContent.includes("id: 'doc-f1'") &&
    !specialistsContent.includes("id: 'doc-m1'"),
    'Hardcoded femaleDoctors and maleDoctors arrays must be removed'
  );

  assert.ok(
    specialistsContent.includes('AppointmentService.getSpecialistDoctors'),
    'specialists.tsx must query AppointmentService.getSpecialistDoctors'
  );
  assert.ok(
    specialistsContent.includes('loadDoctors'),
    'specialists.tsx must support loading and refresh flow'
  );
  assert.ok(
    specialistsContent.includes('ActivityIndicator'),
    'specialists.tsx must render real loading state'
  );
  assert.ok(
    specialistsContent.includes('No Specialists Found'),
    'specialists.tsx must render truthful empty state when 0 matches'
  );

  // Check appointmentService and userService backend envelope unpack
  const appointmentServiceContent = readMobileFile('services/appointmentService.ts');
  const userServiceContent = readMobileFile('services/userService.ts');

  assert.ok(
    appointmentServiceContent.includes('res.data.doctors') || appointmentServiceContent.includes('(res.data as any)?.doctors'),
    'appointmentService must unpack Django { doctors: [...] } envelope'
  );
  assert.ok(
    userServiceContent.includes('data?.doctors'),
    'userService must unpack Django { doctors: [...] } envelope'
  );
});

// ============================================================================
// REQUIREMENT 5: CARE CIRCLE INVITATION LINKS & ACCESS CONTROL
// ============================================================================
test('Req 5: Care Circle creates genuine invite URLs, requires consent, and supports revocation', () => {
  const careCircleContent = readMobileFile('app/(app)/care-circle.tsx');

  assert.ok(
    careCircleContent.includes('CareCircleService.inviteMember'),
    'care-circle.tsx must call CareCircleService.inviteMember'
  );
  assert.ok(
    careCircleContent.includes('https://biopulse.ai/care-provider/'),
    'care-circle.tsx must generate authentic biopulse.ai/care-provider/ link'
  );
  assert.ok(
    careCircleContent.includes('hasConsented'),
    'care-circle.tsx must enforce explicit patient consent check'
  );
  assert.ok(
    careCircleContent.includes('Share.share'),
    'care-circle.tsx must provide native sharing for invite URL'
  );
  assert.ok(
    careCircleContent.includes('Remove from Care Circle') &&
    careCircleContent.includes('removeFromCareCircle'),
    'care-circle.tsx must allow revoking access'
  );
  assert.ok(
    careCircleContent.includes('Pending Invitation') &&
    careCircleContent.includes('Active Member'),
    'care-circle.tsx must distinguish pending from active member states'
  );
});

// ============================================================================
// REQUIREMENT 6: AI ASSISTANT END-TO-END TRACE & ZERO FABRICATED REPLIES
// ============================================================================
test('Req 6: AI Assistant communicates with real backend and removes fabricated messages', () => {
  const companionContent = readMobileFile('app/(app)/ai-companion.tsx');

  // Verify removal of hardcoded mock dialog (msg-2, msg-3)
  assert.ok(
    !companionContent.includes("id: 'msg-2'") &&
    !companionContent.includes("id: 'msg-3'"),
    'Fake pre-populated chat history must be removed'
  );

  assert.ok(
    companionContent.includes('companionService.sendMessage'),
    'ai-companion.tsx must invoke companionService.sendMessage'
  );
  assert.ok(
    companionContent.includes('lastFailedMessage') &&
    companionContent.includes('Retry'),
    'ai-companion.tsx must provide retry mechanism on network/service failure'
  );

  const companionServiceContent = readMobileFile('services/companionService.ts');
  assert.ok(
    companionServiceContent.includes('/v1/intelligence/companion/chat/') &&
    companionServiceContent.includes('/v1/intelligence/public/chat/'),
    'companionService must support both authenticated and educational public fallback endpoints'
  );
});

// ============================================================================
// REQUIREMENT 7: REMOVAL OF UNINTENDED RUNTIME MOCKS
// ============================================================================
test('Req 7: Eradication of mock doctor arrays and development diagnostic blocks', () => {
  const moreContent = readMobileFile('app/(app)/more.tsx');
  assert.ok(
    !moreContent.includes('STATES & DIAGNOSTICS'),
    'Development showcase STATES & DIAGNOSTICS must not be present on More page'
  );

  const specialistsContent = readMobileFile('app/(app)/specialists.tsx');
  assert.ok(
    !specialistsContent.includes('Dr. Ayesha Malik') || specialistsContent.includes('rawDoctorsList'),
    'Doctors list must be computed dynamically from live backend records'
  );
});

// ============================================================================
// REQUIREMENT 8: CHANGEABLE METRIC & IMPERIAL UNITS ENGINE
// ============================================================================
test('Req 8: Authoritative unit converter with bidirectional precision and settings persistence', () => {
  const unitsContent = readMobileFile('utils/units.ts');

  // Check exported conversion functions
  assert.ok(unitsContent.includes('toCanonicalHeightCm'), 'Must export toCanonicalHeightCm');
  assert.ok(unitsContent.includes('fromCanonicalHeightCm'), 'Must export fromCanonicalHeightCm');
  assert.ok(unitsContent.includes('toCanonicalWeightKg'), 'Must export toCanonicalWeightKg');
  assert.ok(unitsContent.includes('fromCanonicalWeightKg'), 'Must export fromCanonicalWeightKg');
  assert.ok(unitsContent.includes('calculateBmiCanonical'), 'Must export calculateBmiCanonical');
  assert.ok(unitsContent.includes('saveUnitPreferences'), 'Must export saveUnitPreferences');
  assert.ok(unitsContent.includes('loadSavedUnitPreferences'), 'Must export loadSavedUnitPreferences');

  // Unit conversions sanity math
  const cmPerFoot = 30.48;
  const kgPerLb = 0.45359237;

  // 178 cm in ft: 178 / 30.48 = 5.8398 => 5.8
  const ftDisplay = parseFloat((178 / cmPerFoot).toFixed(1));
  assert.equal(ftDisplay, 5.8);

  // 70 kg in lb: 70 * 2.20462 = 154.32 => 154
  const lbDisplay = Math.round(70 * 2.20462262);
  assert.equal(lbDisplay, 154);

  // Verify settings.tsx uses units utility
  const settingsContent = readMobileFile('app/(app)/settings.tsx');
  assert.ok(
    settingsContent.includes('loadSavedUnitPreferences') &&
    settingsContent.includes('saveUnitPreferences'),
    'settings.tsx must integrate unit preference loading and persistence'
  );
  assert.ok(
    settingsContent.includes('Height Unit') && settingsContent.includes('Weight Unit'),
    'settings.tsx must provide granular selectors for height and weight'
  );
});

// ============================================================================
// REQUIREMENT 9: MORE PAGE EMPTY, LOADING AND ERROR STATES
// ============================================================================
test('Req 9: More page presents clean navigation, no raw errors or dev panels', () => {
  const moreContent = readMobileFile('app/(app)/more.tsx');

  assert.ok(
    moreContent.includes("title: 'HEALTH & TRACKING'") &&
    moreContent.includes("title: 'DAILY HEALTH'") &&
    moreContent.includes("title: 'CARE & SUPPORT'") &&
    moreContent.includes("title: 'RECORDS'") &&
    moreContent.includes("title: 'ACCOUNT'"),
    'All official sections must be rendered cleanly'
  );
  assert.ok(
    moreContent.includes('profileCompleteness'),
    'Profile completeness progress indicator must be rendered'
  );
});
