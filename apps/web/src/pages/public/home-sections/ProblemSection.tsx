import React from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, AlertCircle, Calendar, Activity, FileText, HeartPulse } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const ProblemSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Subtle Ambient Radial Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4A154B]/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#FB7185]">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>The Everyday Health Challenge</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Reproductive health data is{' '}
            <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
              fragmented.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal max-w-2xl mx-auto">
            Whether tracking menstrual cycle irregularity, pelvic ultrasound scans, morning testosterone labs, or subtle shifts in daily vitality,
            scattered data across separate portals and paper slips obscures the full clinical picture.
          </p>
        </div>

        {/* Scattered Fragments Visual Arena */}
        <div className="relative min-h-[380px] sm:min-h-[440px] rounded-3xl bg-white/[0.03] border border-white/10 p-8 sm:p-12 flex items-center justify-center overflow-hidden">
          {/* Faint Disconnected Dotted Grid Lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#8E3EAF_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

          {/* Fragment 1: Cycle (Top Left Drift) */}
          <motion.div
            animate={{
              x: [-6, 6, -6],
              y: [-8, 8, -8],
            }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 left-6 sm:left-16 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md max-w-[200px] shadow-xl"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#C084FC]">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold font-display">Cycle Log</span>
            </div>
            <p className="text-[11px] text-[#B4A6C7] leading-tight">
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
            className="absolute top-8 right-6 sm:right-20 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md max-w-[220px] shadow-xl"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#38BDF8]">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold font-display">Morning Hormone Lab</span>
            </div>
            <p className="text-[11px] text-[#B4A6C7] leading-tight">
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
            className="absolute bottom-10 left-8 sm:left-24 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md max-w-[210px] shadow-xl"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#E879F9]">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold font-display">Symptom Notes</span>
            </div>
            <p className="text-[11px] text-[#B4A6C7] leading-tight">
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
            className="absolute bottom-8 right-8 sm:right-24 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md max-w-[210px] shadow-xl"
          >
            <div className="flex items-center gap-2.5 mb-1 text-[#34D399]">
              <HeartPulse className="w-4 h-4" />
              <span className="text-xs font-bold font-display">Lifestyle & Recovery</span>
            </div>
            <p className="text-[11px] text-[#B4A6C7] leading-tight">
              Sleep disruption, stress load, and nutrition unlinked to tests.
            </p>
          </motion.div>

          {/* Center Fragment Questioning Icon */}
          <div className="text-center space-y-2 relative z-10">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/15 text-[#B4A6C7] flex items-center justify-center mx-auto shadow-inner">
              <FileQuestion className="w-8 h-8 opacity-70" />
            </div>
            <span className="text-xs font-semibold text-[#B4A6C7] block uppercase tracking-widest">
              Fragmented Signals
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};
