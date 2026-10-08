/**
 * BioPulse Mobile — API Client Core
 *
 * Centralized, typed HTTP client for communication with:
 * 1. Supabase REST API (user-owned clinical state and lifestyle tracking)
 * 2. Django Backend (ML assessment, OCR extraction, AI companion, nutrition engine)
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';
import { BACKEND_API_URL } from './assessmentService';

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
export { SUPABASE_URL, SUPABASE_ANON_KEY, BACKEND_API_URL };

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
// RESPONSE NORMALIZER
// ============================================================================

/**
 * Safely parses response JSON and maps HTTP errors into predictable ApiResponse
 */
export async function normalizeResponse<T>(res: Response): Promise<ApiResponse<T>> {
  let responseData: any = null;
  let errorMessage: string | null = null;

  try {
    const text = await res.text();
    if (text && text.trim().length > 0) {
      responseData = JSON.parse(text);
    }
  } catch (_err) {
    // Malformed JSON response
    responseData = null;
  }

  if (!res.ok) {
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

