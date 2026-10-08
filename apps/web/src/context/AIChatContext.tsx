import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserHealth } from './UserHealthContext';
import { resolvePathway } from '../types/onboarding';
import { sendChatMessage } from '../services/intelligenceService';
import { ROUTES } from '../constants/routes';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  safetyLevel?: 'normal' | 'caution' | 'urgent';
  needsClinician?: boolean;
}

export const FEMALE_QUICK_PROMPTS = [
  'Explain my PCOS screening result',
  'What factors increased my risk?',
  'Explain my lab results',
  'What should I focus on next?',
];

export const MALE_QUICK_PROMPTS = [
  'Explain my screening result',
  'What do my ADAM symptoms mean?',
  'Explain my hormone results',
  'What should I focus on next?',
];

export interface AIChatContextType {
  messages: AIChatMessage[];
  conversationId: string;
  isLoading: boolean;
  compactOpen: boolean;
  pathway: 'female' | 'male' | 'general';
  isFemale: boolean;
  aiBrandName: string;
  quickPrompts: string[];
  placeholderText: string;
  sendMessage: (textToSend?: string) => Promise<void>;
  clearConversation: () => void;
  openCompact: (initialPrompt?: string) => void;
  closeCompact: () => void;
  toggleCompact: () => void;
  expandToFullScreen: () => void;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'biopulse_ai_chat_session_v2';

const generateConversationId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const AIChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useTranslation(['chat', 'common']);
  const { userProfile, activeAiPrompt } = useUserHealth();

  const pathway = resolvePathway(userProfile?.gender, userProfile?.pathway);
  const isFemale = pathway === 'female';
  const aiBrandName = isFemale
    ? t('chat:title', { defaultValue: 'BioPulse AI Companion' })
    : t('chat:title', { defaultValue: 'BioPulse AI Assistant' });

  const quickPrompts = isFemale ? FEMALE_QUICK_PROMPTS : MALE_QUICK_PROMPTS;
  const placeholderText = t('chat:inputPlaceholder', {
    defaultValue: isFemale
      ? 'Ask about your PCOS screening, symptoms, labs, or recommendations...'
      : 'Ask about your screening, symptoms, hormones, or recommendations...',
  });

  const getInitialGreeting = useCallback((): AIChatMessage => {
    let greetingText = '';
    if (pathway === 'female') {
      greetingText = t('chat:greetings.female', {
        defaultValue: 'Hi! I’m BioPulse AI. Ask me about your screening, labs, symptoms, or next steps.',
      });
    } else if (pathway === 'male') {
      greetingText = t('chat:greetings.male', {
        defaultValue: 'Hi! I’m BioPulse AI. Ask me about your screening, hormones, symptoms, or next steps.',
      });
    } else {
      greetingText = t('chat:greetings.general', {
        defaultValue: 'Hi! I’m BioPulse AI. What would you like help understanding today?',
      });
    }

    return {
      id: 'initial_greeting',
      sender: 'ai',
      text: greetingText,
      timestamp: t('common:justNow', { defaultValue: 'Just now' }),
      safetyLevel: 'normal',
    };
  }, [pathway, t]);

