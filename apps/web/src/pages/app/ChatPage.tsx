import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Loader2,
  Stethoscope,
  ShieldCheck,
  Database,
  X,
  Calendar,
  Heart,
  FileText,
  Trash2,
} from 'lucide-react';
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

const SUGGESTED_QUESTIONS = [
  {
    category: 'Cycle & Hormones',
    icon: Calendar,
    prompts: [
      'What phase of my cycle am I in right now according to my Digital Twin?',
      'Why is progesterone dominant during the luteal phase?',
      'How does an extended follicular phase impact ovulation?',
    ],
  },
  {
    category: 'Lab Reports & Biomarkers',
    icon: FileText,
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
      'What are easy low-glycemic meals that support ovarian health?',
      'How does sleep duration influence cortisol and cycle regularity?',
      'What types of exercise are gentle on insulin sensitivity?',
    ],
  },
  {
    category: 'Doctor Discussion',
    icon: Stethoscope,
    prompts: [
      'What key questions should I prepare for my next doctor appointment?',
      'How can I discuss my screening logs with my care team?',
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
  const aiBrandName =
    pathway === 'male' ? 'AndroSense AI' : pathway === 'female' ? 'OvaSense AI' : 'VITASense AI';

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
        ? `Observations from your Digital Twin show you are currently on Day ${snapshotMetrics.cycleDay} (${snapshotMetrics.phaseName}).`
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
        snapshotMetrics
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
      <div className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-[#180A26] via-[#240F38] to-[#12071F] border border-white/10 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-md shadow-purple-950/40">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold font-display text-white">
                {aiBrandName}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold">
                Connected
              </span>
            </div>
            <p className="text-xs text-[#CDBDD8] font-sans">
              Clinical health companion & non-diagnostic literacy reasoning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Digital Twin Context Inspector Button */}
          <button
            type="button"
            onClick={() => setIsContextDrawerOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-mono font-bold text-[#FDA4AF] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Inspect Shared Health Context</span>
          </button>

          {/* Reset Conversation */}
          <button
            type="button"
            onClick={clearChatHistory}
            title="Reset Conversation"
            className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-[#CDBDD8] transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm overflow-hidden relative">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#FCFBFD]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {msg.sender === 'user' ? (
                <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl rounded-tr-xs p-4 bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white shadow-sm space-y-1">
                  <p className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-white">{msg.text}</p>
                  <div className="flex items-center justify-end text-[10px] font-mono text-purple-200/80 pt-0.5">
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%]">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="rounded-3xl rounded-tl-xs p-4 sm:p-5 bg-white border border-[#E7DFEF] text-[#1C1326] shadow-xs space-y-2">
                    {/* Clinician Referral Alert Flag */}
                    {msg.needsClinician && (
                      <div className="p-2.5 rounded-xl bg-[#FFF1F2] border border-[#FDA4AF] text-xs text-[#BE123C] flex items-start gap-2 font-sans">
                        <Stethoscope className="w-4 h-4 text-[#BE123C] shrink-0 mt-0.5" />
                        <span>
                          <strong>Clinical Evaluation Advised:</strong> Please consult your licensed healthcare provider for individualized care.
                        </span>
                      </div>
                    )}

                    {/* Message text with whitespace preservation */}
                    <p className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-[#1C1326]">{msg.text}</p>

                    <div className="flex items-center justify-end text-[10px] font-mono text-[#8D7E9E] pt-1">
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-3xl rounded-tl-xs p-3.5 sm:p-4 bg-white border border-[#E7DFEF] shadow-xs flex items-center gap-2.5 text-[#584B68]">
                <Loader2 className="w-4 h-4 text-[#8E3EAF] animate-spin" />
                <span className="text-xs font-sans">
                  {aiBrandName} is consulting your Digital Twin observations...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Suggested Questions Carousel / Grid (No Windows Native Scrollbar) ── */}
        <div className="border-t border-[#E7DFEF] p-3 sm:p-4 bg-white/95">
          <div className="text-[11px] font-mono text-[#6E2D8B] uppercase font-bold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Suggested Inquiries</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_QUESTIONS.flatMap((cat) => cat.prompts).slice(0, 5).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 px-3.5 py-1.5 rounded-full bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#E9D5FF] text-xs font-semibold text-[#6E2D8B] transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* ── Input Bar ── */}
        <div className="p-3 sm:p-4 border-t border-[#E7DFEF] bg-white">
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
              placeholder={`Ask ${aiBrandName} about your cycle, symptoms, lab reports, or nutrition...`}
              disabled={isTyping}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-[#1C1326] text-xs sm:text-sm placeholder-[#8D7E9E] focus:outline-none focus:border-[#8E3EAF] focus:bg-white transition-all shadow-2xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] hover:brightness-110 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-purple-950/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-center text-[#8D7E9E] font-sans mt-2">
            {aiBrandName} provides health literacy explanations based on your Digital Twin. It does not provide medical diagnoses or prescription changes.
          </p>
        </div>
      </div>

      {/* ── Digital Twin Shared Context Modal Drawer ── */}
      <AnimatePresence>
        {isContextDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-[#140822] border-l border-white/10 text-white p-6 overflow-y-auto flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-[#FB7185]" />
                  <h3 className="text-lg font-bold font-display text-white">
                    Digital Twin Health State
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsContextDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#CDBDD8]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-[#CDBDD8] bg-white/[0.03] p-3 rounded-xl border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-[#FDA4AF] font-bold">
                  <ShieldCheck className="w-4 h-4" />
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
                  <span className="text-[#FDA4AF] uppercase font-bold">1. Patient Profile</span>
                  <p className="text-white">Age: {digitalTwinState.profile.ageYears || 'N/A'} years</p>
                  <p className="text-[#CDBDD8]">
                    BMI: {digitalTwinState.profile.calculatedBmi || 'N/A'} kg/m² ({digitalTwinState.profile.heightCm}cm / {digitalTwinState.profile.weightKg}kg)
                  </p>
                </div>

                {/* 2. Cycle Node */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#FDA4AF] uppercase font-bold">2. Cycle & Hormones</span>
                  <p className="text-white">
                    Day {digitalTwinState.cycle.currentCycleDay} ({digitalTwinState.cycle.currentPhase})
                  </p>
                  <p className="text-[#CDBDD8]">{digitalTwinState.cycle.estrogenProgesteroneState}</p>
                </div>

                {/* 3. Symptoms Node */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#FDA4AF] uppercase font-bold">3. Symptoms (30 Days)</span>
                  <p className="text-white">Total Logged: {digitalTwinState.symptoms.totalLogged30Days}</p>
                  {digitalTwinState.symptoms.frequentSymptoms.map((fs, idx) => (
                    <p key={idx} className="text-[#CDBDD8]">
                      • {fs.name} ({fs.count}x, {fs.typicalSeverity})
                    </p>
                  ))}
                </div>

                {/* 4. Lifestyle & Sleep */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#FDA4AF] uppercase font-bold">4. Lifestyle & Sleep</span>
                  <p className="text-white">Sleep: {digitalTwinState.lifestyle.averageSleepHours} hrs/night ({digitalTwinState.lifestyle.sleepAdherence})</p>
                  <p className="text-[#CDBDD8]">Hydration Target: {digitalTwinState.lifestyle.dailyWaterAdherencePercent}%</p>
                </div>

                {/* 5. Verified Lab Reports */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1">
                  <span className="text-[#FDA4AF] uppercase font-bold">5. Verified Lab Biomarkers</span>
                  <p className="text-white">Verified: {digitalTwinState.reports.verifiedBiomarkersCount} biomarkers</p>
                  {digitalTwinState.reports.keyBiomarkersSummary.map((bm, idx) => (
                    <p key={idx} className="text-[#CDBDD8]">
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
