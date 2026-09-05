import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDot,
  ShieldAlert,
  Zap,
  Info,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface OvaryStructureInfo {
  id: string;
  name: string;
  category: string;
  pinPos: { top: string; left: string };
  color: string;
  summary: string;
  scientificDetail: string;
  pcosContext: string;
}

const OVARY_STRUCTURES: OvaryStructureInfo[] = [
  {
    id: 'follicles',
    name: 'Antral & Primordial Follicles',
    category: 'Follicular Reserve',
    pinPos: { top: '38%', left: '42%' },
    color: '#FB7185',
    summary: 'Fluid-filled biological sacs containing developing oocytes.',
    scientificDetail:
      'In typical cycles, several follicles begin maturation each month, with one emerging as dominant. Granulosa cells within the follicle produce estradiol and support oocyte growth.',
    pcosContext:
      'Under altered hormonal signaling (elevated LH & anti-Müllerian hormone), multiple follicles halt maturation before dominant selection, creating a characteristic peripheral ring appearance.',
  },
  {
    id: 'cortex',
    name: 'Ovarian Cortex & Dense Stroma',
    category: 'Structural Matrix',
    pinPos: { top: '24%', left: '60%' },
    color: '#C084FC',
    summary: 'Outer cellular layer housing the ovarian reserve and thecal cells.',
    scientificDetail:
      'The cortex consists of dense collagenous connective tissue and specialized theca cells that synthesize steroid hormone precursors in response to pituitary signaling.',
    pcosContext:
      'In PMOS, the ovarian stroma often becomes hypertrophic (thicker and denser), increasing the overall ovarian volume beyond the normal 10 cm³ threshold.',
  },
  {
    id: 'vascular-medulla',
    name: 'Vascular Medulla & Blood Supply',
    category: 'Micro-Circulation',
    pinPos: { top: '56%', left: '68%' },
    color: '#FDA4AF',
    summary: 'Rich neurovascular core delivering oxygen, nutrients, and endocrine signals.',
    scientificDetail:
      'Spiral ovarian arteries and veins form a dense plexus within the medulla, enabling rapid exchange of circulating hormones between the ovary and systemic circulation.',
    pcosContext:
      'Increased stromal vascularity and altered pulsatility index are frequently observed in polycystic ovarian morphology during Doppler ultrasound evaluation.',
  },
  {
    id: 'hormone-receptors',
    name: 'LH / FSH Endocrine Receptors',
    category: 'Signaling Axis',
    pinPos: { top: '64%', left: '38%' },
    color: '#E879F9',
    summary: 'Biochemical docking sites responsive to luteinizing hormone and FSH.',
    scientificDetail:
      'Luteinizing hormone (LH) binds thecal cell receptors to stimulate androgen production, while follicle-stimulating hormone (FSH) binds granulosa cells to aromatize androgens into estrogen.',
    pcosContext:
      'An elevated LH-to-FSH ratio (often 2:1 or higher) stimulates excessive thecal androgen output without sufficient FSH to mature the follicle to ovulation.',
  },
];

type PatternMode = 'normal' | 'pcos';

interface OvulationStep {
  stepNumber: number;
  label: string;
  normalTitle: string;
  normalDesc: string;
  pcosTitle: string;
  pcosDesc: string;
  normalVisualCues: string;
  pcosVisualCues: string;
}

