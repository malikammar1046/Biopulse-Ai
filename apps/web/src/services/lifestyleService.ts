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
   */
  async getRecommendations(
    module?: 'ovasense' | 'androsense'
  ): Promise<LifestyleRecommendationsResult> {
    const headers = await getAuthHeaders();
    const url = module
      ? `${LIFESTYLE_ENDPOINT}?module=${encodeURIComponent(module)}`
      : LIFESTYLE_ENDPOINT;

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
