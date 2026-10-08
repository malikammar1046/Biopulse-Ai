/**
 * apps/web/src/services/lifestyleService.ts
 *
 * Client API service for BioPulse AI Dynamic Lifestyle Recommendations.
 * Hits backend endpoints:
 *   GET   /api/v1/intelligence/lifestyle-recommendations/
 *   POST  /api/v1/intelligence/lifestyle-recommendations/
 *   PATCH /api/v1/intelligence/lifestyle-recommendations/status/
 *   GET   /api/v1/intelligence/lifestyle-ai-plan/
 *   POST  /api/v1/intelligence/lifestyle-ai-plan/
 *
 * Features:
 * - Robust bounded authentication handling with automatic 1-time session refresh
 * - Bounded exponential backoff retry for transient network/server failures (300ms, 800ms, 1500ms)
 * - User-scoped, pathway-aware in-memory cache (3-minute TTL)
 * - Identical in-flight request deduplication with caller-isolated abort signals
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  LifestyleRecommendationsResult,
  LifestyleSimulationOverride,
  AILifestylePlan,
} from '../types/lifestyle';

const BACKEND_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_BACKEND_API_URL) ||
  'http://127.0.0.1:8000/api';

const LIFESTYLE_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/lifestyle-recommendations/`;
const AI_PLAN_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/lifestyle-ai-plan/`;

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

interface CacheEntry {
  data: LifestyleRecommendationsResult;
  timestamp: number;
}

export class SessionError extends Error {
  status = 401;
  code = 'SESSION_UNAVAILABLE';
  constructor(message = 'Your session has expired or is unavailable. Please sign in again.') {
    super(message);
    this.name = 'SessionError';
  }
}

/**
 * Normalizes pathway/module aliases into canonical names ('ovasense' | 'androsense').
 */
function normalizeModule(
  module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism' | string
): string {
  if (!module) return 'ovasense';
  const m = module.toLowerCase();
  if (m.includes('andro') || m.includes('male')) return 'androsense';
  return 'ovasense';
}

/**
 * Obtains authenticated HTTP headers with robust session retrieval.
 * If token is expired or missing, performs a single safe session refresh.
 * Never silently sends an anonymous request to authenticated endpoints.
 */
async function getAuthHeaders(forceRefresh = false): Promise<{ headers: HeadersInit; userId: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      headers: { 'Content-Type': 'application/json' },
      userId: 'demo-local-user',
    };
  }

  let session: any = null;

  try {
    if (forceRefresh) {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session) {
        session = data.session;
      }
    } else {
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) {
        session = data.session;
      }
    }
  } catch {
    session = null;
  }

  // If session is still missing or near expiry (<15s), attempt one safe refresh
  if (!session && !forceRefresh) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session) {
        session = data.session;
      }
    } catch {
      session = null;
    }
  } else if (session?.expires_at && session.expires_at * 1000 < Date.now() + 15000 && !forceRefresh) {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data?.session) {
        session = data.session;
      }
    } catch {
      // Retain current session if refresh network failed
    }
  }

  const token = session?.access_token;
  if (!token) {
    throw new SessionError();
  }

  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    userId: session?.user?.id || null,
  };
}

/**
 * Wraps a shared in-flight promise with a consumer-specific AbortSignal.
 * If the caller aborts, their wrapper promise rejects with AbortError without
 * killing the shared background request for other subscribers.
 */
function attachAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      }
    );
  });
}

class LifestyleService {
  private cache = new Map<string, CacheEntry>();
  private inFlightRequests = new Map<string, Promise<LifestyleRecommendationsResult>>();

  /**
   * Builds user-scoped cache key.
   */
  private buildCacheKey(module?: string, userId?: string | null): string {
    const canon = normalizeModule(module);
    const uid = userId || 'active-user';
    return `${uid}:${canon}`;
  }

