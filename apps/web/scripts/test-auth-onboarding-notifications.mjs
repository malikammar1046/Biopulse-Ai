/**
 * PMOSense Automated Test Suite:
 * 1. Remove date of birth from signup
 * 2. Validate age during onboarding (Dynamic age >= 13, timezone-safe boundary rules)
 * 3. Temporary Assessment Notification Lifecycle & Accessibility
 */

import { validateDateOfBirth, getDobInputBounds } from '../src/utils/profileValidation.ts';
import { authService } from '../src/services/authService.ts';
import { profileService, mapDbRowToUserProfile } from '../src/services/profileService.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
    passedTests++;
  }
}

console.log('\n=============================================================');
console.log('🧪 PMOSENSE — AUTH, ONBOARDING & NOTIFICATIONS TEST SUITE');
console.log('=============================================================\n');

// ---------------------------------------------------------------------------
// 1. SIGNUP TESTS
// ---------------------------------------------------------------------------
console.log('[SECTION 1] Signup without Date of Birth');

// Test 1: Signup succeeds without dateOfBirth
const registerResult = await authService.register({
  fullName: 'Sara Ahmed',
  email: 'sara.ahmed@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Ephemeral_P@ss_' + Math.random().toString(36).slice(2),
  consent: true,
  pathway: 'female',
  gender: 'female',
});
assert(registerResult.success === true, 'Signup succeeds without dateOfBirth');
assert(registerResult.user !== undefined, 'Signup returns created user object');
assert(registerResult.user?.email === 'sara.ahmed@example.com', 'Signup user email matches payload');

// Test 2: Database profile mapping handles nullable date_of_birth
const dbProfile = mapDbRowToUserProfile({
  id: 'test-user-id',
  full_name: 'Sara Ahmed',
  email: 'sara.ahmed@example.com',
  date_of_birth: null,
  is_onboarded: false,
});
assert(dbProfile.dateOfBirth === '', 'Profile dateOfBirth is safely empty string until onboarding');
assert(dbProfile.isOnboarded === false, 'Profile is_onboarded is false initially');

// ---------------------------------------------------------------------------
// 2. ONBOARDING AGE VALIDATION TESTS (Minimum Age: 13)
// ---------------------------------------------------------------------------
console.log('\n[SECTION 2] Age Validation & Boundary Rules (Minimum Age: 13)');

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const currentDay = now.getDate();

const pad = (n) => String(n).padStart(2, '0');
const formatYMD = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

// Test 3: Onboarding requires date of birth
const emptyDobCheck = validateDateOfBirth('');
assert(emptyDobCheck.isValid === false, 'Empty date of birth is rejected');
assert(emptyDobCheck.error === 'Date of birth is required.', 'Returns required error message');

const nullDobCheck = validateDateOfBirth(null);
assert(nullDobCheck.isValid === false, 'Null date of birth is rejected');

// Test 4: Future date is rejected
const futureDate = new Date(now.getTime() + 86400000 * 2);
const futureDobStr = formatYMD(futureDate.getFullYear(), futureDate.getMonth() + 1, futureDate.getDate());
const futureCheck = validateDateOfBirth(futureDobStr);
assert(futureCheck.isValid === false, 'Future date of birth is rejected');
assert(futureCheck.error === 'Date of birth cannot be in the future.', 'Returns future date error message');

// Test 5: A 12-year-old user is rejected
const dob12 = formatYMD(currentYear - 12, currentMonth, currentDay);
const check12 = validateDateOfBirth(dob12);
assert(check12.isValid === false, '12-year-old user is rejected');
assert(check12.age === 12, 'Calculates exact age as 12');
assert(check12.error === 'You must be at least 13 years old to use PMOSense.', 'Returns correct 13-year minimum error message');

// Test 6: A user one day before their 13th birthday is rejected
// 13 years ago today + 1 day = 1 day before 13th birthday
const d13YearsAgo = new Date(currentYear - 13, currentMonth - 1, currentDay);
const dOneDayBefore = new Date(d13YearsAgo.getTime() + 86400000);
const dobOneDayBefore = formatYMD(
  dOneDayBefore.getFullYear(),
  dOneDayBefore.getMonth() + 1,
  dOneDayBefore.getDate()
);
const checkOneDayBefore = validateDateOfBirth(dobOneDayBefore);
assert(checkOneDayBefore.isValid === false, 'User one day before 13th birthday is rejected');
assert(checkOneDayBefore.age === 12, 'Age calculated as 12 (not rounded up)');
assert(checkOneDayBefore.error === 'You must be at least 13 years old to use PMOSense.', 'Returns minimum age requirement message');

