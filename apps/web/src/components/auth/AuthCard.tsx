import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AuthCardProps extends HTMLMotionProps<'div'> {
  heading?: string;
  subheading?: string;
  children: React.ReactNode;
  headerAccessory?: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  heading,
  subheading,
  headerAccessory,
  children,
  className,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={twMerge(
        clsx(
          'w-full max-w-md mx-auto p-6 sm:p-8 lg:p-10 rounded-[24px]',
          'bg-[#180A26]/85 backdrop-blur-md',
          'border border-[#8E3EAF]/30 shadow-2xl shadow-purple-950/40',
          'relative overflow-hidden',
          className
        )
      )}
      {...props}
    >
      {/* Subtle Top-Right Ambient Inner Glow */}
      <div
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[#8E3EAF]/20 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Header Section */}
      {(heading || subheading || headerAccessory) && (
        <div className="mb-6 sm:mb-8 space-y-2 relative z-10">
          {headerAccessory && <div className="mb-3">{headerAccessory}</div>}
          {heading && (
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
              {heading}
            </h1>
          )}
          {subheading && (
            <p className="text-sm sm:text-base text-[#B4A6C7] font-sans leading-relaxed">
              {subheading}
            </p>
          )}
        </div>
      )}

      {/* Main Card Body */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
