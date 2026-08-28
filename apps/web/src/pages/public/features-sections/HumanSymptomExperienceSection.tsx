import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Clock,
  Calendar,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const HumanSymptomExperienceSection: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<'Mild' | 'Moderate' | 'Pronounced'>('Moderate');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const severityLevels = [
    { label: 'Mild', score: 1, color: '#34D399', desc: 'Noticeable baseline sensation, normal daily activity.' },
    { label: 'Moderate', score: 3, color: '#FB7185', desc: 'Mild-to-moderate discomfort, benefits from rest or heat.' },
    { label: 'Pronounced', score: 4, color: '#E11D48', desc: 'Significant discomfort affecting energy or movement.' },
  ] as const;

  const currentLevel = severityLevels.find((s) => s.label === selectedSeverity) || severityLevels[1];

  return (
    <section
      id="cramp-experience"
      className="relative py-24 sm:py-32 bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#10071A] text-white overflow-hidden border-y border-white/10"
      aria-label="Human-centered menstrual cramp symptom logging experience"
    >
      {/* 1. Atmospheric Ambient Lighting Layers */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[850px] h-[600px] sm:h-[850px] bg-[#6E2D8B]/24 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#E87084]/20 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-[#A21CAF]/22 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        {/* 2. Editorial Header */}
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16 sm:mb-20">
          <Badge variant="primary" showDot size="md" className="bg-white/10 text-[#FDA4AF] border-white/15">
            Human-Centered Symptom Experience
          </Badge>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.1]">
            Patterns{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              matter.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            Symptoms are personal, but they can also become meaningful signals when recorded consistently over time.
            Log what you experience. PMOSense helps organize those observations alongside your broader health information.
          </p>
        </div>

        {/* 3. Split Storytelling Composition: Left (Human Scene) & Right (PMOSense UI) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* ── LEFT COLUMN: Cinematic Editorial Photo of Woman on Sofa with Biological Glow & Floating Overlays (55%) ── */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-[560px] aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-[#180A25]">
              {/* Online Source Photo: Young woman resting on sofa with hands holding lower abdomen / cramps */}
              {!imageError ? (
                <img
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80"
                  alt="Young woman comfortably resting on a sofa, gently holding her lower abdomen during menstrual cramp discomfort"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover object-center filter saturate-[0.95] contrast-[1.05] brightness-[0.88] transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              ) : (
                /* Fallback Graphic */
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
              <div className="absolute inset-0 bg-gradient-to-r from-[#10071A]/60 via-transparent to-[#10071A]/70 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_65%,rgba(244,114,182,0.22),transparent_55%)] pointer-events-none" />

              {/* Conceptual Biological Abdominal Glow Aura */}
              <motion.div
                animate={{
                  scale: [1, 1.18, 1],
                  opacity: [0.45, 0.8, 0.45],
                }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute bottom-[28%] left-[44%] -translate-x-1/2 -translate-y-1/2 w-32 sm:w-40 h-32 sm:h-40 rounded-full bg-gradient-to-r from-[#FB7185]/45 via-[#E879F9]/40 to-[#C084FC]/35 blur-2xl pointer-events-none"
              />

              {/* ── FLOATING PMOSENSE DATA OVERLAYS (Near the woman) ── */}
              {/* Overlay 1: Cycle Day 14 (Top-Left) */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                animate={{ y: [-3, 3, -3] }}
                className="absolute top-5 left-5 z-20"
              >
                <div className="px-3.5 py-2 rounded-2xl bg-[#10071A]/85 border border-white/20 backdrop-blur-xl shadow-xl space-y-0.5">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#B4A6C7] block">
                    Cycle Day
                  </span>
                  <span className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C084FC]" />
                    Day 14
                  </span>
                </div>
              </motion.div>

              {/* Overlay 2: Symptom Cramps Moderate (Center-Left) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.35 }}
                animate={{ y: [3, -3, 3] }}
                className="absolute bottom-16 left-5 z-20"
              >
                <div className="px-3.5 py-2.5 rounded-2xl bg-[#10071A]/90 border border-[#FB7185]/40 backdrop-blur-xl shadow-2xl space-y-1">
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#FDA4AF] block">
                    Symptom
                  </span>
                  <div className="text-xs font-bold font-display text-white">
                    Cramps
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#FB7185] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-pulse" />
                    <span>Moderate</span>
                  </div>
                </div>
              </motion.div>

              {/* Overlay 3: Logged Today · 9:42 AM (Bottom-Right) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                animate={{ y: [-2, 2, -2] }}
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

          {/* ── RIGHT COLUMN: PMOSense Structured Symptom Interface (45%) ── */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={`p-6 sm:p-8 rounded-3xl bg-white/[0.05] border transition-all duration-300 backdrop-blur-2xl shadow-2xl relative ${
                isHovered
                  ? 'border-[#FB7185]/60 bg-white/[0.08] shadow-[0_0_40px_rgba(251,113,133,0.2)] -translate-y-1'
                  : 'border-white/15'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EDE4F7]/15 text-[#FB7185] flex items-center justify-center border border-[#FB7185]/30 shadow-inner">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display text-white">Symptom Logger</h3>
                    <span className="text-[10px] text-[#B4A6C7] font-mono">Entry ID: #SYM-0482</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#047857]/20 border border-[#047857]/40 text-[#34D399] text-[10px] font-bold font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Logged</span>
                </div>
              </div>

              {/* Data Fields */}
              <div className="space-y-4">
                {/* Cycle Context */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#C084FC]" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#B4A6C7] block">Cycle Status</span>
                      <span className="text-xs font-semibold text-white">Day 14 • Follicular Phase</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#FDA4AF] bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                    Cycle 28d
                  </span>
                </div>

                {/* Symptom Name & Interactive Severity Selector */}
                <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/12 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-[#FDA4AF] block">
                        Active Symptom
                      </span>
                      <h4 className="text-base font-bold font-display text-white">
                        Menstrual Cramps / Pelvic Pressure
                      </h4>
                    </div>
                    <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-white/10 border border-white/15" style={{ color: currentLevel.color }}>
                      {currentLevel.label} ({currentLevel.score}/5)
                    </span>
                  </div>

                  {/* Interactive Severity Pills */}
                  <div>
                    <span className="text-[10px] text-[#B4A6C7] block mb-1.5 font-medium">
                      Select Severity Intensity:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {severityLevels.map((lvl) => {
                        const isSelected = selectedSeverity === lvl.label;
                        return (
                          <button
                            key={lvl.label}
                            type="button"
                            onClick={() => setSelectedSeverity(lvl.label)}
                            className={`py-2 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white shadow-lg shadow-purple-950/40 ring-1 ring-[#FDA4AF]'
                                : 'bg-white/5 text-[#B4A6C7] hover:bg-white/10 hover:text-white border border-white/10'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#EDE4F7]/80 mt-2 italic">
                      "{currentLevel.desc}"
                    </p>
                  </div>
                </div>

                {/* Timestamp & Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-[#B4A6C7]">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#FDA4AF]" />
                    <span>Today · 9:42 AM</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">#PelvicComfort</span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px]">#Resting</span>
                  </div>
                </div>
              </div>

              {/* Clickable Expandable Longitudinal Explanation Drawer */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#FDA4AF] hover:text-white transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    How PMOSense structures this observation
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden pt-3 text-xs text-[#EDE4F7] leading-relaxed space-y-2"
                    >
                      <p>
                        Symptoms can be recorded alongside cycle information and other health data to build a more complete longitudinal picture.
                      </p>
                      <p className="text-[#B4A6C7] text-[11px]">
                        PMOSense organizes observations over consecutive cycles so you and your doctor can observe genuine endocrine patterns rather than isolated moments.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4. Non-Diagnostic Health Information Disclaimer Footer */}
        <div className="max-w-3xl mx-auto mt-12 p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 text-xs text-[#B4A6C7]">
          <ShieldCheck className="w-5 h-5 text-[#FB7185] shrink-0" />
          <p>
            <strong>Responsible AI Notice:</strong> Symptom recording is designed for personal wellness and longitudinal monitoring.
            PMOSense does not diagnose conditions, prescribe painkillers, or replace clinical consultations with your healthcare professional.
          </p>
        </div>
      </Container>
    </section>
  );
};
