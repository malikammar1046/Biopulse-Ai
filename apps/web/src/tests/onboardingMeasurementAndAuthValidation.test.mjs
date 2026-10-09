import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load unit conversions and profile validation logic for testing
import {
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm
} from '../utils/unitConversions.ts';

import {
  validatePakistaniPhone,
  validateRegistrationPassword,
  validateDateOfBirth,
  validateMaleScreeningAge,
  getMaleDobInputBounds,
} from '../utils/profileValidation.ts';

import {
  calculateAgeFromDob,
  deriveMaleTier1InputsFromProfile,
} from '../utils/tier1InputMappers.ts';

console.log('--- STARTING ONBOARDING, MEASUREMENT & PASSWORD VALIDATION TESTS ---');

// ==========================================
// 1. PHONE NUMBER VALIDATION TESTS
// ==========================================
console.log('\n[Test Suite 1] Phone Number Validation:');

// Test 1.1: Optional phone allows empty, undefined, null, or whitespace
assert.deepStrictEqual(
  validatePakistaniPhone('', { optional: true }),
  { isValid: true },
  'Empty phone should be valid when optional'
);
assert.deepStrictEqual(
  validatePakistaniPhone('   ', { optional: true }),
  { isValid: true },
  'Whitespace phone should be valid when optional'
);
assert.deepStrictEqual(
  validatePakistaniPhone(undefined, { optional: true }),
  { isValid: true },
  'Undefined phone should be valid when optional'
);
assert.deepStrictEqual(
  validatePakistaniPhone(null, { optional: true }),
  { isValid: true },
  'Null phone should be valid when optional'
);
console.log('✓ Optional phone allows empty string, whitespace, null, and undefined');

// Test 1.2: Standard required phone still requires a phone number
const emptyRequired = validatePakistaniPhone('');
assert.strictEqual(emptyRequired.isValid, false, 'Empty phone should fail when not marked optional');
assert.match(emptyRequired.error || '', /required/i, 'Error message should indicate phone is required');
console.log('✓ Standard required phone still requires a phone number when optional is false');

// Test 1.3: Valid Pakistani phone format is accepted (both with 03xx and +923xx)
const validPhone1 = validatePakistaniPhone('03001234567', { optional: true });
assert.strictEqual(validPhone1.isValid, true, '03001234567 should be valid');

const validPhone2 = validatePakistaniPhone('+923001234567', { optional: true });
assert.strictEqual(validPhone2.isValid, true, '+923001234567 should be valid');

const validPhone3 = validatePakistaniPhone('0345-1234567', { optional: true });
assert.strictEqual(validPhone3.isValid, true, 'Formatted phone 0345-1234567 should be valid');
console.log('✓ Valid Pakistani phone formats (03xx, +923xx, dashes) are accepted');

// Test 1.4: Invalid phone format is rejected even if optional
const invalidPhone1 = validatePakistaniPhone('12345', { optional: true });
assert.strictEqual(invalidPhone1.isValid, false, 'Too short phone number should be rejected');

const invalidPhone2 = validatePakistaniPhone('0300123', { optional: true });
assert.strictEqual(invalidPhone2.isValid, false, 'Incomplete 7-digit phone should be rejected');

const invalidPhone3 = validatePakistaniPhone('+14155552671', { optional: true });
assert.strictEqual(invalidPhone3.isValid, false, 'Non-Pakistani prefix should be rejected');
console.log('✓ Invalid phone numbers are rejected with proper error message when provided');

// ==========================================
// 2. MEASUREMENT UNIT CONVERSIONS & ROUNDTRIP
// ==========================================
console.log('\n[Test Suite 2] Weight & Waist Measurement Conversions:');

// Test 2.1: Weight 20 lbs roundtrip
const kg20 = lbsToKg(20);
const roundtripLbs20 = kgToLbs(kg20);
assert.strictEqual(roundtripLbs20, 20.0, `20 lbs -> ${kg20} kg -> ${roundtripLbs20} lbs must equal 20.0 (not 20.1 or 2.1)`);
console.log(`✓ 20 lbs converts to ${kg20} kg and precisely roundtrips to ${roundtripLbs20} lbs`);

// Test 2.2: Weight 125 lbs roundtrip
const kg125 = lbsToKg(125);
const roundtripLbs125 = kgToLbs(kg125);
assert.strictEqual(roundtripLbs125, 125.0, `125 lbs -> ${kg125} kg -> ${roundtripLbs125} lbs must equal 125.0`);
console.log(`✓ 125 lbs converts to ${kg125} kg and precisely roundtrips to ${roundtripLbs125} lbs`);

