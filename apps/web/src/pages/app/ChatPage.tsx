import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageChatCircle,
  Send01,
  RefreshCw01,
  MedicalCircle,
  ShieldTick,
  Database01,
  XClose,
  Calendar,
  Heart,
  File01,
  Trash01,
  Sliders01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { sendChatMessage } from '../../services/intelligenceService';
import { DigitalTwinService } from '../../services/digitalTwinService';
import { resolvePathway } from '../../types/onboarding';
import type { ChatSafetyLevel } from '../../types/intelligence';

interface LocalMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  safetyLevel?: ChatSafetyLevel;
  needsClinician?: boolean;
}

const FEMALE_SUGGESTED_QUESTIONS = [
  {
    category: 'PCOS & Hormones',
    icon: Calendar,
    prompts: [
      'Explain my PCOS screening result',
      'What factors influenced my result?',
      'What does my next screening step mean?',
    ],
  },
  {
    category: 'Lab Reports & Biomarkers',
    icon: File01,
    prompts: [
      'Can you explain my verified lab results in plain language?',
      'What is the significance of the LH to FSH ratio?',
      'What lifestyle factors support optimal fasting insulin?',
    ],
  },
  {
    category: 'Nutrition & Lifestyle',
    icon: Heart,
    prompts: [
      'What are easy low-glycemic meals that support endocrine balance?',
      'How does sleep duration influence daily energy?',
      'What types of exercise are gentle on insulin sensitivity?',
    ],
  },
  {
    category: 'Doctor Discussion',
    icon: MedicalCircle,
    prompts: [
      'What key questions should I prepare for my next gynecologist appointment?',
      'How can I discuss my screening logs with my doctor?',
    ],
  },
];

const MALE_SUGGESTED_QUESTIONS = [
  {
    category: 'Hormone Health & Vitality',
    icon: Calendar,
    prompts: [
      'Explain my hypogonadism screening result',
      'What factors influenced my result?',
      'Why is morning testosterone relevant?',
    ],
  },
  {
    category: 'Lab Reports & Biomarkers',
    icon: File01,
    prompts: [
      'Can you explain my verified morning lab results in plain language?',
      'What is the difference between total and free testosterone?',
      'What does my fasting glucose or lipid panel indicate?',
    ],
  },
  {
    category: 'Nutrition & Lifestyle',
    icon: Heart,
    prompts: [
      'What Pakistani nutrition targets support daily energy and metabolic health?',
      'How does sleep quality affect morning testosterone synthesis?',
      'What resistance or functional movement routines support stamina?',
    ],
  },
  {
    category: 'Doctor Discussion',
    icon: MedicalCircle,
    prompts: [
      'What key questions should I prepare for my endocrinologist or urologist?',
      'How can I discuss my ADAM symptom answers with my doctor?',
    ],
  },
];