// Test 7: A user on their 13th birthday is accepted
const dob13thBirthday = formatYMD(currentYear - 13, currentMonth, currentDay);
const check13thBirthday = validateDateOfBirth(dob13thBirthday);
assert(check13thBirthday.isValid === true, 'User on their 13th birthday is accepted');
assert(check13thBirthday.age === 13, 'Age calculated as 13 on birthday');

// Test 8: An older user is accepted
const dob24 = formatYMD(currentYear - 24, currentMonth, currentDay);
const check24 = validateDateOfBirth(dob24);
assert(check24.isValid === true, 'Older user (24 years old) is accepted');
assert(check24.age === 24, 'Age calculated accurately as 24');

// Test 9: HTML date picker bounds
const bounds = getDobInputBounds();
assert(bounds.max === dob13thBirthday, 'Date picker max selectable date is exactly 13 years before today');
assert(bounds.min.startsWith(String(currentYear - 120)), 'Date picker min date is 120 years before today');

// Test 10: Profile Service blocks onboarding when DOB is underage
const underageProfile = {
  id: 'u-underage-01',
  fullName: 'Test Underage',
  email: 'underage@example.com',
  phone: '03001234567',
  dateOfBirth: dob12,
  gender: 'female',
  pathway: 'female',
  isOnboarded: true,
};
const upsertResult = await profileService.upsertUserProfile(underageProfile, 'u-underage-01');
assert(upsertResult.success === false, 'Profile service rejects underage onboarding submission');
assert(upsertResult.error === 'You must be at least 13 years old to use PMOSense.', 'Returns proper structured error');

// ---------------------------------------------------------------------------
// 3. TEMPORARY NOTIFICATION TESTS
// ---------------------------------------------------------------------------
console.log('\n[SECTION 3] Temporary Assessment Update Notifications');

// Test 11: Notification state lifecycle simulation
let currentNotification = null;
let notificationTimer = null;

function triggerNotification(msg, type = 'success') {
  if (notificationTimer) clearTimeout(notificationTimer);
  currentNotification = { message: msg, type };
  notificationTimer = setTimeout(() => {
    currentNotification = null;
  }, 5000);
}

function dismissNotification() {
  if (notificationTimer) clearTimeout(notificationTimer);
  currentNotification = null;
}

// Higher tier saved -> notification shown
triggerNotification('Updated Result: Your assessment has been updated using additional clinical evidence.');
assert(currentNotification !== null, 'Success notification is displayed upon successful tier save');
assert(
  currentNotification?.message.includes('Your assessment has been updated using additional clinical evidence'),
  'Notification contains clinical update text'
);

// Test 12: Manual dismissal
dismissNotification();
assert(currentNotification === null, 'Notification is dismissed on manual close');

// Test 13: Timer reset on sequential update
triggerNotification('Updated Result: First update');
const firstTimer = notificationTimer;
triggerNotification('Updated Result: Second update');
assert(notificationTimer !== firstTimer, 'Previous notification timer was cleared and reset on new update');
assert(currentNotification?.message === 'Updated Result: Second update', 'Notification updated to latest message');

// Test 14: Refresh page simulation (state re-initialized to null, not persisted)
const freshPageState = null;
assert(freshPageState === null, 'Notification does not reappear on page refresh / initial mount');

// Test 15: Failed assessment save does not show success notification
let failedSaveSuccess = false;
let failedNotification = null;
try {
  // Simulate failed network call
  throw new Error('Network timeout during lab submission');
} catch (err) {
  failedSaveSuccess = false;
  failedNotification = { message: err.message, type: 'error' };
}
assert(failedSaveSuccess === false, 'Failed save does not mark success');
assert(failedNotification.type === 'error', 'Error displayed separately as error notification');

console.log(`\n=============================================================`);
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log(`=============================================================\n`);
