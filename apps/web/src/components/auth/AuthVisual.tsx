import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export interface AuthVisualProps {
  headlineLine1: string;
  headlineLine2: string;
  supportingCopy: string;
  identityTag?: string;
}

export const AuthVisual: React.FC<AuthVisualProps> = ({
  headlineLine1,
  headlineLine2,
  supportingCopy,
  identityTag = "AI-assisted women's health intelligence",
}) => {
  return (
    <div className="relative w-full h-full min-h-[480px] lg:min-h-full flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden select-none bg-[#0D0518]">
      {/* ── Background Biological Ambient Light & Radial Gradients ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 25%, rgba(110, 45, 139, 0.45) 0%, transparent 55%),
            radial-gradient(circle at 80% 65%, rgba(232, 112, 132, 0.22) 0%, transparent 50%),
            radial-gradient(circle at 50% 85%, rgba(162, 28, 175, 0.35) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Biomorphic SVG Curves (Thin Flowing Biological Lines) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 lg:opacity-50"
        viewBox="0 0 600 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bioCurveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6E2D8B" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8E3EAF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E87084" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="bioCurveGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E87084" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#A21CAF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#EDE4F7" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="bioCurveGrad3" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#D8B4FE" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6E2D8B" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Primary flowing wave paths */}
        <path
          d="M -50 150 C 150 80, 250 350, 450 280 C 550 240, 620 380, 680 450"
          stroke="url(#bioCurveGrad1)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M -30 320 C 180 260, 220 540, 420 480 C 540 440, 600 620, 670 680"
          stroke="url(#bioCurveGrad2)"
          strokeWidth="1.75"
        />
        <path
          d="M 50 50 C 200 180, 100 480, 320 620 C 440 700, 520 720, 650 790"
          stroke="url(#bioCurveGrad3)"
          strokeWidth="1.25"
        />
        <path
          d="M 120 720 C 240 600, 380 640, 520 540 C 600 480, 640 400, 680 320"
          stroke="url(#bioCurveGrad1)"
          strokeWidth="1"
          strokeOpacity="0.6"
        />

        {/* Biological Follicle Node Circles */}
        <g className="animate-pulse" style={{ animationDuration: '6s' }}>
          <circle cx="250" cy="350" r="14" fill="#6E2D8B" fillOpacity="0.2" stroke="#8E3EAF" strokeWidth="1" />
          <circle cx="250" cy="350" r="4" fill="#E87084" />
          <circle cx="250" cy="350" r="1.5" fill="#FFFFFF" />
        </g>
        <g className="animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '1s' }}>
          <circle cx="420" cy="480" r="18" fill="#8E3EAF" fillOpacity="0.18" stroke="#E87084" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="420" cy="480" r="5" fill="#A21CAF" />
          <circle cx="420" cy="480" r="2" fill="#FFFFFF" />
        </g>
        <g className="animate-pulse" style={{ animationDuration: '7s', animationDelay: '2s' }}>
          <circle cx="320" cy="620" r="10" fill="#E87084" fillOpacity="0.25" stroke="#EDE4F7" strokeWidth="0.75" />
          <circle cx="320" cy="620" r="3.5" fill="#D8B4FE" />
        </g>
      </svg>

      {/* ── Tiny Follicle-Inspired Floating Dots (CSS Driven) ── */}
      <div className="absolute top-[18%] left-[22%] w-2.5 h-2.5 rounded-full bg-[#E87084] shadow-[0_0_12px_#E87084] animate-pulse" />
      <div className="absolute top-[38%] left-[76%] w-2 h-2 rounded-full bg-[#8E3EAF] shadow-[0_0_10px_#8E3EAF] animate-pulse" style={{ animationDelay: '1.2s' }} />
      <div className="absolute top-[68%] left-[30%] w-3 h-3 rounded-full bg-[#A21CAF] shadow-[0_0_14px_#A21CAF] opacity-80 animate-pulse" style={{ animationDelay: '2.5s' }} />
      <div className="absolute top-[82%] left-[64%] w-1.5 h-1.5 rounded-full bg-[#EDE4F7] shadow-[0_0_8px_#EDE4F7] opacity-90 animate-pulse" style={{ animationDelay: '0.7s' }} />
      <div className="absolute top-[48%] left-[15%] w-1.5 h-1.5 rounded-full bg-[#D8B4FE] shadow-[0_0_8px_#D8B4FE] opacity-75 animate-pulse" style={{ animationDelay: '1.8s' }} />

      {/* ── Top Header / Brand Identity Badge ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#200D35]/80 border border-[#8E3EAF]/40 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#E87084] shadow-[0_0_6px_#E87084] animate-ping" />
          <Sparkles className="w-3.5 h-3.5 text-[#D8B4FE]" />
          <span className="text-xs font-semibold tracking-wide text-[#EDE4F7]">
            {identityTag}
          </span>
        </div>
      </motion.div>

      {/* ── Main Brand Headlines & Copy ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
        className="relative z-10 max-w-lg my-auto py-10 lg:py-0"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display tracking-tight text-white leading-[1.15] mb-5">
          <span className="block">{headlineLine1}</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#EDE4F7] via-[#D8B4FE] to-[#E87084]">
            {headlineLine2}
          </span>
        </h2>

        <p className="text-base sm:text-lg text-[#B4A6C7] font-sans leading-relaxed">
          {supportingCopy}
        </p>

        {/* Micro Clinical Pillar Indicators */}
        <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-white/10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E3EAF] font-bold block">
              Pattern AI
            </span>
            <p className="text-xs text-[#EDE4F7] font-medium">Multimodal Correlation</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#E87084] font-bold block">
              Clinical Context
            </span>
            <p className="text-xs text-[#EDE4F7] font-medium">Longitudinal History</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#D8B4FE] font-bold block">
              Privacy First
            </span>
            <p className="text-xs text-[#EDE4F7] font-medium">Encrypted Architecture</p>
          </div>
        </div>
      </motion.div>

      {/* ── Bottom Micro Copyright / Integrity Tag ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 hidden sm:flex items-center justify-between text-xs text-[#8D7E9E]"
      >
        <span>PMOSense Intelligence Framework</span>
        <span className="font-mono text-[11px] text-[#A21CAF]">v1.0.0-preview</span>
      </motion.div>
    </div>
  );
};
