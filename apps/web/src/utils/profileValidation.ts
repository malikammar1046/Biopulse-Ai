/**
 * Profile & Biometric Validation Utilities
 * Enforces clinical minimum age (at least 13 years old) and Pakistani phone standards.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DobValidationResult extends ValidationResult {
  age?: number;
}

/**
 * Validates that Date of Birth is present, a valid date, not in the future,
 * and meets the minimum age requirement of 13 years old.
 * Timezone-safe date component parsing prevents edge boundary shifts.
 */
export function validateDateOfBirth(dateOfBirth: string | undefined | null): DobValidationResult {
  if (!dateOfBirth || !dateOfBirth.trim()) {
    return {
      isValid: false,
      error: 'Date of birth is required.',
    };
  }

  const trimmed = dateOfBirth.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return {
      isValid: false,
      error: 'Please enter a valid date of birth (YYYY-MM-DD).',
    };
  }

  const birthYear = parseInt(match[1], 10);
  const birthMonth = parseInt(match[2], 10);
  const birthDay = parseInt(match[3], 10);

  // Validate calendar validity
  const testDate = new Date(birthYear, birthMonth - 1, birthDay);
  if (
    testDate.getFullYear() !== birthYear ||
    testDate.getMonth() !== birthMonth - 1 ||
    testDate.getDate() !== birthDay
  ) {
    return {
      isValid: false,
      error: 'Please enter a valid calendar date of birth.',
    };
  }

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  // Check if future date
  if (
    birthYear > todayYear ||
    (birthYear === todayYear && birthMonth > todayMonth) ||
    (birthYear === todayYear && birthMonth === todayMonth && birthDay > todayDay)
  ) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future.',
    };
  }

  // Calculate exact age from complete date of birth
  let age = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age--;
  }

  // Minimum permitted age is 13 (users must be older than 12)
  if (age < 13) {
    return {
      isValid: false,
      age,
      error: 'You must be at least 13 years old to use BioPulse AI.',
    };
  }

  return {
    isValid: true,
    age,
  };
}

/**
 * Validates male screening age eligibility (ages 19–60 inclusive).
 * Enforces that users below 19 or above 60 cannot enter or complete male onboarding.
 * Calculated dynamically using the provided or current date, handling birthdays and leap years.
 */
export function validateMaleScreeningAge(
  dateOfBirth: string | undefined | null,
  now: Date = new Date()
): DobValidationResult {
  if (!dateOfBirth || !dateOfBirth.trim()) {
    return {
      isValid: false,
      error: 'Date of birth is required.',
    };
  }

  const trimmed = dateOfBirth.trim();
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) {
    return {
      isValid: false,
      error: 'Please enter a valid date of birth (YYYY-MM-DD).',
    };
  }

  const birthYear = parseInt(match[1], 10);
  const birthMonth = parseInt(match[2], 10);
  const birthDay = parseInt(match[3], 10);

  // Validate calendar validity (e.g., rejects Feb 30, April 31)
  const testDate = new Date(birthYear, birthMonth - 1, birthDay);
  if (
    testDate.getFullYear() !== birthYear ||
    testDate.getMonth() !== birthMonth - 1 ||
    testDate.getDate() !== birthDay
  ) {
    return {
      isValid: false,
      error: 'Please enter a valid calendar date of birth.',
    };
  }

  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  // Check if future date
  if (
    birthYear > todayYear ||
    (birthYear === todayYear && birthMonth > todayMonth) ||
    (birthYear === todayYear && birthMonth === todayMonth && birthDay > todayDay)
  ) {
    return {
      isValid: false,
      error: 'Date of birth cannot be in the future.',
    };
  }

  // Calculate exact age from complete date of birth, respecting birthdays and leap years
  let age = todayYear - birthYear;
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    age--;
  }

  // Lower boundary: Must be at least 19 years old
  if (age < 19) {
    return {
      isValid: false,
      age,
      error: 'BioPulse AI male screening is calibrated for adult men aged 19 to 60. You must be at least 19 years old to participate in male screening.',
    };
  }

  // Upper boundary: Must be 60 or younger
  if (age > 60) {
    return {
      isValid: false,
      age,
      error: 'BioPulse AI male screening is calibrated for adult men aged 19 to 60. In men older than 60, age-related endocrine changes require direct clinical evaluation with a physician.',
    };
  }

  return {
    isValid: true,
    age,
  };
}