const OVULATION_STEPS: OvulationStep[] = [
  {
    stepNumber: 1,
    label: 'Early Follicular Phase',
    normalTitle: 'Follicles Begin Developing',
    normalDesc:
      'A cohort of small fluid-filled follicles begins maturing in response to pituitary FSH signals. Each follicle houses an immature egg (oocyte).',
    pcosTitle: 'Multiple Follicles Recruited',
    pcosDesc:
      'Similarly, multiple small follicles start to develop within the ovarian cortex. The reserve of follicles is frequently abundant.',
    normalVisualCues: '4–6 small follicles growing uniformly within the ovarian stroma.',
    pcosVisualCues: '10–20+ tiny follicles recruited simultaneously along the cortex periphery.',
  },
  {
    stepNumber: 2,
    label: 'Selection & Maturation',
    normalTitle: 'One Follicle Becomes Dominant',
    normalDesc:
      'Under balanced hormonal communication, one single follicle outgrows all others (reaching 18–22 mm). The remaining smaller follicles naturally regress (atresia).',
    pcosTitle: 'Follicles Stop Developing Normally',
    pcosDesc:
      'Due to elevated LH pulse frequency, altered insulin, or local anti-Müllerian hormone (AMH) signals, the follicles halt maturation before any single follicle becomes dominant.',
    normalVisualCues: 'One large prominent dominant follicle emerges; smaller follicles recede.',
    pcosVisualCues: 'Multiple small follicles (2–9 mm) remain paused; no dominant follicle emerges.',
  },
  {
    stepNumber: 3,
    label: 'Ovulation Outcome',
    normalTitle: 'Ovulation Occurs',
    normalDesc:
      'A sharp LH surge causes the dominant follicle to rupture, releasing a mature egg into the fallopian tube. The remaining structure forms the corpus luteum, producing progesterone.',
    pcosTitle: 'Multiple Small Follicles Remain (Ovulation Paused)',
    pcosDesc:
      'Without a dominant follicle or clear hormonal surge, multiple small follicles remain in a paused state. Ovulation may happen less regularly or be delayed for weeks to months.',
    normalVisualCues: 'Release of mature egg into fallopian tube, followed by cyclical progesterone rise.',
    pcosVisualCues: 'Paused follicles persist along the periphery; progesterone rise is delayed or absent.',
  },
];

