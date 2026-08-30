import React, { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  UnderstandPCOSHeroSection,
  BodyToBiologySection,
  OvaryVisualizationSection,
  HowPCOSPatternsSection,
  PCOSDomainsSection,
  DontIgnorePatternsSection,
  LongTermAwarenessSection,
  AwarenessTimelineSection,
  OvaSenseSolutionSection,
  DigitalTwinSection,
  UnderstandPCOSCTASection,
} from './understand-pcos-sections';

const CHAPTERS = [
  { id: 'hero', label: 'Your Body' },
  { id: 'look-beneath-surface', label: 'Inside the Body' },
  { id: 'the-ovary', label: 'How Ovaries Work' },
  { id: 'pcos-patterns', label: 'Hormone Signals' },
  { id: 'what-can-change', label: 'What Changes' },
  { id: 'dont-ignore', label: 'Why It Matters' },
  { id: 'long-term-awareness', label: 'Uterine Lining' },
  { id: 'awareness-timeline', label: 'Your Health Journey' },
  { id: 'ovaserse-solution', label: 'How OvaSense Helps' },
  { id: 'digital-twin', label: 'AI That Explains' },
  { id: 'climax-cta', label: 'Get Started' },
];

export const UnderstandPCOS: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    // Smooth title tag update for SEO
    document.title = 'Understand PCOS | A Cinematic Biological Journey | OvaSense';
  }, []);

  const scrollToChapter = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#10071A] text-white">
      {/* ── Top Story Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6E2D8B] via-[#A21CAF] to-[#FB7185] origin-left z-50 shadow-[0_0_12px_#FB7185]"
        style={{ scaleX }}
      />

      {/* ── Floating Story Progress Pill (Desktop Navigation) ── */}
      <div className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-2.5 p-2 rounded-full bg-[#180A26]/70 border border-white/10 backdrop-blur-xl shadow-2xl">
        {CHAPTERS.map((chap, idx) => {
          return (
            <button
              key={chap.id}
              onClick={() => scrollToChapter(chap.id)}
              className="group relative flex items-center justify-end p-1 cursor-pointer"
              aria-label={`Jump to ${chap.label}`}
            >
              {/* Tooltip Label on Hover */}
              <span className="absolute right-7 whitespace-nowrap px-2.5 py-1 rounded-xl bg-[#10071A]/90 border border-white/15 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                {idx + 1}. {chap.label}
              </span>

              {/* Indicator Dot */}
              <span className="w-2.5 h-2.5 rounded-full bg-white/25 group-hover:bg-[#FB7185] group-hover:scale-125 transition-all" />
            </button>
          );
        })}
      </div>

      {/* ── 1. Hero: Human Body to Internal Translucent Biology ── */}
      <div id="hero">
        <UnderstandPCOSHeroSection />
      </div>

      {/* ── 2. Look Beneath the Surface: 5-Stage Descent ── */}
      <div id="look-beneath-surface">
        <BodyToBiologySection />
      </div>

      {/* ── 3. The Ovary: Microscopic Central Focus ── */}
      <div id="the-ovary">
        <OvaryVisualizationSection />
      </div>

      {/* ── 4. How PCOS Patterns Develop: Interconnected Signals ── */}
      <div id="pcos-patterns">
        <HowPCOSPatternsSection />
      </div>

      {/* ── 5. What Can Change: Interactive 5 Domains ── */}
      <div id="what-can-change">
        <PCOSDomainsSection />
      </div>

      {/* ── 6. Don't Ignore the Pattern: Emotional Turning Point ── */}
      <div id="dont-ignore">
        <DontIgnorePatternsSection />
      </div>

      {/* ── 7. When PCOS is Left Unaddressed: Safe Endometrial Focus ── */}
      <div id="long-term-awareness">
        <LongTermAwarenessSection />
      </div>

      {/* ── 8. The Cost of Ignoring Signals vs Awareness Timeline ── */}
      <div id="awareness-timeline">
        <AwarenessTimelineSection />
      </div>

      {/* ── 9. What OvaSense Does: Ecosystem Showcase ── */}
      <div id="ovaserse-solution">
        <OvaSenseSolutionSection />
      </div>

      {/* ── 10. Digital Twin: Floating AI Inquiries ── */}
      <div id="digital-twin">
        <DigitalTwinSection />
      </div>

      {/* ── 11. Final Resolution & Clinician Preparation CTA ── */}
      <div id="climax-cta">
        <UnderstandPCOSCTASection />
      </div>
    </div>
  );
};

export default UnderstandPCOS;