// Test 2.3: Fractional weight 125.5 lbs roundtrip
const kg125_5 = lbsToKg(125.5);
const roundtripLbs125_5 = kgToLbs(kg125_5);
assert.strictEqual(roundtripLbs125_5, 125.5, `125.5 lbs -> ${kg125_5} kg -> ${roundtripLbs125_5} lbs must equal 125.5`);
console.log(`✓ 125.5 lbs converts to ${kg125_5} kg and precisely roundtrips to ${roundtripLbs125_5} lbs`);

// Test 2.4: Waist 20 in roundtrip
const cm20 = inchesToCm(20);
const roundtripIn20 = cmToInches(cm20);
assert.strictEqual(roundtripIn20, 20.0, `20 in -> ${cm20} cm -> ${roundtripIn20} in must equal 20.0 (not 20.1)`);
console.log(`✓ 20 inches converts to ${cm20} cm and precisely roundtrips to ${roundtripIn20} inches`);

// Test 2.5: Waist 34.5 in roundtrip
const cm34_5 = inchesToCm(34.5);
const roundtripIn34_5 = cmToInches(cm34_5);
assert.strictEqual(roundtripIn34_5, 34.5, `34.5 in -> ${cm34_5} cm -> ${roundtripIn34_5} in must equal 34.5`);
console.log(`✓ 34.5 inches converts to ${cm34_5} cm and precisely roundtrips to ${roundtripIn34_5} inches`);

// Test 2.6: Exhaustive Clinical Range Roundtrip Test
// Test 50 to 350 lbs in 0.5 increments
let lbsFailures = 0;
for (let lbs = 50; lbs <= 350; lbs += 0.5) {
  const kg = lbsToKg(lbs);
  const back = kgToLbs(kg);
  if (Math.abs(back - lbs) > 0.05) {
    lbsFailures++;
  }
}
assert.strictEqual(lbsFailures, 0, `There must be 0 lbs roundtrip conversion discrepancies, found ${lbsFailures}`);
console.log('✓ Exhaustive test: 601 weight values between 50-350 lbs (0.5 steps) have 0 conversion drift');

// Test 20 to 60 inches in 0.5 increments
let inFailures = 0;
for (let inch = 20; inch <= 60; inch += 0.5) {
  const cm = inchesToCm(inch);
  const back = cmToInches(cm);
  if (Math.abs(back - inch) > 0.05) {
    inFailures++;
  }
}
assert.strictEqual(inFailures, 0, `There must be 0 inches roundtrip conversion discrepancies, found ${inFailures}`);
console.log('✓ Exhaustive test: 81 waist values between 20-60 inches (0.5 steps) have 0 conversion drift');

// ==========================================
// 3. REGISTRATION PASSWORD VALIDATION TESTS
// ==========================================
console.log('\n[Test Suite 3] Registration Password Validation:');

// Test 3.1: Valid password (letters + numbers + >= 8 chars)
const validPass1 = validateRegistrationPassword('Password123');
assert.strictEqual(validPass1.isValid, true, 'Password123 should be valid');
assert.strictEqual(validPass1.hasMinLength, true);
assert.strictEqual(validPass1.hasLetter, true);
assert.strictEqual(validPass1.hasNumber, true);

const validPass2 = validateRegistrationPassword('abcde123');
assert.strictEqual(validPass2.isValid, true, 'abcde123 should be valid');
console.log('✓ Valid passwords with letter, digit, and length >= 8 pass validation');

// Test 3.2: Letters only rejected
const lettersOnly = validateRegistrationPassword('PasswordOnly');
assert.strictEqual(lettersOnly.isValid, false, 'Letters-only password must be rejected');
assert.strictEqual(lettersOnly.hasLetter, true);
assert.strictEqual(lettersOnly.hasNumber, false);
assert.match(lettersOnly.error || '', /digit|number/i, 'Error message must mention digit/number');
console.log('✓ Letters-only password rejected with specific message: ' + lettersOnly.error);

// Test 3.3: Digits only rejected
const digitsOnly = validateRegistrationPassword('1234567890');
assert.strictEqual(digitsOnly.isValid, false, 'Digits-only password must be rejected');
assert.strictEqual(digitsOnly.hasLetter, false);
assert.strictEqual(digitsOnly.hasNumber, true);
assert.match(digitsOnly.error || '', /letter/i, 'Error message must mention letter');
console.log('✓ Digits-only password rejected with specific message: ' + digitsOnly.error);

