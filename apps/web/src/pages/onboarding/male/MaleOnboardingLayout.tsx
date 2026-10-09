import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Lock01, ActivityHeart } from '@untitledui/icons';
import { ROUTES } from '../../../constants/routes';
import { MaleOnboardingStepper } from './MaleOnboardingStepper';
import type { MaleStepItem } from './MaleOnboardingStepper';

interface MaleOnboardingLayoutProps {
  currentStep: number;
  totalSteps: number;
  steps: MaleStepItem[];
  onStepClick?: (step: number) => void;
  onNext: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
  canGoBack?: boolean;
  hideBottomNav?: boolean;
  children: React.ReactNode;
}

export const MaleOnboardingLayout: React.FC<MaleOnboardingLayoutProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
  onNext,
  onBack,
  isSubmitting = false,
  canGoBack = true,
  hideBottomNav = false,
  children,
}) => {
  const { t } = useTranslation(['onboarding', 'common']);

  return (
    <div className="min-h-screen bg-[#F5FBFD] text-[#073B72] flex flex-col justify-between p-2 sm:p-4 lg:p-5 xl:p-6 select-none relative font-sans overflow-x-hidden">
      {/* ── Background Luminous Ambient Glows (Teal & Navy) ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-10 w-[450px] h-[450px] bg-[#DDF7F7]/60 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-[#EAFBFC]/50 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-[#F0FDFE]/70 rounded-full blur-[120px]" />
      </div>

      {/* ── Desktop Two-Column Workspace (Wide Card Dominant, max-w-[1520px]) ── */}
      <div className="max-w-[1520px] 2xl:max-w-[1640px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-5 lg:gap-10 xl:gap-14 items-stretch justify-center px-1 sm:px-6 lg:px-8 xl:px-10">
        {/* ════════════════════════════════════════════════════════════
            LEFT COLUMN: MALE IDENTITY & PATHWAY PANEL
           ════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-[260px] xl:w-[290px] 2xl:w-[310px] flex flex-col justify-between py-2 sm:py-3 select-none shrink-0">
          {/* Top Back Action & Identity Header */}
          <div className="space-y-3.5">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#55718F] hover:text-[#073B72] transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#55718F] group-hover:text-[#073B72]" aria-hidden="true" />
              <span>{t('common:actions.backToHome', 'Back to Home')}</span>
            </Link>

            <div className="space-y-2 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBFC] border border-[#B2EBF2] text-[12px] font-bold text-[#0E9EAA] tracking-wider uppercase shadow-2xs font-sans">
                <span>{t('onboarding:layout.forMen', 'FOR MEN')}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl xl:text-[2.1rem] font-bold font-display leading-[1.14] tracking-tight">
                <span className="text-[#073B72] block">{t('onboarding:layout.menTitle', 'Your Health, Your Strength')}</span>
              </h1>

              <p className="text-[14px] sm:text-[15px] text-[#55718F] font-sans leading-relaxed">
                {t('onboarding:layout.menSubtitle', 'A few simple steps help us understand your health and personalize your Male Hypogonadism screening and guidance.')}
              </p>
            </div>
          </div>

          {/* Lower Pathway Visual & Decorative Accents */}
          <div className="relative pt-4 pb-2 mt-auto hidden lg:block">
            {/* Soft teal circular shape background */}
            <div className="relative w-40 h-40 xl:w-44 xl:h-44 mx-auto flex items-center justify-center">
              {/* Circular Halo */}
              <div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-[#EAFBFC] via-[#DDF7F7] to-[#EAFBFC] -z-0 shadow-inner"
                aria-hidden="true"
              />

              {/* Foliage / Geometric botanical SVG decoration in teal */}
              <svg
                className="absolute -top-1.5 -right-1 w-14 h-14 text-[#0E9EAA]/30 pointer-events-none"
                viewBox="0 0 100 100"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M50 0 C65 20, 80 35, 100 50 C75 55, 60 70, 50 100 C45 75, 30 60, 0 50 C25 45, 40 30, 50 0 Z" opacity="0.4" />
                <path d="M70 10 C80 25, 90 35, 100 40 C85 45, 75 55, 70 70 C65 55, 55 45, 40 40 C55 35, 65 25, 70 10 Z" opacity="0.6" />
              </svg>

              {/* Male Model Portrait Image */}
              <div className="relative z-10 w-32 xl:w-36 h-32 xl:h-36 rounded-full overflow-hidden border-2.5 border-white shadow-md">
                <img
                  src="/assets/images/male-pathway.jpg"
                  alt="BioPulse AI - For Men"
                  className="w-full h-full object-cover object-top"
                  loading="eager"
                />
              </div>

              {/* Cursive Handwritten Script Accent */}
              <div className="absolute -top-2 -right-2 rotate-[-8deg] select-none pointer-events-none z-20">
                <span
                  className="text-lg sm:text-xl font-bold text-[#0E9EAA] block leading-tight text-right drop-shadow-2xs"
                  style={{ fontFamily: "'Caveat', cursive" }}
                >
                  Peak Vitality
                  <br />
                  Stronger Tomorrows
                </span>
              </div>

              {/* Floating Badge Card Over Lower Left */}
              <div className="absolute -bottom-1 -left-2 z-20 bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-[#D7EAF2] shadow-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#DDF7F7] flex items-center justify-center text-[#0E9EAA] shrink-0">
                  <ActivityHeart className="w-3.5 h-3.5 text-[#0E9EAA]" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#073B72] block leading-tight">
                    Knowledge today
                  </span>
                  <span className="text-[10px] text-[#55718F] block leading-tight">
                    Stronger tomorrow
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════
            RIGHT COLUMN: MAIN ONBOARDING WORKSPACE (Expanded Dominant Card)
           ════════════════════════════════════════════════════════════ */}
        <main className="w-full flex-1 md:w-[calc(100%-1.25rem)] md:ml-auto lg:w-auto lg:ml-2 xl:ml-4 lg:max-w-[1040px] xl:max-w-[1180px] 2xl:max-w-[1260px] flex flex-col justify-between">
          {/* Main White Card with Generous Desktop Space */}
          <div className="w-full bg-white rounded-[24px] xl:rounded-[28px] border border-[#D7EAF2] shadow-[0_8px_30px_rgba(7,59,114,0.05)] p-5 sm:p-7 lg:p-8 xl:p-9 flex flex-col justify-between">
            {/* Top Fixed Area: Male Hypogonadism Onboarding Bar & Stepper */}
            <div className="shrink-0 mb-2">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E8F1F5] mb-2">
                <span className="text-[13px] sm:text-sm font-bold font-sans text-[#0E9EAA] uppercase tracking-wider">
                  {t('onboarding:layout.maleOnboarding', 'MALE HYPOGONADISM ONBOARDING')}
                </span>
                <span className="text-[13px] sm:text-sm font-semibold font-sans text-[#55718F]">
                  {t('onboarding:layout.stepProgress', 'Step {{current}} of {{total}}', { current: currentStep, total: totalSteps })}
                </span>
              </div>

              {/* 5-Step Horizontal Stepper Progress Indicator */}
              <MaleOnboardingStepper
                steps={steps}
                currentStep={currentStep}
                onStepClick={onStepClick}
              />
            </div>

            {/* Form Content Area with Natural Flow */}
            <div className="flex-1 py-3 sm:py-4">
              {children}
            </div>

            {/* Bottom Navigation Row with Responsive Touch-Friendly Buttons */}
            {!hideBottomNav && (
              <div className={`mt-6 pt-4 sm:pt-5 border-t border-[#E8F1F5] flex items-center ${currentStep === 1 ? 'justify-end' : 'justify-between'} gap-2 sm:gap-4 shrink-0`}>
                {/* Back Button */}
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={!canGoBack || isSubmitting}
                    className="min-h-[44px] sm:min-h-[50px] px-4 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-[15px] font-semibold font-sans uppercase tracking-wider flex items-center gap-1.5 sm:gap-2.5 transition-all cursor-pointer bg-[#F5FBFD] hover:bg-[#E8F4F8] border border-[#D7EAF2] text-[#55718F] hover:text-[#073B72]"
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
                    <span>{t('onboarding:layout.back', 'Back')}</span>
                  </button>
                )}

                {/* Continue / Submit Button */}
                <button
                  type="button"
                  onClick={onNext}
                  disabled={isSubmitting}
                  className={`min-h-[44px] sm:min-h-[50px] px-5 sm:px-10 py-2.5 sm:py-3 rounded-full font-sans font-semibold text-xs sm:text-base uppercase tracking-wider text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 sm:gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] ${currentStep === 1 ? 'w-full sm:w-auto' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{t('onboarding:layout.saving', 'Saving...')}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {currentStep === totalSteps
                          ? t('onboarding:layout.completeSetup', 'Complete Setup')
                          : currentStep === totalSteps - 1
                          ? t('onboarding:layout.reviewProfile', 'Review Profile')
                          : t('onboarding:layout.continue', 'Continue')}
                      </span>
                      <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Privacy Note & Footer Step Counter below Main Card */}
          <div className="w-full py-2.5 flex items-center justify-between text-[13px] sm:text-sm text-[#55718F] font-sans px-3 shrink-0">
            <div className="flex items-center gap-2 mx-auto">
              <Lock01 className="w-4 h-4 text-[#0E9EAA]" aria-hidden="true" />
              <span>{t('onboarding:layout.secureNotice', 'Your information is secure and private.')}</span>
            </div>
            <span className="hidden sm:block text-[13px] font-sans text-[#8FA3B8]">
              {t('onboarding:layout.stepProgress', 'Step {{current}} of {{total}}', { current: currentStep, total: totalSteps })}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
};
