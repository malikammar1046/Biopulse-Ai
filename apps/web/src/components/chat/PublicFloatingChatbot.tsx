import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  MessageChatCircle,
  XClose,
  Send01,
  AlertTriangle,
} from '@untitledui/icons';
import { Sparkles, RotateCcw, Minus, LogIn, UserPlus } from 'lucide-react';
import type { PublicChatMessage } from '../../services/publicChatService';
import {
  streamPublicChatMessage,
  loadPublicChatMessages,
  savePublicChatMessages,
  clearPublicChatMessages,
  SUGGESTED_QUICK_QUESTIONS,
  INITIAL_WELCOME_MESSAGE,
} from '../../services/publicChatService';
import { AIMessageContent } from '../common/AIMessageContent';
import { ROUTES } from '../../constants/routes';

export const PublicFloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<PublicChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize conversation from sessionStorage on mount
  useEffect(() => {
    const saved = loadPublicChatMessages();
    if (saved.length > 0) {
      setMessages(saved);
    } else {
      const initialMessage: PublicChatMessage = {
        id: 'initial_welcome',
        sender: 'assistant',
        text: INITIAL_WELCOME_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        safetyLevel: 'normal',
      };
      setMessages([initialMessage]);
    }
  }, []);

  // Save messages whenever they change (except transient streaming state)
  useEffect(() => {
    if (messages.length > 0) {
      const persistable = messages.map((m) => ({ ...m, isStreaming: false }));
      savePublicChatMessages(persistable);
    }
  }, [messages]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Handle textarea height resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 110)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputText).trim();
      if (!text || isLoading) return;

      setErrorNotice(null);
      if (!textToSend) {
        setInputText('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsgId = `user_${Date.now()}`;
      const assistantMsgId = `asst_${Date.now() + 1}`;

      const userMessage: PublicChatMessage = {
        id: userMsgId,
        sender: 'user',
        text,
        timestamp: now,
      };

      const initialAssistantMessage: PublicChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        text: '',
        timestamp: now,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
      setIsLoading(true);

      const historyPayload = messages
        .filter((m) => m.id !== 'initial_welcome' && m.text.trim())
        .slice(-6)
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      abortControllerRef.current = new AbortController();

      await streamPublicChatMessage({
        message: text,
        conversationHistory: historyPayload,
        signal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, text: m.text + chunk, isStreaming: true } : m
            )
          );
        },
        onDone: (fullText: string, meta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    text: fullText || m.text,
                    isStreaming: false,
                    safetyLevel: meta.safetyLevel || 'normal',
                    needsClinician: meta.needsClinician,
                  }
                : m
            )
          );
          setIsLoading(false);
        },
        onError: (err: Error) => {
          console.warn('Public chatbot stream interrupted:', err.message);
          setIsLoading(false);
          setErrorNotice('Unable to reach BioPulse Assistant. You can retry your question.');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    text:
                      m.text ||
                      "I'm momentarily unavailable. Please feel free to retry or browse our website features.",
                    isStreaming: false,
                  }
                : m
            )
          );
        },
      });
    },
    [inputText, isLoading, messages]
  );

  const handleClearChat = () => {
    if (isLoading) return;
    clearPublicChatMessages();
    const initialMessage: PublicChatMessage = {
      id: 'initial_welcome',
      sender: 'assistant',
      text: INITIAL_WELCOME_MESSAGE,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      safetyLevel: 'normal',
    };
    setMessages([initialMessage]);
    setErrorNotice(null);
  };

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setErrorNotice(null);
    }
  };

  return (
    <>
      {/* ── Public Chatbot Window Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-20 md:bottom-24 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-[410px] h-[78vh] sm:h-[590px] max-h-[620px] rounded-[24px] bg-white border border-[#D7EAF2] shadow-2xl z-50 flex flex-col overflow-hidden text-[#0F172A] select-none"
            role="dialog"
            aria-label="BioPulse Assistant Chat"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-white border-b border-[#D7EAF2] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#E8F8FA] border border-[#16B8C4]/40">
                  <Sparkles className="w-4 h-4 text-[#16B8C4]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold font-display text-[#073B72] truncate">
                      BioPulse Assistant
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] block truncate">
                    General Health & Platform Guide
                  </span>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={isLoading}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#073B72] hover:bg-[#F0F8FA] transition-colors cursor-pointer disabled:opacity-40"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#073B72] hover:bg-[#F0F8FA] transition-colors cursor-pointer"
                  title="Minimize Chat"
                  aria-label="Minimize Chat"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Close Chat"
                  aria-label="Close Chat"
                >
                  <XClose className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-left text-xs bg-[#F5FBFD]/60">
              {messages.map((m) => {
                const isUser = m.sender === 'user';
                const isPrivacyNotice =
                  !isUser &&
                  (m.text.includes('To protect your privacy') ||
                    m.text.includes('personalized health information is only available after you sign in'));

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`flex items-start gap-2 ${
                        isUser ? 'max-w-[85%] justify-end' : 'max-w-[92%]'
                      }`}
                    >
                      {!isUser && (
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[#E8F8FA] border border-[#16B8C4]/30">
                          <Sparkles className="w-3.5 h-3.5 text-[#16B8C4]" aria-hidden="true" />
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-2xl leading-relaxed text-xs shadow-xs ${
                          isUser
                            ? 'bg-[#073B72] text-white rounded-br-xs'
                            : m.safetyLevel === 'urgent'
                            ? 'bg-rose-50 text-rose-950 border-2 border-rose-300 rounded-bl-xs'
                            : m.safetyLevel === 'caution'
                            ? 'bg-amber-50 text-amber-950 border border-amber-300 rounded-bl-xs'
                            : 'bg-white text-[#0F172A] border border-[#D7EAF2] rounded-bl-xs'
                        }`}
                      >
                        {/* Urgent Emergency Alert Header */}
                        {m.safetyLevel === 'urgent' && (
                          <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-rose-200 text-rose-700 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Immediate Medical Attention Recommended</span>
                          </div>
                        )}

                        {/* Content */}
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.text}</div>
                        ) : (
                          <>
                            <AIMessageContent content={m.text} isFemale={false} />
                            {m.isStreaming && (
                              <span className="inline-block w-1.5 h-3 ml-0.5 bg-[#16B8C4] animate-pulse align-middle" />
                            )}

                            {/* Privacy Boundary Sign-in Prompt */}
                            {isPrivacyNotice && (
                              <div className="mt-3 pt-2.5 border-t border-[#D7EAF2] flex items-center gap-2">
                                <Link
                                  to={ROUTES.LOGIN}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#073B72] text-white hover:bg-[#052A52] transition-colors"
                                >
                                  <LogIn className="w-3 h-3" />
                                  <span>Sign In</span>
                                </Link>
                                <Link
                                  to={ROUTES.REGISTER}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#16B8C4] text-white hover:bg-[#0E9EAA] transition-colors"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Create Account</span>
                                </Link>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono text-[#64748B] mt-1 px-1">
                      {m.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Live Assistant Loading Indicator */}
              {isLoading && messages[messages.length - 1]?.text === '' && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#D7EAF2] w-fit shadow-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#16B8C4] animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-[#073B72] animate-bounce delay-150" />
                    <div className="w-2 h-2 rounded-full bg-[#16B8C4] animate-bounce delay-300" />
                  </div>
                  <span className="text-[11px] font-medium text-[#64748B]">
                    BioPulse Assistant is responding...
                  </span>
                </div>
              )}

              {/* Error Notice */}
              {errorNotice && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                  <span>{errorNotice}</span>
                  <button
                    type="button"
                    onClick={() => handleSend(messages[messages.length - 2]?.text)}
                    className="font-semibold underline text-[#073B72] hover:text-[#16B8C4] ml-2 shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Quick Questions (Visible on first conversation interaction) */}
            {messages.length <= 2 && (
              <div className="px-3 py-2 bg-white border-t border-[#D7EAF2] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {SUGGESTED_QUICK_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(question)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer border bg-[#F5FBFD] hover:bg-[#E8F8FA] text-[#073B72] hover:text-[#16B8C4] border-[#D7EAF2] hover:border-[#16B8C4]/40 disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Composer */}
            <div className="p-3 bg-white border-t border-[#D7EAF2] space-y-2 shrink-0">
              <div className="flex items-end gap-2 bg-[#F5FBFD] border border-[#D7EAF2] rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-[#16B8C4]/30 focus-within:border-[#16B8C4] transition-all">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a health question or about BioPulse..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none max-h-28 disabled:opacity-60"
                  aria-label="Ask BioPulse Assistant"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 rounded-xl text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer shrink-0 bg-[#16B8C4] hover:bg-[#0E9EAA]"
                  aria-label="Send Message"
                >
                  <Send01 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Health Disclaimer Footer */}
              <div className="flex items-center justify-between text-[9px] text-[#64748B] px-1">
                <span>General health guide • Not medical diagnosis</span>
                <span className="text-[#073B72] font-medium">BioPulse AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Chatbot Trigger Button (Bottom-Right) ── */}
      <div className="fixed bottom-6 md:bottom-8 right-5 sm:right-8 z-40 select-none">
        <motion.button
          type="button"
          onClick={handleToggle}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="relative group p-3.5 sm:p-4 rounded-full text-white shadow-xl flex items-center justify-center cursor-pointer transition-all bg-[#16B8C4] hover:bg-[#0E9EAA] border border-[#D7EAF2]/60"
          aria-label="Open BioPulse Assistant"
        >
          <MessageChatCircle className="w-6 h-6 text-white" aria-hidden="true" />

          {/* Desktop Hover Tooltip */}
          <span className="hidden sm:group-hover:block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#073B72] text-white text-xs font-mono font-bold whitespace-nowrap shadow-md border border-[#16B8C4]/40">
            Chat with BioPulse AI
          </span>
        </motion.button>
      </div>
    </>
  );
};
