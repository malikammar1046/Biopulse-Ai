/**
 * BioPulse AI — Public Chatbot Service
 *
 * Provides unauthenticated communication with the public AI chatbot endpoint.
 *
 * Architectural Invariants:
 *  1. Completely unauthenticated: Never sends user credentials, Supabase tokens, or patient IDs.
 *  2. High performance: Uses Server-Sent Events (SSE) streaming with sub-second Time-to-First-Token.
 *  3. Storage isolation: Stores public chat history strictly in sessionStorage (biopulse_public_chat_session_v1),
 *     never mixing with the authenticated BioPulse Companion storage or health records.
 *  4. Graceful degradation: Seamless fallback to non-streaming POST if streaming is interrupted.
 */

const BACKEND_API_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_BACKEND_API_URL) ||
  'http://127.0.0.1:8000/api';

const PUBLIC_CHAT_ENDPOINT = `${BACKEND_API_URL}/v1/intelligence/public/chat/`;

export interface PublicChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  safetyLevel?: 'normal' | 'caution' | 'urgent';
  needsClinician?: boolean;
  isStreaming?: boolean;
}

export interface StreamPublicChatOptions {
  message: string;
  conversationHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>;
  onChunk: (token: string) => void;
  onDone: (
    fullText: string,
    metadata: { safetyLevel?: 'normal' | 'caution' | 'urgent'; needsClinician?: boolean }
  ) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
}

export const SUGGESTED_QUICK_QUESTIONS = [
  'What is BioPulse AI?',
  'How does BioPulse work?',
  'What is PCOS?',
  'What health conditions does BioPulse support?',
  'How can I get started?',
] as const;

export const INITIAL_WELCOME_MESSAGE =
  "Hi! I'm BioPulse Assistant. I can help you understand BioPulse, answer general health questions, and guide you through our features. How can I help you today?";

const PUBLIC_SESSION_KEY = 'biopulse_public_chat_session_v1';

/**
 * Loads the active public chat session from sessionStorage.
 */
export function loadPublicChatMessages(): PublicChatMessage[] {
  try {
    const raw = sessionStorage.getItem(PUBLIC_SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persists the current public chat session to sessionStorage.
 */
export function savePublicChatMessages(messages: PublicChatMessage[]): void {
  try {
    sessionStorage.setItem(PUBLIC_SESSION_KEY, JSON.stringify(messages));
  } catch {
    // sessionStorage quota or security restriction handled silently
  }
}

/**
 * Clears the active public chat session.
 */
export function clearPublicChatMessages(): void {
  try {
    sessionStorage.removeItem(PUBLIC_SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Standard non-streaming fallback request for the public chatbot.
 */
export async function sendPublicChatMessage(
  message: string,
  conversationHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>,
  signal?: AbortSignal
): Promise<{
  success: boolean;
  reply: string;
  safety_level: 'normal' | 'caution' | 'urgent';
  needs_clinician: boolean;
} | null> {
  const locale = (typeof window !== 'undefined' && localStorage.getItem('biopulse_locale')) || 'en';
  const payload = {
    message,
    locale,
    conversation_history: conversationHistory?.slice(-6) || [],
    stream: false,
  };

  try {
    const response = await fetch(PUBLIC_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) return null;
    const data = await response.json();
    return {
      success: data.success !== false,
      reply: data.reply || data.message || '',
      safety_level: data.safety_level || 'normal',
      needs_clinician: Boolean(data.needs_clinician),
    };
  } catch {
    return null;
  }
}

/**
 * Real-time SSE streaming request for the public chatbot.
 * Yields incoming tokens incrementally via onChunk and finishes with onDone.
 */
export async function streamPublicChatMessage(options: StreamPublicChatOptions): Promise<void> {
  const { message, conversationHistory, onChunk, onDone, onError, signal } = options;
  const locale = (typeof window !== 'undefined' && localStorage.getItem('biopulse_locale')) || 'en';

  const payload = {
    message,
    locale,
    conversation_history: conversationHistory?.slice(-6) || [],
    stream: true,
  };

  try {
    const response = await fetch(PUBLIC_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Accept-Language': locale,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Public chat server returned HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // If server returned direct JSON (e.g. guardrail instant responses or non-stream fallback)
    if (contentType.includes('application/json')) {
      const data = await response.json();
      const replyText = data.reply || data.message || '';
      onChunk(replyText);
      onDone(replyText, {
        safetyLevel: data.safety_level || 'normal',
        needsClinician: Boolean(data.needs_clinician),
      });
      return;
    }

    if (!response.body) {
      throw new Error('Response body is not readable');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';
    let safetyLevel: 'normal' | 'caution' | 'urgent' = 'normal';
    let needsClinician = false;
    let completed = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              throw new Error(data.error);
            }
            if (data.token) {
              accumulatedText += data.token;
              onChunk(data.token);
            }
            if (data.safety_level) {
              safetyLevel = data.safety_level;
            }
            if (data.needs_clinician !== undefined) {
              needsClinician = Boolean(data.needs_clinician);
            }
            if (data.done) {
              completed = true;
              onDone(accumulatedText, { safetyLevel, needsClinician });
              return;
            }
          } catch (e: any) {
            if (e.message && e.message !== 'Unexpected end of JSON input') {
              throw e;
            }
          }
        }
      }
    }

    if (!completed) {
      onDone(accumulatedText, { safetyLevel, needsClinician });
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return;
    }

    // Try fallback non-streaming request
    try {
      const fallbackResult = await sendPublicChatMessage(message, conversationHistory, signal);
      if (fallbackResult && fallbackResult.reply) {
        onChunk(fallbackResult.reply);
        onDone(fallbackResult.reply, {
          safetyLevel: fallbackResult.safety_level,
          needsClinician: fallbackResult.needs_clinician,
        });
        return;
      }
    } catch {
      // Proceed to onError
    }

    onError(err instanceof Error ? err : new Error(String(err)));
  }
}
