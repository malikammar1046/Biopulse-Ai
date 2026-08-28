import React from 'react';
import { motion } from 'framer-motion';

interface AnatomicalLabelProps {
  /** Primary label text */
  label: string;
  /** Secondary subtitle/description */
  subtitle: string;
  /** Accent color for the dot and connector */
  color: string;
  /** Delay in seconds before the label animates in */
  delay: number;
  /** Whether the label should be visible */
  visible: boolean;
  /** Position style (CSS positioning) */
  style?: React.CSSProperties;
  /** Which side the connector extends to: left means label is on the left, connector goes right */
  anchor?: 'left' | 'right' | 'center-top' | 'center-bottom';
  /** Additional className */
  className?: string;
}

export const AnatomicalLabel: React.FC<AnatomicalLabelProps> = ({
  label,
  subtitle,
  color,
  delay,
  visible,
  style,
  anchor = 'left',
  className = '',
}) => {
  const isLeft = anchor === 'left';
  const isRight = anchor === 'right';
  const isCenterTop = anchor === 'center-top';

  // Connector line direction
  const connectorGradient = isLeft
    ? `linear-gradient(to right, ${color}cc, transparent)`
    : isRight
      ? `linear-gradient(to left, ${color}cc, transparent)`
      : `linear-gradient(to bottom, ${color}cc, transparent)`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute pointer-events-none select-none ${className}`}
      style={style}
    >
      <div
        className={`flex flex-col ${
          isRight ? 'items-end text-right' : isCenterTop ? 'items-center text-center' : 'items-start text-left'
        }`}
      >
        {/* Pulsing target node */}
        <div className="relative mb-1.5">
          <span
            className="block w-2.5 h-2.5 rounded-full shadow-lg"
            style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
          />
          <motion.span
            animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: delay + 0.3 }}
            className="absolute inset-0 w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>

        {/* Connector line */}
        <div
          className={`${
            isCenterTop ? 'w-[1px] h-5' : 'h-[1px] w-12 sm:w-16'
          } mb-1`}
          style={{ background: connectorGradient }}
        />

        {/* Label text */}
        <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-[0.18em] text-white leading-none">
          {label}
        </span>
        <span className="text-[9px] sm:text-[10px] text-[#B4A6C7] font-sans mt-0.5 leading-tight max-w-[160px]">
          {subtitle}
        </span>
      </div>
    </motion.div>
  );
};
