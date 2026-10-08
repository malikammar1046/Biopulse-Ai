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
    <div className="w-full py-1 mb-2.5">
      <div className="relative flex items-center justify-between max-w-3xl xl:max-w-4xl mx-auto px-2">
        {/* Connector Line behind nodes */}
        <div className="absolute top-[18px] left-10 right-10 h-[2px] bg-[#E2EEF4] -z-0" />

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
                className={`w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-full flex items-center justify-center text-[13px] sm:text-[14px] font-bold font-sans transition-all duration-300 ${
                  isActive
                    ? 'bg-[#0E9EAA] text-white shadow-sm shadow-teal-500/25 ring-4 ring-[#DDF7F7]'
                    : isCompleted
                    ? 'bg-[#16B8C4] text-white shadow-2xs'
                    : 'bg-white border-2 border-[#D7EAF2] text-[#8FA3B8]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <span>{stepNum}</span>
                )}
              </motion.div>

              {/* Step Label */}
              <span
                className={`hidden sm:block mt-2 text-[13px] sm:text-[14px] tracking-tight transition-colors duration-200 text-center whitespace-nowrap ${
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

      {/* Mobile Active Step Indicator */}
      <div className="sm:hidden text-center mt-2 px-3">
        <span className="text-xs font-bold text-[#073B72]">
          Step {currentStep} of {steps.length}:{' '}
          <span className="font-semibold text-slate-600">
            {steps[currentStep - 1]?.label || ''}
          </span>
        </span>
      </div>
    </div>
  );
};
