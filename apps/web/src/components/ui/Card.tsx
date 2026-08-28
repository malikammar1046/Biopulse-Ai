import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type CardVariant = 'standard' | 'elevated' | 'subtle' | 'gradient';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  hoverEffect?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'standard',
  hoverEffect = false,
  padded = true,
  className,
  children,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return 'bg-white border border-[#E7DFEF] shadow-lg shadow-purple-950/5';
      case 'subtle':
        return 'bg-[#F2ECF7] border border-[#E7DFEF]/60 shadow-none';
      case 'gradient':
        return 'bg-gradient-to-br from-white via-[#FAF7FD] to-[#F5EEFB] border border-[#E7DFEF] shadow-sm';
      case 'standard':
      default:
        return 'bg-white border border-[#E7DFEF] shadow-sm shadow-purple-950/5';
    }
  };

  return (
    <motion.div
      whileHover={
        hoverEffect
          ? { y: -4, boxShadow: '0 20px 30px -10px rgba(110, 45, 139, 0.08)' }
          : undefined
      }
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={twMerge(
        clsx(
          'rounded-3xl transition-all duration-200 overflow-hidden relative',
          getVariantStyles(),
          padded && 'p-6 sm:p-8',
          className
        )
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
