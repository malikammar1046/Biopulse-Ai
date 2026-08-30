import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type {
  UserProfile,
  EmergencyContact,
  MedicalProfile,
  WomensHealthProfile,
  LifestyleProfile,
  HealthGoals,
} from '../../types/onboarding';
import { Logo } from '../../components/brand/Logo';
import { OnboardingProgressBar } from '../../components/onboarding/OnboardingProgressBar';
import { Step1PersonalInfo } from '../../components/onboarding/Step1PersonalInfo';
import { Step2EmergencySafety } from '../../components/onboarding/Step2EmergencySafety';
import { Step3MedicalInfo } from '../../components/onboarding/Step3MedicalInfo';
import { Step4WomensHealth } from '../../components/onboarding/Step4WomensHealth';
import { Step5Lifestyle } from '../../components/onboarding/Step5Lifestyle';
import { Step6HealthGoals } from '../../components/onboarding/Step6HealthGoals';
import { Step7ProfileComplete } from '../../components/onboarding/Step7ProfileComplete';

const ONBOARDING_STEPS = [
  { number: '1', label: 'Basic Info' },
  { number: '2', label: 'Safety Contact' },
  { number: '3', label: 'Medical History' },
  { number: '4', label: 'Period & Cycle' },
  { number: '5', label: 'Daily Habits' },
  { number: '6', label: 'Health Goals' },
  { number: '7', label: 'All Done' },
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
  }));

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!draftProfile.fullName.trim()) errs.fullName = 'Full Name is required';
      if (!draftProfile.dateOfBirth) errs.dateOfBirth = 'Date of Birth is required';
      if (!draftProfile.phone.trim()) errs.phone = 'Phone Number is required';
      if (!draftProfile.email.trim()) errs.email = 'Email Address is required';
    }

    if (step === 2) {
      const primary = draftProfile.emergencyContacts[0];
      if (!primary?.name?.trim()) errs.primaryName = 'Primary contact name is required';
      if (!primary?.phone?.trim()) errs.primaryPhone = 'Primary contact phone is required';
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
        navigate(ROUTES.APP.DASHBOARD);
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
        <Logo size="sm" showTagline tagline="Health Setup" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#B4A6C7]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FB7185]" />
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
                <Step2EmergencySafety
                  contacts={draftProfile.emergencyContacts}
                  onChange={(contacts: EmergencyContact[]) =>
                    setDraftProfile((prev) => ({ ...prev, emergencyContacts: contacts }))
                  }
                  errors={errors}
                />
              )}

              {currentStep === 3 && (
                <Step3MedicalInfo
                  data={draftProfile.medical}
                  onChange={(med: MedicalProfile) =>
                    setDraftProfile((prev) => ({ ...prev, medical: med }))
                  }
                />
              )}

              {currentStep === 4 && (
                <Step4WomensHealth
                  data={draftProfile.womensHealth}
                  onChange={(wh: WomensHealthProfile) =>
                    setDraftProfile((prev) => ({ ...prev, womensHealth: wh }))
                  }
                />
              )}

              {currentStep === 5 && (
                <Step5Lifestyle
                  data={draftProfile.lifestyle}
                  onChange={(ls: LifestyleProfile) =>
                    setDraftProfile((prev) => ({ ...prev, lifestyle: ls }))
                  }
                />
              )}

              {currentStep === 6 && (
                <Step6HealthGoals
                  data={draftProfile.goals}
                  onChange={(g: HealthGoals) =>
                    setDraftProfile((prev) => ({ ...prev, goals: g }))
                  }
                />
              )}

              {currentStep === 7 && (
                <Step7ProfileComplete
                  profile={draftProfile}
                  onEnterApp={handleEnterApp}
                  isSubmitting={isSubmitting}
                  saveError={saveError}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls (Steps 1 to 6) */}
          {currentStep < 7 && (
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
                  <span>{currentStep === 6 ? 'Complete Profile' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer Disclaim ── */}
      <footer className="w-full max-w-4xl mx-auto py-4 text-center text-xs text-[#A797BD] font-mono">
        <span>© {new Date().getFullYear()} OvaSense AI Health Monitor • Personalized Health Intelligence</span>
      </footer>
    </div>
  );
};

export default OnboardingFlow;
