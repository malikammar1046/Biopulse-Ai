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
import { Maximize2, Minus, Sparkles } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';
import { AIMessageContent } from '../common/AIMessageContent';
import { ROUTES } from '../../constants/routes';

export const FloatingOvaSenseAI: React.FC = () => {
  const location = useLocation();
  const isChatPage =
    location.pathname === ROUTES.APP.CHAT || location.pathname.startsWith('/app/chat');

  const {
    messages,
    isLoading,
    compactOpen,
    isFemale,
    aiBrandName,
    quickPrompts,
    placeholderText,
    sendMessage,
    toggleCompact,
    closeCompact,
    expandToFullScreen,
  } = useAIChat();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (compactOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, compactOpen]);

  // Handle textarea resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;
    if (!textToSend) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    await sendMessage(text.trim());
  };

  // If currently on dedicated chat page, do not show floating trigger or duplicate widget
  if (isChatPage) {
    return null;
  }

  const primaryLightBg = isFemale ? 'bg-[#FDE6EF]' : 'bg-[#E1F5FE]';
  const primaryBorder = isFemale ? 'border-[#F43F7D]/30' : 'border-[#BAE6FD]';
  const primaryText = isFemale ? 'text-[#F43F7D]' : 'text-[#0868B9]';

  return (
    <>
      {/* ── Compact Floating Chat Popup Modal ── */}
      <AnimatePresence>
        {compactOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-24 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-[410px] h-[75dvh] sm:h-[580px] max-h-[620px] rounded-[24px] bg-white border border-[#E2E8F0] shadow-2xl z-50 flex flex-col overflow-hidden text-[#0F172A] select-none"
            role="dialog"
            aria-label={aiBrandName}
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${primaryLightBg} border ${primaryBorder}`}
                >
                  <Sparkles className={`w-4 h-4 ${primaryText}`} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold font-display text-[#0F172A] truncate">
                      {aiBrandName}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] block truncate">
                    {isFemale ? 'PCOS & reproductive health literacy' : 'Hormonal vitality & health literacy'}
                  </span>
                </div>
              </div>

              {/* Header Actions: Minimize, Full Screen / Expand, Close */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={closeCompact}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                  title="Minimize"
                  aria-label="Minimize Chat"
                >
                  <Minus className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={expandToFullScreen}
                  className={`p-1.5 rounded-lg text-[#64748B] hover:${primaryText} hover:bg-[#F1F5F9] transition-colors cursor-pointer`}
                  title="Expand to Full Screen (/app/chat)"
                  aria-label="Expand to Full Screen"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={closeCompact}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Close"
                  aria-label="Close Chat"
                >
                  <XClose className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-left text-xs bg-[#F5FBFD]/40">
              {messages.map((m) => {
                const isUser = m.sender === 'user';
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
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${primaryLightBg} border ${primaryBorder}`}
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${primaryText}`} aria-hidden="true" />
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-2xl leading-relaxed text-xs ${
                          isUser
                            ? isFemale
                              ? 'bg-[#F43F7D] text-white rounded-br-xs shadow-xs'
                              : 'bg-[#0868B9] text-white rounded-br-xs shadow-xs'
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
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded-md text-[10px] font-semibold border ${
                              isFemale
                                ? 'bg-[#FDE6EF] text-[#DC326C] border-[#F43F7D]/20'
                                : 'bg-[#E1F5FE] text-[#0868B9] border-[#BAE6FD]'
                            }`}
                          >
                            <MedicalCross className="w-3 h-3" aria-hidden="true" />
                            <span>Doctor Discussion Recommended</span>
                          </div>
                        )}

                        {isUser ? (
                          <div className="whitespace-pre-wrap">{m.text}</div>
                        ) : (
                          <AIMessageContent content={m.text} isFemale={isFemale} />
                        )}
                      </div>
                    </div>

                    <span className="text-[9px] font-mono text-[#64748B] mt-1 px-1">
                      {m.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Typing / Reviewing Context indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#E2E8F0] w-fit shadow-xs">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce ${
                        isFemale ? 'bg-[#F43F7D]' : 'bg-[#0868B9]'
                      }`}
                    />
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce delay-150 ${
                        isFemale ? 'bg-[#0E9EAA]' : 'bg-[#2196E3]'
                      }`}
                    />
                    <div
                      className={`w-2 h-2 rounded-full animate-bounce delay-300 ${
                        isFemale ? 'bg-[#16B8C4]' : 'bg-[#0868B9]'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#64748B]">
                    BioPulse AI is reviewing your context...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts (Only visible if conversation is near start) */}
            {messages.length <= 2 && (
              <div className="px-3 py-2 bg-white border-t border-[#E2E8F0] flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                      isFemale
                        ? 'bg-[#F8FAFC] hover:bg-[#FDE6EF] text-[#DC326C] border-[#E2E8F0] hover:border-[#F43F7D]/30'
                        : 'bg-[#F8FAFC] hover:bg-[#E1F5FE] text-[#0868B9] border-[#E2E8F0] hover:border-[#BAE6FD]'
                    }`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Bottom Composer */}
            <div className="p-3 bg-white border-t border-[#E2E8F0] space-y-2 shrink-0">
              <div className="flex items-end gap-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-offset-1 focus-within:border-transparent transition-all">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholderText}
                  disabled={isLoading}
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none max-h-24 disabled:opacity-60"
                  aria-label="Type message"
                />
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  className={`p-2 rounded-xl text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer shrink-0 ${
                    isFemale ? 'bg-[#F43F7D] hover:bg-[#DC326C]' : 'bg-[#0868B9] hover:bg-[#065293]'
                  }`}
                  aria-label="Send Message"
                >
                  <Send01 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[9px] text-[#64748B] px-1">
                <span>Educational screening companion • Not a diagnosis</span>
                <button
                  type="button"
                  onClick={expandToFullScreen}
                  className={`hover:underline font-medium cursor-pointer ${primaryText}`}
                >
                  Open Full Screen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Trigger Button (Bottom-Right) ── */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-8 right-4 sm:right-8 z-40 select-none">
        <motion.button
          type="button"
          onClick={toggleCompact}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={`relative group p-3.5 sm:p-4 rounded-full text-white shadow-lg flex items-center justify-center cursor-pointer transition-all ${
            isFemale
              ? 'bg-[#F43F7D] hover:bg-[#DC326C] border border-[#FDE6EF]/40'
              : 'bg-[#0868B9] hover:bg-[#065293] border border-[#BAE6FD]/40'
          }`}
          aria-label={aiBrandName}
        >
          <MessageChatCircle className="w-6 h-6 text-white" aria-hidden="true" />

          {/* Desktop Hover Tooltip */}
          <span className="hidden sm:group-hover:block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-mono font-bold whitespace-nowrap shadow-md border border-[#334155]">
            {aiBrandName}
          </span>
        </motion.button>
      </div>
    </>
  );
};
