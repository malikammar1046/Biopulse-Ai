import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Sparkles, Compass, HelpCircle } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

const UNTRACKED_PATH = [
  { step: '01', title: 'Ignored Signals', desc: 'Isolating irregular periods or fatigue as normal daily stress.' },
  { step: '02', title: 'Untracked Patterns', desc: 'No longitudinal data on cycle intervals, symptom clusters, or ovulation.' },
  { step: '03', title: 'Delayed Evaluation', desc: 'Appointments happen only during acute crises with fragmented medical records.' },
  { step: '04', title: 'Growing Uncertainty', desc: 'Trial-and-error treatments without root understanding of individual biology.' },
];

const AWARENESS_PATH = [
  { step: '01', title: 'Awareness', desc: 'Recognizing that your body communicates in cyclical, multi-system rhythms.' },
  { step: '02', title: 'Longitudinal Tracking', desc: 'Logging symptoms, cycle lengths, and ultrasound metrics consistently.' },
  { step: '03', title: 'Biological Understanding', desc: 'Viewing multimodal correlations between hormones, lifestyle, and nutrition.' },
  { step: '04', title: 'Collaborative Discussion', desc: 'Bringing structured, clinician-ready summaries to your doctor visits.' },
  { step: '05', title: 'Informed Decisions', desc: 'Targeted, confident lifestyle and medical strategies tailored to your profile.' },
];

export const AwarenessTimelineSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'awareness' | 'untracked'>('awareness');

  return (
    <section className="relative py-24 sm:py-32 bg-[#0C0418] text-white overflow-hidden border-t border-white/10 select-none">
      {/* Background Glows */}
      <div className="absolute top-1/3 right-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/18 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 06 — The Power of Awareness
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            Awareness changes the{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              conversation.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            Comparing the trajectory of unmonitored symptoms versus proactive, data-informed
            advocacy.
          </p>

          {/* Toggle Switcher */}
          <div className="pt-4 flex justify-center">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-white/5 border border-white/15 backdrop-blur-xl">
              <button
                onClick={() => setViewMode('awareness')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  viewMode === 'awareness'
                    ? 'bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-lg shadow-purple-950/40 font-bold'
                    : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>The Awareness Path</span>
              </button>
              <button
                onClick={() => setViewMode('untracked')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  viewMode === 'untracked'
                    ? 'bg-white text-[#10071A] font-bold shadow-md'
                    : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>The Cycle of Uncertainty</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Dynamic Timeline Visual Container ── */}
        <AnimatePresence mode="wait">
          {viewMode === 'awareness' ? (
            <motion.div
              key="awareness"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {AWARENESS_PATH.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative p-5 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/90 to-[#12071F]/90 border border-[#8E3EAF]/30 shadow-xl space-y-3 text-left group hover:border-[#FB7185] transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#8E3EAF] to-[#FB7185] text-white text-xs font-mono font-bold flex items-center justify-center shadow-md">
                        {item.step}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                    </div>
                    <h4 className="text-base font-bold font-display text-white">{item.title}</h4>
                    <p className="text-xs text-[#CDBDD8] font-sans leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-center text-xs text-[#EDE4F7] font-sans flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FB7185]" />
                <span>
                  Result: <strong>Proactive clarity</strong> and collaborative alignment with your
                  physician.
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="untracked"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {UNTRACKED_PATH.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative p-5 rounded-3xl bg-white/[0.03] border border-white/10 shadow-lg space-y-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-xl bg-white/10 text-[#A797BD] text-xs font-mono font-bold flex items-center justify-center">
                        {item.step}
                      </span>
                      <HelpCircle className="w-4 h-4 text-[#FDA4AF]" />
                    </div>
                    <h4 className="text-base font-bold font-display text-white">{item.title}</h4>
                    <p className="text-xs text-[#A797BD] font-sans leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-xs text-[#B4A6C7] font-sans flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4 text-[#FB7185]" />
                <span>
                  Result: Frustration, delayed answers, and missed longitudinal patterns.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  );
};
