import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  Activity,
  Calendar,
  FileSearch,
  Stethoscope,
  Utensils,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface SampleInquiry {
  id: string;
  icon: any;
  question: string;
  category: string;
  aiResponse: {
    badge: string;
    summary: string;
    keyPoints: string[];
    suggestedDoctorTopic: string;
  };
}

const SAMPLE_INQUIRIES: SampleInquiry[] = [
  {
    id: 'cycle-irregular',
    icon: Calendar,
    question: 'Why was my cycle irregular this month?',
    category: 'Cycle Dynamics',
    aiResponse: {
      badge: 'Multimodal Cycle Intelligence',
      summary:
        'Your logged data indicates a prolonged 42-day interval. In PCOS, delayed follicular maturation can extend the pre-ovulatory phase, causing the delay.',
      keyPoints: [
        'Basal body temperature (BBT) remained in the lower baseline until Day 28.',
        'Urinary LH strip indicated a delayed peak around Day 27.',
        'No luteal surge was recorded during the typical Day 14–16 window.',
      ],
      suggestedDoctorTopic:
        'Ask your doctor about tracking ovulatory biomarkers to evaluate whether ovulation is delayed vs. anovulatory.',
    },
  },
  {
    id: 'ultrasound-report',
    icon: FileSearch,
    question: 'What does this ultrasound report mean?',
    category: 'Report OCR',
    aiResponse: {
      badge: 'Ultrasound Morphology Extraction',
      summary:
        'The OCR parsed an ovarian volume of 11.4 cm³ on the left and 12.1 cm³ on the right, with 22+ peripheral antral follicles per ovary.',
      keyPoints: [
        'These values align with Rotterdam PCOM (Polycystic Ovarian Morphology) criteria.',
        'Normal volume reference range is typically under 10 cm³.',
        'Increased stromal echogenicity was noted bilaterally.',
      ],
      suggestedDoctorTopic:
        'Review these volume measurements with your gynecologist in context with your hormonal bloodwork.',
    },
  },
  {
    id: 'symptom-history',
    icon: Activity,
    question: 'What symptoms have I logged recently?',
    category: 'Longitudinal Trends',
    aiResponse: {
      badge: 'Symptom Trajectory Analysis',
      summary:
        'Over the past 60 days, you recorded 14 entries: mild acne flare-ups clustered in week 3, accompanied by fatigue on days with irregular sleep.',
      keyPoints: [
        'Skin symptoms peaked during the late follicular phase.',
        'No severe pelvic pain or abnormal spotting logged this month.',
        'Reported mood stability improved following consistent sleep schedules.',
      ],
      suggestedDoctorTopic:
        'Share this 60-day symptom frequency report to provide clear chronological context for your care team.',
    },
  },
  {
    id: 'doctor-prep',
    icon: Stethoscope,
    question: 'What should I discuss with my doctor?',
    category: 'Clinician Prep',
    aiResponse: {
      badge: 'Clinical Discussion Guide',
      summary:
        'Based on your 3-month timeline of extended cycle gaps and elevated ultrasound volume, here are targeted questions for your visit:',
      keyPoints: [
        '“Given my cycle intervals of 40–55 days, would you recommend checking fasting insulin and lipid panels?”',
        '“Is there any indication to evaluate endometrial stripe thickness?”',
        '“Would inositol or targeted nutritional adjustments be appropriate for my metabolic profile?”',
      ],
      suggestedDoctorTopic:
        'Bring the exported OvaSense summary PDF directly to your consultation.',
    },
  },
  {
    id: 'nutrition-habits',
    icon: Utensils,
    question: 'What nutrition habits could support my goals?',
    category: 'Lifestyle Support',
    aiResponse: {
      badge: 'Evidence-Based Nutrition Guidance',
      summary:
        'For individuals with insulin-related PCOS patterns, stabilizing post-meal glucose spikes can reduce circulating insulin and excess thecal androgen stimulation.',
      keyPoints: [
        'Prioritize high-fiber, low-glycemic carbohydrates paired with quality protein.',
        'Incorporate omega-3 fatty acids and antioxidant-rich foods for cellular health.',
        'Maintain regular meal timing to prevent reactive blood sugar drops.',
      ],
      suggestedDoctorTopic:
        'Discuss your dietary approach with a registered dietitian specializing in PCOS.',
    },
  },
  {
    id: 'exercise-routine',
    icon: Dumbbell,
    question: 'What exercise might fit my routine?',
    category: 'Movement Science',
    aiResponse: {
      badge: 'Phase-Tailored Movement',
      summary:
        'A combination of progressive resistance training and zone-2 aerobic movement improves muscular insulin sensitivity without excessively elevating cortisol.',
      keyPoints: [
        '2–3 strength sessions per week enhance peripheral glucose disposal.',
        'Low-impact walking or restorative movement supports parasympathetic recovery.',
        'Avoid chronic overtraining that could trigger excess adrenal stress.',
      ],
      suggestedDoctorTopic:
        'Align your workout intensity with your personal energy and recovery capacity.',
    },
  },
];

