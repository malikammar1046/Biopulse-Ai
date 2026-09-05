import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, AlertTriangle, Stethoscope } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { sendChatMessage } from '../../services/intelligenceService';
import { resolvePathway } from '../../types/onboarding';
import { ROUTES } from '../../constants/routes';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  safetyLevel?: 'normal' | 'caution' | 'urgent';
  needsClinician?: boolean;
}

const FEMALE_QUICK_PROMPTS = [
  'Explain my PCOS screening result',
  'What factors influenced my risk score?',
  'What should I discuss with my doctor?',
  'Why do I feel bloated today?',
  'What foods support my current phase?',
  'What does my Vitamin D result mean?',
];

const MALE_QUICK_PROMPTS = [
  'Explain my male health screening result',
  'How do symptoms correlate with energy levels?',
  'What questions should I ask my doctor about hormones?',
  'Why is morning blood draw timing important?',
  'What lifestyle factors support vitality and stamina?',
  'What does my testosterone or metabolic result mean?',
];

const GENERAL_QUICK_PROMPTS = [
  'Explain my general health overview',
  'What habits improve daily energy and recovery?',
  'What questions should I ask my doctor?',
  'What do my lab report results mean?',
  'What foods support metabolic wellness?',
];

export const FloatingOvaSenseAI: React.FC = () => {
  const location = useLocation();
  const isChatPage = location.pathname === ROUTES.APP.CHAT || location.pathname.startsWith('/app/chat');
  const { userProfile, snapshotMetrics, isAiChatOpen, activeAiPrompt, toggleAiChat, closeAiChat } = useUserHealth();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedPrompt = useRef<string | undefined>(undefined);
  const conversationId = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `conv_${Date.now()}`
  );

  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const aiBrandName =
    pathway === 'male' ? 'AndroSense AI' : pathway === 'female' ? 'OvaSense AI' : 'VITASense AI';

  const quickPrompts =
    pathway === 'male'
      ? MALE_QUICK_PROMPTS
      : pathway === 'female'
      ? FEMALE_QUICK_PROMPTS
      : GENERAL_QUICK_PROMPTS;

  const initialGreeting = `Hello ${userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'there'}! I'm ${aiBrandName}, your health companion. ${
    pathway === 'female' && snapshotMetrics.cycleDay > 0
      ? `Observations from your Digital Twin indicate you are currently on Day ${snapshotMetrics.cycleDay} (${snapshotMetrics.phaseName}).`
      : pathway === 'male'
      ? 'I am here to help you understand hormone vitality, male health screening patterns, daily symptoms, and verified lab reports.'
      : 'I am here to help you explore your baseline health patterns, symptoms, nutrition, activity, and verified lab reports.'
  } How can I assist you today?`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_initial',
      sender: 'ai',
      text: initialGreeting,
      timestamp: 'Just now',
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiChatOpen) {
      scrollToBottom();
    }
  }, [messages, isAiChatOpen]);

  // Handle incoming active prompt triggers (from "Discuss with AI Twin" or other action buttons)
  useEffect(() => {
    if (activeAiPrompt && isAiChatOpen && activeAiPrompt !== lastProcessedPrompt.current) {
      lastProcessedPrompt.current = activeAiPrompt;
      handleSendMessage(activeAiPrompt);
    }
  }, [activeAiPrompt, isAiChatOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: 'Now',
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textToSend) {
      setInputText('');
    }
    setIsTyping(true);

    try {
      const historyPayload = nextMessages
        .slice(-6)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const resp = await sendChatMessage(
        text.trim(),
        conversationId.current,
        historyPayload,
        snapshotMetrics
      );

      if (resp && resp.success) {
        if (resp.conversation_id) {
          conversationId.current = resp.conversation_id;
        }
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: resp.message,
          timestamp: 'Just now',
          safetyLevel: resp.safety_level,
          needsClinician: resp.needs_clinician,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else if (resp && resp.message) {
        // Structured error notification from server (e.g. MedGemma offline 503)
        const offlineMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: resp.message,
          timestamp: 'Just now',
          safetyLevel: 'caution',
          needsClinician: false,
        };
        setMessages((prev) => [...prev, offlineMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: 'I am unable to reach the OvaSense Intelligence server right now. Please verify your connection or ensure the Django backend is running and try again.',
          timestamp: 'Just now',
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'A connection error occurred while consulting the intelligence service. Please try again in a moment.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ── Chat Modal Panel (Desktop & Mobile) ── */}
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[620px] h-[82vh] rounded-[32px] bg-gradient-to-b from-[#180A26] via-[#140822] to-[#0D0417] border border-white/20 shadow-2xl z-50 flex flex-col justify-between overflow-hidden text-white backdrop-blur-2xl select-none"
          >
            {/* Panel Header */}
            <div className="p-4 sm:p-5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-md shadow-purple-950/40">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-display text-white">{aiBrandName} Twin</h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] font-bold">
                      Online
                    </span>
                  </div>
                  <span className="text-[11px] text-[#A797BD] font-sans">
                    {pathway === 'male'
                      ? 'Male hormone & health screening companion'
                      : pathway === 'female'
                      ? 'Conversational health & ML insights companion'
                      : 'Baseline health & wellness insights companion'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAiChat}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#CDBDD8] hover:text-white transition-colors cursor-pointer"
                aria-label="Close AI Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-left text-xs font-sans">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-start gap-2 max-w-[90%]">
                    {m.sender === 'ai' && (
                      <div className="w-6 h-6 rounded-lg bg-[#8E3EAF]/30 border border-[#8E3EAF]/40 flex items-center justify-center text-[#D8B4FE] shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white rounded-br-xs shadow-md'
                          : m.safetyLevel === 'urgent'
                          ? 'bg-[#FB7185]/15 text-white border-2 border-[#FB7185] rounded-bl-xs shadow-lg'
                          : m.safetyLevel === 'caution'
                          ? 'bg-amber-400/10 text-[#EDE4F7] border border-amber-400/40 rounded-bl-xs'
                          : 'bg-white/10 text-[#EDE4F7] border border-white/10 rounded-bl-xs'
                      }`}
                    >
                      {m.safetyLevel === 'urgent' && (
                        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-[#FB7185]/40 text-[#FB7185] font-bold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Immediate Medical Attention Recommended</span>
                        </div>
                      )}
                      {m.needsClinician && m.safetyLevel !== 'urgent' && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded-md bg-[#8E3EAF]/30 text-[#D8B4FE] text-[10px] font-semibold border border-[#8E3EAF]/40">
                          <Stethoscope className="w-3 h-3" />
                          <span>Recommended for Doctor Consultation</span>
                        </div>
                      )}
                      <div>{m.text}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#8D7E9E] mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 w-fit text-[#D8B4FE]">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#FB7185] animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[#8E3EAF] animate-bounce delay-150" />
                    <div className="w-2 h-2 rounded-full bg-[#D8B4FE] animate-bounce delay-300" />
                  </div>
                  <span className="text-[11px] font-medium text-white/70">{aiBrandName} is consulting your records...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#8E3EAF]/40 text-[10px] font-medium text-[#EDE4F7] whitespace-nowrap transition-colors cursor-pointer border border-white/10"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-3 sm:p-4 bg-white/[0.04] border-t border-white/10 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    pathway === 'male'
                      ? 'Ask about male health screening, hormone vitality, symptoms, or doctor prep...'
                      : pathway === 'female'
                      ? 'Ask about your PCOS screening, cycle, symptoms, or doctor prep...'
                      : 'Ask about your health indicators, symptoms, lab reports, or doctor prep...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-[#12071F] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-[#8E3EAF]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white hover:brightness-110 shadow-md disabled:opacity-40 transition-all cursor-pointer"
                  aria-label="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              <p className="text-[9px] text-[#8D7E9E] font-sans text-center">
                {aiBrandName} provides educational explanations and is not a medical diagnostic device.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button (Available Globally, except on dedicated full-screen Chat Page) ── */}
      {!isChatPage && (
        <div className="fixed bottom-20 md:bottom-8 right-5 sm:right-8 z-40 select-none">
          <motion.button
            type="button"
            onClick={toggleAiChat}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] text-white shadow-2xl shadow-purple-950/70 border-2 border-white/40 flex items-center justify-center cursor-pointer transition-transform"
            aria-label={`Ask ${aiBrandName} Twin`}
          >
            {/* Subtle pulse wave ring */}
            <span className="absolute inset-0 rounded-full bg-[#FB7185]/30 animate-ping pointer-events-none" />

            <Sparkles className="w-6 h-6 text-white" />

            {/* Hover Tooltip (Desktop) */}
            <span className="hidden sm:group-hover:block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#180A26] text-white text-xs font-mono font-bold whitespace-nowrap shadow-xl border border-white/20">
              Ask {aiBrandName} Twin ✨
            </span>
          </motion.button>
        </div>
      )}
    </>
  );
};
