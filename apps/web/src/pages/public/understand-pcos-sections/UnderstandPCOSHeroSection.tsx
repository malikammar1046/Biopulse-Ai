import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles, Eye, Zap } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const UnderstandPCOSHeroSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'translucent' | 'silhouette'>('translucent');

  const scrollToNext = () => {
    const nextSection = document.getElementById('look-beneath-surface');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen bg-[#10071A] text-white flex flex-col justify-between pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden select-none">
      {/* ── 1. Atmospheric Cinematic Background ── */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        {/* Deep Orchid & Coral Volumetric Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[850px] h-[600px] sm:h-[850px] bg-gradient-to-tr from-[#6E2D8B]/30 via-[#8E3EAF]/20 to-[#E87084]/25 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#A21CAF]/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-[#FB7185]/15 rounded-full blur-[130px]" />

        {/* Ambient Bioluminescent Floating Particles */}
        {[
          { top: '18%', left: '15%', size: 'w-2 h-2', color: 'bg-[#FB7185]', dur: 4.2 },
          { top: '28%', right: '16%', size: 'w-2.5 h-2.5', color: 'bg-[#C084FC]', dur: 5.8 },
          { bottom: '28%', left: '20%', size: 'w-2 h-2', color: 'bg-[#FDA4AF]', dur: 4.5 },
          { bottom: '22%', right: '22%', size: 'w-3 h-3', color: 'bg-[#E879F9]', dur: 6.2 },
          { top: '50%', left: '10%', size: 'w-1.5 h-1.5', color: 'bg-white', dur: 3.8 },
          { top: '65%', right: '12%', size: 'w-2 h-2', color: 'bg-[#FB7185]', dur: 5.0 },
        ].map((p, idx) => (
          <motion.div
            key={idx}
            animate={{
              y: [-12, 12, -12],
              x: [-6, 6, -6],
              opacity: [0.25, 0.85, 0.25],
            }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute ${p.size} rounded-full ${p.color} shadow-[0_0_12px_currentColor]`}
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
          />
        ))}
      </div>

      {/* ── 2. Top Header Narrative Tagline ── */}
      <Container size="xl" className="relative z-10 w-full">
        <div className="text-center max-w-4xl mx-auto space-y-4 pt-4 sm:pt-6">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl shadow-lg shadow-purple-950/30"
          >
            <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#F6F2FA]">
              A Cinematic Educational Journey
            </span>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-7.5xl font-extrabold tracking-tight text-white leading-[1.06] font-display"
          >
            Your body speaks in{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              patterns.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-base sm:text-xl md:text-2xl text-[#CDBDD8] max-w-2xl mx-auto font-sans font-normal leading-relaxed"
          >
            Understanding PCOS starts with understanding what is happening{' '}
            <span className="text-white font-medium underline decoration-[#E87084]/60 underline-offset-4">
              beneath the surface.
            </span>
          </motion.p>
        </div>
      </Container>

      {/* ── 3. Central Translucent Female Silhouette Artwork ── */}
      <div className="relative w-full max-w-5xl mx-auto my-6 sm:my-8 px-4 flex flex-col items-center justify-center">
        {/* Interactive Mode Switcher Pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-4 sm:mb-6 z-30 inline-flex items-center gap-1.5 p-1 rounded-full bg-[#180A26]/80 border border-white/15 backdrop-blur-xl shadow-xl"
        >
          <button
            onClick={() => setViewMode('translucent')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
              viewMode === 'translucent'
                ? 'bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-md shadow-purple-950/40'
                : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Translucent Anatomy</span>
          </button>
          <button
            onClick={() => setViewMode('silhouette')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
              viewMode === 'silhouette'
                ? 'bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-md shadow-purple-950/40'
                : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Exterior Silhouette</span>
          </button>
        </motion.div>

        {/* Central Visual Vessel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[480px] aspect-[9/16] rounded-3xl overflow-hidden flex items-center justify-center border border-white/15 bg-gradient-to-b from-[#140822] via-[#0D0417] to-[#08020E] shadow-[0_0_80px_rgba(110,45,139,0.35)]"
        >
          {/* Subtle Radial Glow Halo Behind Artwork */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 60%, rgba(232, 112, 132, 0.3) 0%, rgba(142, 62, 175, 0.25) 35%, transparent 75%)',
            }}
          />

          {/* Translucent Silhouette Image with Smooth Edge Fade */}
          <motion.img
            src="/translucent-female-biology.jpg"
            alt="Translucent Female Biological Anatomy with Glowing Ovarian Center"
            className="w-full h-full object-contain object-center select-none"
            animate={{
              filter:
                viewMode === 'translucent'
                  ? 'brightness(1.05) contrast(1.08)'
                  : 'brightness(0.35) contrast(1.35) saturate(0.2)',
              scale: [1, 1.018, 1],
            }}
            transition={{
              filter: { duration: 0.5 },
              scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              maskImage:
                'radial-gradient(ellipse at 50% 50%, black 72%, rgba(0,0,0,0.8) 85%, transparent 98%)',
              WebkitMaskImage:
                'radial-gradient(ellipse at 50% 50%, black 72%, rgba(0,0,0,0.8) 85%, transparent 98%)',
            }}
          />

          {/* Pulsing Pelvic/Ovarian Luminous Focal Ring */}
          <motion.div
            animate={{
              scale: [1, 1.35, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[62.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 sm:w-20 h-16 sm:h-20 rounded-full border border-[#FB7185]/60 bg-[#FB7185]/15 blur-xs pointer-events-none"
          />
          <div className="absolute top-[62.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FB7185] shadow-[0_0_20px_#FB7185] pointer-events-none" />

          {/* Floating Anatomical Badge Callout */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute bottom-6 left-4 right-4 p-3 rounded-2xl bg-[#10071A]/85 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] animate-ping" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E87084] font-bold block">
                  Focal Origin
                </span>
                <span className="text-xs font-semibold text-white">
                  Ovaries & Endocrine Signaling Axis
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#EDE4F7]">
              Rotterdam Aligned
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── 4. Bottom Scroll Down Action ── */}
      <Container size="xl" className="relative z-10 w-full text-center">
        <motion.button
          onClick={scrollToNext}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group inline-flex flex-col items-center gap-2 text-white/80 hover:text-white cursor-pointer transition-colors"
        >
          <span className="text-xs sm:text-sm font-semibold tracking-wider font-sans uppercase text-[#E87084] group-hover:text-white transition-colors flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
            Explore the biology
          </span>
          <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#8E3EAF]/40 group-hover:border-white/40 transition-all duration-300 shadow-lg">
            <ChevronDown className="w-5 h-5 text-white animate-bounce" />
          </div>
        </motion.button>
      </Container>
    </section>
  );
};