/**
 * Returns dynamic HTML date picker bounds for male screening:
 * - max: Exactly 19 years before today's date (youngest eligible user)
 * - min: 61 years before today's date + 1 day (oldest user who is still 60 today)
 */
export function getMaleDobInputBounds(now: Date = new Date()): { min: string; max: string } {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  let maxDate: Date;
  let minDate: Date;

  if (month === 1 && day === 29) {
    // Leap day edge case: year - 19 and year - 61 are non-leap years.
    // Latest eligible birthdate (turning 19 today) is Feb 28, year - 19.
    // Earliest eligible birthdate (turning 61 tomorrow on Mar 1) is Mar 1, year - 61.
    maxDate = new Date(year - 19, 1, 28);
    minDate = new Date(year - 61, 2, 1);
  } else {
    // Exactly 19 years ago (turning 19 today)
    maxDate = new Date(year - 19, month, day);
    // 61 years ago + 1 day (oldest eligible birthdate where age is still 60 today)
    minDate = new Date(year - 61, month, day + 1);
  }

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  };

  return {
    min: format(minDate),
    max: format(maxDate),
  };
}

/**
 * Returns dynamic HTML date picker bounds:
 * - max: Exactly 13 years before today's date
 * - min: 120 years before today's date
 */
export function getDobInputBounds(): { min: string; max: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // Exactly 13 years ago
  const maxDate = new Date(year - 13, month, day);
  // 120 years ago
  const minDate = new Date(year - 120, month, day);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  };

  return {
    min: format(minDate),
    max: format(maxDate),
  };
}

/**
 * Validates that a phone number is an 11-digit Pakistani phone number starting with 03 or +92.
 * Supports optional phone numbers (returns valid when empty if options.optional is true).
 */
export function validatePakistaniPhone(
  phone: string | undefined | null,
  options?: { optional?: boolean }
): ValidationResult {
  if (!phone || !phone.trim()) {
    if (options?.optional) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: 'Phone number is required.',
    };
  }

  // Remove spaces, dashes, dots, parentheses
  const cleaned = phone.trim().replace(/[\s\-\.\(\)]/g, '');

  // Case 1: International format starting with +92
  if (cleaned.startsWith('+92')) {
    const rest = cleaned.slice(3);
    // +92 followed by 10 digits (e.g. +92 300 1234567)
    if (/^\d{10}$/.test(rest)) {
      return { isValid: true };
    }
    // +92 followed by 0 and 10 digits (e.g. +92 0300 1234567)
    if (/^0\d{10}$/.test(rest)) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: 'Pakistani number with +92 must have 10 digits (e.g. +92 300 1234567).',
    };
  }

  // Case 2: International format starting with 0092 or 92
  if (cleaned.startsWith('0092')) {
    const rest = cleaned.slice(4);
    if (/^\d{10}$/.test(rest) || /^0\d{10}$/.test(rest)) {
      return { isValid: true };
    }
  } else if (cleaned.startsWith('92')) {
    const rest = cleaned.slice(2);
    if (/^\d{10}$/.test(rest) || /^0\d{10}$/.test(rest)) {
      return { isValid: true };
    }
  }

  // Case 3: National format starting with 0 (must be exactly 11 digits)
  if (cleaned.startsWith('0')) {
    if (/^0\d{10}$/.test(cleaned)) {
      return { isValid: true };
    }
    return {
      isValid: false,
      error: `Pakistani phone number starting with 0 must be exactly 11 digits (e.g. 03001234567). Currently ${cleaned.length} digits.`,
    };
  }

  // Case 4: Invalid prefix / non-Pakistani number
  return {
    isValid: false,
    error: 'Phone number must be a valid Pakistani number of 11 digits starting with 0 (e.g. 03001234567) or +92 (e.g. +923001234567).',
  };
}

/**
 * Rigorously validates an email address against RFC standards:
 * - Proper local-part and domain separation via a single '@'
 * - Disallows spaces, consecutive dots, and leading/trailing dots/hyphens
 * - Enforces minimum 2-character alphabetic Top-Level Domain (TLD) e.g., .com, .org, .ai, .edu, .co.uk
 * - Enforces RFC length limits (total <= 254 chars, local part <= 64 chars)
 */
