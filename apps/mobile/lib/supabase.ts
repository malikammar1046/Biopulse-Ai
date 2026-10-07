/**
 * BioPulse AI Mobile — Supabase Client & GoTrue REST Service
 *
 * Provides resilient, dependency-free Supabase Auth integration for Expo & React Native.
 * Uses direct HTTPS REST endpoints to guarantee compatibility across Expo Go,
 * iOS, Android, and Web with zero native linking requirements.
 */

import { Platform } from 'react-native';
import { persistentStorage } from './storage';

declare const process: {
  env: Record<string, string | undefined>;
};

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dqqrqwjeebecmgfsihtv.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_rZfbhMCOuoCGq4TVmjiEbA_wnlcutJP';

export const AUTH_SESSION_STORAGE_KEY = 'biopulse_auth_session';

export interface SupabaseUserMetadata {
  full_name?: string;
  gender?: string;
  pathway?: 'female_pcos' | 'male_hypogonadism' | 'female' | 'male' | string;
  terms_agreed?: boolean;
  terms_agreed_at?: string;
  [key: string]: any;
}

export interface SupabaseAuthUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at?: string;
  user_metadata?: SupabaseUserMetadata;
}

export interface SupabaseAuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: SupabaseAuthUser;
}

export interface SupabaseAuthResponse {
  data: {
    user: SupabaseAuthUser | null;
    session: SupabaseAuthSession | null;
  };
  error: {
    message: string;
    status?: number;
    code?: string;
  } | null;
}

// In-memory session cache for current runtime
let activeSessionCache: SupabaseAuthSession | null = null;
const sessionListeners: Array<(session: SupabaseAuthSession | null) => void> = [];

export function subscribeToAuthChanges(
  callback: (session: SupabaseAuthSession | null) => void
): () => void {
  sessionListeners.push(callback);
  return () => {
    const idx = sessionListeners.indexOf(callback);
    if (idx !== -1) sessionListeners.splice(idx, 1);
  };
}

function notifyAuthListeners(session: SupabaseAuthSession | null, persist = true) {
  activeSessionCache = session;
  if (persist) {
    if (session) {
      persistentStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session)).catch((e) => {
        console.warn('[BioPulse Supabase] Failed to persist session:', e);
      });
    } else {
      persistentStorage.removeItem(AUTH_SESSION_STORAGE_KEY).catch((e) => {
        console.warn('[BioPulse Supabase] Failed to remove persisted session:', e);
      });
    }
  }

  sessionListeners.forEach((listener) => {
    try {
      listener(session);
    } catch (e) {
      console.warn('[BioPulse Supabase] Listener callback error:', e);
    }
  });
}

/**
 * Common headers for Supabase requests
 */
function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Execute a Supabase Auth REST request with timeout
 */
async function fetchAuthEndpoint(
  endpoint: string,
  options: {
    method: 'GET' | 'POST';
    body?: any;
    token?: string;
    timeoutMs?: number;
  }
): Promise<{ status: number; body: any }> {
  const url = `${SUPABASE_URL}/auth/v1${endpoint}`;
  const timeoutMs = options.timeoutMs || 12000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method,
      headers: getHeaders(options.token),
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    let parsedBody: any = null;
    const text = await response.text();
    if (text) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = { message: text };
      }
    }
    return { status: response.status, body: parsedBody || {} };
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new Error('Connection timed out. Please check your network and retry.');
    }
    throw err;
  }
}

