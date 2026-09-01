/**
 * OvaSense Intelligence Service
 *
 * Connects the React frontend to the Django intelligence backend.
 *
 * Priority chain:
 *   1. Try Django backend (real Ovasense-ML Extra Trees + TreeSHAP)
 *   2. On failure (timeout / offline / 401 / 500): fall back to local rule engine
 *   3. Never show raw error strings in the health UI
 *
 * Security:
 *   - Bearer token is the Supabase access token (obtained from the Supabase client)
 *   - The user_id is NEVER sent in the request body — the server derives it from the JWT
 *   - SUPABASE_SERVICE_ROLE_KEY never touches the frontend
 */

import { supabase } from '../lib/supabase';
import type {
  IntelligenceAssessment,
  IntelligenceServiceStatus,
  HealthSnapshot,
} from '../types/intelligence';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8000/api';
const ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/`;
const HEALTH_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/health/`;
const STATUS_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/status/`;

/** Timeout in milliseconds for backend requests */
const REQUEST_TIMEOUT_MS = 12000;

// ---------------------------------------------------------------------------
// Token helper
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fetch with timeout
// ---------------------------------------------------------------------------

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Backend available check
// ---------------------------------------------------------------------------

export async function checkBackendStatus(): Promise<IntelligenceServiceStatus | null> {
  try {
    const response = await fetchWithTimeout(STATUS_ENDPOINT, { method: 'GET' }, 5000);
    if (!response.ok) return null;
    return (await response.json()) as IntelligenceServiceStatus;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
let inFlightAssessmentPromise: Promise<IntelligenceAssessment | null> | null = null;

/**
 * Request an intelligence assessment from the Django ML backend.
 *
 * The request body is EMPTY — the server derives patient identity from the JWT.
 * Any attempt to inject a user_id via the body is silently discarded by the server.
 *
 * Deduplicates in-flight requests to avoid redundant duplicate calls during
 * React component re-mounts or StrictMode effect triggers.
 *
 * Returns null on any failure (caller falls back to local engine).
 */
export async function fetchBackendAssessment(forceRefresh = false): Promise<IntelligenceAssessment | null> {
  if (!forceRefresh && inFlightAssessmentPromise) {
    console.debug('[OvaSense ML] Returning existing in-flight assessment promise');
    return inFlightAssessmentPromise;
  }

  inFlightAssessmentPromise = (async () => {
    try {
      const token = await getAccessToken();
      console.log('[OvaSense ML] Assessment request started');
      console.log('[OvaSense ML] API URL:', ASSESSMENT_ENDPOINT);
      console.log('[OvaSense ML] Auth token present:', Boolean(token));

      if (!token) {
        console.debug('[OvaSense ML] No access token available — skipping backend assessment');
        return null;
      }

      const response = await fetchWithTimeout(
        ASSESSMENT_ENDPOINT,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}), // empty body — JWT is authoritative for identity
        }
      );

      console.log('[OvaSense ML] HTTP status:', response.status);

      if (response.status === 401) {
        console.warn('[OvaSense ML] 401 Unauthorized from backend — session token rejected');
        return null;
      }

      if (!response.ok) {
        console.warn('[OvaSense ML] Backend returned HTTP error status:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[OvaSense ML] Backend response received:', {
        risk_category: data?.risk_category,
        pcos_probability: data?.pcos_probability,
        non_pcos_probability: data?.non_pcos_probability,
        screening_threshold: data?.screening_threshold,
        is_higher_risk: data?.is_higher_risk,
        explanations_count: data?.explanations?.length,
        backend_mode: data?.backend_mode,
      });

      // Support both risk_category (real model) and risk_pattern (legacy alias)
      const category = data?.risk_category || data?.risk_pattern;
      if (!category || !data?.disclaimer) {
        console.warn('[OvaSense ML] Backend response is missing required fields:', data);
        return null;
      }

      // Ensure risk_category is populated
      data.risk_category = category;

      console.log('[OvaSense ML] Parsed Risk category:', data.risk_category);
      console.log('[OvaSense ML] Parsed PCOS probability:', data.pcos_probability);
      console.log('[OvaSense ML] Parsed SHAP explanation count:', data.explanations?.length || 0);

      return data as IntelligenceAssessment;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[OvaSense ML] Backend request timed out — using local fallback');
      } else {
        console.warn('[OvaSense ML] Backend unreachable — using local fallback:', err);
      }
      return null;
    } finally {
      inFlightAssessmentPromise = null;
    }
  })();

  return inFlightAssessmentPromise;
}

// ---------------------------------------------------------------------------
// Fetch Health Snapshot from Django backend
// ---------------------------------------------------------------------------

export async function fetchHealthSnapshot(): Promise<HealthSnapshot | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await fetchWithTimeout(
      HEALTH_ENDPOINT,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!response.ok) return null;
    return (await response.json()) as HealthSnapshot;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pattern / Category label → display helpers
// ---------------------------------------------------------------------------

export const RISK_PATTERN_DISPLAY: Record<string, {
  label: string;
  color: string;
  badgeClass: string;
  description: string;
}> = {
  lower_risk: {
    label: 'Lower Screening Risk',
    color: '#34D399',
    badgeClass: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30',
    description: 'Your recorded biometrics and symptom profile currently fall in the lower screening risk tier.',
  },
  intermediate_risk: {
    label: 'Intermediate Risk',
    color: '#FBBF24',
    badgeClass: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
    description: 'Your recorded patterns indicate an intermediate screening risk profile. Continued tracking is recommended.',
  },
  higher_risk: {
    label: 'Higher Screening Risk',
    color: '#FB7185',
    badgeClass: 'text-rose-400 bg-rose-400/15 border-rose-400/30',
    description: 'Your recorded patterns cross the screening threshold (>= 38%). Discussing these findings with your doctor is advised.',
  },
  insufficient_data: {
    label: 'Building Profile',
    color: '#A797BD',
    badgeClass: 'text-purple-300 bg-purple-400/15 border-purple-400/30',
    description: 'More logged health records are needed for a reliable AI screening estimate.',
  },
  // Backwards compatibility aliases
  lower_pattern: {
    label: 'Lower Screening Risk',
    color: '#34D399',
    badgeClass: 'text-emerald-400 bg-emerald-400/15 border-emerald-400/30',
    description: 'Your recorded patterns suggest a lower screening risk profile.',
  },
  moderate_pattern: {
    label: 'Intermediate Risk',
    color: '#FBBF24',
    badgeClass: 'text-amber-400 bg-amber-400/15 border-amber-400/30',
    description: 'Your recorded patterns suggest an intermediate screening risk profile.',
  },
  higher_pattern: {
    label: 'Higher Screening Risk',
    color: '#FB7185',
    badgeClass: 'text-rose-400 bg-rose-400/15 border-rose-400/30',
    description: 'Your recorded patterns cross the screening risk threshold.',
  },
};

export function getRiskPatternDisplay(categoryOrPattern: string | undefined) {
  if (!categoryOrPattern) return RISK_PATTERN_DISPLAY['insufficient_data'];
  return RISK_PATTERN_DISPLAY[categoryOrPattern] ?? RISK_PATTERN_DISPLAY['insufficient_data'];
}

/**
 * Format probability as a precise percentage string (e.g. 64.2%).
 */
export function formatProbability(prob: number | null | undefined): string | null {
  if (prob === null || prob === undefined) return null;
  return `${(prob * 100).toFixed(1)}%`;
}

/**
 * Format confidence as an integer percentage string.
 */
export function formatConfidence(confidence: number | null | undefined): string | null {
  if (confidence === null || confidence === undefined) return null;
  return `${Math.round(confidence * 100)}%`;
}

// ---------------------------------------------------------------------------
// Completeness bar helper
// ---------------------------------------------------------------------------

export function getCompletenessColor(pct: number): string {
  if (pct >= 70) return '#34D399';
  if (pct >= 40) return '#FBBF24';
  return '#FB7185';
}
