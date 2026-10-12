/**
 * BioPulse AI - Centralized Backend API Configuration
 *
 * Resolves the backend base URL with strict production guards.
 * Prevents production builds from silently using localhost/127.0.0.1 as backend.
 */

export function resolveBackendApiUrl(): string {
  const envUrl = (
    typeof import.meta !== 'undefined' &&
    (import.meta as any)?.env?.VITE_BACKEND_API_URL
  )?.toString().trim();

  const isProd =
    typeof import.meta !== 'undefined' &&
    Boolean((import.meta as any)?.env?.PROD);

  if (envUrl && envUrl.length > 0) {
    const cleaned = envUrl.replace(/\/+$/, '');
    if (isProd && (cleaned.includes('localhost') || cleaned.includes('127.0.0.1'))) {
      console.warn(
        `[BioPulse API Config] Production build configured with localhost backend URL: ${cleaned}. Falling back to relative /api to prevent browser connection failures.`
      );
      return '/api';
    }
    return cleaned;
  }

  // In production builds without explicit VITE_BACKEND_API_URL, DO NOT silently
  // fall back to localhost (which fails on client browsers). Default safely to relative /api.
  if (isProd) {
    return '/api';
  }

  // In local development, default to local Django development server
  return 'http://127.0.0.1:8000/api';
}

export const BACKEND_API_URL = resolveBackendApiUrl();
