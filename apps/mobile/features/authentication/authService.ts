import { UserProfile } from './types';

/**
 * Validates a user's full name.
 * Returns null if valid, or a concise error message.
 */
export function validateFullName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Full name is required';
  }
  if (trimmed.length < 2) {
    return 'Please enter a valid full name';
  }
  return null;
}

/**
 * Validates an email address.
 * Returns null if valid, or a concise user-friendly error string.
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validates login password.
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

/**
 * Validates registration password against backend security policies.
 * Requirements:
 * - At least 8 characters
 * - Mix of letters and numbers or symbols
 */
export function validateRegistrationPassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  if (!hasLetter || !hasNumberOrSymbol) {
    return 'Password must include a mix of letters, numbers or symbols';
  }
  return null;
}

/**
 * Validates password confirmation match.
 */
export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
}

/**
 * Validates terms and conditions agreement.
 */
export function validateTermsAgreement(agreed: boolean): string | null {
  if (!agreed) {
    return 'You must agree to the Terms of Service and Privacy Policy to continue';
  }
  return null;
}

export interface LoginResult {
  success: boolean;
  user?: UserProfile;
  errorMessage?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  termsAgreed: boolean;
}

export interface RegisterResult {
  success: boolean;
  user?: UserProfile;
  errorMessage?: string;
}

/**
 * BioPulse Authentication Service: Login with Email & Password.
 */
export async function loginWithEmailAndPassword(
  email: string,
  password: string
): Promise<LoginResult> {
  const emailError = validateEmail(email);
  if (emailError) {
    return { success: false, errorMessage: emailError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { success: false, errorMessage: passwordError };
  }

  // Simulate network resolution delay (700ms)
  await new Promise((resolve) => setTimeout(resolve, 700));

  const trimmedEmail = email.trim().toLowerCase();

  // Test error triggers
  if (trimmedEmail === 'invalid@example.com' || password === 'wrongpassword') {
    return {
      success: false,
      errorMessage: 'Invalid email address or password. Please try again.',
    };
  }

  if (trimmedEmail === 'networkerror@example.com') {
    return {
      success: false,
      errorMessage: 'Unable to connect to server. Please check your network connection.',
    };
  }

  return {
    success: true,
    user: {
      id: 'usr_biopulse_' + Date.now(),
      email: trimmedEmail,
      fullName: 'BioPulse Member',
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * BioPulse Authentication Service: Register Account with Email & Password.
 *
 * Implements:
 * - Full validation checks
 * - Clean integration boundary for backend / Supabase user provisioning
 * - User-facing error messaging without raw exceptions
 */
export async function registerWithEmailAndPassword(
  payload: RegisterPayload
): Promise<RegisterResult> {
  const nameError = validateFullName(payload.fullName);
  if (nameError) {
    return { success: false, errorMessage: nameError };
  }

  const emailError = validateEmail(payload.email);
  if (emailError) {
    return { success: false, errorMessage: emailError };
  }

  const passwordError = validateRegistrationPassword(payload.password);
  if (passwordError) {
    return { success: false, errorMessage: passwordError };
  }

  if (payload.confirmPassword !== undefined) {
    const confirmError = validateConfirmPassword(
      payload.password,
      payload.confirmPassword
    );
    if (confirmError) {
      return { success: false, errorMessage: confirmError };
    }
  }

  const termsError = validateTermsAgreement(payload.termsAgreed);
  if (termsError) {
    return { success: false, errorMessage: termsError };
  }

  // Simulate backend provisioning delay (850ms)
  await new Promise((resolve) => setTimeout(resolve, 850));

  const trimmedEmail = payload.email.trim().toLowerCase();

  // Simulated conflict / duplicate email trigger
  if (trimmedEmail === 'taken@example.com' || trimmedEmail === 'existing@example.com') {
    return {
      success: false,
      errorMessage: 'An account with this email address already exists. Please log in instead.',
    };
  }

  // Simulated network error trigger
  if (trimmedEmail === 'networkerror@example.com') {
    return {
      success: false,
      errorMessage: 'Unable to connect to server. Please check your connection and retry.',
    };
  }

  return {
    success: true,
    user: {
      id: 'usr_biopulse_' + Date.now(),
      email: trimmedEmail,
      fullName: payload.fullName.trim(),
      createdAt: new Date().toISOString(),
    },
  };
}
