import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Send01,
  RefreshCw01,
  MedicalCross,
  AlertTriangle,
  Database01,
  XClose,
  ShieldTick,
} from '@untitledui/icons';
import { Sparkles } from 'lucide-react';
import { useAIChat } from '../../context/AIChatContext';
import { useUserHealth } from '../../context/UserHealthContext';
import { DigitalTwinService } from '../../services/digitalTwinService';
import { AIMessageContent } from '../../components/common/AIMessageContent';

export const ChatPage: React.FC = () => {
  const { t } = useTranslation(['chat', 'common']);
  const {
    messages,
    isLoading,
    isFemale,
    aiBrandName,
    quickPrompts,
    placeholderText,
    sendMessage,
    clearConversation,
  } = useAIChat();

  const {
    userProfile,
    cycleRecords,
    symptomRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    medicationLogs,
    mlAssessment,
    snapshotMetrics,
  } = useUserHealth();

  const [inputText, setInputText] = useState('');
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synthesize digital twin observation snapshot for transparency drawer
  const digitalTwinState = useMemo(() => {
    return DigitalTwinService.synthesizeState({
      userProfile,
      cycleRecords,
      symptomRecords,
      reports,
      foodLogs,
      waterLog,
      fitnessLogs,
      medications,
      medicationLogs,
      mlAssessment,
      currentCycleDay: snapshotMetrics?.cycleDay || 0,
      currentPhaseName: snapshotMetrics?.phaseName || 'Baseline',
    });
  }, [
    userProfile,
    cycleRecords,
    symptomRecords,
    reports,
    foodLogs,
    waterLog,
    fitnessLogs,
    medications,
    medicationLogs,
    mlAssessment,
    snapshotMetrics,
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
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

  const primaryLightBg = isFemale ? 'bg-[#FDE6EF]' : 'bg-[#E1F5FE]';
  const primaryBorder = isFemale ? 'border-[#F43F7D]/25' : 'border-[#BAE6FD]';
  const primaryText = isFemale ? 'text-[#F43F7D]' : 'text-[#0868B9]';

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] md:h-[calc(100dvh-6.5rem)] w-full max-w-6xl mx-auto bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden select-none text-left">
      {/* ── 1. Dedicated AI Workspace Header ── */}
      <header className="px-5 py-4 border-b border-[#E2E8F0] bg-white flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${primaryLightBg} border ${primaryBorder}`}
          >
            <Sparkles className={`w-5 h-5 ${primaryText}`} aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold font-display text-[#0F172A] tracking-tight">
                {aiBrandName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI Online
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600">
                <ShieldTick className="w-3 h-3 text-[#0E9EAA]" aria-hidden="true" />
                Secure Context
              </span>
            </div>

            <p className="text-xs text-[#64748B] font-sans truncate mt-0.5">
              {t('chat:subtitle', { defaultValue: 'Health literacy & screening pattern explanation • Non-diagnostic' })}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsContextDrawerOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-mono font-medium text-[#475569] transition-colors cursor-pointer shadow-2xs"
            title="Inspect Sanitized Health Context"
            aria-label="Inspect Health Context"
          >
            <Database01 className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
            <span>{t('common:inspect', { defaultValue: 'Inspect Context' })}</span>
          </button>

          <button
            type="button"
            onClick={clearConversation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2E8F0] text-xs font-sans font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer shadow-2xs"
            title={t('chat:newChat', { defaultValue: 'Start New Chat' })}
            aria-label={t('chat:newChat', { defaultValue: 'New Chat' })}
          >
            <RefreshCw01 className="w-3.5 h-3.5 text-[#64748B]" aria-hidden="true" />
            <span className="hidden xs:inline">{t('chat:newChat', { defaultValue: 'New Chat' })}</span>
          </button>
        </div>
      </header>

      {/* ── 2. Conversation Message Area ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F5FBFD]/30">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex items-start gap-3 ${
                  isUser
                    ? 'max-w-[85%] sm:max-w-[70%] justify-end'
                    : 'w-full max-w-[95%] sm:max-w-[85%] lg:max-w-[850px]'
                }`}
              >
                {!isUser && (
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${primaryLightBg} border ${primaryBorder}`}
                  >
                    <Sparkles className={`w-4 h-4 ${primaryText}`} aria-hidden="true" />
                  </div>
                )}

                <div
                  className={`p-4 sm:p-5 rounded-2xl leading-relaxed text-sm ${
                    isUser
                      ? isFemale
                        ? 'bg-[#F43F7D] text-white rounded-br-xs shadow-xs'
                        : 'bg-[#0868B9] text-white rounded-br-xs shadow-xs'
                      : m.safetyLevel === 'urgent'
                      ? 'bg-rose-50 text-rose-950 border-2 border-rose-300 rounded-bl-xs shadow-xs w-full'
                      : m.safetyLevel === 'caution'
                      ? 'bg-amber-50 text-amber-950 border border-amber-300 rounded-bl-xs w-full'
                      : 'bg-white text-[#0F172A] border border-[#E2E8F0] rounded-bl-xs shadow-xs w-full'
                  }`}
                >
                  {/* Urgent Medical Caution Banner */}
                  {m.safetyLevel === 'urgent' && (
                    <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-rose-200 text-rose-700 font-bold text-xs sm:text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Immediate Medical Attention Recommended</span>
                    </div>
                  )}

                  {/* Doctor Discussion Recommendation Badge */}
                  {m.needsClinician && m.safetyLevel !== 'urgent' && (
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-lg text-xs font-semibold border ${
                        isFemale
                          ? 'bg-[#FDE6EF] text-[#DC326C] border-[#F43F7D]/20'
                          : 'bg-[#E1F5FE] text-[#0868B9] border-[#BAE6FD]'
                      }`}
                    >
                      <MedicalCross className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Recommended for Doctor Consultation</span>
                    </div>
                  )}

                  {/* Message Content */}
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  ) : (
                    <AIMessageContent content={m.text} isFemale={isFemale} />
                  )}
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#64748B] mt-1.5 px-1">
                {m.timestamp}
              </span>
            </div>
          );
        })}

        {/* Loading UX: Typing indicator + animated dots */}
        {isLoading && (
          <div className="flex items-start gap-3 w-fit">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${primaryLightBg} border ${primaryBorder}`}
            >
              <Sparkles className={`w-4 h-4 ${primaryText}`} aria-hidden="true" />
            </div>

            <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
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
              <span className="text-xs font-medium text-[#64748B]">
                {t('chat:typing', { defaultValue: 'BioPulse AI is reviewing your clinical context...' })}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 3. Quick Prompts (Visible when conversation is near start) ── */}
      {messages.length <= 2 && (
        <div className="px-5 py-3 bg-white border-t border-[#E2E8F0] shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              {t('chat:suggestedPrompts.title', { defaultValue: 'Suggested Discussion Topics' })}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(prompt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  isFemale
                    ? 'bg-[#F8FAFC] hover:bg-[#FDE6EF] text-[#DC326C] border-[#E2E8F0] hover:border-[#F43F7D]/30'
                    : 'bg-[#F8FAFC] hover:bg-[#E1F5FE] text-[#0868B9] border-[#E2E8F0] hover:border-[#BAE6FD]'
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Bottom Input Composer ── */}
      <div className="p-4 sm:p-5 bg-white border-t border-[#E2E8F0] shrink-0 space-y-2">
        <div className="flex items-end gap-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl p-2 sm:p-2.5 focus-within:ring-2 focus-within:ring-offset-1 focus-within:border-transparent transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            disabled={isLoading}
            className="flex-1 bg-transparent px-2.5 py-1.5 text-base sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none resize-none max-h-36 disabled:opacity-60 leading-relaxed"
            aria-label={t('chat:inputPlaceholder', { defaultValue: 'Ask BioPulse AI' })}
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 sm:p-3 rounded-xl text-white shadow-xs disabled:opacity-40 transition-all cursor-pointer shrink-0 ${
              isFemale
                ? 'bg-[#F43F7D] hover:bg-[#DC326C] active:bg-[#BE185D]'
                : 'bg-[#0868B9] hover:bg-[#065293] active:bg-[#043c6d]'
            }`}
            aria-label={t('chat:send', { defaultValue: 'Send Message' })}
          >
            <Send01 className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#64748B] px-1">
          <span>
            {t('chat:disclaimer', {
              defaultValue: 'BioPulse AI provides educational information and is not a medical doctor.',
            })}
          </span>
          <span className="hidden sm:inline font-mono text-[10px]">
            {t('common:enterToSend', { defaultValue: 'Press Enter to send' })}
          </span>
        </div>
      </div>

      {/* ── 5. Digital Twin Context Inspection Drawer ── */}
      <AnimatePresence>
        {isContextDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
            onClick={() => setIsContextDrawerOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-white h-full shadow-2xl p-4 sm:p-6 overflow-y-auto flex flex-col justify-between text-[#0F172A]"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <Database01 className={`w-5 h-5 ${primaryText}`} />
                    <h3 className="text-sm font-bold font-display text-[#0F172A]">
                      Authoritative Health State
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsContextDrawerOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B] cursor-pointer"
                    aria-label="Close Context Drawer"
                  >
                    <XClose className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4 text-xs font-mono">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="font-bold text-[#64748B] block mb-1">Active Pathway</span>
                    <span className="font-semibold text-[#0F172A] capitalize">
                      {isFemale ? 'Female (PCOS)' : 'Male (Hypogonadism)'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="font-bold text-[#64748B] block mb-1">Screening Summary</span>
                    <span className="block">
                      Tier: {(mlAssessment as any)?.assessment_level || mlAssessment?.risk_category_description || 'Tier 1'}
                    </span>
                    <span className="block">
                      Probability:{' '}
                      {digitalTwinState.assessments?.statisticalScreeningProbability
                        ? `${(digitalTwinState.assessments.statisticalScreeningProbability * 100).toFixed(1)}%`
                        : 'Not Run'}
                    </span>
                    <span className="block capitalize">
                      Category: {digitalTwinState.assessments?.latestCategory || 'Not Screened'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="font-bold text-[#64748B] block mb-1">Verified Biomarkers</span>
                    {digitalTwinState.reports?.keyBiomarkersSummary &&
                    digitalTwinState.reports.keyBiomarkersSummary.length > 0 ? (
                      <ul className="space-y-1 list-disc pl-4 text-[11px]">
                        {digitalTwinState.reports.keyBiomarkersSummary.slice(0, 8).map((l, i) => (
                          <li key={i}>
                            {l.testName}: {l.resultValue} {l.unit || ''} ({l.status})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-[#64748B]">No verified lab reports loaded</span>
                    )}
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                    <span className="font-bold text-[#64748B] block mb-1">Logged Symptoms (30 Days)</span>
                    <span className="text-[#0F172A]">
                      {digitalTwinState.symptoms?.frequentSymptoms &&
                      digitalTwinState.symptoms.frequentSymptoms.length > 0
                        ? digitalTwinState.symptoms.frequentSymptoms.map((s) => s.name).join(', ')
                        : 'No symptoms logged'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                <p>
                  BioPulse AI is strictly grounded in these authenticated, sanitized records. Zero PII is transmitted to external inference engines.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
