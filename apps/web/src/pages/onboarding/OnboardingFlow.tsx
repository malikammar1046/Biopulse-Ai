import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldTick } from '@untitledui/icons';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type {
  UserProfile,
  MedicalProfile,
  WomensHealthProfile,
  MensHealthProfile,
  GeneralHealthProfile,
  LifestyleProfile,
} from '../../types/onboarding';
import { Logo } from '../../components/brand/Logo';
import { OnboardingProgressBar } from '../../components/onboarding/OnboardingProgressBar';
import { Step1PersonalInfo } from '../../components/onboarding/Step1PersonalInfo';
import { Step3MedicalInfo } from '../../components/onboarding/Step3MedicalInfo';
import { Step3AdaptiveHealth } from '../../components/onboarding/Step3AdaptiveHealth';
import { Step7ProfileComplete } from '../../components/onboarding/Step7ProfileComplete';
import { validateDateOfBirth, validatePakistaniPhone } from '../../utils/profileValidation';

const ONBOARDING_STEPS = [
  { number: '1', label: 'Basic Info' },
  { number: '2', label: 'Medical History' },
  { number: '3', label: 'Pathway Health' },
  { number: '4', label: 'All Done' },
];

export const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, completeOnboarding } = useUserHealth();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Local editable draft profile state
  const [draftProfile, setDraftProfile] = useState<UserProfile>(() => ({
    ...userProfile,
    fullName: userProfile.fullName || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    dateOfBirth: userProfile.dateOfBirth || '',
    gender: userProfile.gender,
    pathway: userProfile.pathway,
  }));

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!draftProfile.fullName.trim()) errs.fullName = 'Full Name is required';
      
      const dobCheck = validateDateOfBirth(draftProfile.dateOfBirth);
      if (!dobCheck.isValid) errs.dateOfBirth = dobCheck.error!;

      const phoneCheck = validatePakistaniPhone(draftProfile.phone);
      if (!phoneCheck.isValid) errs.phone = phoneCheck.error!;

      if (!draftProfile.email.trim()) errs.email = 'Email Address is required';
      if (!draftProfile.gender) errs.gender = 'Please select your Health Pathway';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEnterApp = async () => {
    setIsSubmitting(true);
    setSaveError(undefined);
    try {
      const res = await completeOnboarding(draftProfile);
      if (res.success) {
        const targetRoute = getPathwayDashboardRoute(draftProfile);
        navigate(targetRoute, { replace: true });
      } else {
        setSaveError(res.error || 'Failed to save health profile to database. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setSaveError('A connection error occurred while saving your profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10071A] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* ── Background Biological Ambient Glows ── */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[850px] h-[600px] sm:h-[850px] bg-[#6E2D8B]/20 rounded-full blur-[180px]" />
        <div className="absolute bottom-10 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#E87084]/15 rounded-full blur-[160px]" />
      </div>

      {/* ── Top Header Brand Bar ── */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 group transition-transform hover:scale-[1.01]">
          <Logo size="sm" theme="dark" />
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#B4A6C7]">
          <ShieldTick className="w-3.5 h-3.5 text-[#34D399]" aria-hidden="true" />
          <span>Encrypted Profile</span>
        </div>
      </header>

      {/* ── Main Centered Card Container ── */}
      <main className="w-full max-w-3xl mx-auto my-4 sm:my-8 flex-1 flex flex-col justify-center">
        {/* Step Progress Indicator Bar */}
        <OnboardingProgressBar
          currentStep={currentStep}
          totalSteps={ONBOARDING_STEPS.length}
          steps={ONBOARDING_STEPS}
          onStepClick={(s) => s < currentStep && setCurrentStep(s)}
        />

        {/* Wizard Card Body */}
        <div className="relative rounded-[36px] bg-gradient-to-b from-[#180A26]/90 via-[#12071F]/90 to-[#0A0313]/95 border border-white/15 shadow-2xl p-6 sm:p-10 backdrop-blur-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {currentStep === 1 && (
                <Step1PersonalInfo
                  data={draftProfile}
                  onChange={(field, val) =>
                    setDraftProfile((prev) => ({ ...prev, [field]: val }))
                  }
                  errors={errors}
                />
              )}

              {currentStep === 2 && (
                <Step3MedicalInfo
                  data={draftProfile.medical}
                  lifestyle={draftProfile.lifestyle}
                  onChange={(med: MedicalProfile) =>
                    setDraftProfile((prev) => ({ ...prev, medical: med }))
                  }
                  onLifestyleChange={(ls: LifestyleProfile) =>
                    setDraftProfile((prev) => ({ ...prev, lifestyle: ls }))
                  }
                />
              )}

              {currentStep === 3 && (
                <Step3AdaptiveHealth
                  gender={draftProfile.gender}
                  womensHealth={draftProfile.womensHealth}
                  mensHealth={draftProfile.mensHealth}
                  generalHealth={draftProfile.generalHealth}
                  onWomensHealthChange={(wh: WomensHealthProfile) =>
                    setDraftProfile((prev) => ({ ...prev, womensHealth: wh }))
                  }
                  onMensHealthChange={(mh: MensHealthProfile) =>
                    setDraftProfile((prev) => ({ ...prev, mensHealth: mh }))
                  }
                  onGeneralHealthChange={(gh: GeneralHealthProfile) =>
                    setDraftProfile((prev) => ({ ...prev, generalHealth: gh }))
                  }
                />
              )}

              {currentStep === 4 && (
                <Step7ProfileComplete
                  profile={draftProfile}
                  onEnterApp={handleEnterApp}
                  isSubmitting={isSubmitting}
                  saveError={saveError}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls (Steps 1 to 3) */}
          {currentStep < 4 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  currentStep === 1
                    ? 'opacity-0 pointer-events-none'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-7 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{currentStep === 3 ? 'Review Profile' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer Disclaimer ── */}
      <footer className="w-full max-w-4xl mx-auto py-4 text-center text-xs text-[#A797BD] font-mono">
        <span>© {new Date().getFullYear()} BioPulse AI • Personalized Healthcare Intelligence</span>
      </footer>
    </div>
  );
};

export default OnboardingFlow;
