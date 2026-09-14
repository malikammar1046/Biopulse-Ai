import React from 'react';
import { motion } from 'framer-motion';

export interface LogoProps {
  /** Size variant or pixel dimension of the emblem */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show the text label 'BioPulse AI' */
  showText?: boolean;
  /** Whether to show the secondary subtitle */
  showTagline?: boolean;
  /** Custom subtitle/tagline (default: "SCIENCE TODAY. HEALTHIER TOMORROWS.") */
  tagline?: string;
  /** Whether the emblem has ambient micro-pulse animations */
  animated?: boolean;
  /** Color theme for text (light mode dark text, dark mode white text) */
  theme?: 'dark' | 'light' | 'auto';
  /** Additional CSS class names */
  className?: string;
}

const SIZE_MAP = {
  xs: { box: 28, text: 'text-base', tagline: 'text-[7.5px]', gap: 'gap-2', radius: 'rounded-xl' },
  sm: { box: 34, text: 'text-lg', tagline: 'text-[8.5px]', gap: 'gap-2.5', radius: 'rounded-xl' },
  md: { box: 40, text: 'text-xl', tagline: 'text-[9px]', gap: 'gap-3', radius: 'rounded-2xl' },
  lg: { box: 48, text: 'text-2xl', tagline: 'text-[10px]', gap: 'gap-3.5', radius: 'rounded-2xl' },
  xl: { box: 60, text: 'text-3xl', tagline: 'text-xs', gap: 'gap-4', radius: 'rounded-3xl' },
};

/**
 * BioPulse Heart-Pulse Vector Emblem matching the Concept Art
 */
export const BioPulseHeartEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bp-heart-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="45%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0D9488" />
      </linearGradient>
      <linearGradient id="bp-heart-shadow" x1="50" y1="20" x2="50" y2="95" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0369A1" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#0B132B" stopOpacity="0.35" />
      </linearGradient>
      <filter id="bp-glow" x="0" y="0" width="100" height="100" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Outer Heart Contour with 3D Depth */}
    <path
      d="M50 88C48 86 14 62 14 36C14 20 26 10 40 10C46 10 50 14 50 14C50 14 54 10 60 10C74 10 86 20 86 36C86 62 52 86 50 88Z"
      fill="url(#bp-heart-grad)"
    />
    <path
      d="M50 88C48 86 14 62 14 36C14 20 26 10 40 10C46 10 50 14 50 14C50 14 54 10 60 10C74 10 86 20 86 36C86 62 52 86 50 88Z"
      fill="url(#bp-heart-shadow)"
    />

    {/* Inner Subtle Depth Cutout */}
    <path
      d="M50 78C48 76 22 56 22 36C22 24 30 18 39 18C44 18 48 21 50 21C52 21 56 18 61 18C70 18 78 24 78 36C78 56 52 76 50 78Z"
      fill="white"
      fillOpacity="0.18"
    />

    {/* Clinical Pulse Rhythm Wave through Heart */}
    <path
      d="M20 48H36L42 34L50 62L58 40L64 52H80"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = true,
  tagline = 'SCIENCE TODAY. HEALTHIER TOMORROWS.',
  animated = true,
  theme = 'light',
  className = '',
}) => {
  const sizeConfig = typeof size === 'string' ? SIZE_MAP[size] : {
    box: size,
    text: size > 44 ? 'text-2xl' : 'text-lg',
    tagline: 'text-[9px]',
    gap: 'gap-2.5',
    radius: 'rounded-2xl',
  };

  const isLight = theme === 'light';

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} select-none group ${className}`}>
      {/* ── Brand Emblem Mark ── */}
      <div className="relative shrink-0">
        <motion.div
          whileHover={animated ? { scale: 1.06 } : undefined}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex items-center justify-center cursor-pointer"
        >
          <BioPulseHeartEmblem size={sizeConfig.box} />
        </motion.div>
      </div>

      {/* ── Brand Typography ── */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center leading-none">
            <span
              className={`font-black font-display tracking-tight transition-colors ${
                sizeConfig.text
              } ${isLight ? 'text-[#0B1E38]' : 'text-white'}`}
            >
              BioPulse{' '}
              <span className="text-[#0284C7]">AI</span>
            </span>
          </div>

          {showTagline && (
            <span
              className={`font-mono uppercase font-bold tracking-[0.14em] text-[8.5px] sm:text-[9px] ${
                isLight ? 'text-[#0891B2]' : 'text-[#38BDF8]'
              } mt-1`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
