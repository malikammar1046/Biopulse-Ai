import React from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, AlertCircle, Calendar, Activity, FileText, HeartPulse } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const ProblemSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#FAFCFF] text-[#162A45] overflow-hidden border-t border-slate-200/80">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-50/60 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-[#E11D48] shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>The Everyday Health Challenge</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            Reproductive health data is{' '}
            <span className="text-[#E11D48]">
              fragmented.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal max-w-2xl mx-auto">
            Whether tracking menstrual cycle irregularity, pelvic ultrasound scans, morning testosterone labs, or subtle shifts in daily vitality,
            scattered data across separate portals and paper slips obscures the full clinical picture.
          </p>
        </div>

        {/* Scattered Fragments Visual Arena */}
        <div className="relative min-h-[380px] sm:min-h-[440px] rounded-3xl bg-slate-50/80 border border-slate-200/90 p-8 sm:p-12 flex items-center justify-center overflow-hidden shadow-inner">
          {/* Faint Disconnected Dotted Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {/* Fragment 1: Cycle (Top Left Drift) */}
          <motion.div
            animate={{
              x: [-6, 6, -6],
              y: [-8, 8, -8],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 left-6 sm:left-16 p-4 sm:p-5 rounded-2xl bg-white/95 border border-pink-200/90 backdrop-blur-md max-w-[210px] shadow-lg shadow-pink-100/50"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#E11D48]">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Cycle Log</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Day 42 • Isolated period dates without hormonal or metabolic context.
            </p>
          </motion.div>

          {/* Fragment 2: Morning Hormone Lab (Top Right Drift) */}
          <motion.div
            animate={{
              x: [8, -8, 8],
              y: [-6, 6, -6],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-8 right-6 sm:right-20 p-4 sm:p-5 rounded-2xl bg-white/95 border border-sky-200/90 backdrop-blur-md max-w-[220px] shadow-lg shadow-sky-100/50"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#0284C7]">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Morning Hormone Lab</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Testosterone panel sitting in an isolated clinic envelope without clinical context.
            </p>
          </motion.div>

          {/* Fragment 3: Symptoms (Bottom Left Drift) */}
          <motion.div
            animate={{
              x: [-7, 7, -7],
              y: [6, -6, 6],
            }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-10 left-8 sm:left-24 p-4 sm:p-5 rounded-2xl bg-white/95 border border-purple-200/90 backdrop-blur-md max-w-[210px] shadow-lg shadow-purple-100/50"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#7C3AED]">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Symptom Notes</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Hirsutism, acne, or fatigue notes scattered in phone memos.
            </p>
          </motion.div>

          {/* Fragment 4: Lifestyle & Recovery (Bottom Right Drift) */}
          <motion.div
            animate={{
              x: [6, -6, 6],
              y: [8, -8, 8],
            }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
            className="absolute bottom-8 right-8 sm:right-24 p-4 sm:p-5 rounded-2xl bg-white/95 border border-emerald-200/90 backdrop-blur-md max-w-[210px] shadow-lg shadow-emerald-100/50"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#059669]">
              <HeartPulse className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Lifestyle &amp; Recovery</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Sleep disruption, stress load, and nutrition unlinked to tests.
            </p>
          </motion.div>

          {/* Center Fragment Questioning Icon */}
          <div className="text-center space-y-2 relative z-10">
            <div className="w-16 h-16 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-md">
              <FileQuestion className="w-8 h-8 text-[#0891B2]" />
            </div>
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-widest">
              Fragmented Signals
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};
