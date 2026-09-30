import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type {
  UserProfile,
  MedicalProfile,
  WomensHealthProfile,
  LifestyleProfile,
} from '../../types/onboarding';
import { validateDateOfBirth, validatePakistaniPhone } from '../../utils/profileValidation';
import { FemaleOnboardingLayout } from './female/FemaleOnboardingLayout';
import { FemaleStep1BasicInfo } from './female/FemaleStep1BasicInfo';
import { FemaleStep2MedicalHistory } from './female/FemaleStep2MedicalHistory';
import { FemaleStep3WomensHealth } from './female/FemaleStep3WomensHealth';
import { FemaleStep4Symptoms } from './female/FemaleStep4Symptoms';
import { FemaleStep5ReviewReady } from './female/FemaleStep5ReviewReady';

const FEMALE_STEPS = [
  { number: '1', label: 'Basic Info' },
  { number: '2', label: 'Medical History' },
  { number: '3', label: 'Period & Cycle' },
  { number: '4', label: 'Symptoms' },
  { number: '5', label: 'Review & Ready' },
];

export const FemaleOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, completeOnboarding } = useUserHealth();
  const shouldReduceMotion = useReducedMotion();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Editable draft profile state — 100% preserved
  const [draftProfile, setDraftProfile] = useState<UserProfile>(() => ({
    ...userProfile,
    gender: 'female',
    pathway: 'female',
    fullName: userProfile.fullName || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    dateOfBirth: userProfile.dateOfBirth || '',
    avatarUrl: userProfile.avatarUrl || '',
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

      const dobCheck = validateDateOfBirth(draftProfile.dateOfBirth);
      if (!dobCheck.isValid) errs.dateOfBirth = dobCheck.error!;

      const phoneCheck = validatePakistaniPhone(draftProfile.phone);
      if (!phoneCheck.isValid) errs.phone = phoneCheck.error!;

      if (!draftProfile.email.trim()) errs.email = 'Email address is required.';

      if (!draftProfile.avatarUrl?.trim()) {
        errs.avatarUrl = 'Choose an avatar or upload a photo to continue.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep < FEMALE_STEPS.length) {
      if (!validateStep(currentStep)) return;
      setCurrentStep((prev) => prev + 1);
    } else {
      handleEnterOvaSense();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (stepNum: number) => {
    if (stepNum < currentStep) {
      setCurrentStep(stepNum);
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

  // Subtle Framer Motion transitions (respects reduced-motion)
  const motionVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 },
  };

  return (
    <FemaleOnboardingLayout
      currentStep={currentStep}
      totalSteps={FEMALE_STEPS.length}
      steps={FEMALE_STEPS}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      isSubmitting={isSubmitting}
      canGoBack={currentStep > 1}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={motionVariants}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <FemaleStep1BasicInfo
              data={draftProfile}
              onChange={(field, val) =>
                setDraftProfile((prev) => ({ ...prev, [field]: val }))
              }
              errors={errors}
            />
          )}

          {/* Step 2: Medical History & Lifestyle */}
          {currentStep === 2 && (
            <FemaleStep2MedicalHistory
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

          {/* Step 3: Period & Menstrual Cycle (Menstrual focus only) */}
          {currentStep === 3 && (
            <FemaleStep3WomensHealth
              data={draftProfile.womensHealth}
              onChange={(wh: WomensHealthProfile) =>
                setDraftProfile((prev) => ({ ...prev, womensHealth: wh }))
              }
            />
          )}

          {/* Step 4: Symptoms & Patterns (Dedicated Step) */}
          {currentStep === 4 && (
            <FemaleStep4Symptoms
              data={draftProfile.womensHealth}
              onChange={(wh: WomensHealthProfile) =>
                setDraftProfile((prev) => ({ ...prev, womensHealth: wh }))
              }
            />
          )}

          {/* Step 5: Review & Ready */}
          {currentStep === 5 && (
            <FemaleStep5ReviewReady
              profile={draftProfile}
              saveError={saveError}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </FemaleOnboardingLayout>
  );
};

export default FemaleOnboarding;
