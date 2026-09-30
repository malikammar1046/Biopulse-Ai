import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InfoCircle, XClose } from '@untitledui/icons';

export interface OnboardingWhyModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  accentColor?: 'teal' | 'blue' | 'rose';
  children: React.ReactNode;
}

export const OnboardingWhyModal: React.FC<OnboardingWhyModalProps> = ({
  isOpen,
  onClose,
  title = 'Why we ask this',
  icon: Icon = InfoCircle,
  accentColor = 'teal',
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const colorStyles = {
    teal: {
      iconBg: 'bg-[#DDF7F7] text-[#0E9EAA]',
      buttonBg: 'bg-[#0E9EAA] hover:bg-[#0C8B96]',
    },
    blue: {
      iconBg: 'bg-[#E0F2FE] text-[#0288D1]',
      buttonBg: 'bg-[#0288D1] hover:bg-[#0277BD]',
    },
    rose: {
      iconBg: 'bg-[#FCE7F3] text-[#F43F7D]',
      buttonBg: 'bg-[#F43F7D] hover:bg-[#E11D48]',
    },
  }[accentColor];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#073B72]/30 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-lg bg-white rounded-2xl border border-[#D7EAF2] shadow-2xl p-5 sm:p-6 space-y-4 z-10 select-text"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorStyles.iconBg}`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold font-display text-[#073B72]">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#55718F] hover:text-[#073B72] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <XClose className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs sm:text-sm text-[#55718F] leading-relaxed">
              {children}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2 rounded-full text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs ${colorStyles.buttonBg}`}
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export interface OnboardingWhyTriggerProps {
  onClick: () => void;
  label?: string;
  accentColor?: 'teal' | 'blue' | 'rose';
  className?: string;
}

export const OnboardingWhyTrigger: React.FC<OnboardingWhyTriggerProps> = ({
  onClick,
  label = 'Why we ask this',
  accentColor = 'teal',
  className = '',
}) => {
  const triggerStyles = {
    teal: 'text-[#0E9EAA] bg-[#F0FDFE] hover:bg-[#E0F8FA] border-[#CCFBF1]',
    blue: 'text-[#0288D1] bg-[#F0F8FF] hover:bg-[#E0F2FE] border-[#BAE6FD]',
    rose: 'text-[#F43F7D] bg-[#FFF1F2] hover:bg-[#FFE4E6] border-[#FECDD3]',
  }[accentColor];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:shadow-xs group ${triggerStyles} ${className}`}
      aria-label={label}
    >
      <InfoCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};
