/**
 * apps/web/src/services/lifestyleService.ts
 *
 * Client API service for BioPulse AI Dynamic Lifestyle Recommendations.
 * Hits backend endpoint:
 *   GET  /api/v1/intelligence/lifestyle-recommendations/
 *   POST /api/v1/intelligence/lifestyle-recommendations/
 *
 * Completely decoupled from the legacy Meal Directory.
 */

import { supabase } from '../lib/supabase';
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

async function getAuthHeaders(): Promise<HeadersInit> {
  let token: string | undefined;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token;
  } catch {
    // ignore
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

class LifestyleService {
  /**
   * Fetch personalized lifestyle recommendations synthesized from
   * profile, screening risk, SHAP drivers, symptoms, and lab biomarkers.
   * If refresh is true, triggers a fresh recalculation instead of using cached fingerprint.
   * Implements bounded retries (0ms, 250ms, 500ms) for post-onboarding resilience.
   */
  async getRecommendations(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism',
    refresh = false
  ): Promise<LifestyleRecommendationsResult> {
    const retryDelays = [0, 250, 500];
    let lastError: any = null;

    for (let attempt = 0; attempt < retryDelays.length; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
      }

      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams();
        if (module) params.set('module', module);
        if (refresh) params.set('refresh', 'true');
        const queryString = params.toString();
        const url = queryString ? `${LIFESTYLE_ENDPOINT}?${queryString}` : LIFESTYLE_ENDPOINT;

        const res = await fetch(url, {
          method: 'GET',
          headers,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const fallbackMsg = `Unable to retrieve lifestyle recommendations (HTTP ${res.status})`;
          const errorObj = new Error(
            err.error || err.detail || fallbackMsg
          ) as any;
          errorObj.status = res.status;
          errorObj.detail = err.detail;
          lastError = errorObj;

          // Retry on 401 (auth race) or 5xx/422 if attempts remain
          if (attempt < retryDelays.length - 1 && (res.status === 401 || res.status >= 500 || res.status === 422)) {
            continue;
          }
          throw errorObj;
        }

        return await res.json();
      } catch (err: any) {
        lastError = err;
        if (attempt < retryDelays.length - 1) {
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error('Failed to load lifestyle recommendations.');
  }

  /**
   * Update the adherence lifecycle status (ACTIVE, COMPLETED, SKIPPED)
   * of a specific lifestyle recommendation item. Persists to backend database.
   */
  async updateRecommendationStatus(params: {
    recommendation_id: string;
    status: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED';
    module?: string;
    note?: string;
  }): Promise<{ status: string; recommendation_id: string; [key: string]: any }> {
    const headers = await getAuthHeaders();
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

    return res.json();
  }

  /**
   * Simulate tailored recommendations with custom preference overrides
   * (e.g. testing vegetarian swap effects or altered activity levels).
   */
  async simulateRecommendations(
    overrides: LifestyleSimulationOverride
  ): Promise<LifestyleRecommendationsResult> {
    const headers = await getAuthHeaders();
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
   * Retrieves active 7-Day Personalized AI Plan synthesized via Hybrid Rule-Based + Generative AI Engine.
   */
  async getAIPlan(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism'
  ): Promise<AILifestylePlan | null> {
    const headers = await getAuthHeaders();
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
   * Evaluates deterministic safety rules, grounds in Pakistani catalog, invokes Gemini,
   * validates output constraints, and persists result.
   */
  async generateAIPlan(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism',
    overrides?: {
      dietary_preference?: string;
      activity_level?: string;
      allergens?: string[];
    }
  ): Promise<AILifestylePlan> {
    const headers = await getAuthHeaders();
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
