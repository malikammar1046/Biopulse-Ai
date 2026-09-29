import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { userProfile, snapshotMetrics, activeAiPrompt } = useUserHealth();

  const pathway = resolvePathway(userProfile?.gender, userProfile?.pathway);
  const isFemale = pathway === 'female';
  const aiBrandName = isFemale ? 'BioPulse AI Companion' : 'BioPulse AI Assistant';

  const quickPrompts = isFemale ? FEMALE_QUICK_PROMPTS : MALE_QUICK_PROMPTS;
  const placeholderText = isFemale
    ? 'Ask about your PCOS screening, symptoms, labs, or recommendations...'
    : 'Ask about your screening, symptoms, hormones, or recommendations...';

  const getInitialGreeting = useCallback((): AIChatMessage => {
    let greetingText = '';
    if (pathway === 'female') {
      const cycleInfo =
        snapshotMetrics && snapshotMetrics.cycleDay > 0
          ? ` (Recorded cycle: Day ${snapshotMetrics.cycleDay}, ${snapshotMetrics.phaseName})`
          : '';
      greetingText = `Hello! I am BioPulse AI Companion, your health literacy and pattern explanation companion${cycleInfo}. I am here to help you explore your baseline health patterns, verified lab markers, and lifestyle insights. What would you like to explore today?`;
    } else if (pathway === 'male') {
      greetingText = `Hello! I am BioPulse AI Assistant, your hormonal health and screening explanation companion. I am here to help you explore hormonal vitality, male health screening patterns, and verified lab markers. What would you like to explore today?`;
    } else {
      greetingText = `Hello! I am BioPulse AI Companion, your health literacy and screening explanation companion. I am here to help you explore your baseline health patterns, verified lab markers, and lifestyle insights. What would you like to explore today?`;
    }

    return {
      id: 'initial_greeting',
      sender: 'ai',
      text: greetingText,
      timestamp: 'Just now',
      safetyLevel: 'normal',
    };
  }, [pathway, snapshotMetrics]);

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
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          return parsed.messages;
        }
      }
    } catch {
      // ignore
    }
    return [getInitialGreeting()];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [compactOpen, setCompactOpen] = useState<boolean>(false);
  const lastProcessedPrompt = useRef<string | undefined>(undefined);

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
      if (!trimmed || isLoading) return;

      const userMsg: AIChatMessage = {
        id: `user_${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
      setIsLoading(true);

      try {
        const historyPayload = nextMessages
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
          const fallbackText =
            'The BioPulse AI service is momentarily unreachable. Please ensure your connection is active and try again shortly.';
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
