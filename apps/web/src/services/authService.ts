import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth?: string;
  consent: boolean;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  fullName?: string;
  dateOfBirth?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUserProfile;
  session?: SupabaseSession | null;
  error?: string;
}

class AuthService {
  /**
   * Log in user via Supabase Auth.
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (!payload.email || !payload.password) {
      return {
        success: false,
        error: 'Please provide both an email address and password.',
      };
    }

    if (!isSupabaseConfigured()) {
      // Demo / Mock login fallback
      return {
        success: true,
        user: {
          id: 'demo-user-id-001',
          email: payload.email,
          fullName: payload.email.split('@')[0],
          createdAt: new Date().toISOString(),
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: payload.email.trim(),
        password: payload.password,
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Invalid email or password. Please try again.',
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Authentication failed. Please verify your credentials.',
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || payload.email,
          fullName: data.user.user_metadata?.full_name || '',
          dateOfBirth: data.user.user_metadata?.date_of_birth,
          createdAt: data.user.created_at,
        },
        session: data.session,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'A network error occurred during login. Please try again.',
      };
    }
  }

  /**
   * Register a new user via Supabase Auth.
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (!payload.consent) {
      return {
        success: false,
        error: 'Clinical acknowledgment consent is required to proceed.',
      };
    }

    if (!payload.email || !payload.password || !payload.fullName) {
      return {
        success: false,
        error: 'Please fill in all required fields.',
      };
    }

    if (!isSupabaseConfigured()) {
      // Demo / Mock registration fallback
      return {
        success: true,
        user: {
          id: 'demo-user-id-' + Math.random().toString(36).substring(2, 9),
          email: payload.email,
          fullName: payload.fullName,
          dateOfBirth: payload.dateOfBirth,
          createdAt: new Date().toISOString(),
        },
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim(),
        password: payload.password,
        options: {
          data: {
            full_name: payload.fullName.trim(),
            date_of_birth: payload.dateOfBirth || null,
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Account registration failed. Please try again.',
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Account could not be created. Please try again.',
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email || payload.email,
          fullName: payload.fullName,
          dateOfBirth: payload.dateOfBirth,
          createdAt: data.user.created_at,
        },
        session: data.session,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'A connection error occurred. Please try again.',
      };
    }
  }

  /**
   * Log out user and clear Supabase session.
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Send password recovery email.
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/login',
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  /**
   * Retrieve active session.
   */
  async getSession(): Promise<SupabaseSession | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Retrieve currently authenticated user.
   */
  async getUser(): Promise<SupabaseUser | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data } = await supabase.auth.getUser();
    return data.user;
  }
}

export const authService = new AuthService();
