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
 */
export function validatePakistaniPhone(phone: string | undefined | null): ValidationResult {
  if (!phone || !phone.trim()) {
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
