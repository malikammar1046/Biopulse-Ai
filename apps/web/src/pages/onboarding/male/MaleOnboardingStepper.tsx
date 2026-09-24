import React from 'react';
import { motion } from 'framer-motion';
import { Check } from '@untitledui/icons';

export interface MaleStepItem {
  number: string;
  label: string;
}

interface MaleOnboardingStepperProps {
  steps: MaleStepItem[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export const MaleOnboardingStepper: React.FC<MaleOnboardingStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full py-1 mb-3">
      <div className="relative flex items-center justify-between max-w-2xl mx-auto px-2">
        {/* Connector Line behind nodes */}
        <div className="absolute top-3.5 left-8 right-8 h-[2px] bg-[#E2EEF4] -z-0" />

        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <div
              key={step.number}
              className="relative z-10 flex flex-col items-center group cursor-pointer select-none"
              onClick={() => {
                if (isCompleted && onStepClick) {
                  onStepClick(stepNum);
                }
              }}
            >
              {/* Circular Indicator */}
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                }}
                transition={{ duration: 0.2 }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold font-mono transition-all duration-300 ${
                  isActive
                    ? 'bg-[#0E9EAA] text-white shadow-sm shadow-teal-500/25 ring-3 ring-[#DDF7F7]'
                    : isCompleted
                    ? 'bg-[#16B8C4] text-white shadow-2xs'
                    : 'bg-white border border-[#D7EAF2] text-[#8FA3B8]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <span>{stepNum}</span>
                )}
              </motion.div>

              {/* Step Label */}
              <span
                className={`mt-1.5 text-[10px] sm:text-[11px] tracking-tight transition-colors duration-200 text-center whitespace-nowrap ${
                  isActive
                    ? 'text-[#073B72] font-bold'
                    : isCompleted
                    ? 'text-[#0E9EAA] font-semibold hover:text-[#073B72]'
                    : 'text-[#8FA3B8] font-medium'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
