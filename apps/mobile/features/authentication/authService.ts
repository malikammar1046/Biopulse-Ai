import { UserProfile, HealthPathway } from './types';
import { mobileSupabaseAuth, SupabaseAuthSession } from '../../lib/supabase';

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
 * Validates registration password against security policies.
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
  pathway?: HealthPathway;
}

export interface RegisterResult {
  success: boolean;
  user?: UserProfile;
  errorMessage?: string;
}

// Active in-memory session user
let currentUserProfile: UserProfile | null = null;

function mapSupabaseToUserProfile(
  user: any,
  session?: SupabaseAuthSession | null
): UserProfile {
  const metadata = user.user_metadata || {};
  let pathway: HealthPathway | null = null;
  if (metadata.pathway) {
    pathway = metadata.pathway;
  } else if (metadata.gender === 'female') {
    pathway = 'female_pcos';
  } else if (metadata.gender === 'male') {
    pathway = 'male_hypogonadism';
  }

  const profile: UserProfile = {
    id: user.id || 'usr_' + Date.now(),
    email: user.email || '',
    fullName: metadata.full_name || user.email?.split('@')[0] || 'BioPulse Member',
    gender: metadata.gender,
    pathway,
    createdAt: user.created_at || new Date().toISOString(),
    accessToken: session?.access_token,
  };
  currentUserProfile = profile;
  return profile;
}

/**
 * BioPulse Authentication Service: Login with Email & Password.
 * Connects to Supabase GoTrue Auth service.
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

  const trimmedEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await mobileSupabaseAuth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      return { success: false, errorMessage: error.message };
    }

    if (data.user) {
      const user = mapSupabaseToUserProfile(data.user, data.session);
      return { success: true, user };
    }

    return {
      success: false,
      errorMessage: 'Authentication was rejected. Please verify your credentials.',
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'A network error occurred. Please check your connection.',
    };
  }
}

/**
 * BioPulse Authentication Service: Register Account with Email & Password.
 * Provisions real user in Supabase Auth.
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

  const trimmedEmail = payload.email.trim().toLowerCase();

  try {
    const { data, error } = await mobileSupabaseAuth.signUp({
      email: trimmedEmail,
      password: payload.password,
      data: {
        full_name: payload.fullName.trim(),
        pathway: payload.pathway || undefined,
        terms_agreed: true,
        terms_agreed_at: new Date().toISOString(),
      },
    });

    if (error) {
      return { success: false, errorMessage: error.message };
    }

    if (data.user) {
      const user = mapSupabaseToUserProfile(data.user, data.session);
      return { success: true, user };
    }

    return {
      success: false,
      errorMessage: 'Could not create account at this time. Please try again.',
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: err?.message || 'An error occurred during account creation.',
    };
  }
}

/**
 * Send password reset recovery email via Supabase
 */
export async function sendPasswordResetEmail(
  email: string
): Promise<{ success: boolean; message: string }> {
  const emailError = validateEmail(email);
  if (emailError) {
    return { success: false, message: emailError };
  }
  return mobileSupabaseAuth.resetPasswordForEmail(email);
}

/**
 * Log out and invalidate active session
 */
export async function logoutUser(): Promise<void> {
  currentUserProfile = null;
  await mobileSupabaseAuth.signOut();
}

/**
 * Retrieve the current in-memory user profile
 */
export function getCurrentUser(): UserProfile | null {
  if (currentUserProfile) return currentUserProfile;
  const session = mobileSupabaseAuth.getSession();
  if (session?.user) {
    return mapSupabaseToUserProfile(session.user, session);
  }
  return null;
}

/**
 * Update the user's selected pathway in active session
 */
export function updateUserPathway(pathway: HealthPathway): UserProfile | null {
  if (currentUserProfile) {
    currentUserProfile = {
      ...currentUserProfile,
      pathway,
    };
    return currentUserProfile;
  }
  return null;
}