// Test 3.4: Too short rejected
const tooShort = validateRegistrationPassword('Pass1');
assert.strictEqual(tooShort.isValid, false, 'Short password must be rejected');
assert.strictEqual(tooShort.hasMinLength, false);
assert.strictEqual(tooShort.hasLetter, true);
assert.strictEqual(tooShort.hasNumber, true);
assert.match(tooShort.error || '', /8 characters/i, 'Error message must mention min length');
console.log('✓ Too short password rejected with specific message: ' + tooShort.error);

// Test 3.5: Empty password
const emptyPass = validateRegistrationPassword('');
assert.strictEqual(emptyPass.isValid, false, 'Empty password must be rejected');
console.log('✓ Empty password rejected');

// ==========================================
// 4. SOURCE CODE & TEMPLATE CONTRACT VERIFICATION
// ==========================================
console.log('\n[Test Suite 4] UI & Source Code Verification:');

// 4.1: MaleStep1BasicInfo has (Optional) phone and uses MeasurementInput
const maleStep1Content = readFileSync(resolve('src/pages/onboarding/male/MaleStep1BasicInfo.tsx'), 'utf-8');
assert.ok(maleStep1Content.includes('(Optional)'), 'MaleStep1BasicInfo must show (Optional) indicator');
assert.ok(!maleStep1Content.includes('Phone (Pakistan) *'), 'MaleStep1BasicInfo must NOT show required * on phone');
assert.ok(maleStep1Content.includes('<MeasurementInput'), 'MaleStep1BasicInfo must use MeasurementInput component');
console.log('✓ MaleStep1BasicInfo has Optional phone and uses MeasurementInput');

// 4.2: FemaleStep1BasicInfo has (Optional) phone and uses MeasurementInput
const femaleStep1Content = readFileSync(resolve('src/pages/onboarding/female/FemaleStep1BasicInfo.tsx'), 'utf-8');
assert.ok(femaleStep1Content.includes('(Optional)'), 'FemaleStep1BasicInfo must show (Optional) indicator');
assert.ok(!femaleStep1Content.includes('text-rose-500">*</span>'), 'FemaleStep1BasicInfo must NOT show required asterisk on phone');
assert.ok(femaleStep1Content.includes('<MeasurementInput'), 'FemaleStep1BasicInfo must use MeasurementInput component');
console.log('✓ FemaleStep1BasicInfo has Optional phone and uses MeasurementInput');

// 4.3: GeneralOnboarding has (Optional) phone
const generalContent = readFileSync(resolve('src/pages/onboarding/GeneralOnboarding.tsx'), 'utf-8');
assert.ok(generalContent.includes('(Optional)'), 'GeneralOnboarding must show (Optional) indicator');
assert.ok(!generalContent.includes('text-rose-500">*</span>'), 'GeneralOnboarding must NOT show required asterisk on phone');
console.log('✓ GeneralOnboarding has Optional phone label');

// 4.4: PersonalTab in Settings uses MeasurementInput
const personalTabContent = readFileSync(resolve('src/pages/app/settings/tabs/PersonalTab.tsx'), 'utf-8');
assert.ok(personalTabContent.includes('<MeasurementInput'), 'PersonalTab must use MeasurementInput component');
console.log('✓ PersonalTab uses MeasurementInput for consistent settings editing');

// 4.5: Register.tsx has helper text and live password requirements list
const registerContent = readFileSync(resolve('src/pages/auth/Register.tsx'), 'utf-8');
assert.ok(registerContent.includes('Use at least one letter and one number.'), 'Register.tsx must have specified helper text');
assert.ok(registerContent.includes('validateRegistrationPassword'), 'Register.tsx must use validateRegistrationPassword');
assert.ok(registerContent.includes('hasLetter'), 'Register.tsx must reflect letter check');
assert.ok(registerContent.includes('hasNumber'), 'Register.tsx must reflect number check');
assert.ok(registerContent.includes('hasMinLength'), 'Register.tsx must reflect minLength check');
console.log('✓ Register.tsx includes helper text, live indicators, and strict validation');

// 4.6: authService.ts enforces validateRegistrationPassword
const authServiceContent = readFileSync(resolve('src/services/authService.ts'), 'utf-8');
assert.ok(authServiceContent.includes('validateRegistrationPassword'), 'authService.ts must validate password on register');
console.log('✓ authService.ts enforces registration password validation at service layer');

