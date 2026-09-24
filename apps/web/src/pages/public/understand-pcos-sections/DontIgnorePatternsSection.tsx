import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Compass } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

const DISMISSIVE_THOUGHTS = [
  '“Maybe it’s just an irregular period.”',
  '“Maybe it’s just stress from this month.”',
  '“Maybe the symptoms will disappear on their own.”',
];

export const DontIgnorePatternsSection: React.FC = () => {
  const [thoughtIndex, setThoughtIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setThoughtIndex((prev) => (prev + 1) % DISMISSIVE_THOUGHTS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[90vh] py-28 sm:py-36 bg-[#08020E] text-white overflow-hidden border-t border-b border-white/10 flex items-center justify-center select-none">
      {/* ── Atmospheric Obsidian & Empathy Blush Glows ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[700px] sm:h-[950px] bg-gradient-to-tr from-[#6E2D8B]/20 via-[#8E3EAF]/15 to-[#E87084]/20 rounded-full blur-[200px] pointer-events-none -z-10" />

      {/* Gentle Floating Atmospheric Embers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {[
          { top: '20%', left: '15%', size: 'w-2 h-2', color: 'bg-[#FB7185]', dur: 5.2 },
          { top: '35%', right: '20%', size: 'w-1.5 h-1.5', color: 'bg-[#C084FC]', dur: 4.8 },
          { bottom: '25%', left: '22%', size: 'w-2.5 h-2.5', color: 'bg-[#FDA4AF]', dur: 6.0 },
          { bottom: '30%', right: '25%', size: 'w-2 h-2', color: 'bg-[#E879F9]', dur: 5.5 },
        ].map((p, idx) => (
          <motion.div
            key={idx}
            animate={{ y: [-15, 15, -15], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute ${p.size} rounded-full ${p.color} shadow-lg blur-[0.5px]`}
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
          />
        ))}
      </div>

      <Container size="xl" className="relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
            <Compass className="w-3.5 h-3.5 text-[#E87084]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#EDE4F7]">
              The Emotional Turning Point
            </span>
          </div>

          {/* ── Dynamic Thought Fade Progression ── */}
          <div className="min-h-[90px] sm:min-h-[120px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={thoughtIndex}
                initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                transition={{ duration: 0.85, ease: 'easeInOut' }}
                className="text-2xl sm:text-4xl md:text-5xl font-light text-[#9D8EB5] italic font-serif"
              >
                {DISMISSIVE_THOUGHTS[thoughtIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* ── The Awakening Statement ── */}
          <div className="space-y-6 pt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="inline-block"
            >
              <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-[0.3em] text-[#FB7185] block mb-2">
                A Moment of Clarity
              </span>
              <h2 className="text-3xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight text-white leading-[1.12] font-display max-w-3xl mx-auto">
                Persistent patterns{' '}
                <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                  deserve attention.
                </span>
              </h2>
            </motion.div>

            {/* Core Empowering Mantra Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl mx-auto p-6 sm:p-8 rounded-[32px] bg-gradient-to-b from-[#1C0D2E]/80 via-[#140822]/80 to-[#0F041B]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] to-[#FB7185] flex items-center justify-center text-white shadow-lg shadow-purple-950/40">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#EDE4F7] font-bold">
                  Empowerment Through Understanding
                </span>
              </div>

              <p className="text-lg sm:text-xl font-bold font-display text-white leading-snug">
                Taking PMOS seriously doesn’t mean being afraid of it.
              </p>

              <p className="text-sm sm:text-base text-[#CDBDD8] font-sans leading-relaxed">
                It means understanding your body early, listening to longitudinal signals, and
                making confident, informed decisions alongside your healthcare team.
              </p>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#A797BD]">
                <span>Self-Advocacy & Clarity</span>
                <span className="text-[#FB7185] flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Early Awareness Matters
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
