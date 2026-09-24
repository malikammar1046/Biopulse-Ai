import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  Activity,
  Calendar,
  Moon,
  Footprints,
  FileText,
  BrainCircuit,
  Sparkles,
  ArrowDown,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const HumanSymptomExperienceSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      id: 1,
      badge: 'Stage 01 — Human Experience',
      title: 'IT STARTS WITH SOMETHING YOU FEEL.',
      subtitle: 'VITASense helps connect the signals.',
      desc: 'Physical sensations — subtle shifts in daily vitality, cycle variations, fatigue, sleep disruptions, or skin changes — are your body’s early biological signals.',
    },
    {
      id: 2,
      badge: 'Stage 02 — Biological Signal',
      title: 'PATTERNS YOU NOTICE, BUT CAN’T ALWAYS CONNECT.',
      subtitle: 'Energy. Sleep. Endocrine rhythms.',
      desc: 'An isolated symptom or uncharacteristic fatigue can feel random. Behind the scenes, subtle hormonal fluctuations and endocrine feedback drive these sensations.',
    },
    {
      id: 3,
      badge: 'Stage 03 — Structured Data Points',
      title: 'FROM PHYSICAL SENSATION TO STRUCTURED OBSERVATIONS.',
      subtitle: 'Multimodal data standardization',
      desc: 'VITASense captures subjective observations and organizes them alongside quantified biomarkers, sleep quality, and physiological timing.',
    },
    {
      id: 4,
      badge: 'Stage 04 — Multimodal Convergence',
      title: 'THE VITASENSE INTELLIGENCE CORE.',
      subtitle: 'Unifying disparate health streams',
      desc: 'Symptoms, temporal chronologies, verified laboratory results, and lifestyle pacing converge into a unified health matrix.',
    },
    {
      id: 5,
      badge: 'Stage 05 — Connected Health Insights',
      title: 'LONGITUDINAL PATTERNS REVEALED.',
      subtitle: 'Explainable health intelligence',
      desc: 'A clear, non-diagnostic overview of historical trends designed to empower informed, collaborative conversations with your doctor.',
    },
  ];

  const dataPoints = [
    { label: 'Temporal Marker', val: 'Morning Window (08:30 AM)', icon: Calendar, color: '#C084FC' },
    { label: 'Symptom Severity', val: 'Moderate (3/5)', icon: Activity, color: '#FB7185' },
    { label: 'Sleep Quality', val: '6.5 hrs (Fragmented)', icon: Moon, color: '#93C5FD' },
    { label: 'Activity Pacing', val: '4,200 Steps (Paced)', icon: Footprints, color: '#34D399' },
    { label: 'Lifestyle Context', val: 'Nutrition & Rest Logged', icon: HeartPulse, color: '#FDA4AF' },
    { label: 'Verified Lab Results', val: 'Hormone Panel Verified', icon: FileText, color: '#E879F9' },
  ];

  return (
    <section
      id="symptom-experience"
      className="relative pt-24 sm:pt-32 pb-20 sm:pb-28 bg-[#10071A] text-white overflow-hidden border-b border-white/10"
      aria-label="Human-centered biological symptom experience and data transformation"
    >
      {/* Subtle Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#E87084]/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-14 sm:mb-18">
          <Badge variant="primary" showDot size="md" className="bg-white/10 text-[#FDA4AF] border-white/15">
            The Living Symptom Journey
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            IT STARTS WITH{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              SOMETHING YOU FEEL.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto font-normal">
            VITASense helps connect the signals — transforming lived physical experiences into structured, explainable health insights.
          </p>

          {/* Interactive Stage Stepper Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {stages.map((stg, sIdx) => {
              const isCurrent = activeStage === sIdx;
              return (
                <button
                  key={stg.id}
                  type="button"
                  onClick={() => setActiveStage(sIdx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white font-bold shadow-lg shadow-purple-950/40 ring-2 ring-[#FDA4AF]'
                      : 'bg-white/5 text-[#B4A6C7] hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  0{stg.id} • {stg.badge.split('— ')[1]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Stage Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* Left Visual Card */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-b from-[#1E0B2E] via-[#180A25] to-[#10071A] p-8 flex flex-col justify-between shadow-2xl">
              {/* Stage Context Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-md">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#FDA4AF] block">
                      Biological Journey
                    </span>
                    <span className="text-xs font-bold font-display text-white">
                      {stages[activeStage].badge}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#E879F9] bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                  Step 0{activeStage + 1} / 05
                </span>
              </div>

              {/* Dynamic Biological Visual Graphic */}
              <div className="relative my-auto py-6 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#6E2D8B]/40 via-[#A21CAF]/30 to-[#E87084]/40 border border-white/20 flex items-center justify-center shadow-xl">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8E3EAF] to-[#E87084] flex items-center justify-center shadow-[0_0_25px_rgba(232,112,132,0.5)]">
                    {activeStage === 0 && <HeartPulse className="w-10 h-10 text-white" />}
                    {activeStage === 1 && <Activity className="w-10 h-10 text-white" />}
                    {activeStage === 2 && <Calendar className="w-10 h-10 text-white" />}
                    {activeStage === 3 && <BrainCircuit className="w-10 h-10 text-white" />}
                    {activeStage === 4 && <Sparkles className="w-10 h-10 text-white" />}
                  </div>
                </div>

                {/* Floating Context Pills */}
                <div className="absolute -top-1 left-2 px-3 py-1.5 rounded-xl bg-[#10071A]/90 border border-white/15 text-[11px] font-mono text-white shadow-lg flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FB7185]" />
                  <span>Early Bodily Signal</span>
                </div>

                <div className="absolute -bottom-1 right-2 px-3 py-1.5 rounded-xl bg-[#10071A]/90 border border-white/15 text-[11px] font-mono text-[#34D399] shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Longitudinal Record</span>
                </div>
              </div>

              {/* Biological Timeline Indicator */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#B4A6C7] font-mono">
                <span>Subjective Signal</span>
                <span className="text-white font-bold">→</span>
                <span>Structured Intelligence</span>
              </div>
            </div>
          </div>

          {/* Right Presentation */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl space-y-3">
              <span className="px-2.5 py-1 rounded-full bg-[#8E3EAF]/30 text-[#FDA4AF] border border-[#8E3EAF]/40 text-[10px] font-mono font-bold uppercase tracking-wider inline-block">
                {stages[activeStage].badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white leading-snug">
                {stages[activeStage].title}
              </h3>
              <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed">
                {stages[activeStage].desc}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {activeStage <= 1 && (
                <motion.div
                  key="stage-intake"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 rounded-3xl bg-white/[0.05] border border-[#FB7185]/30 backdrop-blur-xl shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#EDE4F7]/15 text-[#FB7185] flex items-center justify-center border border-[#FB7185]/30">
                        <HeartPulse className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold font-display text-white">Symptom Observation</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#34D399] bg-[#047857]/20 px-2 py-0.5 rounded-full border border-[#047857]/40">
                      Validated
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Reported Experience:</span>
                      <span className="font-semibold text-white">Persistent Fatigue & Vitality Shift</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Severity Intensity:</span>
                      <span className="font-bold text-[#FB7185]">Moderate (3 / 5)</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Associated Context:</span>
                      <span className="font-mono text-[11px] text-[#FDA4AF]">Morning Window • Sleep Disruption</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStage === 2 && (
                <motion.div
                  key="stage-datapoints"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-xl shadow-2xl space-y-3"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                    Structured Multimodal Streams
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {dataPoints.map((dp, idx) => {
                      const DataIcon = dp.icon;
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <DataIcon className="w-3.5 h-3.5" style={{ color: dp.color }} />
                            <span className="text-[10px] font-bold text-white block truncate">{dp.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#B4A6C7] block truncate">{dp.val}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeStage === 3 && (
                <motion.div
                  key="stage-convergence"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 rounded-3xl bg-gradient-brand border border-white/20 backdrop-blur-xl shadow-2xl text-center space-y-3"
                >
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#FDA4AF]">
                    Multimodal Convergence Architecture
                  </span>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold py-2">
                    <span className="px-2 py-1 rounded-lg bg-white/10">SYMPTOMS</span>
                    <span>+</span>
                    <span className="px-2 py-1 rounded-lg bg-white/10">TIMELINE</span>
                    <span>+</span>
                    <span className="px-2 py-1 rounded-lg bg-white/10">LABS</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                    <ArrowDown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/15 border border-white/20 text-xs font-bold text-white font-display">
                    VITASENSE INTELLIGENCE ENGINE
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                    <ArrowDown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#34D399] block">
                    ✓ CONNECTED PATTERNS MATRIX
                  </span>
                </motion.div>
              )}

              {activeStage >= 4 && (
                <motion.div
                  key="stage-insights"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 rounded-3xl bg-white/[0.05] border border-[#8E3EAF]/50 backdrop-blur-xl shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <BrainCircuit className="w-4 h-4 text-[#C084FC]" />
                    <span>Explainable Longitudinal Evaluation</span>
                  </div>
                  <p className="text-xs text-[#B4A6C7] leading-relaxed">
                    Multidimensional risk trends and statistical clustering presented in an actionable summary prepared for collaborative clinical review.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-[11px] text-[#34D399]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Non-diagnostic, patient-empowering intelligence</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
};