  // Hydrate or initialize state
  const [conversationId, setConversationId] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.conversationId) return parsed.conversationId;
      }
    } catch {
      // ignore
    }
    return generateConversationId();
  });

  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    const initialGreeting = getInitialGreeting();
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          // Safely migrate the initial system greeting bubble if present, preserving genuine user conversation
          return parsed.messages.map((m: AIChatMessage, idx: number) => {
            if (
              idx === 0 &&
              (m.id === 'initial_greeting' ||
                m.text?.includes('health literacy and pattern explanation companion') ||
                m.text?.includes('baseline health patterns') ||
                m.text?.includes('hormonal vitality, male health screening'))
            ) {
              return {
                ...m,
                id: 'initial_greeting',
                text: initialGreeting.text,
              };
            }
            return m;
          });
        }
      }
    } catch {
      // ignore
    }
    return [initialGreeting];
  });

  // Automatically update initial greeting if pathway changes while no user messages exist
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'initial_greeting') {
        const fresh = getInitialGreeting();
        if (prev[0].text !== fresh.text) {
          return [fresh];
        }
      }
      return prev;
    });
  }, [getInitialGreeting]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [compactOpen, setCompactOpen] = useState<boolean>(false);
  const lastProcessedPrompt = useRef<string | undefined>(undefined);
  const isSendingRef = useRef<boolean>(false);

  // Sync to session storage whenever messages or conversationId changes
  useEffect(() => {
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ conversationId, messages })
      );
    } catch {
      // ignore quota errors
    }
  }, [conversationId, messages]);

  // Handle external activeAiPrompt from UserHealthContext
  useEffect(() => {
    if (activeAiPrompt && activeAiPrompt !== lastProcessedPrompt.current) {
      lastProcessedPrompt.current = activeAiPrompt;
      setCompactOpen(true);
      sendMessage(activeAiPrompt);
    }
  }, [activeAiPrompt]);

  const openCompact = useCallback((initialPrompt?: string) => {
    setCompactOpen(true);
    if (initialPrompt && initialPrompt.trim()) {
      sendMessage(initialPrompt.trim());
    }
  }, []);

  const closeCompact = useCallback(() => {
    setCompactOpen(false);
  }, []);

  const toggleCompact = useCallback(() => {
    setCompactOpen((prev) => !prev);
  }, []);

  const expandToFullScreen = useCallback(() => {
    setCompactOpen(false);
    navigate(ROUTES.APP.CHAT);
  }, [navigate]);

  const clearConversation = useCallback(() => {
    const newConvId = generateConversationId();
    const freshGreeting = getInitialGreeting();
    setConversationId(newConvId);
    setMessages([freshGreeting]);
    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ conversationId: newConvId, messages: [freshGreeting] })
      );
    } catch {
      // ignore
    }
  }, [getInitialGreeting]);

  const sendMessage = useCallback(
    async (textToSend?: string) => {
      const trimmed = textToSend?.trim();
      if (!trimmed || isLoading || isSendingRef.current) return;

      isSendingRef.current = true;
      const userMsg: AIChatMessage = {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // Set user message immediately so it renders with zero delay
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Send previous conversation history (excluding initial greeting and the current message)
        const historyPayload = messages
          .filter((m) => m.id !== 'initial_greeting')
          .slice(-6)
          .map((m) => ({ sender: m.sender, text: m.text }));

        const resp = await sendChatMessage(
          trimmed,
          conversationId,
          historyPayload,
          { pathway: isFemale ? 'female' : 'male' }
        );

        if (resp && resp.success) {
          if (resp.conversation_id) {
            setConversationId(resp.conversation_id);
          }
          const aiMsg: AIChatMessage = {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: resp.message || resp.reply || 'Analysis completed.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            safetyLevel: resp.safety_level || 'normal',
            needsClinician: Boolean(resp.needs_clinician),
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else if (resp && resp.message) {
          const warningMsg: AIChatMessage = {
            id: `ai_${Date.now()}`,
            sender: 'ai',
            text: resp.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            safetyLevel: 'caution',
            needsClinician: false,
          };
          setMessages((prev) => [...prev, warningMsg]);
        } else {
          let fallbackText =
            'The BioPulse AI service is momentarily unreachable. Please ensure your connection is active and try again shortly.';
          if (resp?.error_type === 'SESSION') {
            fallbackText = 'Your session has expired. Please sign in again to continue your conversation.';
          } else if (resp?.error_type === 'PROVIDER_UNAVAILABLE') {
            fallbackText = 'The AI companion is currently busy or experiencing high demand. Please try again shortly.';
          } else if (resp?.error_type === 'BACKEND') {
            fallbackText = 'The server encountered an error processing your query. Please try again.';
          }
          const errorMsg: AIChatMessage = {
            id: `err_${Date.now()}`,
            sender: 'ai',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            safetyLevel: 'caution',
            needsClinician: false,
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      } catch {
        const fallbackText =
          'A network error occurred while communicating with BioPulse AI. Please verify your connection and try again.';
        const errorMsg: AIChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          safetyLevel: 'caution',
          needsClinician: false,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
        isSendingRef.current = false;
      }
    },
    [conversationId, isFemale, isLoading, messages]
  );

  return (
    <AIChatContext.Provider
      value={{
        messages,
        conversationId,
        isLoading,
        compactOpen,
        pathway,
        isFemale,
        aiBrandName,
        quickPrompts,
        placeholderText,
        sendMessage,
        clearConversation,
        openCompact,
        closeCompact,
        toggleCompact,
        expandToFullScreen,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = (): AIChatContextType => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};
