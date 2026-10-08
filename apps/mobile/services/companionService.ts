/**
 * BioPulse Mobile — Intelligence Companion Service
 *
 * Connects directly to authoritative Django AI Companion endpoints:
 *   - POST /api/v1/intelligence/companion/chat/
 *   - GET  /api/v1/intelligence/companion/health/
 *   - GET  /api/v1/intelligence/clinical-state/
 *
 * Uses Qwen3 1.7B clinical intelligence with safety guardrails,
 * clinical context builder, and privacy boundary sanitization.
 * Never fabricates AI responses.
 */

import {
  ApiResponse,
  safeRequest,
  getDjangoHeaders,
  getDjangoBaseUrl,
} from './api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CompanionSender = 'user' | 'companion' | 'human';

export interface CompanionHistoryMessage {
  sender: CompanionSender;
  text: string;
  timestamp?: number | string;
}

export interface CompanionChatRequest {
  message: string;
  conversation_id?: string;
  conversation_history?: CompanionHistoryMessage[];
  pathway?: 'female' | 'male' | 'male_hypogonadism';
  client_telemetry?: {
    platform?: string;
    screen?: string;
    app_version?: string;
    [key: string]: unknown;
  };
}

export interface CompanionChatResponse {
  success: boolean;
  reply: string;
  message: string;
  conversation_id: string;
  context_used?: {
    pathway?: string;
    has_active_assessment?: boolean;
    excluded_food_categories?: string[];
    [key: string]: unknown;
  };
  safety_level: 'routine' | 'caution' | 'urgent';
  needs_clinician: boolean;
  model: string;
}

export interface CompanionHealthStatus {
  status: 'healthy' | 'degraded' | 'unavailable';
  model_name?: string;
  ollama_reachable?: boolean;
  error?: string;
}

export interface PatientClinicalState {
  patient_uuid: string;
  module?: string;
  clinical_indicators: Record<string, unknown>;
  lifestyle_indicators: Record<string, unknown>;
  last_assessment?: {
    id: string;
    risk_level: string;
    probability: number;
    created_at: string;
  };
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const companionService = {
  /**
   * Send a message to the BioPulse AI Companion
   * POST /api/v1/intelligence/companion/chat/
   */
  async sendMessage(
    token: string,
    req: CompanionChatRequest
  ): Promise<ApiResponse<CompanionChatResponse>> {
    const url = `${getDjangoBaseUrl()}/api/v1/intelligence/companion/chat/`;
    const headers = getDjangoHeaders(token);

    // Normalize pathway format expected by Django
    let backendPathway: string | undefined = req.pathway;
    if (backendPathway === 'female') {
      backendPathway = 'female_pcos';
    } else if (backendPathway === 'male') {
      backendPathway = 'male_hypogonadism';
    }

    const payload = {
      message: req.message.trim(),
      conversation_id: req.conversation_id || '',
      conversation_history: (req.conversation_history || []).map((h) => ({
        sender: h.sender === 'user' ? 'user' : 'companion',
        text: h.text,
      })),
      pathway: backendPathway,
      client_telemetry: req.client_telemetry || { platform: 'mobile_app' },
    };

    return safeRequest<CompanionChatResponse>(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      30000 // 30s timeout for LLM inference
    );
  },

  /**
   * Check companion health and model availability
   * GET /api/v1/intelligence/companion/health/
   */
  async checkHealth(): Promise<ApiResponse<CompanionHealthStatus>> {
    const url = `${getDjangoBaseUrl()}/api/v1/intelligence/companion/health/`;
    return safeRequest<CompanionHealthStatus>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      5000
    );
  },

  /**
   * Fetch authoritative patient clinical state used in intelligence prompts
   * GET /api/v1/intelligence/clinical-state/
   */
  async getClinicalState(
    token: string,
    module?: 'male_hypogonadism' | 'female_pcos'
  ): Promise<ApiResponse<PatientClinicalState>> {
    const query = module ? `?module=${encodeURIComponent(module)}` : '';
    const url = `${getDjangoBaseUrl()}/api/v1/intelligence/clinical-state/${query}`;
    const headers = getDjangoHeaders(token);

    return safeRequest<PatientClinicalState>(url, {
      method: 'GET',
      headers,
    });
  },
};
