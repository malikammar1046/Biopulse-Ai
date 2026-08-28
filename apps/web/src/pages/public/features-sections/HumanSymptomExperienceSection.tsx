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
  ChevronRight,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const HumanSymptomExperienceSection: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [imageError, setImageError] = useState(false);

  const stages = [
    {
      id: 1,
      badge: 'Stage 01 — Human Experience',
      title: 'IT STARTS WITH SOMETHING YOU FEEL.',
      subtitle: 'PMOSense helps connect the signals.',
      desc: 'Physical sensations—pelvic tension, menstrual cramps, subtle shifts in daily energy—are your body’s first biological signals.',
    },
    {
      id: 2,
      badge: 'Stage 02 — Biological Signal',
      title: 'PATTERNS YOU NOTICE, BUT CAN’T ALWAYS CONNECT.',
      subtitle: 'Cramps. Fatigue. Cycle changes.',
      desc: 'An isolated cramp or irregular cycle can feel random. Behind the scenes, subtle hormonal fluctuations and ovarian signaling drive these sensations.',
    },
    {
      id: 3,
      badge: 'Stage 03 — Structured Data Points',
      title: 'FROM PHYSICAL SENSATION TO STRUCTURED OBSERVATIONS.',
      subtitle: 'Multimodal data standardization',
      desc: 'PMOSense captures subjective observations and organizes them alongside quantified biomarkers, sleep quality, and cycle duration.',
    },
    {
      id: 4,
      badge: 'Stage 04 — Multimodal Convergence',
      title: 'THE PMOSENSE INTELLIGENCE CORE.',
      subtitle: 'Unifying disparate health streams',
      desc: 'Symptoms, cycle chronologies, verified laboratory results, and lifestyle pacing converge into a unified health matrix.',
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
    { label: 'Cycle Day', val: 'Day 14 (Follicular)', icon: Calendar, color: '#C084FC' },
    { label: 'Symptom Severity', val: 'Moderate (3/5)', icon: Activity, color: '#FB7185' },
    { label: 'Sleep Quality', val: '6.5 hrs (Restless)', icon: Moon, color: '#93C5FD' },
    { label: 'Activity Pacing', val: '4,200 Steps (Light)', icon: Footprints, color: '#34D399' },
    { label: 'Lifestyle Context', val: 'Warmth & Rest Logged', icon: HeartPulse, color: '#FDA4AF' },
    { label: 'Verified Lab Results', val: 'LH/FSH Ratio: 1.71', icon: FileText, color: '#E879F9' },
  ];

  return (
    <section
      id="symptom-experience"
      className="relative py-24 sm:py-36 bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#10071A] text-white overflow-hidden border-y border-white/10"
      aria-label="Human-centered biological symptom experience and data transformation"
    >
      {/* ── Ambient Radial Atmosphere ── */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[700px] sm:h-[950px] bg-[#6E2D8B]/20 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#E87084]/16 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[450px] h-[450px] bg-[#A21CAF]/18 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* ── Floating Background Biological Particles ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {[
          { top: '18%', left: '15%', size: 'w-2 h-2', color: 'bg-[#FB7185]', dur: 4 },
          { top: '32%', right: '12%', size: 'w-2.5 h-2.5', color: 'bg-[#C084FC]', dur: 5.5 },
          { bottom: '24%', left: '18%', size: 'w-2 h-2', color: 'bg-[#FDA4AF]', dur: 4.8 },
          { bottom: '15%', right: '22%', size: 'w-3 h-3', color: 'bg-[#E879F9]', dur: 6 },
          { top: '50%', left: '8%', size: 'w-1.5 h-1.5', color: 'bg-white', dur: 3.5 },
        ].map((p, idx) => (
          <motion.div
            key={idx}
            animate={{ y: [-10, 10, -10], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute ${p.size} rounded-full ${p.color} shadow-lg blur-[0.5px]`}
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
          />
        ))}
      </div>

      <Container size="xl" className="relative z-10">
        {/* ── Section Header ── */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <Badge variant="primary" showDot size="md" className="bg-white/10 text-[#FDA4AF] border-white/15">
            The Living Symptom Journey
          </Badge>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.08]">
            IT STARTS WITH{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              SOMETHING YOU FEEL.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto font-normal">
            PMOSense helps connect the signals—transforming lived physical experiences into structured, explainable health insights.
          </p>

          {/* Interactive Stage Stepper Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
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

        {/* ── Main Stage Canvas: Split Composition ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT COLUMN: Cinematic Visual with Atmospheric Blending & Abdominal Glow (55%)
             ═══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-[560px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-[#180A25]">
              {/* Online Editorial Image: Dignified young woman resting comfortably on sofa, hand on lower abdomen */}
              {!imageError ? (
                <img
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80"
                  alt="Realistic adult woman comfortably seated on a modern sofa with one hand gently resting on her lower abdomen during mild menstrual cramp discomfort"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-center filter saturate-[0.95] contrast-[1.05] brightness-[0.88] transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              ) : (
                /* Fallback Scene Graphic */
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-[#241038] via-[#180A25] to-[#10071A] text-center space-y-4">
                  <HeartPulse className="w-16 h-16 text-[#FB7185] animate-pulse" />
                  <div>
                    <h4 className="text-base font-bold font-display text-white">Lived Physiological Experience</h4>
                    <p className="text-xs text-[#B4A6C7]">Pelvic discomfort recorded in natural home environment</p>
                  </div>
                </div>
              )}

              {/* Seamless Dark Plum & Orchid Gradient Masks (No visible hard rectangular box) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#10071A] via-transparent to-[#10071A]/40 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#10071A]/65 via-transparent to-[#10071A]/70 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_65%,rgba(244,114,182,0.24),transparent_55%)] pointer-events-none" />

              {/* Conceptual Biological Abdominal Glow Aura */}
              <motion.div
                animate={{
                  scale: activeStage >= 1 ? [1, 1.22, 1] : [1, 1.08, 1],
                  opacity: activeStage >= 1 ? [0.55, 0.9, 0.55] : [0.35, 0.55, 0.35],
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute bottom-[28%] left-[44%] -translate-x-1/2 -translate-y-1/2 w-32 sm:w-44 h-32 sm:h-44 rounded-full bg-gradient-to-r from-[#FB7185]/50 via-[#E879F9]/40 to-[#C084FC]/35 blur-2xl pointer-events-none"
              />

              {/* Signal Wave Particles around pelvic region */}
              <div className="absolute bottom-[28%] left-[44%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 pointer-events-none">
                <span className="absolute inset-0 rounded-full border border-[#FB7185]/60 animate-ping" />
                <span className="absolute inset-2 rounded-full border border-[#C084FC]/40 animate-pulse" />
              </div>

              {/* Floating Live Context Overlay 1 (Cycle Day) */}
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-5 left-5 z-20"
              >
                <div className="px-3.5 py-2 rounded-2xl bg-[#10071A]/85 border border-white/20 backdrop-blur-xl shadow-xl space-y-0.5">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#B4A6C7] block">
                    Cycle Day
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-display text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C084FC]" />
                    Day 14
                  </span>
                </div>
              </motion.div>

              {/* Floating Live Context Overlay 2 (Active Symptom: Cramps) */}
              <motion.div
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-16 left-5 z-20"
              >
                <div className="px-3.5 py-2.5 rounded-2xl bg-[#10071A]/90 border border-[#FB7185]/40 backdrop-blur-xl shadow-2xl space-y-0.5">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#FDA4AF] block">
                    Symptom
                  </span>
                  <div className="text-xs font-bold font-display text-white">
                    Cramps
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#FB7185] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-pulse" />
                    <span>Moderate</span>
                  </div>
                </div>
              </motion.div>

              {/* Floating Live Context Overlay 3 (Logged Status) */}
              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute bottom-5 right-5 z-20"
              >
                <div className="px-3.5 py-2 rounded-2xl bg-[#10071A]/85 border border-white/20 backdrop-blur-xl shadow-xl space-y-0.5">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#34D399] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Logged
                  </span>
                  <span className="text-[11px] font-mono text-[#EDE4F7] block">
                    Today · 9:42 AM
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Subtle SVG Connector Curve to PMOSense Card (Desktop only) */}
            <svg
              className="hidden lg:block absolute -right-8 top-1/2 -translate-y-1/2 w-16 h-28 overflow-visible pointer-events-none z-30"
              viewBox="0 0 64 112"
            >
              <path
                d="M 0 56 C 32 56, 32 56, 64 56"
                fill="none"
                stroke="url(#connectorGrad)"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              <defs>
                <linearGradient id="connectorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#C084FC" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT COLUMN: Dynamic Stage Presentation & PMOSense Intelligence Interface (45%)
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Dynamic Stage Header Card */}
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

            {/* Dynamic Interactive Stage Body */}
            <AnimatePresence mode="wait">
              {/* ── STAGE 1 & 2: Human Symptom Intake ── */}
              {activeStage <= 1 && (
                <motion.div
                  key="stage-intake"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
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
                      <span className="font-semibold text-white">Lower Pelvic Cramps</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Severity Intensity:</span>
                      <span className="font-bold text-[#FB7185]">Moderate (3 / 5)</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Associated Factors:</span>
                      <span className="font-mono text-[11px] text-[#FDA4AF]">Mid-Cycle • Follicular Day 14</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STAGE 3: Structured Data Transformation ── */}
              {activeStage === 2 && (
                <motion.div
                  key="stage-datapoints"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-xl shadow-2xl space-y-3"
                >
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                    Structured Multimodal Streams
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {dataPoints.map((dp, idx) => {
                      const Icon = dp.icon;
                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-2xl bg-white/5 border border-white/10 space-y-1"
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" style={{ color: dp.color }} />
                            <span className="text-[10px] font-bold text-white block truncate">{dp.label}</span>
                          </div>
                          <span className="text-[10px] font-mono text-[#B4A6C7] block truncate">{dp.val}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── STAGE 4: Central Convergence Matrix ── */}
              {activeStage === 3 && (
                <motion.div
                  key="stage-convergence"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 rounded-3xl bg-gradient-brand border border-white/20 backdrop-blur-xl shadow-2xl text-center space-y-3"
                >
                  <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#FDA4AF]">
                    Multimodal Convergence Architecture
                  </span>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold py-2">
                    <span className="px-2 py-1 rounded-lg bg-white/10">SYMPTOMS</span>
                    <span>+</span>
                    <span className="px-2 py-1 rounded-lg bg-white/10">CYCLE</span>
                    <span>+</span>
                    <span className="px-2 py-1 rounded-lg bg-white/10">LABS</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                    <ArrowDown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white/15 border border-white/20 text-xs font-bold text-white">
                    PMOSENSE INTELLIGENCE ENGINE
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                    <ArrowDown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#34D399] block">
                    ✓ CONNECTED PATTERNS MATRIX
                  </span>
                </motion.div>
              )}

              {/* ── STAGE 5: PMOSense Insight Interface ── */}
              {activeStage === 4 && (
                <motion.div
                  key="stage-insights"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-xl shadow-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-[#C084FC]" />
                      <h4 className="text-xs font-bold font-display text-white">
                        Pattern Insight Summary
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-[#FDA4AF] bg-white/5 px-2 py-0.5 rounded-md">
                      3-Cycle Window
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Cycle Regularity:</span>
                      <span className="font-semibold text-white">37–42 Days (Variable)</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Cramp Timing:</span>
                      <span className="font-semibold text-[#FB7185]">Mid-Cycle Clustering</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <span className="text-[#B4A6C7]">Biomarker Correlation:</span>
                      <span className="font-semibold text-[#34D399]">LH Ratio Alignment</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EDE4F7]/10 border border-[#D8B4FE]/30 text-[11px] text-[#EDE4F7] leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#FDA4AF] shrink-0 mt-0.5" />
                    <span>
                      Longitudinal observations are synthesized into a PDF appointment summary for your next physician consultation.
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={activeStage === 0}
                onClick={() => setActiveStage((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#B4A6C7] hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                Previous Stage
              </button>

              <span className="text-xs font-mono text-[#B4A6C7]">
                Stage {activeStage + 1} of {stages.length}
              </span>

              <button
                type="button"
                disabled={activeStage === stages.length - 1}
                onClick={() => setActiveStage((prev) => Math.min(stages.length - 1, prev + 1))}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              >
                <span>Next Stage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Non-Diagnostic Responsible AI Notice ── */}
        <div className="max-w-3xl mx-auto mt-16 p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 text-xs text-[#B4A6C7]">
          <ShieldCheck className="w-5 h-5 text-[#FB7185] shrink-0" />
          <p>
            <strong>Responsible AI Notice:</strong> Symptom recording and pattern observation support longitudinal health intelligence.
            PMOSense does not diagnose medical conditions, prescribe treatments, or replace professional clinical care.
          </p>
        </div>
      </Container>
    </section>
  );
};
