import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Activity,
  UserCheck,
  BrainCircuit,
  Zap,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const PathwayIntelligenceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'womens' | 'mens' | 'baseline'>('womens');

  return (
    <section
      id="pathway-intelligence"
      className="py-24 sm:py-32 bg-[#10071A] text-white border-t border-white/10 relative overflow-hidden select-none"
      aria-labelledby="pathway-intelligence-title"
    >
      {/* Volumetric Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#8E3EAF]/18 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#0284C7]/15 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Deep Biological Mapping
            </span>
          </div>

          <h2
            id="pathway-intelligence-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight"
          >
            Pathway-Specific{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#38BDF8] bg-clip-text text-transparent">
              Biological Intelligence
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed font-sans">
            Explore how VITASense AI models the unique physiology of each pathway—from ovarian cycle
            dynamics to the brain-testes hormonal axis.
          </p>

          {/* Interactive Pathway Switcher Pills */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('womens')}
              aria-pressed={activeTab === 'womens'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'womens'
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185] text-white shadow-lg shadow-purple-950/40'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Women's Health (PCOS)</span>
            </button>

            <button
              onClick={() => setActiveTab('mens')}
              aria-pressed={activeTab === 'mens'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mens'
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#6366F1] text-white shadow-lg shadow-sky-950/40'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Men's Health (Hypogonadism)</span>
            </button>

            <button
              onClick={() => setActiveTab('baseline')}
              aria-pressed={activeTab === 'baseline'}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'baseline'
                  ? 'bg-gradient-to-r from-[#6E2D8B] to-[#C084FC] text-white shadow-lg shadow-purple-950/40'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>General Health Baseline</span>
            </button>
          </div>
        </div>

        {/* Dynamic Interactive Biological Content Panel */}
        <AnimatePresence mode="wait">
          {/* TAB 1: WOMEN'S HEALTH (PCOS & OVARIAN CYCLE) */}
          {activeTab === 'womens' && (
            <motion.div
              key="womens"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto"
            >
              {/* Visual Card */}
              <div className="lg:col-span-6 p-8 rounded-[36px] bg-gradient-to-b from-[#1F0D33] to-[#12071F] border border-[#FB7185]/30 shadow-2xl flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative w-full rounded-2xl overflow-hidden bg-[#180A28]/80 border border-[#FB7185]/20 p-2 shadow-inner group">
                  {/* Ambient backdrop glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#8E3EAF]/15 via-transparent to-[#FB7185]/15 pointer-events-none" />
                  <picture>
                    <source srcSet="/ovary-follicle-development-dark.webp" type="image/webp" />
                    <img
                      src="/ovary-follicle-development-dark.png"
                      alt="Anatomical cross-section of the ovary showing stages of follicle development, ovulation, and corpus luteum formation"
                      className="w-full h-auto object-contain rounded-xl drop-shadow-[0_0_16px_rgba(251,113,133,0.25)] transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </picture>
                  <div className="absolute top-3 left-3 bg-[#10071A]/85 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-[#F3E8FF] flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-pulse" />
                    <span>Follicle Maturation Progression</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#FB7185] font-bold">
                    Women's Pathway Model
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    Follicular & Cycle Signal Dynamics
                  </h3>
                  <p className="text-xs text-[#CDBDD8] max-w-sm mx-auto">
                    Analyzes antral follicle density, ovarian stromal volume, LH-to-FSH biomarker ratios, and cycle length variations.
                  </p>
                </div>
              </div>

              {/* Biomarkers & Clinical Context */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#FB7185] font-bold flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    Key Tracked Biomarkers & Features
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#EDE4F7]">
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Cycle Length Variations</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• LH / FSH Hormone Ratio</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Antral Follicle Count</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Total & Free Testosterone</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Hirsutism & Acne Grading</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Fasting Glucose & Insulin</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E879F9] font-bold flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Explainable Model Output
                  </span>
                  <p className="text-xs text-[#EDE4F7] leading-relaxed">
                    Evaluates multi-marker interactions under Rotterdam consensus guidelines to estimate
                    PCOS risk patterns without black-box conclusions.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: MEN'S HEALTH (HYPOGONADISM & HPT AXIS) */}
          {activeTab === 'mens' && (
            <motion.div
              key="mens"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto"
            >
              {/* Visual Card */}
              <div className="lg:col-span-6 p-8 rounded-[36px] bg-gradient-to-b from-[#0B1E3B] to-[#0A1020] border border-[#38BDF8]/30 shadow-2xl flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative w-full rounded-2xl overflow-hidden bg-[#0A1528]/80 border border-[#38BDF8]/20 p-6 shadow-inner group flex items-center justify-center min-h-[220px]">
                  {/* Ambient backdrop glow */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#0284C7]/15 via-transparent to-[#6366F1]/15 pointer-events-none" />
                  
                  <picture className="relative z-10 flex items-center justify-center">
                    <source srcSet="/male-hypogonadism-symbol-dark.webp" type="image/webp" />
                    <img
                      src="/male-hypogonadism-symbol-dark.png"
                      alt="Male hypogonadism and testosterone signaling physiological symbol"
                      className="w-44 h-44 object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.35)] transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </picture>

                  <div className="absolute top-3 left-3 bg-[#071324]/85 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-[#E0F2FE] flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
                    <span>Androgen Signaling & HPT Axis</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#38BDF8] font-bold">
                    Men's Pathway Model
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    HPT Axis Signaling & Morning Timing
                  </h3>
                  <p className="text-xs text-[#CDBDD8] max-w-sm mx-auto">
                    Models the hypothalamic-pituitary-testicular feedback loop, morning circadian rhythm curves, and symptoms.
                  </p>
                </div>
              </div>

              {/* Biomarkers & Clinical Context */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Key Tracked Biomarkers & Features
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#EDE4F7]">
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Morning Total Testosterone</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Luteinizing Hormone (LH)</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Follicle-Stimulating (FSH)</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Daytime Energy Logs</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Libido & Sexual Wellness</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Sleep & Shift Work Timing</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#0284C7]/20 border border-[#0284C7]/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Circadian Timing Awareness
                  </span>
                  <p className="text-xs text-[#EDE4F7] leading-relaxed">
                    Understands that testosterone follows a 24-hour diurnal cycle (peaks 7:00–10:00 AM) and
                    requires multiple morning confirmations before clinical diagnosis.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: GENERAL HEALTH BASELINE */}
          {activeTab === 'baseline' && (
            <motion.div
              key="baseline"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto"
            >
              {/* Visual Card */}
              <div className="lg:col-span-6 p-8 rounded-[36px] bg-gradient-to-b from-[#1C1030] to-[#0F081C] border border-[#C084FC]/30 shadow-2xl flex flex-col items-center justify-center space-y-6 text-center">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#6E2D8B] to-[#C084FC] flex items-center justify-center shadow-xl border border-white/20">
                  <UserCheck className="w-14 h-14 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#C084FC] font-bold">
                    General Health Baseline
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    Proactive Literacy & Verification
                  </h3>
                  <p className="text-xs text-[#CDBDD8] max-w-sm mx-auto">
                    For individuals without active symptoms who want to organize lab records, understand their metrics, and track health over time.
                  </p>
                </div>
              </div>

              {/* Biomarkers & Clinical Context */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C084FC] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Universal Baseline Tracking
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#EDE4F7]">
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Routine Metabolic Panels</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Sleep & Stress Dynamics</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Paper Report OCR Storage</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Annual Checkup Readiness</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Health Literacy Education</span>
                    <span className="p-2 rounded-xl bg-white/5 border border-white/5">• Longitudinal Trend Lines</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8B4FE] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Non-Alarming Philosophy
                  </span>
                  <p className="text-xs text-[#EDE4F7] leading-relaxed">
                    Understand your body before you ignore the signals. You don't have to be sick to take
                    charge of your health records.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
};