export const mobileSupabaseAuth = {
  /**
   * Log in user with email & password via Supabase Auth
   */
  async signInWithPassword(params: {
    email: string;
    password: string;
  }): Promise<SupabaseAuthResponse> {
    try {
      const { status, body } = await fetchAuthEndpoint('/token?grant_type=password', {
        method: 'POST',
        body: {
          email: params.email.trim().toLowerCase(),
          password: params.password,
        },
      });

      if (status >= 200 && status < 300 && body.access_token && body.user) {
        const session: SupabaseAuthSession = {
          access_token: body.access_token,
          token_type: body.token_type || 'bearer',
          expires_in: body.expires_in || 3600,
          expires_at: Math.floor(Date.now() / 1000) + (body.expires_in || 3600),
          refresh_token: body.refresh_token,
          user: body.user,
        };
        notifyAuthListeners(session);
        return {
          data: { user: session.user, session },
          error: null,
        };
      }

      // Map Supabase error codes to user-friendly clinical messages
      let message = body.msg || body.error_description || body.message || 'Invalid credentials.';
      if (body.error_code === 'invalid_credentials' || message.includes('Invalid login credentials')) {
        message = 'Invalid email address or password. Please verify your credentials.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Your email address has not been confirmed yet. Please check your inbox.';
      }

      return {
        data: { user: null, session: null },
        error: { message, status, code: body.error_code },
      };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: {
          message:
            err?.message ||
            'Unable to reach BioPulse authentication service. Please check your internet connection.',
        },
      };
    }
  },

  /**
   * Register a new user with email & password via Supabase Auth
   */
  async signUp(params: {
    email: string;
    password: string;
    data?: SupabaseUserMetadata;
  }): Promise<SupabaseAuthResponse> {
    try {
      const { status, body } = await fetchAuthEndpoint('/signup', {
        method: 'POST',
        body: {
          email: params.email.trim().toLowerCase(),
          password: params.password,
          data: params.data || {},
        },
      });

      if (status >= 200 && status < 300) {
        // Some configurations return user directly without session if email confirm is on
        const user: SupabaseAuthUser = body.user || body;
        const session: SupabaseAuthSession | null = body.access_token
          ? {
              access_token: body.access_token,
              token_type: body.token_type || 'bearer',
              expires_in: body.expires_in || 3600,
              expires_at: Math.floor(Date.now() / 1000) + (body.expires_in || 3600),
              refresh_token: body.refresh_token,
              user,
            }
          : null;

        if (session) {
          notifyAuthListeners(session);
        }

        return {
          data: { user, session },
          error: null,
        };
      }

      let message = body.msg || body.error_description || body.message || 'Registration failed.';
      if (
        message.toLowerCase().includes('already registered') ||
        message.toLowerCase().includes('already exists') ||
        body.error_code === 'user_already_exists'
      ) {
        message = 'An account with this email address already exists. Please log in instead.';
      } else if (message.toLowerCase().includes('rate limit')) {
        message = 'Signup rate limit exceeded. Please wait a moment before trying again.';
      }

      return {
        data: { user: null, session: null },
        error: { message, status, code: body.error_code },
      };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: {
          message:
            err?.message ||
            'Unable to connect to BioPulse service. Please verify your connection and try again.',
        },
      };
    }
  },

  /**
   * Request password recovery reset email via Supabase Auth
   */
  async resetPasswordForEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const { status, body } = await fetchAuthEndpoint('/recover', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      });

      if (status >= 200 && status < 300) {
        return {
          success: true,
          message: 'If an account exists for this email, password recovery instructions have been sent.',
        };
      }

      return {
        success: false,
        message: body.msg || body.message || 'Unable to process password reset. Please try again.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error occurred while requesting password reset.',
      };
    }
  },

  /**
   * Sign out and clear active session
   */
  async signOut(): Promise<void> {
    if (activeSessionCache?.access_token) {
      try {
        await fetchAuthEndpoint('/logout', {
          method: 'POST',
          token: activeSessionCache.access_token,
          timeoutMs: 4000,
        });
      } catch {
        // Silently clear local session on network failure
      }
    }
    notifyAuthListeners(null);
  },

  /**
   * Get currently active session from memory
   */
  getSession(): SupabaseAuthSession | null {
    return activeSessionCache;
  },

  /**
   * Manually update active session cache
   */
  setSession(session: SupabaseAuthSession | null): void {
    notifyAuthListeners(session);
  },

  /**
   * Refresh active session using refresh_token
   */
  async refreshSession(refreshToken?: string): Promise<SupabaseAuthSession | null> {
    const tokenToUse = refreshToken || activeSessionCache?.refresh_token;
    if (!tokenToUse) {
      return null;
    }

    try {
      const { status, body } = await fetchAuthEndpoint('/token?grant_type=refresh_token', {
        method: 'POST',
        body: { refresh_token: tokenToUse },
      });

      if (status >= 200 && status < 300 && body.access_token && body.user) {
        const refreshedSession: SupabaseAuthSession = {
          access_token: body.access_token,
          token_type: body.token_type || 'bearer',
          expires_in: body.expires_in || 3600,
          expires_at: Math.floor(Date.now() / 1000) + (body.expires_in || 3600),
          refresh_token: body.refresh_token || tokenToUse,
          user: body.user,
        };
        notifyAuthListeners(refreshedSession, true);
        return refreshedSession;
      }
    } catch (err) {
      console.warn('[BioPulse Supabase] Token refresh error:', err);
    }
    return null;
  },

  /**
   * Restore stored session from persistent storage on startup
   */
  async restoreSession(): Promise<SupabaseAuthSession | null> {
    try {
      const raw = await persistentStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed: SupabaseAuthSession = JSON.parse(raw);
      if (!parsed?.access_token || !parsed?.user) {
        await persistentStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        return null;
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const isExpired = parsed.expires_at ? parsed.expires_at <= nowSec + 60 : false;

      if (isExpired && parsed.refresh_token) {
        const refreshed = await this.refreshSession(parsed.refresh_token);
        if (refreshed) {
          return refreshed;
        }
      }

      // Valid session restored
      notifyAuthListeners(parsed, false);
      return parsed;
    } catch (err) {
      console.warn('[BioPulse Supabase] Session restoration failed:', err);
      await persistentStorage.removeItem(AUTH_SESSION_STORAGE_KEY).catch(() => {});
      return null;
    }
  },
};
