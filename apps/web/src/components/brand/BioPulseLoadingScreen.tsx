import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BioPulseHeartEmblem } from './Logo';

export interface BioPulseLoadingScreenProps {
  /** Optional message displayed below the logo */
  message?: string;
  /** Whether the loading screen fills the entire viewport */
  fullScreen?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * Botanical Corner Foliage: Left (Teal / Men's & Metabolic Pathway)
 * Elegant line-art leaves and branching stems in clinical teal.
 */
const LeftTealBotanical: React.FC = () => (
  <svg
    viewBox="0 0 280 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-48 sm:w-64 md:w-80 h-auto pointer-events-none select-none"
    aria-hidden="true"
  >
    {/* Arching Central Stem */}
    <path
      d="M -20 420 C 40 340 70 250 50 140 C 38 75 10 20 -10 0"
      stroke="#0891B2"
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />

    {/* Secondary Branchlets */}
    <path
      d="M 50 250 C 95 230 140 220 190 225"
      stroke="#0D9488"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />
    <path
      d="M 46 170 C 85 145 125 130 170 132"
      stroke="#0891B2"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />
    <path
      d="M 32 90 C 65 65 100 50 140 48"
      stroke="#0284C7"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.35"
    />

    {/* Leaf 1: Lower Branch Leaf */}
    <path
      d="M 190 225 C 160 200 120 205 105 220 C 130 240 170 245 190 225 Z"
      fill="#0891B2"
      fillOpacity="0.14"
      stroke="#0891B2"
      strokeWidth="1.25"
      strokeOpacity="0.55"
    />
    <path
      d="M 120 216 C 145 222 170 224 185 225"
      stroke="#0891B2"
      strokeWidth="1"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />

    {/* Leaf 2: Mid-Height Upright Leaf */}
    <path
      d="M 170 132 C 145 110 110 115 95 132 C 120 148 150 150 170 132 Z"
      fill="#0D9488"
      fillOpacity="0.16"
      stroke="#0D9488"
      strokeWidth="1.25"
      strokeOpacity="0.6"
    />
    <path
      d="M 108 128 C 130 131 152 132 165 132"
      stroke="#0D9488"
      strokeWidth="1"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />

    {/* Leaf 3: Upper Slender Leaf */}
    <path
      d="M 140 48 C 120 30 90 35 78 50 C 98 64 125 65 140 48 Z"
      fill="#0284C7"
      fillOpacity="0.12"
      stroke="#0284C7"
      strokeWidth="1.25"
      strokeOpacity="0.5"
    />

    {/* Soft Cellular Rings / Organic Accents */}
    <circle cx="210" cy="195" r="4.5" fill="#0891B2" fillOpacity="0.25" />
    <circle cx="230" cy="205" r="2.5" fill="#0D9488" fillOpacity="0.35" />
    <circle cx="185" cy="105" r="3.5" fill="#0284C7" fillOpacity="0.25" />
    <circle cx="95" cy="275" r="2" fill="#0891B2" fillOpacity="0.3" />
    <circle cx="65" cy="340" r="18" stroke="#0891B2" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.2" />
  </svg>
);

/**
 * Botanical Corner Foliage: Right (Pink / Female & PCOS Pathway)
 * Elegant line-art leaves and branching stems in clinical rose/pink.
 */
const RightPinkBotanical: React.FC = () => (
  <svg
    viewBox="0 0 280 420"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-48 sm:w-64 md:w-80 h-auto pointer-events-none select-none"
    aria-hidden="true"
  >
    {/* Arching Central Stem */}
    <path
      d="M 300 0 C 240 80 210 170 230 280 C 242 345 270 400 290 420"
      stroke="#E11D48"
      strokeWidth="2"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />

    {/* Secondary Branchlets */}
    <path
      d="M 230 170 C 185 190 140 200 90 195"
      stroke="#F43F5E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />
    <path
      d="M 234 250 C 195 275 155 290 110 288"
      stroke="#E11D48"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />
    <path
      d="M 248 330 C 215 355 180 370 140 372"
      stroke="#FB7185"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.35"
    />

    {/* Leaf 1: Upper Branch Leaf */}
    <path
      d="M 90 195 C 120 220 160 215 175 200 C 150 180 110 175 90 195 Z"
      fill="#E11D48"
      fillOpacity="0.14"
      stroke="#E11D48"
      strokeWidth="1.25"
      strokeOpacity="0.55"
    />
    <path
      d="M 160 204 C 135 198 110 196 95 195"
      stroke="#E11D48"
      strokeWidth="1"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />

    {/* Leaf 2: Mid-Height Branch Leaf */}
    <path
      d="M 110 288 C 135 310 170 305 185 288 C 160 272 130 270 110 288 Z"
      fill="#F43F5E"
      fillOpacity="0.16"
      stroke="#F43F5E"
      strokeWidth="1.25"
      strokeOpacity="0.6"
    />
    <path
      d="M 172 292 C 150 289 128 288 115 288"
      stroke="#F43F5E"
      strokeWidth="1"
      strokeLinecap="round"
      strokeOpacity="0.45"
    />

    {/* Leaf 3: Lower Slender Leaf */}
    <path
      d="M 140 372 C 160 390 190 385 202 370 C 182 356 155 355 140 372 Z"
      fill="#FB7185"
      fillOpacity="0.12"
      stroke="#FB7185"
      strokeWidth="1.25"
      strokeOpacity="0.5"
    />

    {/* Soft Cellular Rings / Organic Accents */}
    <circle cx="70" cy="225" r="4.5" fill="#E11D48" fillOpacity="0.25" />
    <circle cx="50" cy="215" r="2.5" fill="#F43F5E" fillOpacity="0.35" />
    <circle cx="95" cy="315" r="3.5" fill="#FB7185" fillOpacity="0.25" />
    <circle cx="185" cy="145" r="2" fill="#E11D48" fillOpacity="0.3" />
    <circle cx="215" cy="80" r="18" stroke="#E11D48" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.2" />
  </svg>
);

/**
 * BioPulse ECG Heartbeat Pulse Line
 * Horizontal clinical rhythm line where Teal meets Pink without gradients:
 * Left section: Solid Teal (#0891B2)
 * Right section: Solid Pink (#E11D48)
 * Animated lead pulse particle traveling across the wave.
 */
const BioPulseRhythmLine: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  return (
    <div className="relative w-48 sm:w-56 h-8 flex items-center justify-center">
      <svg
        viewBox="0 0 220 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* Subtle Background Guide Track */}
        <path
          d="M 0 18 L 74 18 L 82 24 L 90 6 L 100 32 L 108 12 L 114 20 L 122 18 L 220 18"
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Left Segment: Solid BioPulse Teal (#0891B2) */}
        <path
          d="M 0 18 L 74 18 L 82 24 L 90 6 L 100 32"
          stroke="#0891B2"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Right Segment: Solid BioPulse Pink (#E11D48) */}
        <path
          d="M 100 32 L 108 12 L 114 20 L 122 18 L 220 18"
          stroke="#E11D48"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central Convergence Node (Teal & Pink meeting) */}
        <circle cx="100" cy="32" r="2.5" fill="#0891B2" />
        <circle cx="108" cy="12" r="2.5" fill="#E11D48" />

        {/* Animated Traveling Pulse Tracer (Disabled when reducedMotion is active) */}
        {!reducedMotion && (
          <motion.circle
            r="3.5"
            fill="#0B1E38"
            animate={{
              cx: [0, 74, 82, 90, 100, 108, 114, 122, 220],
              cy: [18, 18, 24, 6, 32, 12, 20, 18, 18],
              opacity: [0, 1, 1, 1, 1, 1, 1, 1, 0],
            }}
            transition={{
              duration: 2.0,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </svg>
    </div>
  );
};

export const BioPulseLoadingScreen: React.FC<BioPulseLoadingScreenProps> = ({
  message = 'Preparing your health experience',
  fullScreen = true,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      }}
      className={`w-full ${
        fullScreen ? 'fixed inset-0 z-[100] min-h-[100dvh]' : 'min-h-[70vh]'
      } flex items-center justify-center bg-[#F8FAFC] text-[#162A45] relative overflow-hidden select-none px-4 ${className}`}
    >
      {/* ── Soft Ambient Radial Background Wash ── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(248, 250, 252, 0.7) 0%, rgba(241, 245, 249, 0.96) 100%)',
        }}
        aria-hidden="true"
      />

      {/* ── Left Botanical Decoration (Teal Pathway) ── */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -16 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                x: 0,
                y: [0, -8, 0],
                rotate: [0, 0.75, 0],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.35 }
            : {
                opacity: { duration: 0.6, ease: 'easeOut' },
                x: { duration: 0.6, ease: 'easeOut' },
                y: { duration: 7, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        className="absolute left-0 top-0 sm:top-1/2 sm:-translate-y-1/2 pointer-events-none z-0"
      >
        <LeftTealBotanical />
      </motion.div>

      {/* ── Right Botanical Decoration (Pink Pathway) ── */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 16 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : {
                opacity: 1,
                x: 0,
                y: [0, 8, 0],
                rotate: [0, -0.75, 0],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.35 }
            : {
                opacity: { duration: 0.6, ease: 'easeOut' },
                x: { duration: 0.6, ease: 'easeOut' },
                y: { duration: 7.5, repeat: Infinity, ease: 'easeInOut' },
                rotate: { duration: 8.5, repeat: Infinity, ease: 'easeInOut' },
              }
        }
        className="absolute right-0 bottom-0 sm:top-1/2 sm:-translate-y-1/2 pointer-events-none z-0"
      >
        <RightPinkBotanical />
      </motion.div>

      {/* ── Center: BioPulse Identity & Pulse Rhythm ── */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md mx-auto"
      >
        {/* BioPulse Heart Emblem with Subtle Breathing Micro-Pulse */}
        <div className="relative flex items-center justify-center mb-4">
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [1, 1.03, 1],
                    boxShadow: [
                      '0 10px 25px -5px rgba(8, 145, 178, 0.08), 0 8px 10px -6px rgba(225, 29, 72, 0.06)',
                      '0 20px 30px -5px rgba(8, 145, 178, 0.16), 0 10px 15px -5px rgba(225, 29, 72, 0.12)',
                      '0 10px 25px -5px rgba(8, 145, 178, 0.08), 0 8px 10px -6px rgba(225, 29, 72, 0.06)',
                    ],
                  }
            }
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="p-3.5 sm:p-4 rounded-3xl bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-lg flex items-center justify-center"
          >
            <BioPulseHeartEmblem size={52} />
          </motion.div>
        </div>

        {/* Brand Wordmark & Tagline */}
        <div className="flex flex-col items-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#0B1E38] leading-tight">
            BioPulse <span className="text-[#0891B2]">AI</span>
          </h1>

          <p className="text-xs sm:text-[13px] text-slate-500 font-medium tracking-normal mt-0.5 max-w-[280px] sm:max-w-none">
            Personalized reproductive health intelligence
          </p>
        </div>

        {/* BioPulse Rhythm Line (Teal ←→ Pink) */}
        <div className="mt-5 mb-3">
          <BioPulseRhythmLine reducedMotion={shouldReduceMotion} />
        </div>

        {/* Loading Message & Subtle Animated Ellipsis */}
        <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-600">
          <span>{message}</span>
          {!shouldReduceMotion && (
            <span className="inline-flex gap-0.5 text-[#0891B2]">
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              >
                .
              </motion.span>
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BioPulseLoadingScreen;