// 4.7: MaleStep1BasicInfo has optional waist size and references iliac crest protocol
assert.ok(maleStep1Content.includes('<span>Waist Size</span>'), 'MaleStep1BasicInfo must contain Waist Size field');
assert.ok(maleStep1Content.includes('iliac crest'), 'MaleStep1BasicInfo must reference iliac crest protocol');
assert.ok(maleStep1Content.includes('(optional)'), 'MaleStep1BasicInfo must mark waist size as optional');
console.log('✓ MaleStep1BasicInfo correctly marks waist size optional and references iliac crest protocol');

// 4.8: MaleStep1BasicInfo uses getMaleDobInputBounds and shows 19–60 guidance
assert.ok(maleStep1Content.includes('getMaleDobInputBounds'), 'MaleStep1BasicInfo must call getMaleDobInputBounds');
assert.ok(maleStep1Content.includes('19–60'), 'MaleStep1BasicInfo must show 19–60 eligibility guidance');
assert.ok(!maleStep1Content.includes('12 years or older'), 'MaleStep1BasicInfo must NOT show 12 years or older message');
console.log('✓ MaleStep1BasicInfo uses getMaleDobInputBounds and displays 19–60 guidance');

// 4.9: MaleOnboarding.tsx enforces validateMaleScreeningAge in step validation and final submit
const maleOnboardingContent = readFileSync(resolve('src/pages/onboarding/MaleOnboarding.tsx'), 'utf-8');
assert.ok(maleOnboardingContent.includes('validateMaleScreeningAge(draftProfile.dateOfBirth)'), 'MaleOnboarding must call validateMaleScreeningAge');
assert.ok(maleOnboardingContent.includes('handleEnterAndroSense'), 'MaleOnboarding must have handleEnterAndroSense');
assert.ok(maleOnboardingContent.includes('// Blocking eligibility gate: Ensure age 19–60 before onboarding completion'), 'MaleOnboarding must have blocking gate comment');
console.log('✓ MaleOnboarding enforces validateMaleScreeningAge in step 1 and final submission gate');

// ==========================================
// 5. MALE SCREENING AGE ELIGIBILITY TESTS (19–60 INCLUSIVE)
// ==========================================
console.log('\n[Test Suite 5] Male Screening Age Eligibility (19–60 Inclusive):');

// Fixed reference date for deterministic boundary testing: 2026-10-10
const refNow = new Date(2026, 9, 10); // Oct 10, 2026

// 5.1: Age 18 (below 19) is rejected
const res18 = validateMaleScreeningAge('2008-01-01', refNow);
assert.strictEqual(res18.isValid, false, 'Age 18 must be rejected');
assert.strictEqual(res18.age, 18, 'Age must calculate to 18');
assert.match(res18.error || '', /19 to 60/i, 'Error must explain 19 to 60 requirement');
console.log('✓ Age 18 is strictly rejected with respectful eligibility message');

// 5.2: Age 19 (exact lower boundary) is accepted
const res19 = validateMaleScreeningAge('2007-10-10', refNow);
assert.strictEqual(res19.isValid, true, 'Age 19 on 19th birthday must be accepted');
assert.strictEqual(res19.age, 19, 'Age must calculate to 19');
console.log('✓ Age 19 on exact birthday boundary is accepted');

// 5.3: Age 60 (exact upper boundary) is accepted
const res60 = validateMaleScreeningAge('1966-10-10', refNow);
assert.strictEqual(res60.isValid, true, 'Age 60 on 60th birthday must be accepted');
assert.strictEqual(res60.age, 60, 'Age must calculate to 60');
console.log('✓ Age 60 on exact birthday boundary is accepted');

// 5.4: Age 61 (above 60) is rejected
const res61 = validateMaleScreeningAge('1965-10-10', refNow);
assert.strictEqual(res61.isValid, false, 'Age 61 on 61st birthday must be rejected');
assert.strictEqual(res61.age, 61, 'Age must calculate to 61');
assert.match(res61.error || '', /older than 60/i, 'Error must explain >60 restriction');
console.log('✓ Age 61 is strictly rejected with clinical explanation');

// 5.5: Birthday boundary: 1 day before 19th birthday (still 18) is rejected
const resDayBefore19 = validateMaleScreeningAge('2007-10-11', refNow);
assert.strictEqual(resDayBefore19.isValid, false, '1 day before 19th birthday must be rejected');
assert.strictEqual(resDayBefore19.age, 18, 'Calculated age 1 day before 19th birthday must be 18');
console.log('✓ Day before 19th birthday (age 18) is rejected');

