/**
 * BioPulse Mobile — Authentication Service
 *
 * Provides typed, clean service interface for:
 * - User login via Supabase GoTrue Auth
 * - User registration with email/password and pathway selection
 * - Persistent session restoration
 * - Logout and cross-user memory purging
 * - Password recovery
 */

import {
  loginWithEmailAndPassword,
  registerWithEmailAndPassword,
  logoutUser,
  sendPasswordResetEmail,
  getCurrentUser,
  validateEmail,
  validatePassword,
  validateRegistrationPassword,
  validateFullName,
  validateConfirmPassword,
  validateTermsAgreement,
  LoginResult,
  RegisterPayload,
  RegisterResult,
} from '../features/authentication/authService';
import { UserProfile } from '../features/authentication/types';
import { mobileSupabaseAuth } from '../lib/supabase';
import { ApiResponse } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends RegisterPayload {}

export interface AuthSessionResponse {
  user: UserProfile;
  token?: string;
}

export class AuthService {
  /**
   * Log in user using email and password
   */
  static async login(credentials: LoginCredentials): Promise<ApiResponse<UserProfile>> {
    const emailErr = validateEmail(credentials.email);
    if (emailErr) {
      return { data: null, error: emailErr, status: 400 };
    }
    const passErr = validatePassword(credentials.password);
    if (passErr) {
      return { data: null, error: passErr, status: 400 };
    }

    const result: LoginResult = await loginWithEmailAndPassword(
      credentials.email,
      credentials.password
    );

    if (result.success && result.user) {
      return { data: result.user, error: null, status: 200 };
    }

    return {
      data: null,
      error: result.errorMessage || 'Invalid email or password.',
      status: 401,
    };
  }

  /**
   * Register a new BioPulse account
   */
  static async register(payload: RegisterCredentials): Promise<ApiResponse<UserProfile>> {
    const nameErr = validateFullName(payload.fullName);
    if (nameErr) return { data: null, error: nameErr, status: 400 };

    const emailErr = validateEmail(payload.email);
    if (emailErr) return { data: null, error: emailErr, status: 400 };

    const passErr = validateRegistrationPassword(payload.password);
    if (passErr) return { data: null, error: passErr, status: 400 };

    if (payload.confirmPassword) {
      const confirmErr = validateConfirmPassword(payload.password, payload.confirmPassword);
      if (confirmErr) return { data: null, error: confirmErr, status: 400 };
    }

    const termsErr = validateTermsAgreement(payload.termsAgreed);
    if (termsErr) return { data: null, error: termsErr, status: 400 };

    const result: RegisterResult = await registerWithEmailAndPassword(payload);

    if (result.success && result.user) {
      return { data: result.user, error: null, status: 201 };
    }

    return {
      data: null,
      error: result.errorMessage || 'Registration failed. Please try again.',
      status: 400,
    };
  }

  /**
   * Restore existing persistent session
   */
  static async restoreSession(): Promise<ApiResponse<UserProfile | null>> {
    try {
      const session = await mobileSupabaseAuth.restoreSession();
      if (!session) {
        return { data: null, error: null, status: 204 };
      }
      const user = getCurrentUser();
      return { data: user, error: null, status: user ? 200 : 204 };
    } catch (err: any) {
      return {
        data: null,
        error: err?.message || 'Failed to restore session.',
        status: 500,
      };
    }
  }

  /**
   * Log out active user and clear session
   */
  static async logout(): Promise<ApiResponse<boolean>> {
    try {
      await logoutUser();
      return { data: true, error: null, status: 200 };
    } catch (err: any) {
      return { data: false, error: err?.message, status: 500 };
    }
  }

  /**
   * Send password recovery email
   */
  static async resetPassword(email: string): Promise<ApiResponse<boolean>> {
    const err = validateEmail(email);
    if (err) return { data: false, error: err, status: 400 };

    const res = await sendPasswordResetEmail(email);
    return {
      data: res.success,
      error: res.success ? null : res.message,
      status: res.success ? 200 : 400,
    };
  }

  /**
   * Get currently active in-memory user
   */
  static getCurrentUser(): UserProfile | null {
    return getCurrentUser();
  }
}

export {
  validateEmail,
  validatePassword,
  validateRegistrationPassword,
  validateFullName,
  validateConfirmPassword,
  validateTermsAgreement,
};
