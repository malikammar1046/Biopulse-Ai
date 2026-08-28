/**
 * PMOSense API client configuration placeholder.
 * Base configuration and headers contract for backend requests.
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export const API_CONFIG = {
  timeoutMs: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;
