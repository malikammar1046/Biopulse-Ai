import React, { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  UnderstandPCOSHeroSection,
  WhatIsPCOSSection,
  PCOSSymptomsSection,
  BodyToBiologySection,
  OvaryVisualizationSection,
  HowPCOSPatternsSection,
  PCOSDomainsSection,
  PCOSMythBustingSection,
  DontIgnorePatternsSection,
  LongTermAwarenessSection,
  AwarenessTimelineSection,
  OvaSenseSolutionSection,
  DigitalTwinSection,
  UnderstandPCOSCTASection,
} from './understand-pcos-sections';

const CHAPTERS = [
  { id: 'hero', label: 'Understand PMOS' },
  { id: 'what-is-pcos', label: 'What is PMOS?' },
  { id: 'pcos-symptoms', label: 'Symptoms & Realities' },
  { id: 'look-beneath-surface', label: 'Inside the Body' },
  { id: 'the-ovary', label: 'Ovaries & Ovulation' },
  { id: 'pcos-patterns', label: 'How PMOS Patterns Develop' },
  { id: 'what-can-change', label: 'What Changes' },
  { id: 'pcos-myths', label: 'PMOS Myth vs Fact' },
  { id: 'dont-ignore', label: 'Why It Matters' },
  { id: 'long-term-awareness', label: 'When PMOS is Left Unaddressed' },
  { id: 'awareness-timeline', label: 'Your Health Journey' },
  { id: 'ovaserse-solution', label: 'How PMOSense Helps' },
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
    document.title = 'Understand PMOS | Educational Reproductive Intelligence | PMOSense';
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
      <div className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-2 p-2 rounded-full bg-[#180A26]/70 border border-white/10 backdrop-blur-xl shadow-2xl max-h-[85vh] overflow-y-auto">
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

      {/* ── 2. What is PCOS: Patient-Friendly Foundation ── */}
      <div id="what-is-pcos">
        <WhatIsPCOSSection />
      </div>

      {/* ── 3. Symptoms & Experiences: Accessible Cards ── */}
      <div id="pcos-symptoms">
        <PCOSSymptomsSection />
      </div>

      {/* ── 4. Look Beneath the Surface: 5-Stage Descent ── */}
      <div id="look-beneath-surface">
        <BodyToBiologySection />
      </div>

      {/* ── 5. The Ovary & Ovulation: Normal vs PCOS Pattern ── */}
      <div id="the-ovary">
        <OvaryVisualizationSection />
      </div>

      {/* ── 6. How PCOS Patterns Develop: Interconnected Signals ── */}
      <div id="pcos-patterns">
        <HowPCOSPatternsSection />
      </div>

      {/* ── 7. What Can Change: Interactive 5 Domains ── */}
      <div id="what-can-change">
        <PCOSDomainsSection />
      </div>

      {/* ── 8. Myth vs Fact: Supportive Evidence Busting ── */}
      <div id="pcos-myths">
        <PCOSMythBustingSection />
      </div>

      {/* ── 9. Don't Ignore the Pattern: Emotional Turning Point ── */}
      <div id="dont-ignore">
        <DontIgnorePatternsSection />
      </div>

      {/* ── 10. When PCOS is Left Unaddressed: Safe Endometrial Focus ── */}
      <div id="long-term-awareness">
        <LongTermAwarenessSection />
      </div>

      {/* ── 11. The Cost of Ignoring Signals vs Awareness Timeline ── */}
      <div id="awareness-timeline">
        <AwarenessTimelineSection />
      </div>

      {/* ── 12. What OvaSense Does: Ecosystem Showcase ── */}
      <div id="ovaserse-solution">
        <OvaSenseSolutionSection />
      </div>

      {/* ── 13. Digital Twin: Floating AI Inquiries ── */}
      <div id="digital-twin">
        <DigitalTwinSection />
      </div>

      {/* ── 14. Final Resolution & Clinician Preparation CTA ── */}
      <div id="climax-cta">
        <UnderstandPCOSCTASection />
      </div>
    </div>
  );
};

export default UnderstandPCOS;
