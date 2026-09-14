// Test suite for Date of Birth (16-50 years) & Pakistani Phone Number (11 digits, 0 or +92)
import assert from 'node:assert';

function validateDateOfBirth(dateOfBirth) {
  if (!dateOfBirth || !dateOfBirth.trim()) {
    return { isValid: false, error: 'Date of birth is required.' };
  }

  const dob = new Date(dateOfBirth.trim());
  if (isNaN(dob.getTime())) {
    return { isValid: false, error: 'Please enter a valid date of birth (YYYY-MM-DD).' };
  }

  const today = new Date();
  if (dob > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future.' };
  }

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 16) {
    return {
      isValid: false,
      age,
      error: `Participant must be at least 16 years old (currently ${age < 0 ? 0 : age} years old).`,
    };
  }

  if (age > 50) {
    return {
      isValid: false,
      age,
      error: `Participant must be 50 years old or younger (currently ${age} years old).`,
    };
  }

  return { isValid: true, age };
}

function validatePakistaniPhone(phone) {
  if (!phone || !phone.trim()) {
    return { isValid: false, error: 'Phone number is required.' };
  }

  const cleaned = phone.trim().replace(/[\s\-\.\(\)]/g, '');

  if (cleaned.startsWith('+92')) {
    const rest = cleaned.slice(3);
    if (/^\d{10}$/.test(rest)) return { isValid: true };
    if (/^0\d{10}$/.test(rest)) return { isValid: true };
    return { isValid: false, error: 'Pakistani number with +92 must have 10 digits.' };
  }

  if (cleaned.startsWith('0092')) {
    const rest = cleaned.slice(4);
    if (/^\d{10}$/.test(rest) || /^0\d{10}$/.test(rest)) return { isValid: true };
  } else if (cleaned.startsWith('92')) {
    const rest = cleaned.slice(2);
    if (/^\d{10}$/.test(rest) || /^0\d{10}$/.test(rest)) return { isValid: true };
  }

  if (cleaned.startsWith('0')) {
    if (/^0\d{10}$/.test(cleaned)) return { isValid: true };
    return {
      isValid: false,
      error: `Pakistani phone number starting with 0 must be exactly 11 digits. Currently ${cleaned.length} digits.`,
    };
  }

  return {
    isValid: false,
    error: 'Phone number must be a valid Pakistani number of 11 digits starting with 0 or +92.',
  };
}

console.log('--- Testing DOB validation (16 - 50 years old) ---');
const today = new Date();
const formatDob = (yearsAgo) => {
  const d = new Date(today.getFullYear() - yearsAgo, today.getMonth(), today.getDate());
  return d.toISOString().split('T')[0];
};

// 1. Under 16
const dob14 = formatDob(14);
assert.strictEqual(validateDateOfBirth(dob14).isValid, false);
console.log('✓ Age 14 rejected:', validateDateOfBirth(dob14).error);

// 2. Exactly 16
const dob16 = formatDob(16);
assert.strictEqual(validateDateOfBirth(dob16).isValid, true);
console.log('✓ Age 16 accepted: age =', validateDateOfBirth(dob16).age);

// 3. Middle range (25)
const dob25 = formatDob(25);
assert.strictEqual(validateDateOfBirth(dob25).isValid, true);
console.log('✓ Age 25 accepted: age =', validateDateOfBirth(dob25).age);

// 4. Exactly 50
const dob50 = formatDob(50);
assert.strictEqual(validateDateOfBirth(dob50).isValid, true);
console.log('✓ Age 50 accepted: age =', validateDateOfBirth(dob50).age);

// 5. Over 50 (52)
const dob52 = formatDob(52);
assert.strictEqual(validateDateOfBirth(dob52).isValid, false);
console.log('✓ Age 52 rejected:', validateDateOfBirth(dob52).error);

// 6. Screenshot case: '2004-07-24' (in 2026, age is ~22)
assert.strictEqual(validateDateOfBirth('2004-07-24').isValid, true);
console.log('✓ Screenshot DOB 2004-07-24 accepted: age =', validateDateOfBirth('2004-07-24').age);

console.log('\n--- Testing Phone Number validation (11 digits, Pakistani origin 0 or +92) ---');

// 1. Screenshot invalid phone: 12345678991
assert.strictEqual(validatePakistaniPhone('12345678991').isValid, false);
console.log('✓ Screenshot phone "12345678991" rejected:', validatePakistaniPhone('12345678991').error);

// 2. Standard 11 digit starting with 0: 03001234567
assert.strictEqual(validatePakistaniPhone('03001234567').isValid, true);
console.log('✓ Standard 03001234567 accepted');

// 3. With spaces/dashes: 0300-1234567
assert.strictEqual(validatePakistaniPhone('0300-1234567').isValid, true);
console.log('✓ Formatted 0300-1234567 accepted');

// 4. International with +92: +923001234567
assert.strictEqual(validatePakistaniPhone('+923001234567').isValid, true);
console.log('✓ International +923001234567 accepted');

// 5. International with spaces: +92 300 1234567
assert.strictEqual(validatePakistaniPhone('+92 300 1234567').isValid, true);
console.log('✓ International +92 300 1234567 accepted');

// 6. 10 digits starting with 0 (too short): 0300123456
assert.strictEqual(validatePakistaniPhone('0300123456').isValid, false);
console.log('✓ 10 digits rejected:', validatePakistaniPhone('0300123456').error);

// 7. 12 digits starting with 0 (too long): 030012345678
assert.strictEqual(validatePakistaniPhone('030012345678').isValid, false);
console.log('✓ 12 digits rejected:', validatePakistaniPhone('030012345678').error);

// 8. US number: +1 555 123 4567
assert.strictEqual(validatePakistaniPhone('+1 555 123 4567').isValid, false);
console.log('✓ Non-Pakistani +1 rejected');

console.log('\nAll validation test scenarios passed successfully!');
