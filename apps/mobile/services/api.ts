/**
 * BioPulse Mobile — API Client Core
 *
 * Centralized, typed HTTP client for communication with:
 * 1. Supabase REST API (user-owned clinical state and lifestyle tracking)
 * 2. Django Backend (ML assessment, OCR extraction, AI companion, nutrition engine)
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

declare const process: {
  env: Record<string, string | undefined>;
};
// ============================================================================
// DYNAMIC BACKEND URL RESOLUTION & NORMALIZATION
// ============================================================================

/**
 * Intelligently resolves and normalizes the Django Backend API URL:
 * 1. Reads process.env.EXPO_PUBLIC_BACKEND_URL if provided, normalizes trailing slashes,
 *    and ensures the '/api' suffix is present without duplication.
 * 2. On physical devices in Expo Go / dev build, extracts the local LAN host IP from
 *    Expo Constants (e.g. '192.168.1.5:8000/api') so requests reach the dev machine.
 * 3. On Android emulators without an explicit env variable, routes to '10.0.2.2:8000/api'.
 * 4. Falls back safely to 'http://127.0.0.1:8000/api' for local web / iOS simulator.
 */
export function resolveBackendApiUrl(): string {
  const envUrl = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_BACKEND_URL : undefined;
  if (envUrl && envUrl.trim().length > 0) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) {
      clean = `${clean}/api`;
    }
    return clean;
  }

  try {
    // Discover dev machine LAN IP via Expo Constants (physical device / Expo Go)
    const Constants = require('expo-constants')?.default || require('expo-constants');
    const hostUri = Constants?.expoConfig?.hostUri || Constants?.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri && typeof hostUri === 'string') {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:8000/api`;
      }
    }
  } catch {
    // expo-constants not available in this runtime
  }

  try {
    const { Platform } = require('react-native');
    if (Platform?.OS === 'android') {
      return 'http://10.0.2.2:8000/api';
    }
  } catch {
    // react-native not available
  }

  return 'http://127.0.0.1:8000/api';
}

export const BACKEND_API_URL = resolveBackendApiUrl();

// ============================================================================
// TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export class BioPulseApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'BioPulseApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const API_CONFIG = {
  timeoutMs: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

// Re-export URLs for service usage
export { SUPABASE_URL, SUPABASE_ANON_KEY };

export function getDjangoBaseUrl(): string {
  return BACKEND_API_URL;
}

export function createSuccessResponse<T>(data: T, status = 200): ApiResponse<T> {
  return { data, error: null, status };
}

export function createErrorResponse<T>(error: string, status = 400, _code?: string): ApiResponse<T> {
  return { data: null, error, status };
}

// ============================================================================
// HEADER FACTORIES
// ============================================================================

/**
 * Builds standard Supabase headers with anon key and user bearer token
 */
export function getSupabaseHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Builds Django backend headers with optional user bearer token
 */
export function getDjangoHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ============================================================================
// AUTH EXPIRATION & SESSION STATE
// ============================================================================

export type AuthFailureListener = () => void;
const authFailureListeners = new Set<AuthFailureListener>();
let isSessionExpired = false;

export function registerAuthFailureListener(listener: AuthFailureListener): () => void {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

export function notifyAuthFailure(): void {
  isSessionExpired = true;
  for (const listener of authFailureListeners) {
    try {
      listener();
    } catch (err) {
      console.warn('[BioPulse api] Error in auth failure listener:', err);
    }
  }
}

export function isAuthExpired(): boolean {
  return isSessionExpired;
}

export function setAuthExpired(expired: boolean): void {
  isSessionExpired = expired;
}

// ============================================================================
// OFFLINE ARCHITECTURE SPECIFICATION
// ============================================================================

/**
 * Truthful, authoritative declaration of offline capabilities across BioPulse Mobile.
 * - Offline Reading: Supported via persistent local cache (dashboard cache, user profile draft, session tokens).
 * - Offline Mutations: NOT supported. Clinical safety requires real-time backend validation.
 *   Mutations are safely rejected with truthful messaging; zero fake health data is ever generated.
 */
export const OFFLINE_ARCHITECTURE_DECLARATION = {
  supportsOfflineReading: true,
  supportsOfflineMutations: false,
  cachingLayer: 'persistentStorage (expo-file-system / localStorage)',
  syncBehavior: 'Optimistic local cache restored upon restart. Online connection strictly required for new clinical inputs.',
  gracefulOfflineMessage: "You appear to be offline. Please reconnect to the internet to complete this action and synchronize your health records.",
} as const;

// ============================================================================
// ERROR CLASSIFICATION HELPERS
// ============================================================================

export function isNetworkOfflineError(status: number, error?: string | null): boolean {
  if (status === 0 || status === 408) return true;
  if (!error) return false;
  const lower = error.toLowerCase();
  return (
    lower.includes('network') ||
    lower.includes('offline') ||
    lower.includes('internet') ||
    lower.includes('failed to fetch') ||
    lower.includes('timed out') ||
    lower.includes('connection')
  );
}

export function isAuthExpiredError(status: number): boolean {
  return status === 401;
}

export function isValidationError(status: number): boolean {
  return status === 400 || status === 422;
}

export function isServerError(status: number): boolean {
  return status >= 500 && status <= 599;
}

export function isTimeoutError(status: number): boolean {
  return status === 408;
}

export function isMalformedResponseError(status: number, error?: string | null): boolean {
  if (status === 422 && error?.toLowerCase().includes('malformed')) return true;
  if (error?.toLowerCase().includes('malformed') || error?.toLowerCase().includes('unexpected token')) return true;
  return false;
}

// ============================================================================
// RESPONSE NORMALIZER
// ============================================================================

/**
 * Safely parses response JSON and maps HTTP errors into predictable ApiResponse
 */
export async function normalizeResponse<T>(res: Response): Promise<ApiResponse<T>> {
  let responseData: any = null;
  let errorMessage: string | null = null;
  let isMalformed = false;

  try {
    const text = await res.text();
    if (text && text.trim().length > 0) {
      responseData = JSON.parse(text);
    }
  } catch (_err) {
    // Malformed JSON response body
    responseData = null;
    isMalformed = true;
  }

  // Handle malformed response on otherwise successful HTTP status
  if (isMalformed && res.ok) {
    return {
      data: null,
      error: 'Malformed response received from server. Please try again.',
      status: 422,
    };
  }

  if (!res.ok) {
    if (res.status === 401) {
      notifyAuthFailure();
    }

    if (responseData && typeof responseData === 'object') {
      errorMessage =
        responseData.message ||
        responseData.error ||
        responseData.detail ||
        (Array.isArray(responseData.errors) ? responseData.errors[0] : null) ||
        `HTTP Error ${res.status}`;
    } else {
      switch (res.status) {
        case 401:
          errorMessage = 'Authentication expired or invalid. Please sign in again.';
          break;
        case 403:
          errorMessage = 'Permission denied for requested resource.';
          break;
        case 404:
          errorMessage = 'Requested resource not found.';
          break;
        case 422:
          errorMessage = 'Validation failed for submitted data.';
          break;
        case 500:
          errorMessage = 'BioPulse server error. Please try again later.';
          break;
        default:
          errorMessage = `Request failed with status ${res.status}`;
      }
    }

    return {
      data: null,
      error: errorMessage,
      status: res.status,
    };
  }

  return {
    data: responseData as T,
    error: null,
    status: res.status,
  };
}

/**
 * Generic safe fetch wrapper with automatic timeout and error normalization
 */
export async function safeRequest<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_CONFIG.timeoutMs
): Promise<ApiResponse<T>> {
  // Prevent unauthorized cascading requests if session has expired
  if (isSessionExpired && options.headers && (options.headers as any)['Authorization']) {
    return {
      data: null,
      error: 'User session has expired. Please sign in again.',
      status: 401,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return await normalizeResponse<T>(res);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return {
        data: null,
        error: 'Network request timed out. Please check your internet connection.',
        status: 408,
      };
    }
    return {
      data: null,
      error: err?.message || 'Network error occurred while contacting server.',
      status: 0,
    };
  }
}


