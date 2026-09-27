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
} from '../types/lifestyle';

const BACKEND_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_BACKEND_API_URL) ||
  'http://127.0.0.1:8000/api';

const LIFESTYLE_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/lifestyle-recommendations/`;

async function getAuthHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
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
   */
  async getRecommendations(
    module?: 'ovasense' | 'androsense' | 'female_pcos' | 'male_hypogonadism',
    refresh = false
  ): Promise<LifestyleRecommendationsResult> {
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
      throw new Error(
        err.error || err.detail || `Failed to fetch lifestyle recommendations (${res.status})`
      );
    }

    return res.json();
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
}

export const lifestyleService = new LifestyleService();
