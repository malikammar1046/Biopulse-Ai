import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type {
  UserProfile,
  MedicalProfile,
  WomensHealthProfile,
  LifestyleProfile,
} from '../../types/onboarding';
import { validateFemaleScreeningAge, validatePakistaniPhone } from '../../utils/profileValidation';
import { FemaleOnboardingLayout } from './female/FemaleOnboardingLayout';
import { FemaleStep1BasicInfo } from './female/FemaleStep1BasicInfo';
import { FemaleStep2MedicalHistory } from './female/FemaleStep2MedicalHistory';
import { FemaleStep3WomensHealth } from './female/FemaleStep3WomensHealth';
import { FemaleStep4Symptoms } from './female/FemaleStep4Symptoms';
import { FemaleStep5ReviewReady } from './female/FemaleStep5ReviewReady';
import { preloadDashboardRoutes } from '../../utils/routePreloaders';
import { BioPulseLoadingScreen } from '../../components/brand/BioPulseLoadingScreen';
import { deriveFemaleTier1InputsFromProfile } from '../../utils/tier1InputMappers';

export const FemaleOnboarding: React.FC = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, finalizeOnboardingAndScreen, fetchClinicalState } = useUserHealth();
  const shouldReduceMotion = useReducedMotion();

  const isExplicitRelaunch = Boolean((location.state as any)?.allowReonboard);
  const isUpdatingProfile = Boolean(userProfile.isOnboarded && isExplicitRelaunch);

  const femaleSteps = useMemo(() => [
    { number: '1', label: t('onboarding:stepLabels.basicInfo', 'Basic Info') },
    { number: '2', label: t('onboarding:stepLabels.medicalHistory', 'Medical History') },
    { number: '3', label: t('onboarding:stepLabels.periodCycle', 'Period & Cycle') },
    { number: '4', label: t('onboarding:stepLabels.symptoms', 'Symptoms') },
    { number: '5', label: t('onboarding:stepLabels.reviewReady', 'Review & Ready') },
  ], [t]);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isProcessingScreening, setIsProcessingScreening] = useState(false);
  const [screeningStatusMessage, setScreeningStatusMessage] = useState('Preparing your health profile...');

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
    heightCm: userProfile.heightCm ?? null,
    weightKg: userProfile.weightKg ?? null,
    medical: {
      bloodType: userProfile.medical?.bloodType || '',
      allergies: userProfile.medical?.allergies || ['None'],
      medications: userProfile.medical?.medications || [],
      conditions: userProfile.medical?.conditions?.length
        ? userProfile.medical.conditions
        : [],
      surgeries: userProfile.medical?.surgeries || [],
      familyHistory: userProfile.medical?.familyHistory?.length
        ? userProfile.medical.familyHistory
        : ['None known'],
    },
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

  // Re-sync draft profile when userProfile is loaded or updated
  useEffect(() => {
    if (userProfile && (userProfile.fullName || userProfile.dateOfBirth || userProfile.medical || userProfile.womensHealth)) {
      setDraftProfile((prev) => ({
        ...prev,
        fullName: prev.fullName || userProfile.fullName || '',
        email: prev.email || userProfile.email || '',
        phone: prev.phone || userProfile.phone || '',
        dateOfBirth: prev.dateOfBirth || userProfile.dateOfBirth || '',
        avatarUrl: prev.avatarUrl || userProfile.avatarUrl || '',
        heightCm: prev.heightCm ?? userProfile.heightCm ?? null,
        weightKg: prev.weightKg ?? userProfile.weightKg ?? null,
        waistCm: prev.waistCm ?? userProfile.waistCm ?? null,
        medical: {
          bloodType: prev.medical?.bloodType || userProfile.medical?.bloodType || '',
          allergies: prev.medical?.allergies?.length ? prev.medical.allergies : (userProfile.medical?.allergies || ['None']),
          medications: prev.medical?.medications?.length ? prev.medical.medications : (userProfile.medical?.medications || []),
          conditions: prev.medical?.conditions?.length ? prev.medical.conditions : (userProfile.medical?.conditions || []),
          surgeries: prev.medical?.surgeries?.length ? prev.medical.surgeries : (userProfile.medical?.surgeries || []),
          familyHistory: prev.medical?.familyHistory?.length ? prev.medical.familyHistory : (userProfile.medical?.familyHistory || ['None known']),
        },
        womensHealth: {
          ...userProfile.womensHealth,
          ...prev.womensHealth,
        },
        lifestyle: {
          ...userProfile.lifestyle,
          ...prev.lifestyle,
        },
        goals: {
          ...userProfile.goals,
          ...prev.goals,
        },
      }));
    }
  }, [userProfile]);

  // Prepopulate clinical inputs from authoritative backend state
  useEffect(() => {
    let active = true;
    if (fetchClinicalState) {
      fetchClinicalState('female_pcos').then((state) => {
        if (!active || !state) return;
        setDraftProfile((prev) => {
          const t1 = state.tier_1_inputs || {};
          const next = { ...prev };
          if (t1.height_cm && (!prev.heightCm || prev.heightCm === 165)) {
            next.heightCm = Number(t1.height_cm);
          }
          if (t1.weight_kg && (!prev.weightKg || prev.weightKg === 62)) {
            next.weightKg = Number(t1.weight_kg);
          }
          if (t1.waist_inch && !prev.waistCm) {
            next.waistCm = Math.round(Number(t1.waist_inch) * 2.54);
          }
          if (t1.cycle_length_raw && (!prev.womensHealth?.cycleLength || prev.womensHealth.cycleLength === 28)) {
            next.womensHealth = {
              ...next.womensHealth,
              cycleLength: Number(t1.cycle_length_raw),
            };
          }
          return next;
        });
      }).catch((e) => console.warn('Female onboarding clinical state notice:', e));
    }
    return () => { active = false; };
  }, [fetchClinicalState]);

  // Preload dashboard route chunk when user reaches late onboarding steps
  useEffect(() => {
    if (currentStep >= 4) {
      preloadDashboardRoutes();
    }
  }, [currentStep]);

  // Route protection: If already onboarded and not explicitly re-onboarding, go directly to OvaSense app
  if (userProfile.isOnboarded && !isExplicitRelaunch) {
    return <Navigate to={ROUTES.APP.OVASENSE} replace />;
  }
  if (userProfile.pathway === 'male') {
    return <Navigate to={ROUTES.ONBOARDING_MALE} replace />;
  }

  const validateStep = (stepNum: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNum === 1) {
      if (!draftProfile.fullName.trim()) errs.fullName = 'Full Name is required.';

      const dobCheck = validateFemaleScreeningAge(draftProfile.dateOfBirth);
      if (!dobCheck.isValid) errs.dateOfBirth = dobCheck.error!;

      const phoneCheck = validatePakistaniPhone(draftProfile.phone, { optional: true });
      if (!phoneCheck.isValid) errs.phone = phoneCheck.error!;

      if (!draftProfile.email.trim()) errs.email = 'Email address is required.';
    }

    if (stepNum === 3) {
      if (draftProfile.womensHealth?.hasHadPeriod !== false && draftProfile.womensHealth?.ageAtMenarche) {
        const match = (draftProfile.dateOfBirth || '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
        if (match) {
          const birthYear = parseInt(match[1], 10);
          const birthMonth = parseInt(match[2], 10);
          const birthDay = parseInt(match[3], 10);
          const now = new Date();
          let currentAge = now.getFullYear() - birthYear;
          if (now.getMonth() + 1 < birthMonth || (now.getMonth() + 1 === birthMonth && now.getDate() < birthDay)) {
            currentAge--;
          }
          const menarche = Number(draftProfile.womensHealth.ageAtMenarche);
          if (menarche > currentAge) {
            errs.ageAtMenarche = `Age at first period (${menarche}) cannot exceed current age (${currentAge}).`;
          }
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep < femaleSteps.length) {
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
    const dobCheck = validateFemaleScreeningAge(draftProfile.dateOfBirth);
    if (!dobCheck.isValid) {
      setErrors({ dateOfBirth: dobCheck.error! });
      setCurrentStep(1);
      return;
    }
    setIsSubmitting(true);
    setIsProcessingScreening(true);
    setSaveError(undefined);
    setScreeningStatusMessage('Saving your health profile...');

    try {
      const femaleTier1Inputs = deriveFemaleTier1InputsFromProfile(draftProfile);

      const res = await finalizeOnboardingAndScreen(
        draftProfile,
        'female',
        femaleTier1Inputs,
        (step) => {
          if (step === 'saving_profile') {
            setScreeningStatusMessage('Saving your health profile...');
          } else if (step === 'analyzing_patterns') {
            setScreeningStatusMessage('Preparing your screening baseline...');
          } else if (step === 'syncing_timeline') {
            setScreeningStatusMessage('Synchronizing your health timeline...');
          } else if (step === 'preparing_guidance' || step === 'preparing_dashboard') {
            setScreeningStatusMessage('Preparing your personalized guidance...');
          }
        }
      );

      if (res.success && res.assessment) {
        navigate(ROUTES.APP.OVASENSE, { replace: true });
      } else {
        setIsProcessingScreening(false);
        setIsSubmitting(false);
        setSaveError(res.error || "We couldn't prepare your screening result. Please try again.");
      }
    } catch {
      setIsProcessingScreening(false);
      setIsSubmitting(false);
      setSaveError('A network error occurred while finalizing your profile. Please try again.');
    }
  };

  // Subtle Framer Motion transitions (respects reduced-motion)
  const motionVariants = {
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 },
    exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 },
  };

  if (isProcessingScreening) {
    return (
      <BioPulseLoadingScreen
        message={screeningStatusMessage}
        fullScreen={true}
      />
    );
  }

  const handleCancel = () => {
    navigate(ROUTES.APP.SETTINGS);
  };

  return (
    <FemaleOnboardingLayout
      currentStep={currentStep}
      totalSteps={femaleSteps.length}
      steps={femaleSteps}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      isSubmitting={isSubmitting}
      canGoBack={currentStep > 1}
      isUpdatingProfile={isUpdatingProfile}
      onCancel={isUpdatingProfile ? handleCancel : undefined}
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
              userDob={draftProfile.dateOfBirth}
              errors={errors}
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
