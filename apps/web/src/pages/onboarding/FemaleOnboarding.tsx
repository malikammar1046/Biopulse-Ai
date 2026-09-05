import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type {
  UserProfile,
  MedicalProfile,
  WomensHealthProfile,
  LifestyleProfile,
} from '../../types/onboarding';
import { Logo } from '../../components/brand/Logo';
import { OnboardingProgressBar } from '../../components/onboarding/OnboardingProgressBar';
import { Step1PersonalInfo } from '../../components/onboarding/Step1PersonalInfo';
import { Step3MedicalInfo } from '../../components/onboarding/Step3MedicalInfo';
import { Step4WomensHealth } from '../../components/onboarding/Step4WomensHealth';
import { Step7ProfileComplete } from '../../components/onboarding/Step7ProfileComplete';

const FEMALE_STEPS = [
  { number: '1', label: 'Basic Info' },
  { number: '2', label: 'Medical History' },
  { number: '3', label: 'Period & Cycle' },
  { number: '4', label: 'Review & Ready' },
];

export const FemaleOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, completeOnboarding } = useUserHealth();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Editable draft profile state
  const [draftProfile, setDraftProfile] = useState<UserProfile>(() => ({
    ...userProfile,
    gender: 'female',
    pathway: 'female',
    fullName: userProfile.fullName || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    dateOfBirth: userProfile.dateOfBirth || '',
    heightCm: userProfile.heightCm || 165,
    weightKg: userProfile.weightKg || 62,
    womensHealth: {
      cycleLength: userProfile.womensHealth?.cycleLength || 28,
      lastPeriodDate: userProfile.womensHealth?.lastPeriodDate || '',
      periodRegularity: userProfile.womensHealth?.periodRegularity || 'mostly_regular',
      periodDuration: userProfile.womensHealth?.periodDuration || 5,
      commonSymptoms: userProfile.womensHealth?.commonSymptoms || [],
      currentCycleDay: userProfile.womensHealth?.currentCycleDay || 14,
      currentPhase: userProfile.womensHealth?.currentPhase || 'follicular',
      maritalStatus: userProfile.womensHealth?.maritalStatus || 'unmarried',
      marriageYears: userProfile.womensHealth?.marriageYears ?? 0,
      isPregnant: userProfile.womensHealth?.isPregnant ?? false,
      abortionsCount: userProfile.womensHealth?.abortionsCount ?? 0,
    },
    lifestyle: {
      dietaryPreference: userProfile.lifestyle?.dietaryPreference || 'Balanced',
      dailyWaterGlasses: userProfile.lifestyle?.dailyWaterGlasses || 8,
      activityLevel: userProfile.lifestyle?.activityLevel || 'moderate',
      exercisePreferences: userProfile.lifestyle?.exercisePreferences || ['Walking', 'Pilates'],
      sleepHours: userProfile.lifestyle?.sleepHours || 7.5,
      fastFoodIntake: userProfile.lifestyle?.fastFoodIntake || 'occasional',
      regularExercise: userProfile.lifestyle?.regularExercise ?? true,
    },
    goals: {
      selectedGoals: userProfile.goals?.selectedGoals?.length
        ? userProfile.goals.selectedGoals
        : ['Track and predict my menstrual cycle', 'Understand PCOS screening patterns'],
      supportPreference: userProfile.goals?.supportPreference || 'gentle_nudges',
    },
    emergencyContacts: userProfile.emergencyContacts?.length
      ? userProfile.emergencyContacts
      : [
          {
            name: '',
            relationship: 'Partner / Family',
            phone: '',
            isPrimary: true,
          },
        ],
  }));

  // Route protection: If already onboarded, go directly to OvaSense app
  if (userProfile.isOnboarded) {
    return <Navigate to={ROUTES.APP.OVASENSE} replace />;
  }
  if (userProfile.pathway === 'male') {
    return <Navigate to={ROUTES.ONBOARDING_MALE} replace />;
  }

  const validateStep = (stepNum: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNum === 1) {
      if (!draftProfile.fullName.trim()) errs.fullName = 'Full Name is required.';
      if (!draftProfile.dateOfBirth) errs.dateOfBirth = 'Date of birth is required.';
      if (!draftProfile.phone.trim()) errs.phone = 'Phone number is required.';
      if (!draftProfile.email.trim()) errs.email = 'Email address is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < FEMALE_STEPS.length) {
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

  const handleEnterOvaSense = async () => {
    setIsSubmitting(true);
    setSaveError(undefined);
    try {
      const res = await completeOnboarding({
        ...draftProfile,
        gender: 'female',
        pathway: 'female',
        isOnboarded: true,
      });

      if (res.success) {
        navigate(ROUTES.APP.OVASENSE, { replace: true });
      } else {
        setSaveError(res.error || 'Unable to save profile. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setSaveError('A network error occurred while finalizing your profile. Please try again.');
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

      {/* ── Top Header ── */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-white/10">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <Logo size="sm" theme="dark" showTagline tagline="Women's Health Companion" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 font-bold">
            OvaSense AI
          </span>
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#B4A6C7]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Encrypted Profile</span>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="w-full max-w-3xl mx-auto my-4 sm:my-8 flex-1 flex flex-col justify-center">
        {/* Step Progress Indicator Bar */}
        <OnboardingProgressBar
          currentStep={currentStep}
          totalSteps={FEMALE_STEPS.length}
          steps={FEMALE_STEPS}
          onStepClick={(step) => {
            if (step < currentStep) setCurrentStep(step);
          }}
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
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <Step1PersonalInfo
                  data={draftProfile}
                  onChange={(field, val) =>
                    setDraftProfile((prev) => ({ ...prev, [field]: val }))
                  }
                  errors={errors}
                  hideGenderSelection={true}
                />
              )}

              {/* Step 2: Medical History (with ML Model Predictors) */}
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

              {/* Step 3: Period & Menstrual Cycle (with Clinical PCOS Factors) */}
              {currentStep === 3 && (
                <Step4WomensHealth
                  data={draftProfile.womensHealth}
                  onChange={(wh: WomensHealthProfile) =>
                    setDraftProfile((prev) => ({ ...prev, womensHealth: wh }))
                  }
                />
              )}

              {/* Step 4: Review & Ready (Step 7 Complete Card) */}
              {currentStep === 4 && (
                <Step7ProfileComplete
                  profile={draftProfile}
                  onEnterApp={handleEnterOvaSense}
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

              <button
                type="button"
                onClick={handleNext}
                className="px-7 py-3 rounded-2xl font-sans font-bold text-xs sm:text-sm uppercase tracking-wider text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{currentStep === 3 ? 'Review Profile' : 'Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full max-w-4xl mx-auto py-4 text-center text-xs text-[#A797BD] font-mono">
        <span>© {new Date().getFullYear()} OvaSense AI Health Monitor • Personalized Women's Health Intelligence</span>
      </footer>
    </div>
  );
};

export default FemaleOnboarding;