// 5.6: Birthday boundary: 1 day before 61st birthday (still 60) is accepted
const resDayBefore61 = validateMaleScreeningAge('1965-10-11', refNow);
assert.strictEqual(resDayBefore61.isValid, true, '1 day before 61st birthday (age 60) must be accepted');
assert.strictEqual(resDayBefore61.age, 60, 'Calculated age 1 day before 61st birthday must be 60');
console.log('✓ Day before 61st birthday (age 60) is accepted');

// 5.7: Leap year handling: Born Feb 29, 2008
// On Feb 28, 2027 (non-leap year), user is 18 (rejected)
const nowNonLeapFeb28 = new Date(2027, 1, 28);
const resLeapFeb28 = validateMaleScreeningAge('2008-02-29', nowNonLeapFeb28);
assert.strictEqual(resLeapFeb28.isValid, false, 'Born Feb 29 on Feb 28 of 19th year is still 18');
assert.strictEqual(resLeapFeb28.age, 18);

// On March 1, 2027, user has reached 19 (accepted)
const nowNonLeapMar1 = new Date(2027, 2, 1);
const resLeapMar1 = validateMaleScreeningAge('2008-02-29', nowNonLeapMar1);
assert.strictEqual(resLeapMar1.isValid, true, 'Born Feb 29 on March 1 of 19th year is 19');
assert.strictEqual(resLeapMar1.age, 19);
console.log('✓ Leap year boundary (Feb 29 birthday on non-leap years) calculated correctly');

// 5.8: Missing and whitespace DOB rejected
assert.strictEqual(validateMaleScreeningAge('').isValid, false);
assert.strictEqual(validateMaleScreeningAge('   ').isValid, false);
assert.strictEqual(validateMaleScreeningAge(undefined).isValid, false);
assert.strictEqual(validateMaleScreeningAge(null).isValid, false);
assert.match(validateMaleScreeningAge('').error || '', /required/i);
console.log('✓ Missing and empty DOB rejected');

// 5.9: Invalid format and calendar dates rejected
assert.strictEqual(validateMaleScreeningAge('not-a-date').isValid, false);
assert.strictEqual(validateMaleScreeningAge('2000/10/10').isValid, false);
assert.strictEqual(validateMaleScreeningAge('2001-02-29').isValid, false, 'Feb 29 on non-leap year must be rejected');
assert.strictEqual(validateMaleScreeningAge('1995-04-31').isValid, false, 'April 31 must be rejected');
console.log('✓ Malformed and nonexistent calendar dates rejected');

// 5.10: Future DOB rejected
assert.strictEqual(validateMaleScreeningAge('2026-10-11', refNow).isValid, false);
assert.match(validateMaleScreeningAge('2026-10-11', refNow).error || '', /future/i);
console.log('✓ Future date of birth strictly rejected');

// 5.11: HTML date picker bounds for male screening
const bounds = getMaleDobInputBounds(refNow);
assert.strictEqual(bounds.max, '2007-10-10', 'Max DOB must be exactly 19 years ago');
assert.strictEqual(bounds.min, '1965-10-11', 'Min DOB must be oldest date that is still 60 today');
const ageAtMax = validateMaleScreeningAge(bounds.max, refNow);
const ageAtMin = validateMaleScreeningAge(bounds.min, refNow);
assert.strictEqual(ageAtMax.isValid, true, 'Max date picker bound must produce valid age 19');
assert.strictEqual(ageAtMax.age, 19);
assert.strictEqual(ageAtMin.isValid, true, 'Min date picker bound must produce valid age 60');
assert.strictEqual(ageAtMin.age, 60);
console.log('✓ getMaleDobInputBounds constrains date picker exactly to ages 19–60');

// 5.12: General account validation remains distinct
// validateDateOfBirth allows 13-year-olds; validateMaleScreeningAge strictly does not
const dob13 = '2013-10-10';
const general13 = validateDateOfBirth(dob13);
const male13 = validateMaleScreeningAge(dob13, refNow);
assert.strictEqual(general13.isValid, true, 'General account allows age >= 13');
assert.strictEqual(general13.age, 13);
assert.strictEqual(male13.isValid, false, 'Male screening rejects age 13');
console.log('✓ General account validation (age >= 13) remains strictly decoupled from male screening');

