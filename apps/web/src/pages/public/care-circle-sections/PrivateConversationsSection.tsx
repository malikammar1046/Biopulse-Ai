import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Key, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const PrivateConversationsSection: React.FC = () => {
  const [shareSummary, setShareSummary] = useState(false);

  return (
    <section className="py-20 sm:py-28 bg-white text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
            <Lock className="w-4 h-4 text-[#0891B2]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Zero-Compromise Privacy
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display">
            Private means{' '}
            <span className="text-[#0891B2]">
              private.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal max-w-2xl mx-auto">
            Your intimate health conversations with BioPulse AI are protected by a strict privacy barrier. They are never visible to doctors, family, or partners unless you explicitly choose to include a synthesized summary.
          </p>
        </div>

        {/* ── Visual Vault Showcase ── */}
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl bg-slate-50/80 border border-slate-200/90 p-6 sm:p-10 shadow-sm text-left">
            {/* Corner Privacy Badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2 text-xs font-mono text-[#0891B2] font-semibold">
                <Key className="w-4 h-4 text-[#0891B2]" />
                <span>END-TO-END ENCRYPTED CONVERSATION VAULT</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-700 font-bold">
                <span>● STRICT ISOLATION</span>
              </div>
            </div>

            {/* Simulated Intimate AI Conversation Log (Protected) */}
            <div className="py-6 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-2 relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Patient Prompt • Private Session</span>
                  <span className="flex items-center gap-1 text-[#0891B2] font-semibold">
                    <Lock className="w-3 h-3" /> Encrypted
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#162A45] font-sans leading-relaxed">
                  "I've been feeling extremely fatigued around 4 PM on cycle days 12-16, along with bloating. What lifestyle habits or questions should I raise with my doctor?"
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-[#0891B2]">
                  <span className="font-mono font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> BioPulse AI Intelligence
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">Non-Diagnostic Synthesis</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed">
                  "Based on your logged trends, mid-luteal fatigue and postprandial glucose dips frequently correlate. I've drafted 3 structured talking points for Dr. Ahmed's upcoming consultation regarding meal composition and biomarker testing."
                </p>
              </div>
            </div>

            {/* Interactive Sharing Switcher */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-[#162A45] font-display block">
                    Share weekly conversation topic summary?
                  </span>
                  <span className="text-xs text-slate-500 block font-sans">
                    {shareSummary
                      ? 'Only a high-level summary of discussed topics is included in the doctor brief.'
                      : 'Conversation summary is disabled. Zero conversation metadata is shared.'}
                  </span>
                </div>

                {/* Switch */}
                <button
                  type="button"
                  onClick={() => setShareSummary(!shareSummary)}
                  className={`relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    shareSummary ? 'bg-[#0891B2]' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle Conversation Summary Sharing"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                      shareSummary ? 'translate-x-7 text-[#0891B2]' : 'translate-x-0 text-slate-400'
                    }`}
                  >
                    {shareSummary ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>

              {/* Dynamic Notification of Status */}
              <AnimatePresence mode="wait">
                {shareSummary ? (
                  <motion.div
                    key="summary-on"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-sans"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Safe Summary Mode:</strong> Raw transcripts are never shared. Only high-level topics ("Concern regarding mid-cycle fatigue") appear on your clinician brief.
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="summary-off"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2 font-sans"
                  >
                    <Lock className="w-4 h-4 text-[#0891B2] shrink-0" />
                    <span>
                      <strong>Vault Locked:</strong> Neither doctors nor family will see topics or transcripts. Everything stays 100% private to you.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
