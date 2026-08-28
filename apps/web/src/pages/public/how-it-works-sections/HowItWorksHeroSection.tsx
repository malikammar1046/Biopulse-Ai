import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { OvaryHeroVisual } from '../../../components/biological/OvaryHeroVisual';

export const HowItWorksHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white pt-20 pb-16 overflow-hidden flex flex-col items-center justify-center">
      {/* 1. Deep Atmospheric Gradient Lights for Seamless Blending */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[700px] sm:h-[950px] bg-[#6E2D8B]/20 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/3 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#E87084]/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#A21CAF]/18 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* 2. Centered Biological Ovary Visual with Interactive Labeling & Effects */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center justify-center relative z-10 flex-grow">
        <OvaryHeroVisual />
      </div>

      {/* 3. Subtle Scroll Cue at the Bottom */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 text-center flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer pb-2"
      >
        <a href="#journey-start" className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-[0.25em] text-[#B4A6C7]">
            Scroll To Explore The Journey
          </span>
          <ChevronDown className="w-4 h-4 text-[#FB7185]" />
        </a>
      </motion.div>
    </section>
  );
};
