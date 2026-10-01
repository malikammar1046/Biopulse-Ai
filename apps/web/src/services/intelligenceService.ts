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
  ProgressiveAssessment,
} from '../types/intelligence';
import type {
  LongitudinalHealthResponse,
  MonitoringPeriodFilter,
} from '../types/longitudinalHealth';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BACKEND_API_URL = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_BACKEND_API_URL) || 'http://127.0.0.1:8000/api';
const ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/`;
const ACTIVE_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/active/`;
const HISTORY_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/history/`;
const TIER1_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/tier1/`;
const TIER2_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/tier2/`;
const CLEAR_TIER2_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/clear-tier2/`;
const MALE_TIER1_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/male/tier1/`;
const MALE_TIER2_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/male/tier2/`;
const ULTRASOUND_ASSESSMENT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/assessment/ultrasound/`;
const STATUS_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/status/`;
const CLINICAL_STATE_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/clinical-state/`;
const LONGITUDINAL_HEALTH_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/longitudinal-health/`;
const HEALTH_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/health/`;
const CHAT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/companion/chat/`;
const COMPANION_HEALTH_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/companion/health/`;


/** Timeout in milliseconds for backend requests (60s for deterministic model inference / vision) */
const REQUEST_TIMEOUT_MS = 60000;

// ---------------------------------------------------------------------------
// LocalStorage Caching Helpers for Resilient Hydration
// ---------------------------------------------------------------------------
const LOCAL_STORAGE_ACTIVE_ASSESSMENT_PREFIX = 'biopulse_active_assessment_';

export function getLocalActiveAssessment(userId?: string, module = 'female_pcos'): ProgressiveAssessment | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_ACTIVE_ASSESSMENT_PREFIX}${userId}_${module}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProgressiveAssessment;
    if (parsed && parsed.patient_id && parsed.patient_id !== userId) {
      return null;
    }
    if (parsed && parsed.module && parsed.module !== module) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalActiveAssessment(userId: string | undefined, module: string, assessment: ProgressiveAssessment): void {
  if (!userId || !assessment) return;
  try {
    assessment.patient_id = userId;
    localStorage.setItem(`${LOCAL_STORAGE_ACTIVE_ASSESSMENT_PREFIX}${userId}_${module}`, JSON.stringify(assessment));
  } catch {
    // ignore storage errors
  }
}

export function clearLocalActiveAssessment(userId?: string, module = 'female_pcos'): void {
  if (!userId) return;
  try {
    localStorage.removeItem(`${LOCAL_STORAGE_ACTIVE_ASSESSMENT_PREFIX}${userId}_${module}`);
  } catch {
    // ignore
  }
}

export function clearAllLocalAssessments(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith(LOCAL_STORAGE_ACTIVE_ASSESSMENT_PREFIX) ||
          key.startsWith('biopulse_original_ultrasound_'))
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Failed to clear local assessments:', e);
  }
}

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

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

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
// ---------------------------------------------------------------------------
// Smart In-Memory & Storage Assessment Cache
// ---------------------------------------------------------------------------

interface CachedAssessmentRecord {
  userId: string;
  module: string;
  dataHash: string;
  assessment: IntelligenceAssessment;
  timestamp: number;
}

const memoryAssessmentCacheMap = new Map<string, CachedAssessmentRecord>();
const inFlightAssessmentPromiseMap = new Map<string, Promise<IntelligenceAssessment | null>>();

function computeHealthDataHash(payload?: {
  userProfile?: any;
  cycleRecords?: any[];
  symptomRecords?: any[];
  foodLogs?: any[];
  fitnessLogs?: any[];
}): string {
  if (!payload) return 'empty';
  try {
    const up = payload.userProfile || {};
    const wh = up.womensHealth || {};
    const med = up.medical || {};
    const ls = up.lifestyle || {};

    const keyFactors = {
      uid: up.id,
      dob: up.dateOfBirth,
      h: up.heightCm,
      w: up.weightKg,
      cl: wh.cycleLength,
      pr: wh.periodRegularity,
      ms: wh.maritalStatus,
      my: wh.marriageYears,
      ip: wh.isPregnant,
      ac: wh.abortionsCount,
      cs: Array.isArray(wh.commonSymptoms) ? [...wh.commonSymptoms].sort() : [],
      conds: Array.isArray(med.conditions) ? [...med.conditions].sort() : [],
      dp: ls.dietaryPreference,
      ffi: ls.fastFoodIntake,
      re: ls.regularExercise,
      al: ls.activityLevel,
      cycleCount: Array.isArray(payload.cycleRecords) ? payload.cycleRecords.length : 0,
      symCount: Array.isArray(payload.symptomRecords) ? payload.symptomRecords.length : 0,
      symTypes: Array.isArray(payload.symptomRecords)
        ? payload.symptomRecords.map((s: any) => s.symptomType || s.symptom_type).sort()
        : [],
      foodCount: Array.isArray(payload.foodLogs) ? payload.foodLogs.length : 0,
      fitnessCount: Array.isArray(payload.fitnessLogs) ? payload.fitnessLogs.length : 0,
    };
    return JSON.stringify(keyFactors);
  } catch {
    return String(Date.now());
  }
}

export function clearAssessmentCache(userId?: string): void {
  if (userId) {
    for (const key of Array.from(memoryAssessmentCacheMap.keys())) {
      if (key.startsWith(`${userId}_`)) {
        memoryAssessmentCacheMap.delete(key);
      }
    }
    for (const key of Array.from(inFlightAssessmentPromiseMap.keys())) {
      if (key.startsWith(`${userId}_`)) {
        inFlightAssessmentPromiseMap.delete(key);
      }
    }
  } else {
    memoryAssessmentCacheMap.clear();
    inFlightAssessmentPromiseMap.clear();
  }
}

/**
 * Request an intelligence assessment from the Django ML backend.
 *
 * Caches prediction results by health-data hash. If the user navigates across
 * pages without changing their health data, returns cached assessment instantly.
 * Re-predicts only when data is modified or when explicitly requested.
 */
export async function fetchBackendAssessment(
  forceRefresh = false,
  clientHealthData?: {
    userProfile?: any;
    cycleRecords?: any[];
    symptomRecords?: any[];
    foodLogs?: any[];
    fitnessLogs?: any[];
  },
  targetModule?: string
): Promise<IntelligenceAssessment | null> {
  const currentHash = computeHealthDataHash(clientHealthData);
  const up = clientHealthData?.userProfile;
  const userId = up?.id || up?.user_id || 'anonymous';
  const mod = targetModule || (up?.gender === 'male' || up?.pathway === 'male' ? 'male_hypogonadism' : 'female_pcos');
  const cacheKey = `${userId}_${mod}`;

  // Return cached result immediately if data has not changed
  const cached = memoryAssessmentCacheMap.get(cacheKey);
  if (!forceRefresh && cached && cached.dataHash === currentHash) {
    console.log(`[OvaSense ML] Returning cached assessment for ${cacheKey} (health data unchanged)`);
    return cached.assessment;
  }

  const existingInFlight = inFlightAssessmentPromiseMap.get(cacheKey);
  if (!forceRefresh && existingInFlight) {
    console.debug(`[OvaSense ML] Returning existing in-flight assessment promise for ${cacheKey}`);
    return existingInFlight;
  }

  const promise = (async () => {
    try {
      const token = await getAccessToken();
      console.log(`[OvaSense ML] Assessment request started for ${cacheKey}`);
      console.log('[OvaSense ML] API URL:', ASSESSMENT_ENDPOINT);
      console.log('[OvaSense ML] Auth token present:', Boolean(token));

      if (!token) {
        console.debug('[OvaSense ML] No access token available; skipping backend assessment fetch');
        return null;
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetchWithTimeout(
        ASSESSMENT_ENDPOINT,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(clientHealthData || {}),
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

      // Store in memory cache with the current data fingerprint
      const parsedAssessment = data as IntelligenceAssessment;
      memoryAssessmentCacheMap.set(cacheKey, {
        userId,
        module: mod,
        dataHash: currentHash,
        assessment: parsedAssessment,
        timestamp: Date.now(),
      });

      return parsedAssessment;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.warn('[OvaSense ML] Backend request timed out');
      } else {
        console.warn('[OvaSense ML] Backend unreachable:', err);
      }
      return null;
    } finally {
      inFlightAssessmentPromiseMap.delete(cacheKey);
    }
  })();

  inFlightAssessmentPromiseMap.set(cacheKey, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// PCOS-ML Progressive Assessment API Methods
// ---------------------------------------------------------------------------
// PCOS-ML & Male-ML Progressive Assessment API Methods
// ---------------------------------------------------------------------------

/**
 * Fetches the currently active progressive assessment for the authenticated patient.
 */
export async function fetchActiveAssessment(
  _forceRefresh = false,
  module?: string,
  userId?: string
): Promise<ProgressiveAssessment | null> {
  const modKey = module || 'female_pcos';
  try {
    const token = await getAccessToken();
    if (!token) {
      return getLocalActiveAssessment(userId, modKey);
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const url = module
      ? `${ACTIVE_ASSESSMENT_ENDPOINT}?module=${encodeURIComponent(module)}`
      : ACTIVE_ASSESSMENT_ENDPOINT;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers,
    }, 30000);

    if (response.status === 401 || response.status === 403) {
      console.warn('[Intelligence API] Active assessment unauthorized (401/403).');
      return null;
    }

    if (!response.ok) {
      console.warn('[Intelligence API] Active assessment request failed with status:', response.status);
      return getLocalActiveAssessment(userId, modKey);
    }

    const data = (await response.json()) as ProgressiveAssessment;
    if (data && typeof data === 'object') {
      if (data.has_assessment === false) {
        clearLocalActiveAssessment(userId, modKey);
        return null;
      }
      saveLocalActiveAssessment(userId, modKey, data);
      return data;
    }
    return null;
  } catch (err) {
    console.warn('[Intelligence API] Active assessment error:', err);
    return getLocalActiveAssessment(userId, modKey);
  }
}

/**
 * Fetches the currently active male hypogonadism assessment.
 */
export async function fetchActiveMaleAssessment(userId?: string): Promise<ProgressiveAssessment | null> {
  return fetchActiveAssessment(false, 'male_hypogonadism', userId);
}

/**
 * Fetches the chronological history of all progressive assessments.
 */
export async function fetchAssessmentHistory(module?: string): Promise<ProgressiveAssessment[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const url = module
      ? `${HISTORY_ASSESSMENT_ENDPOINT}?module=${encodeURIComponent(module)}`
      : HISTORY_ASSESSMENT_ENDPOINT;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) return [];
    const data = await response.json();
    return (data.history || []) as ProgressiveAssessment[];
  } catch (err) {
    console.warn('[Intelligence API] Assessment history error:', err);
    return [];
  }
}

/**
 * Executes Female PCOS Tier 1 Assessment and sets it as the active result.
 */
export async function submitTier1Assessment(inputs: Record<string, any> = {}, userId?: string): Promise<ProgressiveAssessment | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn('[PCOS-ML] No access token available for Tier 1 submission.');
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetchWithTimeout(TIER1_ASSESSMENT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs),
    }, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      console.error('[PCOS-ML] Tier 1 submission failed:', response.status);
      return null;
    }

    clearAssessmentCache();
    const data = (await response.json()) as ProgressiveAssessment;
    if (data) {
      saveLocalActiveAssessment(userId || data.patient_id, 'female_pcos', data);
    }
    return data;
  } catch (err) {
    console.error('[PCOS-ML] Tier 1 error:', err);
    return null;
  }
}

function sanitizeClinicalInputs(inputs: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(inputs)) {
    if (key === 'remove_fields' || key === 'removed_fields') {
      sanitized[key] = value;
      continue;
    }
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Executes Female PCOS Cumulative Tier 2 Assessment (Tier 1 + Clinical Labs) and replaces active result.
 */
export async function submitTier2Assessment(inputs: Record<string, any>, userId?: string): Promise<ProgressiveAssessment | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn('[PCOS-ML] No access token available for Tier 2 submission.');
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const payload = sanitizeClinicalInputs(inputs);
    const response = await fetchWithTimeout(TIER2_ASSESSMENT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }, 60000);

    if (!response.ok) {
      console.error('[PCOS-ML] Tier 2 submission failed:', response.status);
      return null;
    }

    clearAssessmentCache();
    const data = (await response.json()) as ProgressiveAssessment;
    if (data) {
      saveLocalActiveAssessment(userId || data.patient_id, 'female_pcos', data);
    }
    return data;
  } catch (err) {
    console.error('[PCOS-ML] Tier 2 error:', err);
    return null;
  }
}

/**
 * Executes Male Hypogonadism Tier 1 Assessment (Questionnaire/Biometrics) and sets it as active.
 */
export async function submitMaleTier1Assessment(inputs: Record<string, any> = {}, userId?: string): Promise<ProgressiveAssessment | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn('[Male-ML] No access token available for Male Tier 1 submission.');
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetchWithTimeout(MALE_TIER1_ASSESSMENT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs),
    }, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      console.error('[Male-ML] Tier 1 submission failed:', response.status);
      return null;
    }

    clearAssessmentCache();
    const data = (await response.json()) as ProgressiveAssessment;
    if (data) {
      saveLocalActiveAssessment(userId || data.patient_id, 'male_hypogonadism', data);
    }
    return data;
  } catch (err) {
    console.error('[Male-ML] Tier 1 error:', err);
    return null;
  }
}

/**
 * Executes Male Hypogonadism Tier 2 Assessment (Clinical Labs + Hormone pattern) and replaces active result.
 */
export async function submitMaleTier2Assessment(inputs: Record<string, any>, userId?: string): Promise<ProgressiveAssessment | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn('[Male-ML] No access token available for Male Tier 2 submission.');
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const payload = sanitizeClinicalInputs(inputs);
    const response = await fetchWithTimeout(MALE_TIER2_ASSESSMENT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    }, 60000);

    if (!response.ok) {
      console.error('[Male-ML] Tier 2 submission failed:', response.status);
      return null;
    }

    clearAssessmentCache();
    const data = (await response.json()) as ProgressiveAssessment;
    if (data) {
      saveLocalActiveAssessment(userId || data.patient_id, 'male_hypogonadism', data);
    }
    return data;
  } catch (err) {
    console.error('[Male-ML] Tier 2 error:', err);
    return null;
  }
}

/**
 * Explicitly clears Tier 2 stored clinical/lab data and recalculates Tier 1 active assessment.
 */
export async function clearTier2Assessment(module: string = 'female_pcos', userId?: string): Promise<ProgressiveAssessment | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn('[Intelligence API] No access token available to clear Tier 2.');
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetchWithTimeout(CLEAR_TIER2_ASSESSMENT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ module }),
    }, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
      console.error('[Intelligence API] Clear Tier 2 failed:', response.status);
      return null;
    }

    clearAssessmentCache();
    const data = (await response.json()) as ProgressiveAssessment;
    if (data) {
      saveLocalActiveAssessment(userId || data.patient_id, module, data);
    }
    return data;
  } catch (err) {
    console.error('[Intelligence API] Clear Tier 2 error:', err);
    return null;
  }
}

/**
 * Retrieves the authoritative persistent patient clinical state (Tier 1 & Tier 2 inputs).
 */
export async function fetchPatientClinicalState(
  module: string = 'female_pcos'
): Promise<{
  user_id: string;
  module: string;
  tier_1_inputs: Record<string, any>;
  tier_2_inputs: Record<string, any>;
  ultrasound_inputs: Record<string, any>;
} | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    const url = `${CLINICAL_STATE_ENDPOINT}?module=${encodeURIComponent(module)}`;
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers,
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('[Intelligence API] fetchPatientClinicalState error:', err);
    return null;
  }
}

/**
 * Uploads an ultrasound image for morphological analysis (PCOM) and multimodal fusion.
 */

export async function uploadUltrasoundAssessment(
  imageFile: File,
  reportId?: string,
  userId?: string
): Promise<ProgressiveAssessment | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.warn('[PCOS-ML] No access token available for ultrasound upload.');
      return null;
    }
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };

    const formData = new FormData();
    formData.append('image', imageFile);
    if (reportId) formData.append('report_id', reportId);

    const response = await fetchWithTimeout(
      ULTRASOUND_ASSESSMENT_ENDPOINT,
      {
        method: 'POST',
        headers,
        body: formData,
      },
      60000 // 60s timeout for deep vision model inference
    );

    if (!response.ok) {
      console.error('[PCOS-ML] Ultrasound upload failed:', response.status);
      return null;
    }

    clearAssessmentCache();
    const data = (await response.json()) as ProgressiveAssessment;
    if (data) {
      saveLocalActiveAssessment(userId || data.patient_id, 'female_pcos', data);
    }
    return data;
  } catch (err) {
    console.error('[PCOS-ML] Ultrasound error:', err);
    return null;
  }
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
  // Aliases for diverse backend responses
  lower: {
    label: 'Lower Screening Risk',
    color: '#059669',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    description: 'Your recorded biometrics and symptom profile currently fall in the lower screening risk tier.',
  },
  low: {
    label: 'Lower Screening Risk',
    color: '#059669',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    description: 'Your recorded biometrics and symptom profile currently fall in the lower screening risk tier.',
  },
  low_risk: {
    label: 'Lower Screening Risk',
    color: '#059669',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    description: 'Your recorded biometrics and symptom profile currently fall in the lower screening risk tier.',
  },
  moderate: {
    label: 'Intermediate Risk',
    color: '#D97706',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-300',
    description: 'Your recorded patterns indicate an intermediate screening risk profile. Continued tracking is recommended.',
  },
  intermediate: {
    label: 'Intermediate Risk',
    color: '#D97706',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-300',
    description: 'Your recorded patterns indicate an intermediate screening risk profile. Continued tracking is recommended.',
  },
  higher: {
    label: 'Higher Screening Risk',
    color: '#E11D48',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-300',
    description: 'Your recorded patterns cross the screening threshold. Discussing these findings with your doctor is advised.',
  },
  high: {
    label: 'Higher Screening Risk',
    color: '#E11D48',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-300',
    description: 'Your recorded patterns cross the screening threshold. Discussing these findings with your doctor is advised.',
  },
  high_risk: {
    label: 'Higher Screening Risk',
    color: '#E11D48',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-300',
    description: 'Your recorded patterns cross the screening threshold. Discussing these findings with your doctor is advised.',
  },
  lower_pattern: {
    label: 'Lower Screening Risk',
    color: '#059669',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    description: 'Your recorded patterns suggest a lower screening risk profile.',
  },
  moderate_pattern: {
    label: 'Intermediate Risk',
    color: '#D97706',
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-300',
    description: 'Your recorded patterns suggest an intermediate screening risk profile.',
  },
  higher_pattern: {
    label: 'Higher Screening Risk',
    color: '#E11D48',
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-300',
    description: 'Your recorded patterns cross the screening risk threshold.',
  },
};

export function getRiskPatternDisplay(categoryOrPattern: string | undefined, label?: string) {
  if (!categoryOrPattern && !label) return RISK_PATTERN_DISPLAY['insufficient_data'];
  const raw = (categoryOrPattern || label || '').toLowerCase().trim().replace(/[\s-]/g, '_');

  if (raw in RISK_PATTERN_DISPLAY) {
    return RISK_PATTERN_DISPLAY[raw];
  }

  if (raw.includes('lower') || raw.includes('low')) {
    return RISK_PATTERN_DISPLAY['lower_risk'];
  }
  if (raw.includes('intermediate') || raw.includes('moderate')) {
    return RISK_PATTERN_DISPLAY['intermediate_risk'];
  }
  if (raw.includes('higher') || raw.includes('high')) {
    return RISK_PATTERN_DISPLAY['higher_risk'];
  }

  return RISK_PATTERN_DISPLAY['insufficient_data'];
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

// ---------------------------------------------------------------------------
// Real OvaSense Conversational Intelligence API
// ---------------------------------------------------------------------------

export async function sendChatMessage(
  message: string,
  conversationId?: string,
  conversationHistory?: Array<{ sender: 'user' | 'ai'; text: string }>,
  clientTelemetry?: Record<string, any>
): Promise<import('../types/intelligence').ChatResponsePayload | null> {
  const token = await getAccessToken();
  if (!token) {
    console.warn('sendChatMessage: No access token available (user not authenticated).');
    return null;
  }

  const pathway = clientTelemetry?.pathway || '';
  const payload = {
    message,
    conversation_id: conversationId || '',
    pathway,
    conversation_history: conversationHistory || [],
    client_telemetry: clientTelemetry || {},
  };

  try {
    const response = await fetchWithTimeout(
      CHAT_ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
      REQUEST_TIMEOUT_MS
    );

    // If 200 OK or 503 Service Unavailable with a structured payload, parse JSON
    if (response.ok || response.status === 503) {
      try {
        const data = await response.json();
        return {
          ...data,
          message: data.reply || data.message || '',
        } as import('../types/intelligence').ChatResponsePayload;
      } catch {
        // Continue to fallback
      }
    }

    console.warn(`sendChatMessage failed with status ${response.status}`);
    return null;
  } catch (err) {
    console.error('sendChatMessage network error:', err);
    return null;
  }
}

/**
 * Health check for the BioPulse AI Companion (Qwen3 1.7B).
 * Verifies Ollama connectivity and configured model availability without generating chat completions.
 */
export async function checkCompanionHealth(): Promise<{
  status: string;
  ollama_reachable: boolean;
  configured_model?: string;
  model_available?: boolean;
  available_models?: string[];
  error?: string | null;
} | null> {
  try {
    const response = await fetchWithTimeout(COMPANION_HEALTH_ENDPOINT, { method: 'GET' }, 5000);
    if (!response.ok && response.status !== 503) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetches authoritative longitudinal health summary and historical trends.
 * Supports period filtering ('30d' | '90d' | '180d' | '1y' | 'all') and pathway scoping.
 * Implements bounded retries (0ms, 250ms, 500ms) with rich diagnostics.
 */
export async function getLongitudinalHealth(
  period: MonitoringPeriodFilter = '90d',
  module?: string,
  signal?: AbortSignal
): Promise<LongitudinalHealthResponse | null> {
  const retryDelays = [0, 250, 500];

  for (let attempt = 0; attempt < retryDelays.length; attempt++) {
    if (attempt > 0) {
      if (signal?.aborted) return null;
      await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
    }

    try {
      let token = await getAccessToken();
      if (!token) {
        // Attempt a quick session refresh if token is initially missing
        try {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token ?? null;
        } catch {
          // ignore
        }
      }

      if (!token) {
        console.warn('[Intelligence API] getLongitudinalHealth: No active auth token available.');
        return null;
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      const params = new URLSearchParams();
      if (period) params.set('period', period);
      if (module) params.set('module', module);

      const url = `${LONGITUDINAL_HEALTH_ENDPOINT}?${params.toString()}`;
      const response = await fetchWithTimeout(url, { method: 'GET', headers, signal }, 15000);

      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch {
          errorBody = '(could not parse response body)';
        }
        console.warn(
          `[Intelligence API] getLongitudinalHealth attempt ${attempt + 1}/${retryDelays.length} failed: HTTP ${response.status} | body: ${errorBody}`
        );

        // Do not retry 401 Unauthorized or 403 Forbidden; session problem must be handled by auth
        if (response.status === 401 || response.status === 403) {
          return null;
        }

        // Retry on 422 (transient hydration race) or 500/503
        if (attempt < retryDelays.length - 1) {
          continue;
        }
        return null;
      }

      return (await response.json()) as LongitudinalHealthResponse;
    } catch (err: any) {
      if (err?.name === 'AbortError' || signal?.aborted) {
        return null;
      }
      console.error(`[Intelligence API] getLongitudinalHealth network error attempt ${attempt + 1}:`, err);
      if (attempt === retryDelays.length - 1) {
        return null;
      }
    }
  }

  return null;
}


