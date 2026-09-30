import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lock01, ActivityHeart } from '@untitledui/icons';
import { ROUTES } from '../../../constants/routes';
import { OnboardingStepper } from './OnboardingStepper';
import type { StepItem } from './OnboardingStepper';

interface FemaleOnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  steps: StepItem[];
  onStepClick?: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  canGoBack?: boolean;
  children: React.ReactNode;
}

export const FemaleOnboardingLayout: React.FC<FemaleOnboardingLayoutProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  onNext,
  onBack,
  isSubmitting = false,
  canGoBack = true,
  children,
}) => {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-[#F5FBFD] text-[#073B72] flex flex-col justify-between p-3 sm:p-4 lg:p-4 xl:p-5 select-none relative font-sans">
      {/* ── Background Luminous Ambient Glows ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-10 w-[450px] h-[450px] bg-[#E0F2FE]/60 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-[#DDF7F7]/50 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-[#F0F9FF]/70 rounded-full blur-[120px]" />
      </div>

      {/* ── Desktop Two-Column Viewport-Contained Workspace (Wide Card Dominant) ── */}
      <div className="max-w-[1520px] 2xl:max-w-[1620px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-5 lg:gap-6 xl:gap-8 items-stretch justify-center lg:justify-start px-3 sm:px-6 lg:px-8 xl:px-10 min-h-0">
        {/* ════════════════════════════════════════════════════════════
            LEFT COLUMN: FEMALE IDENTITY & PATHWAY PANEL (Compact ~240-270px)
           ════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[240px] xl:w-[270px] 2xl:w-[280px] flex flex-col justify-between py-1.5 lg:py-2 select-none shrink-0 min-h-0">
          {/* Top Back Action & Identity Header */}
          <div className="space-y-3">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#55718F] hover:text-[#073B72] transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-[#55718F] group-hover:text-[#073B72]" aria-hidden="true" />
              <span>Back to Home</span>
            </Link>

            <div className="space-y-1.5 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[11px] font-bold text-[#0288D1] tracking-wider uppercase shadow-2xs font-sans">
                <span>FOR WOMEN</span>
              </div>

              <h1 className="text-2xl sm:text-3xl xl:text-[2rem] font-bold font-display leading-[1.14] tracking-tight">
                <span className="text-[#073B72] block">Your Health</span>
                <span className="text-[#0288D1] block">Your Future</span>
              </h1>

              <p className="text-[13px] sm:text-sm text-[#55718F] font-sans leading-relaxed">
                A few simple steps help us understand your health and personalize your PCOS screening and guidance.
              </p>
            </div>
          </div>

          {/* Lower Pathway Visual & Handwritten Decorative Script */}
          <div className="relative pt-2 pb-1 mt-auto">
            {/* Soft circular shape background */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 xl:w-44 xl:h-44 mx-auto flex items-center justify-center">
              {/* Circular Halo */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E0F2FE] via-[#BAE6FD]/40 to-[#E0F2FE] -z-0 shadow-inner"
                aria-hidden="true"
              />

              {/* Foliage / Delicate Leaves SVG decoration */}
              <svg
                className="absolute -top-1.5 -right-1 w-14 h-14 text-[#0288D1]/30 pointer-events-none"
                viewBox="0 0 100 100"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M50 0 C65 20, 80 35, 100 50 C75 55, 60 70, 50 100 C45 75, 30 60, 0 50 C25 45, 40 30, 50 0 Z" opacity="0.4" />
                <path d="M70 10 C80 25, 90 35, 100 40 C85 45, 75 55, 70 70 C65 55, 55 45, 40 40 C55 35, 65 25, 70 10 Z" opacity="0.6" />
              </svg>

              {/* Model Portrait Image */}
              <div className="relative z-10 w-28 sm:w-32 xl:w-36 h-28 sm:h-32 xl:h-36 rounded-full overflow-hidden border-2.5 border-white shadow-md">
                <img
                  src="/assets/images/female-pathway.jpg"
                  alt="BioPulse AI - For Women"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
              </div>

              {/* Cursive Handwritten Script Accent */}
              <div className="absolute -top-2 -right-1 sm:-right-2 rotate-[-8deg] select-none pointer-events-none z-20">
                <span
                  className="text-lg sm:text-xl font-bold text-[#0288D1] block leading-tight text-right drop-shadow-2xs"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Same care
                  <br />
                  Brighter Tomorrows
                </span>
              </div>

              {/* Floating Badge Card Over Lower Left */}
              <div className="absolute -bottom-1 -left-2 sm:-left-2 z-20 bg-white/95 backdrop-blur-md rounded-xl p-2 border border-[#D7EAF2] shadow-sm flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0288D1] shrink-0">
                  <ActivityHeart className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#073B72] block leading-tight">
                    Knowledge today
                  </span>
                  <span className="text-[9px] text-[#55718F] block leading-tight">
                    A healthier tomorrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════
            RIGHT COLUMN: MAIN ONBOARDING WORKSPACE (Expanded Dominant Card)
           ════════════════════════════════════════════════════════════ */}
        <main className="w-full flex-1 lg:max-w-[940px] xl:max-w-[1060px] 2xl:max-w-[1180px] flex flex-col justify-between lg:h-full min-h-0">
          {/* Main White Card with Viewport Constraints */}
          <div className="w-full bg-white rounded-[24px] xl:rounded-[28px] border border-[#D7EAF2] shadow-[0_8px_30px_rgba(7,59,114,0.05)] p-4 sm:p-5 lg:p-6 xl:p-7 flex flex-col justify-between lg:h-full min-h-0">
            {/* Top Fixed Area: PCOS Onboarding Bar & Stepper */}
            <div className="shrink-0 mb-1">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8F1F5] mb-1.5">
                <span className="text-xs sm:text-[13px] font-bold font-sans text-[#0288D1] uppercase tracking-wider">
                  PCOS ONBOARDING
                </span>
                <span className="text-xs sm:text-sm font-semibold font-sans text-[#55718F]">
                  Step {currentStep} of {totalSteps}
                </span>
              </div>

              {/* 5-Step Horizontal Stepper Progress Indicator */}
              <OnboardingStepper
                steps={steps}
                currentStep={currentStep}
                onStepClick={onStepClick}
              />
            </div>

            {/* Flexible / Scroll-contained Form Content Area */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-1">
              {children}
            </div>

            {/* Sticky/Stable Bottom Navigation Row inside Main Card */}
            <div className="mt-4 pt-4 border-t border-[#E8F1F5] flex items-center justify-between gap-4 shrink-0">
              {/* Back Button */}
              <button
                type="button"
                onClick={onBack}
                disabled={!canGoBack || currentStep === 1 || isSubmitting}
                className={`min-h-[46px] px-6 py-2.5 rounded-full text-sm font-semibold font-sans uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  currentStep === 1
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-[#F5FBFD] hover:bg-[#E8F4F8] border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]'
                }`}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Back</span>
              </button>

              {/* Continue / Submit Button */}
              <button
                type="button"
                onClick={onNext}
                disabled={isSubmitting}
                className="min-h-[46px] px-8 py-2.5 rounded-full font-sans font-semibold text-sm sm:text-base uppercase tracking-wider text-white bg-[#0288D1] hover:bg-[#01579B] shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentStep === totalSteps
                        ? 'Complete Setup'
                        : currentStep === totalSteps - 1
                        ? 'Review Profile'
                        : 'Continue'}
                    </span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Privacy Note & Footer Step Counter below Main Card */}
          <div className="w-full py-2 flex items-center justify-between text-xs sm:text-[13px] text-[#55718F] font-sans px-3 shrink-0">
            <div className="flex items-center gap-2 mx-auto">
              <Lock01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
              <span>Your information is secure and private.</span>
            </div>
            <span className="hidden sm:block text-xs font-sans text-[#8FA3B8]">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
};