export const DigitalTwinSection: React.FC = () => {
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>(SAMPLE_INQUIRIES[0].id);

  const activeInquiry =
    SAMPLE_INQUIRIES.find((i) => i.id === selectedInquiryId) || SAMPLE_INQUIRIES[0];

  return (
    <section className="relative py-24 sm:py-32 bg-[#0C0418] text-white overflow-hidden border-t border-white/10 select-none">
      {/* Background Ambient Lighting */}
      <div className="absolute top-1/3 left-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#FB7185]/18 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Bot className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 08 — The OvaSense Digital Twin
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            Your questions shouldn’t{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              have to wait.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            The OvaSense Digital Twin acts as your personalized, contextual knowledge companion—translating
            complex biomarker trends and symptoms into clear, educational explanations.
          </p>
        </div>

        {/* ── Interactive Digital Twin Interface ── */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Interactive Question Chips */}
          <div className="lg:col-span-5 space-y-3 text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDE4F7] block">
              Sample Health Questions:
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {SAMPLE_INQUIRIES.map((inq) => {
                const isSelected = inq.id === selectedInquiryId;
                const Icon = inq.icon;
                return (
                  <button
                    key={inq.id}
                    onClick={() => setSelectedInquiryId(inq.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#8E3EAF]/30 to-[#E87084]/20 border-[#FB7185] shadow-lg shadow-purple-950/40 scale-[1.02]'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-[#FB7185] text-white' : 'bg-white/10 text-[#B4A6C7]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-white">{inq.question}</span>
                    </div>

                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE] shrink-0">
                      {inq.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dynamic Floating Digital Twin Response Box */}
          <div className="lg:col-span-7">
            <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-b from-[#180A26]/95 via-[#12071F]/95 to-[#0A0313]/95 border border-white/15 shadow-2xl p-6 sm:p-7 space-y-5 text-left backdrop-blur-2xl">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {/* Floating Pulsing AI Mark */}
                  <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center text-white shadow-lg shadow-purple-950/40 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34D399] border-2 border-[#10071A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-white">
                      OvaSense Digital Twin
                    </h3>
                    <span className="text-[10px] font-mono text-[#B4A6C7] block">
                      Contextual Educational AI
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[#34D399]/15 border border-[#34D399]/30 text-[#34D399] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live Context
                </span>
              </div>

              {/* User Query Bubble */}
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-xs text-white font-medium flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-[#FB7185] shrink-0" />
                <span>"{activeInquiry.question}"</span>
              </div>

              {/* AI Response Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeInquiry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#FDA4AF]">
                    <Sparkles className="w-3 h-3 text-[#FB7185]" />
                    <span>{activeInquiry.aiResponse.badge}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#EDE4F7] font-medium leading-relaxed font-sans">
                    {activeInquiry.aiResponse.summary}
                  </p>

                  {/* Bullet Key Points */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#FDA4AF] font-bold block">
                      Data Correlation Points:
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#CDBDD8] font-sans">
                      {activeInquiry.aiResponse.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] mt-1.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Doctor Conversation Prompt Box */}
                  <div className="p-3.5 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E879F9] font-bold block flex items-center gap-1.5">
                      <Stethoscope className="w-3 h-3 text-[#E879F9]" />
                      Doctor Discussion Guidance
                    </span>
                    <p className="text-xs text-[#EDE4F7] leading-relaxed">
                      {activeInquiry.aiResponse.suggestedDoctorTopic}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Regulatory Notice Banner */}
              <div className="pt-3 border-t border-white/10 text-[10px] text-[#A797BD] font-sans flex items-start gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-[#FB7185] shrink-0 mt-0.5" />
                <p>
                  <strong>Disclaimer:</strong> OvaSense provides health information and
                  personalized guidance based on the data you provide. It does not diagnose
                  disease or prescribe medical treatments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
