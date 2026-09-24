import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Calendar, FileText, Activity, Stethoscope } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const DisconnectedProblemSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#F8FAFC] text-[#162A45] overflow-hidden border-t border-slate-200/80">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-50/60 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-[#E11D48] shadow-2xs">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>The Real Information Gap</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            The problem isn't a lack of information.{' '}
            <span className="text-[#E11D48]">
              It's disconnected information.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Today, someone exploring reproductive health might record symptom notes in phone memos, receive hormone blood tests as paper slips from different diagnostic labs, and try to remember months of physical changes during a rushed consultation.
          </p>
        </div>

        {/* Scattered Fragments Arena */}
        <div className="relative min-h-[360px] sm:min-h-[420px] rounded-3xl bg-slate-50/80 border border-slate-200/90 p-8 sm:p-12 flex items-center justify-center overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {/* Fragment: Symptom Note */}
          <motion.div
            animate={{ x: [-5, 5, -5], y: [-6, 6, -6] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-8 left-6 sm:left-14 p-4 rounded-2xl bg-white border border-pink-200/90 max-w-[200px] shadow-lg shadow-pink-100/50"
          >
            <div className="flex items-center gap-2 text-[#E11D48] mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Daily Note / Memo</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Fatigue, mood, or physical discomfort logged in isolation without biomarker context.
            </p>
          </motion.div>

          {/* Fragment: Lab Report */}
          <motion.div
            animate={{ x: [6, -6, 6], y: [-7, 7, -7] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="absolute top-6 right-6 sm:right-16 p-4 rounded-2xl bg-white border border-sky-200/90 max-w-[210px] shadow-lg shadow-sky-100/50"
          >
            <div className="flex items-center gap-2 text-[#0284C7] mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Paper Lab Slips</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Hormone panels and metabolic results filed in disparate hospital paper folders.
            </p>
          </motion.div>

          {/* Fragment: Calendar */}
          <motion.div
            animate={{ x: [-6, 6, -6], y: [6, -6, 6] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            className="absolute bottom-8 left-8 sm:left-20 p-4 rounded-2xl bg-white border border-purple-200/90 max-w-[200px] shadow-lg shadow-purple-100/50"
          >
            <div className="flex items-center gap-2 text-[#7C3AED] mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Basic Date Tracker</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Calendar entries unlinked to clinical guidelines or multi-month trends.
            </p>
          </motion.div>

          {/* Fragment: Doctor Visit */}
          <motion.div
            animate={{ x: [5, -5, 5], y: [7, -7, 7] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            className="absolute bottom-6 right-8 sm:right-20 p-4 rounded-2xl bg-white border border-emerald-200/90 max-w-[210px] shadow-lg shadow-emerald-100/50"
          >
            <div className="flex items-center gap-2 text-[#059669] mb-1">
              <Stethoscope className="w-4 h-4" />
              <span className="text-xs font-bold font-display text-[#162A45]">Rushed Consultation</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Limited time to recall months of symptoms and organize crumpled test receipts.
            </p>
          </motion.div>

          {/* Central Message */}
          <div className="text-center space-y-2 relative z-10">
            <span className="px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono font-bold uppercase tracking-wider text-slate-600 shadow-2xs">
              Fragmented Reproductive Health Data
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default DisconnectedProblemSection;