// 5.13: Mapper calculateAgeFromDob safe handling (never defaults to 35)
assert.strictEqual(calculateAgeFromDob(undefined, null), null);
assert.strictEqual(calculateAgeFromDob('not-a-date', null), null);
assert.strictEqual(calculateAgeFromDob('2030-01-01', null), null, 'Future date must yield null age');
const t1InputsMissingDob = deriveMaleTier1InputsFromProfile({ dateOfBirth: undefined });
assert.strictEqual(t1InputsMissingDob.age, null, 'deriveMaleTier1InputsFromProfile must yield age null without DOB');
console.log('✓ calculateAgeFromDob and deriveMaleTier1InputsFromProfile never substitute default age 35');

// 5.14: Explicit prompt canonical examples on 2026-10-10
// Case A: DOB October 11, 1965 -> Eligible, age 60
const exA = validateMaleScreeningAge('1965-10-11', refNow);
assert.strictEqual(exA.isValid, true);
assert.strictEqual(exA.age, 60);

// Case B: DOB October 10, 1966 -> Eligible, age 60
const exB = validateMaleScreeningAge('1966-10-10', refNow);
assert.strictEqual(exB.isValid, true);
assert.strictEqual(exB.age, 60);

// Case C: DOB October 10, 1965 -> Ineligible, age 61
const exC = validateMaleScreeningAge('1965-10-10', refNow);
assert.strictEqual(exC.isValid, false);
assert.strictEqual(exC.age, 61);

// Case D: DOB October 10, 2007 -> Eligible, age 19
const exD = validateMaleScreeningAge('2007-10-10', refNow);
assert.strictEqual(exD.isValid, true);
assert.strictEqual(exD.age, 19);

// Case E: DOB October 11, 2007 -> Ineligible, age 18
const exE = validateMaleScreeningAge('2007-10-11', refNow);
assert.strictEqual(exE.isValid, false);
assert.strictEqual(exE.age, 18);
console.log('✓ All 5 prompt canonical boundary examples on 2026-10-10 verified');

// 5.15: Leap year date picker boundary verification
// On leap day 2024-02-29:
const leapNow2024 = new Date(2024, 1, 29);
const leapBounds2024 = getMaleDobInputBounds(leapNow2024);
assert.strictEqual(leapBounds2024.max, '2005-02-28', 'Youngest eligible user turning 19 on leap day is Feb 28, 2005');
assert.strictEqual(leapBounds2024.min, '1963-03-01', 'Oldest eligible user still 60 on leap day is Mar 1, 1963');

const validLeapMax = validateMaleScreeningAge(leapBounds2024.max, leapNow2024);
assert.strictEqual(validLeapMax.isValid, true);
assert.strictEqual(validLeapMax.age, 19);

const invalidAfterLeapMax = validateMaleScreeningAge('2005-03-01', leapNow2024);
assert.strictEqual(invalidAfterLeapMax.isValid, false);
assert.strictEqual(invalidAfterLeapMax.age, 18);

const validLeapMin = validateMaleScreeningAge(leapBounds2024.min, leapNow2024);
assert.strictEqual(validLeapMin.isValid, true);
assert.strictEqual(validLeapMin.age, 60);

const invalidBeforeLeapMin = validateMaleScreeningAge('1963-02-28', leapNow2024);
assert.strictEqual(invalidBeforeLeapMin.isValid, false);
assert.strictEqual(invalidBeforeLeapMin.age, 61);

// On non-leap Feb 28, 2025: 61 years ago (1964) was a leap year
const nonLeap2025 = new Date(2025, 1, 28);
const bounds2025 = getMaleDobInputBounds(nonLeap2025);
assert.strictEqual(bounds2025.min, '1964-02-29', 'Oldest eligible user was born on leap day 1964');
const validFeb29_1964 = validateMaleScreeningAge('1964-02-29', nonLeap2025);
assert.strictEqual(validFeb29_1964.isValid, true);
assert.strictEqual(validFeb29_1964.age, 60);
const invalidFeb28_1964 = validateMaleScreeningAge('1964-02-28', nonLeap2025);
assert.strictEqual(invalidFeb28_1964.isValid, false);
assert.strictEqual(invalidFeb28_1964.age, 61);
console.log('✓ Leap year date picker and validation boundary edge cases verified');

console.log('\n======================================================');
console.log('ALL ONBOARDING, MEASUREMENT & PASSWORD TESTS PASSED! 🎉');
console.log('======================================================');
