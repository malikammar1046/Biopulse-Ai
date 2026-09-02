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
          whileHover={animated ? { scale: 1.08, rotate: 1 } : undefined}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative flex items-center justify-center ${sizeConfig.radius} overflow-hidden shadow-lg ${
            isLight
              ? 'bg-gradient-to-br from-pink-50 via-white to-purple-50/60 border border-pink-200/60 shadow-pink-900/10'
              : 'bg-gradient-to-br from-[#270D3E] via-[#160628] to-[#0A0214] border border-pink-500/25 shadow-purple-950/50'
          }`}
          style={{ width: sizeConfig.box, height: sizeConfig.box, padding: typeof size === 'string' && (size === 'xs' || size === 'sm') ? 2 : 4 }}
        >
          {/* New Official Brand Logo Image */}
          <img
            src="/logo.png"
            alt="OVASense Logo"
            className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
            loading="eager"
          />
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