  /**
   * Synchronously checks for valid, non-expired cached recommendations.
   */
  getCachedRecommendations(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism' | string,
    userId?: string | null
  ): LifestyleRecommendationsResult | null {
    const key = this.buildCacheKey(module, userId);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Stores successful result in user-scoped cache.
   */
  setCachedRecommendations(
    module: string | undefined,
    data: LifestyleRecommendationsResult,
    userId?: string | null
  ): void {
    const key = this.buildCacheKey(module, userId);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Updates adherence status of a recommendation item in the local cache,
   * keeping the UI in sync without needing a full re-fetch.
   */
  updateCachedRecommendationStatus(
    recommendationId: string,
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED',
    module?: string,
    userId?: string | null
  ): void {
    const key = this.buildCacheKey(module, userId);
    const entry = this.cache.get(key);
    if (!entry || !entry.data.recommendations) return;

    const updated = entry.data.recommendations.map((rec) =>
      rec.id === recommendationId ? { ...rec, status } : rec
    );

    this.cache.set(key, {
      ...entry,
      data: {
        ...entry.data,
        recommendations: updated,
      },
    });
  }

  /**
   * Clears the recommendation cache. If userId provided, clears only that user's entries.
   */
  clearCache(userId?: string | null): void {
    if (!userId) {
      this.cache.clear();
      return;
    }
    const prefix = `${userId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Fetch personalized lifestyle recommendations synthesized from
   * profile, screening risk, SHAP drivers, symptoms, and lab biomarkers.
   *
   * Features:
   * - Immediate cache hit if fresh (< 3 mins) and !refresh
   * - Request deduplication for simultaneous calls
   * - Bounded exponential backoff for transient failures (300ms, 800ms, 1500ms)
   * - Safe one-time session refresh upon 401
   */
  async getRecommendations(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism',
    refresh = false,
    signal?: AbortSignal,
    userId?: string | null
  ): Promise<LifestyleRecommendationsResult> {
    const canonical = normalizeModule(module);

    // 1. Return from cache if fresh and not explicitly refreshing
    if (!refresh) {
      const cached = this.getCachedRecommendations(canonical, userId);
      if (cached) {
        return cached;
      }
    }

    // 2. Request deduplication: join in-flight request if present
    const inFlightKey = `${userId || 'active'}:${canonical}:${refresh}`;
    const existingInFlight = this.inFlightRequests.get(inFlightKey);
    if (existingInFlight) {
      return attachAbortSignal(existingInFlight, signal);
    }

    // 3. Initiate new deduplicated request
    const requestPromise = (async (): Promise<LifestyleRecommendationsResult> => {
      const retryDelays = [300, 800, 1500];
      let refreshedAuthTried = false;
      let lastError: any = null;

      for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }

        if (attempt > 0) {
          const delay = retryDelays[attempt - 1];
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (signal?.aborted) {
            throw new DOMException('Aborted', 'AbortError');
          }
        }

        try {
          const { headers, userId: detectedUserId } = await getAuthHeaders(refreshedAuthTried);

          const params = new URLSearchParams();
          if (module) params.set('module', module);
          if (refresh) params.set('refresh', 'true');
          const queryString = params.toString();
          const url = queryString ? `${LIFESTYLE_ENDPOINT}?${queryString}` : LIFESTYLE_ENDPOINT;

          const res = await fetch(url, {
            method: 'GET',
            headers,
            // Do not pass signal directly to fetch so aborted caller doesn't break shared in-flight fetch
          });

          if (!res.ok) {
            // Safe single refresh retry for 401
            if (res.status === 401 && !refreshedAuthTried) {
              refreshedAuthTried = true;
              continue; // Retry once with refreshed session
            }

            const errBody = await res.json().catch(() => ({}));
            const fallbackMsg = `Unable to retrieve lifestyle recommendations (HTTP ${res.status})`;
            const errorObj: any = new Error(errBody.error || errBody.detail || fallbackMsg);
            errorObj.status = res.status;
            errorObj.detail = errBody.detail;

            // Deterministic errors: do not retry
            if (res.status === 404 || res.status === 400 || res.status === 403 || res.status === 422) {
              throw errorObj;
            }

            // Session error after refresh attempt failed: do not retry further
            if (res.status === 401) {
              throw new SessionError();
            }

            lastError = errorObj;
            // Transient 502/503/504 can continue loop
            if (attempt < retryDelays.length && (res.status === 502 || res.status === 503 || res.status === 504)) {
              continue;
            }

            throw errorObj;
          }

          const result: LifestyleRecommendationsResult = await res.json();

          // Persist to local cache
          const effectiveUser = userId || detectedUserId;
          this.setCachedRecommendations(canonical, result, effectiveUser);

          return result;
        } catch (err: any) {
          if (err?.name === 'AbortError' || signal?.aborted) {
            throw err;
          }

          if (err instanceof SessionError || err?.code === 'SESSION_UNAVAILABLE' || err?.status === 404) {
            throw err;
          }

          // Check if transient network error
          const isNetworkErr =
            err?.name === 'TypeError' ||
            String(err?.message || '').toLowerCase().includes('failed to fetch');

          lastError = err;

          if (attempt < retryDelays.length && isNetworkErr) {
            continue;
          }

          throw err;
        }
      }

      throw lastError || new Error('Failed to load lifestyle recommendations.');
    })();

    // Store in-flight tracker and cleanup on settlement
    this.inFlightRequests.set(inFlightKey, requestPromise);
    requestPromise.finally(() => {
      this.inFlightRequests.delete(inFlightKey);
    });

    return attachAbortSignal(requestPromise, signal);
  }

  /**
   * Update the adherence lifecycle status (ACTIVE, COMPLETED, SKIPPED)
   * of a specific lifestyle recommendation item. Persists to backend database
   * and synchronizes the local in-memory cache immediately.
   */
  async updateRecommendationStatus(params: {
    recommendation_id: string;
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED';
    module?: string;
    note?: string;
    userId?: string | null;
  }): Promise<{ status: string; recommendation_id: string; [key: string]: any }> {
    const { headers } = await getAuthHeaders();
    const url = `${LIFESTYLE_ENDPOINT}status/`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error || err.detail || `Failed to update recommendation status (${res.status})`
      );
    }

    const json = await res.json();

    // Sync cache
    this.updateCachedRecommendationStatus(
      params.recommendation_id,
      params.status,
      params.module,
      params.userId
    );

    return json;
  }

  /**
   * Simulate tailored recommendations with custom preference overrides.
   * Does not overwrite base user cache.
   */
  async simulateRecommendations(
    overrides: LifestyleSimulationOverride
  ): Promise<LifestyleRecommendationsResult> {
    const { headers } = await getAuthHeaders();
    const res = await fetch(LIFESTYLE_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(overrides),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.error || err.detail || `Failed to simulate lifestyle recommendations (${res.status})`
      );
    }

    return res.json();
  }

  /**
   * Retrieves active 7-Day Personalized AI Plan synthesized via Hybrid Engine.
   */
  async getAIPlan(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism'
  ): Promise<AILifestylePlan | null> {
    const { headers } = await getAuthHeaders();
    const params = new URLSearchParams();
    if (module) params.set('module', module);
    const url = params.toString() ? `${AI_PLAN_ENDPOINT}?${params.toString()}` : AI_PLAN_ENDPOINT;

    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || `Failed to retrieve AI plan (${res.status})`);
    }

    return res.json();
  }

  /**
   * Generates or regenerates 7-Day Personalized AI Plan.
   */
  async generateAIPlan(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism',
    overrides?: {
      dietary_preference?: string;
      activity_level?: string;
      allergens?: string[];
    }
  ): Promise<AILifestylePlan> {
    const { headers } = await getAuthHeaders();
    const params = new URLSearchParams();
    if (module) params.set('module', module);
    params.set('refresh', 'true');
    const url = `${AI_PLAN_ENDPOINT}?${params.toString()}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(overrides || { refresh: true }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || `Failed to generate AI plan (${res.status})`);
    }

    return res.json();
  }
}

export const lifestyleService = new LifestyleService();