export function validateEmail(email: string | undefined | null): ValidationResult {
  if (!email || !email.trim()) {
    return {
      isValid: false,
      error: 'Please enter your email address.',
    };
  }

  const trimmed = email.trim();

  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: 'Email address cannot exceed 254 characters.',
    };
  }

  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Email address cannot contain spaces.',
    };
  }

  if (trimmed.includes('..')) {
    return {
      isValid: false,
      error: 'Email address cannot contain consecutive dots.',
    };
  }

  const atParts = trimmed.split('@');
  if (atParts.length < 2) {
    return {
      isValid: false,
      error: "Email address must include an '@' symbol (e.g., name@example.com).",
    };
  }

  if (atParts.length > 2) {
    return {
      isValid: false,
      error: "Email address cannot contain more than one '@' symbol.",
    };
  }

  const [local, domain] = atParts;

  if (!local) {
    return {
      isValid: false,
      error: "Please enter a username before the '@' symbol.",
    };
  }

  if (local.length > 64) {
    return {
      isValid: false,
      error: 'Email username cannot exceed 64 characters.',
    };
  }

  if (local.startsWith('.') || local.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email username cannot start or end with a dot.',
    };
  }

  // Local part valid characters: letters, numbers, and allowed punctuation: !#$%&'*+/=?^_`{|}~.-
  const localRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
  if (!localRegex.test(local)) {
    return {
      isValid: false,
      error: 'Email username contains invalid characters.',
    };
  }

  if (!domain) {
    return {
      isValid: false,
      error: "Please enter a domain after the '@' symbol (e.g., example.com).",
    };
  }

  if (domain.length > 253) {
    return {
      isValid: false,
      error: 'Email domain is too long.',
    };
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return {
      isValid: false,
      error: 'Email domain cannot start or end with a dot.',
    };
  }

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return {
      isValid: false,
      error: 'Email domain must include an extension (e.g., name@example.com).',
    };
  }

  for (let i = 0; i < domainParts.length; i++) {
    const label = domainParts[i];
    if (!label) {
      return {
        isValid: false,
        error: 'Email domain contains invalid empty segments.',
      };
    }
    if (label.length > 63) {
      return {
        isValid: false,
        error: 'Email domain segment cannot exceed 63 characters.',
      };
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return {
        isValid: false,
        error: 'Email domain cannot start or end with a hyphen.',
      };
    }

    if (i === domainParts.length - 1) {
      // Top-level domain must be only alphabetic characters, between 2 and 63 chars
      if (!/^[a-zA-Z]{2,63}$/.test(label)) {
        return {
          isValid: false,
          error: 'Please enter a valid domain extension (e.g., .com, .org, .edu, .ai).',
        };
      }
    } else {
      if (!/^[a-zA-Z0-9-]+$/.test(label)) {
        return {
          isValid: false,
          error: 'Email domain contains invalid characters.',
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Returns boolean whether an email address is valid according to RFC and TLD standards.
 */
export function isValidEmail(email: string | undefined | null): boolean {
  return validateEmail(email).isValid;
}

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  error?: string;
}

/**
 * Validates registration password:
 * - At least 8 characters
 * - At least one letter (a-z or A-Z)
 * - At least one number (0-9)
 */
export function validateRegistrationPassword(password: string | undefined | null): PasswordValidationResult {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);

  if (!pwd) {
    return {
      isValid: false,
      hasMinLength: false,
      hasLetter: false,
      hasNumber: false,
      error: 'Please create a password.',
    };
  }

  const missing: string[] = [];
  if (!hasMinLength) missing.push('at least 8 characters');
  if (!hasLetter) missing.push('at least one letter');
  if (!hasNumber) missing.push('at least one number');

  if (missing.length > 0) {
    return {
      isValid: false,
      hasMinLength,
      hasLetter,
      hasNumber,
      error: `Password must include ${missing.join(', ')}.`,
    };
  }

  return {
    isValid: true,
    hasMinLength: true,
    hasLetter: true,
    hasNumber: true,
  };
}

