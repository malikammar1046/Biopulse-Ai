import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageChatCircle,
  XClose,
  Send01,
  AlertTriangle,
  MedicalCross,
} from '@untitledui/icons';
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
  'What factors influenced my result?',
  'What does my next screening step mean?',
  'What should I discuss with my doctor?',
  'What foods support my nutritional plan?',
  'What does my lab report mean?',
];

const MALE_QUICK_PROMPTS = [
  'Explain my hypogonadism screening result',
  'What factors influenced my result?',
  'Why is morning testosterone relevant?',
  'What questions should I ask my doctor about hormones?',
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
  const isFemale = pathway === 'female';
  const aiBrandName = 'BioPulse AI Companion';


  const quickPrompts =
    pathway === 'male'
      ? MALE_QUICK_PROMPTS
      : pathway === 'female'
      ? FEMALE_QUICK_PROMPTS
      : GENERAL_QUICK_PROMPTS;

  const initialGreeting = `Hello ${userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'there'}! I'm ${aiBrandName}, your health companion. ${
    pathway === 'female' && snapshotMetrics.cycleDay > 0
      ? `Observations from your recorded history indicate you are currently on Day ${snapshotMetrics.cycleDay} (${snapshotMetrics.phaseName}).`
      : 'I am here to help you navigate your screening insights, biomarker patterns, and preparation for your clinician appointments.'
  }`;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: initialGreeting,
      timestamp: 'Just now',
    },
  ]);

  // Handle triggered AI prompt from other sections
  useEffect(() => {
    if (activeAiPrompt && activeAiPrompt !== lastProcessedPrompt.current) {
      lastProcessedPrompt.current = activeAiPrompt;
      handleSendMessage(activeAiPrompt);
    }
  }, [activeAiPrompt]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isAiChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isAiChatOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const response = await sendChatMessage(
        text.trim(),
        conversationId.current,
        messages.map((m) => ({ sender: m.sender, text: m.text })),
        { profileId: userProfile?.id }
      );

      const replyText = response?.reply || response?.message || 'I could not process your request at this moment.';
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        safetyLevel: response?.safety_level || 'normal',
        needsClinician: Boolean(response?.needs_clinician),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI chat failed:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'A connection error occurred while consulting the intelligence service. Please try again in a moment.',
        timestamp: 'Just now',
        safetyLevel: 'caution',
        needsClinician: false,
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
            className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[440px] max-h-[calc(100vh-140px)] sm:max-h-[620px] h-[78vh] rounded-[24px] sm:rounded-[28px] bg-white border border-[#E2E8F0] shadow-2xl z-50 flex flex-col justify-between overflow-hidden text-[#0F172A] select-none"
          >
            {/* Panel Header */}
            <div className="p-4 sm:p-5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
                  <MessageChatCircle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-display text-[#0F172A]">{aiBrandName}</h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      Online
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] font-sans block">
                    {pathway === 'male'
                      ? 'Male hypogonadism & health screening companion'
                      : pathway === 'female'
                      ? 'Conversational health & ML insights companion'
                      : 'Baseline health & wellness insights companion'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAiChat}
                className="p-1.5 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors cursor-pointer"
                aria-label="Close AI Chat"
              >
                <XClose className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-left text-xs font-sans bg-[#F8FAFC]/50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-start gap-2 max-w-[90%]">
                    {m.sender === 'ai' && (
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isFemale ? 'bg-[#FDE6EF] border border-[#F43F7D]/20 text-[#F43F7D]' : 'bg-[#E1F5FE] border border-[#B3E5FC] text-[#29B6F6]'
                      }`}>
                        <MessageChatCircle className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#29B6F6]'}`} aria-hidden="true" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                        m.sender === 'user'
                          ? (isFemale ? 'bg-[#F43F7D] text-white rounded-br-xs shadow-xs' : 'bg-[#29B6F6] text-white rounded-br-xs shadow-xs')
                          : m.safetyLevel === 'urgent'
                          ? 'bg-rose-50 text-rose-950 border-2 border-rose-300 rounded-bl-xs shadow-xs'
                          : m.safetyLevel === 'caution'
                          ? 'bg-amber-50 text-amber-950 border border-amber-300 rounded-bl-xs'
                          : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-xs shadow-xs'
                      }`}
                    >
                      {m.safetyLevel === 'urgent' && (
                        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-rose-200 text-rose-700 font-bold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Immediate Medical Attention Recommended</span>
                        </div>
                      )}
                      {m.needsClinician && m.safetyLevel !== 'urgent' && (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded-md text-[10px] font-semibold border ${
                          isFemale ? 'bg-[#FDE6EF] text-[#DC326C] border-[#F43F7D]/20' : 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
                        }`}>
                          <MedicalCross className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Recommended for Doctor Consultation</span>
                        </div>
                      )}
                      <div>{m.text}</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-[#64748B] mt-1 px-1">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#E2E8F0] w-fit">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${isFemale ? 'bg-[#F43F7D]' : 'bg-[#29B6F6]'}`} />
                    <div className={`w-2 h-2 rounded-full animate-bounce delay-150 ${isFemale ? 'bg-[#DC326C]' : 'bg-[#0288D1]'}`} />
                    <div className={`w-2 h-2 rounded-full animate-bounce delay-300 ${isFemale ? 'bg-[#BE185D]' : 'bg-[#01579B]'}`} />
                  </div>
                  <span className="text-[11px] font-medium text-[#64748B]">{aiBrandName} is consulting your records...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-3 bg-white border-t border-[#E2E8F0] flex gap-1.5 overflow-x-auto no-scrollbar">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    isFemale
                      ? 'bg-[#F8FAFC] hover:bg-[#FDE6EF] text-[#DC326C] border-[#E2E8F0] hover:border-[#F43F7D]/30'
                      : 'bg-[#F8FAFC] hover:bg-[#E0F2FE] text-[#0288D1] border-[#E2E8F0] hover:border-[#BAE6FD]'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-3 sm:p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] space-y-2">
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
                      ? 'Ask about hypogonadism screening, hormone vitality, symptoms, or doctor prep...'
                      : pathway === 'female'
                      ? 'Ask about your PCOS screening, cycle, symptoms, or doctor prep...'
                      : 'Ask about your health indicators, symptoms, lab reports, or doctor prep...'
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={`flex-1 px-4 py-2.5 rounded-2xl bg-white border border-[#CBD5E1] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 ${
                    isFemale ? 'focus:ring-[#F43F7D]/30 focus:border-[#F43F7D]' : 'focus:ring-[#29B6F6]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2.5 rounded-2xl text-white shadow-sm disabled:opacity-40 transition-all cursor-pointer ${
                    isFemale ? 'bg-[#F43F7D] hover:bg-[#DC326C]' : 'bg-[#29B6F6] hover:bg-[#039BE5]'
                  }`}
                  aria-label="Send Message"
                >
                  <Send01 className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>

              <p className="text-[9px] text-[#64748B] font-sans text-center">
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
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className={`relative group p-3.5 sm:p-4 rounded-full text-white shadow-lg flex items-center justify-center cursor-pointer transition-all ${
              isFemale
                ? 'bg-[#F43F7D] hover:bg-[#DC326C] border border-[#FDE6EF]/40'
                : 'bg-[#29B6F6] hover:bg-[#039BE5] border border-[#B3E5FC]/40'
            }`}
            aria-label={`Consult ${aiBrandName}`}
          >
            <MessageChatCircle className="w-6 h-6 text-white" aria-hidden="true" />

            {/* Hover Tooltip (Desktop) */}
            <span className="hidden sm:group-hover:block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-mono font-bold whitespace-nowrap shadow-md border border-[#334155]">
              Consult {aiBrandName}
            </span>
          </motion.button>
        </div>
      )}
    </>
  );
};
