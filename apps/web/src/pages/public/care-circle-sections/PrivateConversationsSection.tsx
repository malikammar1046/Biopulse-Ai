import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, Key, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const PrivateConversationsSection: React.FC = () => {
  const [shareSummary, setShareSummary] = useState(false);

  return (
    <section className="py-24 sm:py-32 bg-[#0C0517] text-white relative overflow-hidden border-t border-white/10">
      {/* Deep Obsidian Center Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[190px] pointer-events-none -z-10" />

      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Lock className="w-4 h-4 text-[#FB7185]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
              Zero-Compromise Privacy
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            Private means{' '}
            <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
              private.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
          >
            Your intimate health conversations with VITASense AI are protected by a strict privacy barrier. They are never visible to doctors, family, or partners unless you explicitly choose to include a synthesized summary.
          </motion.p>
        </div>

        {/* ── Visual Vault Showcase ── */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75 }}
            className="relative rounded-3xl bg-[#140822] border border-white/15 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl shadow-purple-950/70 overflow-hidden text-left"
          >
            {/* Corner Privacy Badges */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FB7185]">
                <Key className="w-4 h-4" />
                <span>END-TO-END ENCRYPTED CONVERSATION VAULT</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/30 text-[10px] font-mono text-[#FB7185]">
                <span>● STRICT ISOLATION</span>
              </div>
            </div>

            {/* Simulated Intimate AI Conversation Log (Protected) */}
            <div className="py-6 space-y-4">
              <div className="p-4 rounded-2xl bg-[#0C0517] border border-white/10 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-[#8D7E9E]">
                  <span className="font-mono">Patient Prompt • Private Session</span>
                  <span className="flex items-center gap-1 text-[#FB7185]"><Lock className="w-3 h-3" /> Encrypted</span>
                </div>
                <p className="text-xs sm:text-sm text-white font-sans">
                  "I've been feeling extremely fatigued around 4 PM on cycle days 12-16, along with bloating. What lifestyle habits or questions should I raise with my doctor?"
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1D0E30] border border-[#8E3EAF]/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#C084FC]">
                  <span className="font-mono font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> VITASense AI Intelligence
                  </span>
                  <span className="text-[10px] text-[#B4A6C7]">Non-Diagnostic Synthesis</span>
                </div>
                <p className="text-xs sm:text-sm text-[#EDE4F7] font-sans leading-relaxed">
                  "Based on your logged trends, mid-luteal fatigue and postprandial glucose dips frequently correlate. I've drafted 3 structured talking points for Dr. Ahmed's upcoming consultation regarding meal composition and biomarker testing."
                </p>
              </div>
            </div>

            {/* Interactive Sharing Switcher */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0C0517] border border-white/12">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white font-display block">
                    Share weekly conversation topic summary?
                  </span>
                  <span className="text-xs text-[#B4A6C7] block font-sans">
                    {shareSummary
                      ? 'Only a summarized list of discussed topics is included in the doctor brief.'
                      : 'Conversation summary is disabled. Zero conversation metadata is shared.'}
                  </span>
                </div>

                {/* Switch */}
                <button
                  onClick={() => setShareSummary(!shareSummary)}
                  className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    shareSummary ? 'bg-gradient-to-r from-[#8E3EAF] to-[#FB7185]' : 'bg-white/20'
                  }`}
                  aria-label="Toggle Conversation Summary Sharing"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[10px] font-bold ${
                      shareSummary ? 'translate-x-8 text-[#8E3EAF]' : 'translate-x-0 text-[#8D7E9E]'
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
                    className="p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#34D399] flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Safe Summary Mode:</strong> Raw transcripts are never shared. Only the high-level topics ("Concern regarding mid-cycle fatigue") appear on your clinician brief.
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="summary-off"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#B4A6C7] flex items-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-[#FB7185] shrink-0" />
                    <span>
                      <strong>Vault Locked:</strong> Neither doctors nor family will see topics or transcripts. Everything stays 100% private to you.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