export const ChatPage: React.FC = () => {
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

  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const aiBrandName = 'BioPulse AI Companion';

  const conversationId = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `conv_${Date.now()}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Digital Twin state for inspection
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
      currentCycleDay: snapshotMetrics.cycleDay,
      currentPhaseName: snapshotMetrics.phaseName,
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

  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const initialGreeting: LocalMessage = {
    id: 'initial_msg',
    sender: 'ai',
    text: `Hello ${
      userProfile.fullName ? userProfile.fullName.split(' ')[0] : 'there'
    }! I am ${aiBrandName}, your health literacy and pattern explanation companion. ${
      pathway === 'female' && snapshotMetrics.cycleDay > 0
        ? `Observations from your recorded history show you are currently on Day ${snapshotMetrics.cycleDay} (${snapshotMetrics.phaseName}).`
        : pathway === 'male'
        ? 'I am here to help you explore hormonal vitality, male health screening patterns, and verified lab markers.'
        : 'I am here to help you explore your baseline health patterns, verified lab markers, and lifestyle insights.'
    } What would you like to explore today?`,
    timestamp: 'Just now',
    safetyLevel: 'normal',
  };

  const [messages, setMessages] = useState<LocalMessage[]>([initialGreeting]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isTyping) return;

    const userMsg: LocalMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      const historyPayload = nextMessages
        .slice(-6)
        .map((m) => ({ sender: m.sender, text: m.text }));

      const resp = await sendChatMessage(
        text.trim(),
        conversationId.current,
        historyPayload,
        { ...snapshotMetrics, pathway }
      );

      if (resp && resp.success) {
        if (resp.conversation_id) {
          conversationId.current = resp.conversation_id;
        }
        const aiMsg: LocalMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: resp.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          safetyLevel: resp.safety_level,
          needsClinician: resp.needs_clinician,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else if (resp && resp.message) {
        const noticeMsg: LocalMessage = {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: resp.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          safetyLevel: 'caution',
          needsClinician: false,
        };
        setMessages((prev) => [...prev, noticeMsg]);
      } else {
        const errorMsg: LocalMessage = {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: 'Unable to reach the AI service right now. Please ensure the backend server is running and try again shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: LocalMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'A connection error occurred while contacting the conversational service. Please check your network and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChatHistory = () => {
    conversationId.current = `conv_${Date.now()}`;
    setMessages([initialGreeting]);
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-6.5rem)] flex flex-col space-y-4 pb-6 select-none text-left">
      {/* ── Top Header Bar ── */}
      <div className="p-4 sm:p-5 rounded-[24px] bg-white border border-[#E2E8F0] text-[#0F172A] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E0F2FE] flex items-center justify-center text-[#0288D1] shadow-2xs">
            <MessageChatCircle className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold font-display text-[#0F172A]">
                BioPulse AI Companion
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-700 font-bold">
                Connected
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-sans">
              Clinical health companion & non-diagnostic literacy reasoning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Digital Twin Context Inspector Button */}
          <button
            type="button"
            onClick={() => setIsContextDrawerOpen(true)}
            className="px-3 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-xs font-mono font-semibold text-[#334155] flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Database01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>Inspect Shared Health Context</span>
          </button>

          {/* Reset Conversation */}
          <button
            type="button"
            onClick={clearChatHistory}
            title="Reset Conversation"
            className="p-2 rounded-xl border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#DC2626] transition-all cursor-pointer active:scale-[0.98]"
          >
            <Trash01 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col rounded-[24px] bg-white border border-[#E2E8F0] shadow-xs overflow-hidden relative">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8FAFC]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {msg.sender === 'user' ? (
                <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs p-3.5 sm:p-4 bg-[#0288D1] text-white shadow-xs space-y-1">
                  <p className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-white">
                    {msg.text}
                  </p>
                  <div className="flex items-center justify-end text-[10px] font-mono text-[#E0F2FE] pt-0.5">
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%]">
                  <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] text-[#0288D1] flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
                    <MessageChatCircle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                  </div>
                  <div className="rounded-2xl rounded-tl-xs p-4 sm:p-5 bg-white border border-[#E2E8F0] shadow-xs space-y-2 text-[#0F172A]">
                    {/* Clinician Referral Alert Flag */}
                    {msg.needsClinician && (
                      <div className="p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-start gap-2 font-sans">
                        <MedicalCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" aria-hidden="true" />
                        <span>
                          <strong>Clinical Evaluation Advised:</strong> Please consult your licensed healthcare provider for individualized care.
                        </span>
                      </div>
                    )}

                    {/* Message text with whitespace preservation */}
                    <p className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-[#0F172A]">
                      {msg.text}
                    </p>

                    <div className="flex items-center justify-end text-[10px] font-mono text-[#94A3B8] pt-1">
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Shimmering Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] text-[#0288D1] flex items-center justify-center shadow-2xs shrink-0 mt-0.5">
                <MessageChatCircle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
              </div>
              <div className="rounded-2xl rounded-tl-xs p-3.5 sm:p-4 bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-2.5 text-[#475569]">
                <RefreshCw01 className="w-4 h-4 animate-spin text-[#0288D1]" aria-hidden="true" />
                <span className="text-xs font-sans">
                  {aiBrandName} is consulting your recorded health observations...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggested Questions Carousel / Grid ── */}
        <div className="border-t border-[#E2E8F0] p-3 sm:p-4 bg-white">
          <div className="text-[11px] font-mono uppercase font-bold mb-2 flex items-center gap-1.5 text-[#0288D1]">
            <Sliders01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>Suggested Inquiries</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {(pathway === 'male' ? MALE_SUGGESTED_QUESTIONS : FEMALE_SUGGESTED_QUESTIONS).flatMap((cat) => cat.prompts).slice(0, 5).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer active:scale-[0.98] bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-[#0288D1] shadow-2xs hover:shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input Bar ── */}
        <div className="p-3 sm:p-4 border-t border-[#E2E8F0] bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={pathway === 'male' ? `Ask ${aiBrandName} about your symptoms, morning lab tests, or nutrition...` : `Ask ${aiBrandName} about your symptoms, lab reports, or nutrition...`}
              disabled={isTyping}
              className="flex-1 px-4 py-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder-[#64748B] focus:border-[#0288D1] focus:bg-white text-xs sm:text-sm focus:outline-none transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="px-5 py-3 rounded-xl font-semibold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-[0.98] bg-[#0288D1] hover:bg-[#0277BD] disabled:opacity-40 text-white"
            >
              <span>Send</span>
              <Send01 className="w-4 h-4 text-white" aria-hidden="true" />
            </button>
          </form>
          <p className="text-[10px] text-center text-[#94A3B8] font-sans mt-2">
            {aiBrandName} provides health literacy explanations based on your recorded health data. It does not provide medical diagnoses or prescription changes.
          </p>
        </div>
      </div>

      {/* ── Longitudinal Shared Context Modal Drawer ── */}
      <AnimatePresence>
        {isContextDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-xs flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-[#0F172A] border-l border-[#0288D1]/20 text-white p-6 overflow-y-auto flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Database01 className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
                  <h3 className="text-lg font-bold font-display text-white">
                    Longitudinal Health State
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContextDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#94A3B8] transition-colors"
                >
                  <XClose className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="text-xs text-[#94A3B8] bg-white/[0.03] p-3 rounded-xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-[#38BDF8] font-bold">
                  <ShieldTick className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
                  <span>Privacy-Preserving Shared Tree</span>
                </div>
                <p>
                  This structured representation summarizes your verified records. Personal identifiers (exact birthdates, database keys) are removed before consulting the AI.
                </p>
              </div>

              {/* Node Inspector */}
              <div className="space-y-4 text-xs font-mono">
                {/* 1. Profile Node */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#38BDF8] uppercase font-bold">1. Patient Profile</span>
                  <p className="text-white">Age: {digitalTwinState.profile.ageYears || 'N/A'} years</p>
                  <p className="text-[#94A3B8]">
                    BMI: {digitalTwinState.profile.calculatedBmi || 'N/A'} kg/m² ({digitalTwinState.profile.heightCm}cm / {digitalTwinState.profile.weightKg}kg)
                  </p>
                </div>

                {/* 2. Cycle Node */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#38BDF8] uppercase font-bold">2. Cycle & Hormones</span>
                  <p className="text-white">
                    Day {digitalTwinState.cycle.currentCycleDay} ({digitalTwinState.cycle.currentPhase})
                  </p>
                  <p className="text-[#94A3B8]">{digitalTwinState.cycle.estrogenProgesteroneState}</p>
                </div>

                {/* 3. Symptoms Node */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#38BDF8] uppercase font-bold">3. Symptoms (30 Days)</span>
                  <p className="text-white">Total Logged: {digitalTwinState.symptoms.totalLogged30Days}</p>
                  {digitalTwinState.symptoms.frequentSymptoms.map((fs, idx) => (
                    <p key={idx} className="text-[#94A3B8]">
                      • {fs.name} ({fs.count}x, {fs.typicalSeverity})
                    </p>
                  ))}
                </div>

                {/* 4. Lifestyle & Sleep */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#38BDF8] uppercase font-bold">4. Lifestyle & Sleep</span>
                  <p className="text-white">Sleep: {digitalTwinState.lifestyle.averageSleepHours} hrs/night ({digitalTwinState.lifestyle.sleepAdherence})</p>
                  <p className="text-[#94A3B8]">Hydration Target: {digitalTwinState.lifestyle.dailyWaterAdherencePercent}%</p>
                </div>

                {/* 5. Verified Lab Reports */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#38BDF8] uppercase font-bold">5. Verified Lab Biomarkers</span>
                  <p className="text-white">Verified: {digitalTwinState.reports.verifiedBiomarkersCount} biomarkers</p>
                  {digitalTwinState.reports.keyBiomarkersSummary.map((bm, idx) => (
                    <p key={idx} className="text-[#94A3B8]">
                      • {bm.testName}: {bm.resultValue} {bm.unit} ({bm.status})
                    </p>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsContextDrawerOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Close Health State Inspector
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
