import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface OvaryCallout {
  id: string;
  label: string;
  subtitle: string;
  x: number; // percentage in SVG space
  y: number;
  labelPos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  color: string;
}

export const OvaryHeroVisual: React.FC = () => {
  const [activeCallout, setActiveCallout] = useState<string | null>(null);

  const callouts: OvaryCallout[] = [
    {
      id: 'cortex',
      label: 'Ovarian Cortex',
      subtitle: 'Dense stroma containing primordial follicles',
      x: 28,
      y: 26,
      labelPos: 'top-left',
      color: '#C084FC',
    },
    {
      id: 'follicles',
      label: 'Antral Follicles',
      subtitle: 'Fluid-filled follicles in follicular phase',
      x: 74,
      y: 32,
      labelPos: 'top-right',
      color: '#FB7185',
    },
    {
      id: 'luteum',
      label: 'Endocrine Core',
      subtitle: 'Hormonal signaling & steroidogenesis',
      x: 52,
      y: 50,
      labelPos: 'bottom-center',
      color: '#E879F9',
    },
    {
      id: 'medulla',
      label: 'Vascular Medulla',
      subtitle: 'Rich network of blood vessels & nerves',
      x: 32,
      y: 68,
      labelPos: 'bottom-left',
      color: '#FDA4AF',
    },
    {
      id: 'receptors',
      label: 'LH / FSH Receptors',
      subtitle: 'Biochemical responsiveness threshold',
      x: 70,
      y: 72,
      labelPos: 'bottom-right',
      color: '#34D399',
    },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center min-h-[640px] sm:min-h-[760px] select-none">
      {/* 1. Ambient Background Biological Glows (Seamless Dark Blending) */}
      <div className="absolute w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#6E2D8B]/28 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] bg-[#E87084]/22 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] bg-[#A21CAF]/25 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 2. Floating Ambient Cellular Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {[
          { top: '15%', left: '20%', size: 'w-2 h-2', color: 'bg-[#FB7185]', dur: 4 },
          { top: '25%', right: '18%', size: 'w-2.5 h-2.5', color: 'bg-[#C084FC]', dur: 5.5 },
          { bottom: '20%', left: '22%', size: 'w-2 h-2', color: 'bg-[#FDA4AF]', dur: 4.8 },
          { bottom: '25%', right: '24%', size: 'w-3 h-3', color: 'bg-[#E879F9]', dur: 6 },
          { top: '48%', left: '12%', size: 'w-1.5 h-1.5', color: 'bg-white', dur: 3.5 },
          { top: '55%', right: '12%', size: 'w-2 h-2', color: 'bg-[#34D399]', dur: 5 },
        ].map((p, idx) => (
          <motion.div
            key={idx}
            animate={{ y: [-8, 8, -8], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute ${p.size} rounded-full ${p.color} shadow-lg blur-[0.5px]`}
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
          />
        ))}
      </div>

      {/* 3. Central Biological Ovary Artwork with Breathing Animation */}
      <motion.div
        animate={{
          scale: [1, 1.025, 1],
          y: [-6, 6, -6],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-[340px] sm:w-[480px] md:w-[560px] h-[340px] sm:h-[480px] md:h-[560px] flex items-center justify-center"
      >
        {/* Soft Radial Gradient Falloff Mask (Eliminating hard rectangular borders) */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,transparent_45%,#10071A_95%)] pointer-events-none z-10" />

        {/* SVG Biological Ovary Canvas */}
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full filter drop-shadow-[0_0_50px_rgba(142,62,175,0.45)]"
        >
          <defs>
            {/* Outer Membrane Gradient */}
            <linearGradient id="ovaryMembrane" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#A21CAF" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#7E22CE" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#6E2D8B" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#4A154B" stopOpacity="0.95" />
            </linearGradient>

            {/* Inner Stroma Glow Gradient */}
            <radialGradient id="innerStroma" cx="48%" cy="48%" r="50%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#E879F9" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#8E3EAF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10071A" stopOpacity="0" />
            </radialGradient>

            {/* Follicle Fluid Gradient */}
            <radialGradient id="follicleGlow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#FDA4AF" stopOpacity="0.9" />
              <stop offset="75%" stopColor="#FB7185" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E11D48" stopOpacity="0.4" />
            </radialGradient>

            <radialGradient id="folliclePurpleGlow" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#E879F9" stopOpacity="0.85" />
              <stop offset="80%" stopColor="#C084FC" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.3" />
            </radialGradient>

            {/* Soft Glow Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Deep Background Aura */}
          <ellipse
            cx="250"
            cy="250"
            rx="195"
            ry="165"
            fill="url(#innerStroma)"
            className="animate-pulse"
          />

          {/* 2. Main Organic Ovary Shape (Asymmetrical Natural Ovoid Contour) */}
          <path
            d="M 140 180 
               C 120 110, 240 70, 340 100 
               C 420 125, 450 220, 420 310 
               C 390 395, 290 430, 200 410 
               C 110 390, 80 290, 110 220 
               Z"
            fill="url(#ovaryMembrane)"
            stroke="rgba(255, 255, 255, 0.28)"
            strokeWidth="2.5"
            filter="url(#softGlow)"
          />

          {/* 3. Translucent Subsurface Inner Layer */}
          <path
            d="M 160 195 
               C 145 135, 245 100, 325 125 
               C 390 145, 415 225, 390 295 
               C 365 365, 280 395, 210 380 
               C 135 360, 115 285, 140 225 
               Z"
            fill="url(#innerStroma)"
            opacity="0.85"
          />

          {/* 4. Delicate Vascular / Capillary Network Lines */}
          <g stroke="rgba(253, 164, 175, 0.35)" strokeWidth="1.2" fill="none" strokeLinecap="round">
            <path d="M 250 250 Q 210 210 170 200 T 135 225" />
            <path d="M 250 250 Q 290 220 340 210 T 385 240" />
            <path d="M 250 250 Q 230 300 215 345 T 195 380" />
            <path d="M 250 250 Q 290 290 330 330 T 365 350" />
            <path d="M 250 250 Q 260 180 275 130 T 300 110" />
          </g>

          {/* 5. Luminous Developing Follicles (Variable Sizes & Pulsing Glows) */}
          {/* Follicle 1 (Large Antral, Top-Right) */}
          <g className="cursor-pointer" onClick={() => setActiveCallout('follicles')}>
            <circle cx="365" cy="165" r="26" fill="url(#follicleGlow)" filter="url(#softGlow)" />
            <circle cx="365" cy="165" r="24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
            <circle cx="360" cy="160" r="5" fill="#FFFFFF" opacity="0.9" />
          </g>

          {/* Follicle 2 (Medium Follicle, Left Upper) */}
          <g className="cursor-pointer" onClick={() => setActiveCallout('cortex')}>
            <circle cx="145" cy="175" r="18" fill="url(#folliclePurpleGlow)" filter="url(#softGlow)" />
            <circle cx="145" cy="175" r="16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
            <circle cx="142" cy="172" r="3.5" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Follicle 3 (Lower Right) */}
          <g className="cursor-pointer" onClick={() => setActiveCallout('receptors')}>
            <circle cx="350" cy="345" r="22" fill="url(#follicleGlow)" filter="url(#softGlow)" />
            <circle cx="350" cy="345" r="20" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
            <circle cx="346" cy="341" r="4" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Follicle 4 (Lower Left Medullary) */}
          <g className="cursor-pointer" onClick={() => setActiveCallout('medulla')}>
            <circle cx="165" cy="325" r="16" fill="url(#folliclePurpleGlow)" filter="url(#softGlow)" />
            <circle cx="165" cy="325" r="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
            <circle cx="162" cy="322" r="3" fill="#FFFFFF" opacity="0.8" />
          </g>

          {/* Follicle 5 (Central Endocrine Core) */}
          <g className="cursor-pointer" onClick={() => setActiveCallout('luteum')}>
            <circle cx="260" cy="250" r="32" fill="url(#follicleGlow)" opacity="0.8" filter="url(#softGlow)" />
            <circle cx="260" cy="250" r="28" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="254" cy="244" r="6" fill="#FFFFFF" opacity="0.85" />
          </g>

          {/* Micro-follicles / Primordial Cluster */}
          <circle cx="210" cy="140" r="9" fill="url(#follicleGlow)" opacity="0.75" />
          <circle cx="295" cy="115" r="10" fill="url(#folliclePurpleGlow)" opacity="0.7" />
          <circle cx="395" cy="245" r="11" fill="url(#follicleGlow)" opacity="0.75" />
          <circle cx="280" cy="375" r="12" fill="url(#folliclePurpleGlow)" opacity="0.75" />
          <circle cx="195" cy="365" r="8" fill="url(#follicleGlow)" opacity="0.65" />
          <circle cx="120" cy="250" r="9" fill="url(#folliclePurpleGlow)" opacity="0.7" />
        </svg>

        {/* 6. Scientific Callout Label Overlays with Thin Glowing Connector Lines */}
        {callouts.map((c) => {
          const isHighlighted = activeCallout === c.id;

          // Placement offsets based on position
          const getPosClasses = () => {
            switch (c.labelPos) {
              case 'top-left':
                return 'bottom-full right-full pr-4 pb-2 text-right';
              case 'top-right':
                return 'bottom-full left-full pl-4 pb-2 text-left';
              case 'bottom-left':
                return 'top-full right-full pr-4 pt-2 text-right';
              case 'bottom-right':
                return 'top-full left-full pl-4 pt-2 text-left';
              case 'top-center':
                return 'bottom-full left-1/2 -translate-x-1/2 pb-4 text-center';
              case 'bottom-center':
                return 'top-full left-1/2 -translate-x-1/2 pt-4 text-center';
            }
          };

          return (
            <div
              key={c.id}
              className="absolute z-20"
              style={{ top: `${c.y}%`, left: `${c.x}%` }}
            >
              {/* Endpoint Pulsing Dot on Anatomical Target */}
              <div
                onClick={() => setActiveCallout(c.id === activeCallout ? null : c.id)}
                className="relative -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer group"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-md transition-transform group-hover:scale-125"
                  style={{ backgroundColor: c.color }}
                />
                <span
                  className="absolute w-4 h-4 rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: c.color }}
                />
              </div>

              {/* Callout Label & Line */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={`absolute ${getPosClasses()} min-w-[150px] sm:min-w-[190px] pointer-events-auto cursor-pointer`}
                onClick={() => setActiveCallout(c.id === activeCallout ? null : c.id)}
              >
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
                    isHighlighted
                      ? 'bg-white/15 border-white/40 shadow-xl backdrop-blur-xl scale-105'
                      : 'bg-white/[0.06] border-white/15 backdrop-blur-md hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                      {c.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#B4A6C7] font-sans block mt-0.5 leading-tight">
                    {c.subtitle}
                  </span>
                </div>
              </motion.div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};
