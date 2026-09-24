import React from 'react';
import { motion } from 'framer-motion';
import { Check } from '@untitledui/icons';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; number: string }>;
  onStepClick?: (stepNumber: number) => void;
}

export const OnboardingProgressBar: React.FC<OnboardingProgressBarProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
}) => {
  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 sm:mb-12 px-2 select-none">
      {/* Top Mobile Bar Indicator */}
      <div className="sm:hidden flex items-center justify-between mb-3 text-xs">
        <span className="font-mono font-bold text-[#29B6F6] uppercase tracking-wider">
          Step 0{currentStep} of 0{totalSteps}
        </span>
        <span className="font-sans font-semibold text-white">
          {steps[currentStep - 1]?.label}
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative">
        {/* Background Grey Bar */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0" />

        {/* Active Gradient Filled Bar */}
        <motion.div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-gradient-to-r from-[#0288D1] to-[#29B6F6] rounded-full z-0"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* Step Nodes (Desktop / Tablet) */}
        <div className="relative z-10 flex items-center justify-between">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            const isClickable = stepNum < currentStep && !!onStepClick;

            return (
              <div
                key={step.number}
                onClick={() => isClickable && onStepClick?.(stepNum)}
                className={`flex flex-col items-center group ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                {/* Step Circle Pin */}
                <motion.div
                  whileHover={isClickable ? { scale: 1.15 } : undefined}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#0288D1] text-white shadow-md border border-white/30'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-[#0288D1] to-[#29B6F6] text-white shadow-lg border-2 border-white scale-110'
                      : 'bg-[#180A26] text-[#A797BD] border border-white/15'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </motion.div>

                {/* Step Label (Desktop Only) */}
                <span
                  className={`hidden sm:block text-[11px] font-sans font-medium mt-2 whitespace-nowrap transition-colors duration-200 ${
                    isCurrent
                      ? 'text-white font-bold'
                      : isCompleted
                      ? 'text-[#E0F2FE]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
