import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

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
        <span className="font-mono font-bold text-[#E87084] uppercase tracking-wider">
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
          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] rounded-full z-0"
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
                      ? 'bg-gradient-to-tr from-[#6E2D8B] to-[#8E3EAF] text-white shadow-md shadow-purple-950/40 border border-white/30'
                      : isCurrent
                      ? 'bg-gradient-to-tr from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-lg shadow-purple-950/60 border-2 border-white scale-110'
                      : 'bg-[#180A26] text-[#A797BD] border border-white/15'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
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
                      ? 'text-[#EDE4F7]'
                      : 'text-[#8D7E9E]'
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