export const OvaryVisualizationSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ovulation-concept' | 'anatomy'>('ovulation-concept');
  const [selectedStructureId, setSelectedStructureId] = useState<string>(OVARY_STRUCTURES[0].id);

  // Ovulation interactive state
  const [patternMode, setPatternMode] = useState<PatternMode>('normal');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showAccessibleTranscript, setShowAccessibleTranscript] = useState<boolean>(false);

  const activeStructure =
    OVARY_STRUCTURES.find((s) => s.id === selectedStructureId) || OVARY_STRUCTURES[0];

  const currentStep = OVULATION_STEPS[activeStepIndex];

  return (
    <section
      id="the-ovary"
      className="relative min-h-screen py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10 flex items-center select-none"
      aria-labelledby="ovary-section-heading"
    >
      {/* Background Volumetric Lighting & Glows */}
      <div className="absolute top-1/4 left-1/3 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#8E3EAF]/22 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <CircleDot className="w-3.5 h-3.5 text-[#FB7185] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Interactive Learning Layer
            </span>
          </div>

          <h2
            id="ovary-section-heading"
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display"
          >
            How Ovaries Work & What Changes in{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              PMOS
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            Compare the normal ovulatory cycle against the PMOS-related pattern, or explore
            microscopic anatomical structures.
          </p>

          {/* Primary View Switcher: Ovulation Pattern vs Anatomy */}
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('ovulation-concept')}
              aria-pressed={activeTab === 'ovulation-concept'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ovulation-concept'
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] text-white shadow-lg'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ovulation Cycle Comparison</span>
            </button>
            <button
              onClick={() => setActiveTab('anatomy')}
              aria-pressed={activeTab === 'anatomy'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'anatomy'
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] text-white shadow-lg'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Microscopic Anatomy Hotspots</span>
            </button>
          </div>
        </div>

        {/* ── TAB 1: OVULATION CYCLE COMPARISON (NORMAL VS PCOS-DISRUPTED) ── */}
        {activeTab === 'ovulation-concept' && (
          <div className="space-y-8">
            {/* Pattern Mode Toggle Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-[#1C0D2E]/80 border border-white/15 backdrop-blur-xl shadow-xl max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[#A797BD]">
                  Select Biological Pattern:
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setPatternMode('normal')}
                  aria-pressed={patternMode === 'normal'}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    patternMode === 'normal'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-lg shadow-emerald-950/40'
                      : 'bg-white/5 text-[#B4A6C7] border border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Normal Ovulatory Cycle</span>
                </button>

                <button
                  onClick={() => setPatternMode('pcos')}
                  aria-pressed={patternMode === 'pcos'}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    patternMode === 'pcos'
                      ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] text-white border border-[#FB7185]/40 shadow-lg shadow-purple-950/40'
                      : 'bg-white/5 text-[#B4A6C7] border border-white/10 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>PMOS-Related Pattern</span>
                </button>
              </div>
            </div>

            {/* Interactive Step Navigator */}
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/5 border border-white/10">
              {OVULATION_STEPS.map((s, idx) => (
                <button
                  key={s.stepNumber}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeStepIndex === idx
                      ? 'bg-white/15 text-white border border-white/20 shadow-md'
                      : 'text-[#A797BD] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      activeStepIndex === idx
                        ? patternMode === 'normal'
                          ? 'bg-emerald-400 text-black'
                          : 'bg-[#FB7185] text-black'
                        : 'bg-white/10 text-white'
                    }`}
                  >
                    {s.stepNumber}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Central Visual & Detailed Step Narrative Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
              {/* Visual Interactive Stage Canvas */}
              <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
                <div className="relative w-full aspect-square max-w-[440px] rounded-[36px] overflow-hidden bg-gradient-to-b from-[#180A26] via-[#12071F] to-[#0A0313] border border-white/15 shadow-2xl p-6 flex flex-col items-center justify-center">
                  {/* Atmospheric Glow */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-colors duration-700"
                    style={{
                      background:
                        patternMode === 'normal'
                          ? 'radial-gradient(circle at 50% 50%, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.1) 50%, transparent 80%)'
                          : 'radial-gradient(circle at 50% 50%, rgba(251, 113, 133, 0.28) 0%, rgba(142, 62, 175, 0.2) 50%, transparent 80%)',
                    }}
                  />

                  {/* Stylized Biological Ovary Canvas with Follicular States */}
                  <div className="relative w-64 h-64 rounded-full border-2 border-white/20 bg-[#1C0D2E]/60 backdrop-blur-md flex items-center justify-center shadow-inner">
                    {/* Central Stroma Core */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6E2D8B]/50 to-[#E87084]/40 blur-md" />

                    {/* Dynamic Follicles Rendering Based on Pattern and Step */}
                    {patternMode === 'normal' ? (
                      <>
                        {/* Normal Step 1: 4-5 Small Follicles */}
                        {activeStepIndex === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[0, 72, 144, 216, 288].map((deg, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute w-5 h-5 rounded-full bg-emerald-300 border-2 border-white/80 shadow-[0_0_12px_#34D399]"
                                style={{
                                  transform: `rotate(${deg}deg) translate(85px) rotate(-${deg}deg)`,
                                }}
                              />
                            ))}
                            <span className="text-[10px] font-mono text-emerald-300 font-bold bg-black/60 px-2 py-0.5 rounded-full z-10">
                              Cohort Maturing
                            </span>
                          </div>
                        )}

                        {/* Normal Step 2: One Dominant Follicle emerges, others shrink */}
                        {activeStepIndex === 1 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {/* Dominant Follicle */}
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: [1, 1.08, 1] }}
                              transition={{ duration: 2.5, repeat: Infinity }}
                              className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-200 border-2 border-white shadow-[0_0_24px_#34D399] flex items-center justify-center text-center p-1"
                            >
                              <span className="text-[9px] font-bold text-black leading-tight">
                                Dominant Follicle
                              </span>
                            </motion.div>

                            {/* Smaller Regressing Follicles */}
                            {[110, 170, 230].map((deg, i) => (
                              <div
                                key={i}
                                className="absolute w-3 h-3 rounded-full bg-emerald-600/40 border border-white/20"
                                style={{
                                  transform: `rotate(${deg}deg) translate(80px) rotate(-${deg}deg)`,
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Normal Step 3: Ovulation - Egg Released */}
                        {activeStepIndex === 2 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {/* Bursting / Releasing Egg */}
                            <motion.div
                              animate={{ y: [-10, -25, -10], opacity: [0.9, 1, 0.9] }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                            >
                              <div className="w-7 h-7 rounded-full bg-white border-2 border-emerald-300 shadow-[0_0_20px_white] animate-pulse" />
                              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-black/70 px-2 py-0.5 rounded-full">
                                Mature Egg Released
                              </span>
                            </motion.div>

                            {/* Remaining Corpus Luteum */}
                            <div className="absolute top-2 w-10 h-10 rounded-full bg-amber-400/70 border border-white/50 shadow-md flex items-center justify-center text-[8px] text-black font-bold">
                              Corpus Luteum
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* PCOS Step 1: Abundant small follicles */}
                        {activeStepIndex === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute w-3.5 h-3.5 rounded-full bg-[#FB7185] border border-white/60 shadow-[0_0_8px_#FB7185]"
                                style={{
                                  transform: `rotate(${deg}deg) translate(95px) rotate(-${deg}deg)`,
                                }}
                              />
                            ))}
                            <span className="text-[10px] font-mono text-[#FB7185] font-bold bg-black/60 px-2 py-0.5 rounded-full z-10">
                              Abundant Follicles Recruited
                            </span>
                          </div>
                        )}

                        {/* PCOS Step 2: Follicles halt maturation, no dominant follicle */}
                        {activeStepIndex === 1 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                              (deg, i) => (
                                <div
                                  key={i}
                                  className="absolute w-4 h-4 rounded-full bg-[#E879F9]/80 border border-white/50 shadow-[0_0_6px_#C084FC]"
                                  style={{
                                    transform: `rotate(${deg}deg) translate(95px) rotate(-${deg}deg)`,
                                  }}
                                />
                              )
                            )}
                            <div className="text-center z-10 bg-black/80 p-2 rounded-2xl border border-white/15 max-w-[130px]">
                              <span className="text-[10px] font-mono text-[#FDA4AF] font-bold block leading-tight">
                                Maturation Halted
                              </span>
                              <span className="text-[8px] text-[#C5B5D5]">
                                No single dominant follicle selected
                              </span>
                            </div>
                          </div>
                        )}

                        {/* PCOS Step 3: Multiple small follicles remain, ovulation paused */}
                        {activeStepIndex === 2 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                              (deg, i) => (
                                <motion.div
                                  key={i}
                                  animate={{ opacity: [0.6, 1, 0.6] }}
                                  transition={{ duration: 2.5, delay: i * 0.1, repeat: Infinity }}
                                  className="absolute w-4 h-4 rounded-full bg-[#FB7185]/90 border border-white shadow-[0_0_8px_#FB7185]"
                                  style={{
                                    transform: `rotate(${deg}deg) translate(95px) rotate(-${deg}deg)`,
                                  }}
                                />
                              )
                            )}
                            <div className="text-center z-10 bg-black/85 p-2.5 rounded-2xl border border-[#FB7185]/30 max-w-[140px]">
                              <span className="text-[10px] font-mono text-[#FB7185] font-bold block leading-tight">
                                Paused Small Follicles
                              </span>
                              <span className="text-[8px] text-[#EDE4F7]">
                                Ovulation paused or delayed
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Badge */}
                  <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[10px] font-mono text-white">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: patternMode === 'normal' ? '#34D399' : '#FB7185' }}
                    />
                    <span>
                      {patternMode === 'normal' ? 'BALANCED HORMONAL PULSES' : 'ALTERED HORMONAL SIGNALS'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step Explanation Card & Step Controls */}
              <div className="lg:col-span-6 space-y-5 text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${patternMode}-${activeStepIndex}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-3 py-1 rounded-full bg-white/10 text-[#D8B4FE]">
                        Step {currentStep.stepNumber} of 3 — {currentStep.label}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                          patternMode === 'normal'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-[#FB7185]/20 text-[#FB7185]'
                        }`}
                      >
                        {patternMode === 'normal' ? 'Normal Cycle' : 'PMOS Pattern'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                      {patternMode === 'normal' ? currentStep.normalTitle : currentStep.pcosTitle}
                    </h3>

                    <p className="text-sm text-[#EDE4F7] leading-relaxed font-sans">
                      {patternMode === 'normal' ? currentStep.normalDesc : currentStep.pcosDesc}
                    </p>

                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#FDA4AF] font-bold block">
                        Visual Illustration Guide
                      </span>
                      <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                        {patternMode === 'normal'
                          ? currentStep.normalVisualCues
                          : currentStep.pcosVisualCues}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Step Forward / Back Controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    disabled={activeStepIndex === 0}
                    onClick={() => setActiveStepIndex((c) => Math.max(0, c - 1))}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous Step</span>
                  </button>

                  <button
                    disabled={activeStepIndex === OVULATION_STEPS.length - 1}
                    onClick={() =>
                      setActiveStepIndex((c) => Math.min(OVULATION_STEPS.length - 1, c + 1))
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Accessible Transcript Accordion (for screen readers and users who prefer text) */}
            <div className="max-w-4xl mx-auto pt-4">
              <button
                onClick={() => setShowAccessibleTranscript((curr) => !curr)}
                aria-expanded={showAccessibleTranscript}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-[#EDE4F7] hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#FB7185]" />
                  <span>View Complete Accessible Text Transcript of Ovulation Biology</span>
                </div>
                <span className="text-[11px] text-[#A797BD]">
                  {showAccessibleTranscript ? 'Hide' : 'Show Details'}
                </span>
              </button>

              {showAccessibleTranscript && (
                <div className="mt-3 p-6 rounded-3xl bg-[#180A26]/90 border border-white/10 text-xs sm:text-sm text-[#CDBDD8] space-y-4 font-sans text-left">
                  <h4 className="text-base font-bold text-white font-display">
                    Educational Summary: Normal Ovulation vs PMOS-Related Pattern
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20">
                      <strong className="text-emerald-300 font-bold block">
                        Normal Ovulatory Cycle Flow:
                      </strong>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#EDE4F7]">
                        <li>
                          <strong>Follicles develop:</strong> FSH from the pituitary prompts several
                          follicles to begin maturing simultaneously.
                        </li>
                        <li>
                          <strong>Dominant follicle selected:</strong> One follicle outgrows the
                          rest, producing estrogen while other follicles regress.
                        </li>
                        <li>
                          <strong>Ovulation occurs:</strong> The mature egg is released upon an LH
                          surge, leaving a corpus luteum that produces progesterone.
                        </li>
                      </ol>
                    </div>

                    <div className="space-y-2 p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20">
                      <strong className="text-[#FB7185] font-bold block">
                        PMOS-Related Pattern:
                      </strong>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#EDE4F7]">
                        <li>
                          <strong>Multiple follicles start:</strong> An abundant reserve of follicles
                          is initially recruited in the ovary.
                        </li>
                        <li>
                          <strong>Maturation halts:</strong> Altered LH pulses or local signaling
                          prevent any single follicle from reaching full dominant size.
                        </li>
                        <li>
                          <strong>Follicles remain, ovulation delayed:</strong> Multiple small
                          unruptured follicles (2–9 mm) persist along the cortex, causing ovulation to
                          occur irregularly or pause.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: MICROSCOPIC ANATOMICAL STRUCTURES ── */}
        {activeTab === 'anatomy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left / Central Ovary Model Canvas */}
            <div className="lg:col-span-7 relative flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[540px] aspect-square rounded-[36px] overflow-hidden bg-gradient-to-b from-[#180A26] via-[#12071F] to-[#0A0313] border border-white/15 shadow-[0_0_80px_rgba(110,45,139,0.4)] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, rgba(232, 112, 132, 0.3) 0%, rgba(142, 62, 175, 0.25) 45%, transparent 80%)',
                  }}
                />

                {/* Central Ovary Visual */}
                <motion.div
                  animate={{
                    scale: [1, 1.025, 1],
                    rotate: [0, 1, -1, 0],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <img
                    src="/translucent-ovary-macro.jpg"
                    alt="Translucent Macro Biological Ovary with Follicles"
                    className="w-full h-full object-contain select-none filter contrast-[1.08]"
                    style={{
                      maskImage:
                        'radial-gradient(circle at 50% 50%, black 72%, rgba(0,0,0,0.85) 85%, transparent 98%)',
                      WebkitMaskImage:
                        'radial-gradient(circle at 50% 50%, black 72%, rgba(0,0,0,0.85) 85%, transparent 98%)',
                    }}
                  />

                  {/* Hotspots */}
                  {OVARY_STRUCTURES.map((struct) => {
                    const isSelected = selectedStructureId === struct.id;
                    return (
                      <div
                        key={struct.id}
                        style={{ top: struct.pinPos.top, left: struct.pinPos.left }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                      >
                        <button
                          onClick={() => setSelectedStructureId(struct.id)}
                          className={`group relative flex items-center justify-center cursor-pointer transition-transform duration-300 ${
                            isSelected ? 'scale-125' : 'hover:scale-115'
                          }`}
                          aria-label={`Explore ${struct.name}`}
                        >
                          <span
                            className={`absolute w-9 h-9 rounded-full ${
                              isSelected ? 'animate-ping opacity-75' : 'opacity-0 group-hover:opacity-50'
                            }`}
                            style={{ backgroundColor: struct.color }}
                          />
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all ${
                              isSelected
                                ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.9)] text-black'
                                : 'bg-[#180A26]/80 border-white/40 text-white hover:border-white'
                            }`}
                          >
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: struct.color }}
                            />
                          </span>
                          <span
                            className={`hidden md:block absolute left-8 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase transition-all duration-200 ${
                              isSelected
                                ? 'bg-white text-[#10071A] shadow-xl border border-white'
                                : 'bg-[#10071A]/85 text-[#EDE4F7] border border-white/20 group-hover:border-[#FB7185]'
                            }`}
                          >
                            {struct.name.split('&')[0]}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </motion.div>

                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-mono text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-ping" />
                  <span>ORGANIC ENDOCRINE CORE</span>
                </div>
              </div>
            </div>

            {/* Right / Structure Info */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <div className="flex flex-wrap gap-2">
                {OVARY_STRUCTURES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStructureId(s.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      s.id === selectedStructureId
                        ? 'bg-white text-[#10071A] shadow-md font-bold'
                        : 'bg-white/5 border border-white/10 text-[#B4A6C7] hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {s.name.split('&')[0]}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStructure.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="p-6 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                        style={{ backgroundColor: activeStructure.color }}
                      />
                      <h3 className="text-xl font-bold font-display text-white">
                        {activeStructure.name}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
                      {activeStructure.category}
                    </span>
                  </div>

                  <p className="text-sm text-white/90 font-medium leading-relaxed">
                    {activeStructure.summary}
                  </p>

                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#FDA4AF] font-bold block flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-[#FB7185]" />
                      Physiological Function
                    </span>
                    <p className="text-xs text-[#C5B5D5] leading-relaxed">
                      {activeStructure.scientificDetail}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#E879F9] font-bold block flex items-center gap-1.5">
                      <Info className="w-3 h-3 text-[#E879F9]" />
                      Pattern in PMOS
                    </span>
                    <p className="text-xs text-[#EDE4F7] leading-relaxed font-sans">
                      {activeStructure.pcosContext}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Non-Diagnostic & Educational Safety Banner ── */}
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5 max-w-4xl mx-auto text-left">
          <ShieldAlert className="w-5 h-5 text-[#FB7185] shrink-0 mt-0.5" />
          <div className="text-xs text-[#B4A6C7] leading-relaxed font-sans">
            <strong className="text-white block font-semibold mb-0.5">
              Educational Illustration Only:
            </strong>
            This 3D and dynamic model is a simplified conceptual tool designed to help you visualize biological
            mechanisms. It is not an ultrasound scanner, does not interpret diagnostic imaging, and cannot diagnose PMOS / PCOS.
            Clinical evaluations must always be performed by a licensed physician using validated diagnostic criteria.
          </div>
        </div>
      </Container>
    </section>
  );
};
