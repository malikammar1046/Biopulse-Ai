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
      className="py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#F7F9FD] text-[#162A45] border-t border-slate-200/80 relative overflow-hidden select-none"
      aria-labelledby="pathway-intelligence-title"
    >
      {/* Volumetric Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sky-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-[#0891B2]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              Deep Biological Mapping
            </span>
          </div>

          <h2
            id="pathway-intelligence-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
          >
            Pathway-Specific{' '}
            <span className="text-[#0891B2]">
              Biological Intelligence
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            Explore how BIOPulse AI models the unique physiology of each pathway—from ovarian cycle
            dynamics to the brain-testes hormonal axis.
          </p>

          {/* Interactive Pathway Switcher Pills */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-slate-100 border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setActiveTab('womens')}
              aria-pressed={activeTab === 'womens'}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'womens'
                  ? 'bg-[#E11D48] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Women's Health (PCOS)</span>
            </button>

            <button
              onClick={() => setActiveTab('mens')}
              aria-pressed={activeTab === 'mens'}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mens'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Men's Health (Hypogonadism)</span>
            </button>

            <button
              onClick={() => setActiveTab('baseline')}
              aria-pressed={activeTab === 'baseline'}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'baseline'
                  ? 'bg-[#0891B2] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
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
              <div className="lg:col-span-6 p-8 rounded-[36px] bg-gradient-to-b from-[#FFF0F5] to-[#FFE8F0] border border-pink-200/90 shadow-xl flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative w-full rounded-2xl overflow-hidden bg-white/90 border border-pink-200/80 p-2 shadow-inner group">
                  <picture>
                    <source srcSet="/ovary-follicle-development-dark.webp" type="image/webp" />
                    <img
                      src="/ovary-follicle-development-dark.png"
                      alt="Anatomical cross-section of the ovary showing stages of follicle development, ovulation, and corpus luteum formation"
                      className="w-full h-auto object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </picture>
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-pink-200 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-[#E11D48] flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
                    <span>Follicle Maturation Progression</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#E11D48] font-bold">
                    Women's Pathway Model
                  </span>
                  <h3 className="text-xl font-bold font-display text-[#162A45]">
                    Follicular &amp; Cycle Signal Dynamics
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                    Analyzes antral follicle density, ovarian stromal volume, LH-to-FSH biomarker ratios, and cycle length variations.
                  </p>
                </div>
              </div>

              {/* Biomarkers & Clinical Context */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#E11D48] font-bold flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    Key Tracked Biomarkers &amp; Features
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    <span className="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">• Cycle Length Variations</span>
                    <span className="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">• LH / FSH Hormone Ratio</span>
                    <span className="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">• Antral Follicle Count</span>
                    <span className="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">• Total &amp; Free Testosterone</span>
                    <span className="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">• Hirsutism &amp; Acne Grading</span>
                    <span className="p-2.5 rounded-xl bg-pink-50/60 border border-pink-100">• Fasting Glucose &amp; Insulin</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-pink-50/80 border border-pink-200/80 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#E11D48] font-bold flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Explainable Model Output
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
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
              <div className="lg:col-span-6 p-8 rounded-[36px] bg-gradient-to-b from-[#F0F9FF] to-[#E0F2FE] border border-sky-200/90 shadow-xl flex flex-col items-center justify-center space-y-6 text-center">
                <div className="relative w-full rounded-2xl overflow-hidden bg-white/90 border border-sky-200/80 p-6 shadow-inner group flex items-center justify-center min-h-[220px]">
                  <picture className="relative z-10 flex items-center justify-center">
                    <source srcSet="/male-hypogonadism-symbol-dark.webp" type="image/webp" />
                    <img
                      src="/male-hypogonadism-symbol-dark.png"
                      alt="Male hypogonadism and testosterone signaling physiological symbol"
                      className="w-44 h-44 object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </picture>

                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md border border-sky-200 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-[#0284C7] flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-pulse" />
                    <span>Androgen Signaling &amp; HPT Axis</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#0284C7] font-bold">
                    Men's Pathway Model
                  </span>
                  <h3 className="text-xl font-bold font-display text-[#162A45]">
                    HPT Axis Signaling &amp; Morning Timing
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                    Models the hypothalamic-pituitary-testicular feedback loop, morning circadian rhythm curves, and symptoms.
                  </p>
                </div>
              </div>

              {/* Biomarkers & Clinical Context */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0284C7] font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Key Tracked Biomarkers &amp; Features
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    <span className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">• Morning Total Testosterone</span>
                    <span className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">• Luteinizing Hormone (LH)</span>
                    <span className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">• Follicle-Stimulating (FSH)</span>
                    <span className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">• Daytime Energy Logs</span>
                    <span className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">• Libido &amp; Sexual Wellness</span>
                    <span className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100">• Sleep &amp; Shift Work Timing</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-sky-50/80 border border-sky-200/80 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#0284C7] font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Circadian Timing Awareness
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
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
              <div className="lg:col-span-6 p-8 rounded-[36px] bg-gradient-to-b from-[#F0FDF4] to-[#E6F4EA] border border-emerald-200/90 shadow-xl flex flex-col items-center justify-center space-y-6 text-center">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#0891B2] to-[#059669] flex items-center justify-center shadow-lg border border-white/40">
                  <UserCheck className="w-14 h-14 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#059669] font-bold">
                    General Health Baseline
                  </span>
                  <h3 className="text-xl font-bold font-display text-[#162A45]">
                    Proactive Literacy &amp; Verification
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                    For individuals without active symptoms who want to organize lab records, understand their metrics, and track health over time.
                  </p>
                </div>
              </div>

              {/* Biomarkers & Clinical Context */}
              <div className="lg:col-span-6 space-y-4 text-left">
                <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-md space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#059669] font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Universal Baseline Tracking
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                    <span className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">• Routine Metabolic Panels</span>
                    <span className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">• Sleep &amp; Stress Dynamics</span>
                    <span className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">• Paper Report OCR Storage</span>
                    <span className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">• Annual Checkup Readiness</span>
                    <span className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">• Health Literacy Education</span>
                    <span className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">• Longitudinal Trend Lines</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#059669] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Non-Alarming Philosophy
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
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
