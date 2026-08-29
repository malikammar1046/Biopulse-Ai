import React from 'react';
import { motion } from 'framer-motion';

export interface LogoProps {
  /** Size variant or pixel dimension of the emblem */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Whether to show the text label 'OVASense' */
  showText?: boolean;
  /** Whether to show the secondary subtitle */
  showTagline?: boolean;
  /** Custom subtitle/tagline (default: "AI Health Monitor") */
  tagline?: string;
  /** Whether the emblem has ambient micro-pulse animations */
  animated?: boolean;
  /** Color theme for text (light mode dark text, dark mode white text) */
  theme?: 'dark' | 'light' | 'auto';
  /** Additional CSS class names */
  className?: string;
}

const SIZE_MAP = {
  xs: { box: 28, text: 'text-base', tagline: 'text-[9px]', gap: 'gap-2', radius: 'rounded-xl' },
  sm: { box: 36, text: 'text-lg', tagline: 'text-[9.5px]', gap: 'gap-2.5', radius: 'rounded-xl' },
  md: { box: 42, text: 'text-xl', tagline: 'text-[10px]', gap: 'gap-3', radius: 'rounded-2xl' },
  lg: { box: 50, text: 'text-2xl', tagline: 'text-[11px]', gap: 'gap-3.5', radius: 'rounded-2xl' },
  xl: { box: 64, text: 'text-3xl', tagline: 'text-xs', gap: 'gap-4', radius: 'rounded-3xl' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = true,
  tagline = 'AI Health Monitor',
  animated = true,
  theme = 'dark',
  className = '',
}) => {
  const sizeConfig = typeof size === 'string' ? SIZE_MAP[size] : {
    box: size,
    text: size > 44 ? 'text-2xl' : 'text-lg',
    tagline: 'text-[10px]',
    gap: 'gap-3',
    radius: 'rounded-2xl',
  };

  const isLight = theme === 'light';

  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} select-none group ${className}`}>
      {/* ── Brand Emblem Mark ── */}
      <div className="relative shrink-0">
        <motion.div
          whileHover={animated ? { scale: 1.06, rotate: 2 } : undefined}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative flex items-center justify-center p-0.5 ${sizeConfig.radius} overflow-hidden shadow-lg shadow-purple-950/40 bg-gradient-to-br from-[#2D0C4E] via-[#140624] to-[#090212] border border-white/15`}
          style={{ width: sizeConfig.box, height: sizeConfig.box }}
        >
          {/* SVG Vector Biological Loop Emblem */}
          <svg
            viewBox="0 0 120 120"
            fill="none"
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`ovaLogoGrad1-${size}`} x1="15%" y1="10%" x2="85%" y2="90%">
                <stop offset="0%" stopColor="#8E3EAF" />
                <stop offset="50%" stopColor="#A21CAF" />
                <stop offset="100%" stopColor="#C026D3" />
              </linearGradient>

              <linearGradient id={`ovaLogoGrad2-${size}`} x1="85%" y1="10%" x2="15%" y2="90%">
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="50%" stopColor="#E87084" />
                <stop offset="100%" stopColor="#D946EF" />
              </linearGradient>

              <radialGradient id={`ovaLogoNucleus-${size}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="35%" stopColor="#FDA4AF" />
                <stop offset="70%" stopColor="#FB7185" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8E3EAF" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Left Intertwined Ovarian Petal Loop */}
            <path
              d="M 60 22 C 38 22, 24 38, 24 60 C 24 82, 38 98, 60 98 C 76 98, 86 88, 88 74 C 89 66, 82 60, 75 60 C 67 60, 62 67, 56 78 C 50 88, 40 85, 36 78 C 32 70, 32 50, 36 42 C 40 35, 50 32, 56 42 C 62 53, 67 60, 75 60 C 82 60, 89 54, 88 46 C 86 32, 76 22, 60 22 Z"
              fill={`url(#ovaLogoGrad1-${size})`}
              opacity="0.95"
            />

            {/* Right Intertwined Vitality Loop */}
            <path
              d="M 60 22 C 76 22, 96 36, 96 60 C 96 84, 76 98, 60 98 C 44 98, 34 88, 32 74 C 31 66, 38 60, 45 60 C 53 60, 58 67, 64 78 C 70 88, 80 85, 84 78 C 88 70, 88 50, 84 42 C 80 35, 70 32, 64 42 C 58 53, 53 60, 45 60 C 38 60, 31 54, 32 46 C 34 32, 44 22, 60 22 Z"
              fill={`url(#ovaLogoGrad2-${size})`}
              opacity="0.9"
              style={{ mixBlendMode: 'screen' }}
            />

            {/* Central Luminous Follicle Spark */}
            <circle cx="60" cy="60" r="14" fill={`url(#ovaLogoNucleus-${size})`} />
            <circle cx="60" cy="60" r="5" fill="#FFFFFF" />

            {/* Micro Orbit Nodes */}
            <circle cx="60" cy="22" r="3.5" fill="#FB7185" />
            <circle cx="60" cy="22" r="1.5" fill="#FFFFFF" />
            <circle cx="60" cy="98" r="3.5" fill="#C084FC" />
            <circle cx="60" cy="98" r="1.5" fill="#FFFFFF" />
          </svg>
        </motion.div>

        {/* Ambient Top Pulse Indicator */}
        {animated && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse pointer-events-none" />
        )}
      </div>

      {/* ── Brand Typography ── */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span
              className={`font-extrabold font-display tracking-tight leading-tight transition-colors ${
                sizeConfig.text
              } ${isLight ? 'text-[#1C1326] group-hover:text-[#6E2D8B]' : 'text-white group-hover:text-[#E879F9]'}`}
            >
              OVASense
            </span>
          </div>

          {showTagline && (
            <span
              className={`uppercase font-semibold tracking-wider ${
                sizeConfig.tagline
              } ${isLight ? 'text-[#8D7E9E]' : 'text-[#B4A6C7]'} -mt-0.5`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
