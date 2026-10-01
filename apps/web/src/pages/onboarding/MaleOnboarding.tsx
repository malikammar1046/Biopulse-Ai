import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type {
  UserProfile,
  MedicalProfile,
  MensHealthProfile,
  LifestyleProfile,
} from '../../types/onboarding';
import { validateDateOfBirth, validatePakistaniPhone } from '../../utils/profileValidation';
import { MaleOnboardingLayout } from './male/MaleOnboardingLayout';
import { MaleStep1BasicInfo } from './male/MaleStep1BasicInfo';
import { MaleStep2HealthProfile } from './male/MaleStep2HealthProfile';
import { MaleStep3SymptomsADAM } from './male/MaleStep3SymptomsADAM';
import { MaleStep4Lifestyle } from './male/MaleStep4Lifestyle';
import { MaleStep5ReviewReady } from './male/MaleStep5ReviewReady';
import { preloadDashboardRoutes } from '../../utils/routePreloaders';
import { BioPulseLoadingScreen } from '../../components/brand/BioPulseLoadingScreen';
import { deriveMaleTier1InputsFromProfile } from '../../utils/tier1InputMappers';

const MALE_STEPS = [
  { number: '1', label: 'Basic Info' },
  { number: '2', label: 'Health Profile' },
  { number: '3', label: 'Symptoms / ADAM' },
  { number: '4', label: 'Lifestyle' },
  { number: '5', label: 'Review & Ready' },
];

export const MaleOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, finalizeOnboardingAndScreen } = useUserHealth();
  const shouldReduceMotion = useReducedMotion();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isProcessingScreening, setIsProcessingScreening] = useState(false);
  const [screeningStatusMessage, setScreeningStatusMessage] = useState('Preparing your health profile...');

  // Editable draft profile state — 100% preserved with safe defaults
  const [draftProfile, setDraftProfile] = useState<UserProfile>(() => {
    const defaultHeight = userProfile.heightCm || 178;
    const defaultWeight = userProfile.weightKg || 80;
    const defaultWaist = userProfile.waistCm || 88;

    return {
      ...userProfile,
      gender: 'male',
      pathway: 'male',
      fullName: userProfile.fullName || '',
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      dateOfBirth: userProfile.dateOfBirth || '',
      avatarUrl: userProfile.avatarUrl || '',
      heightCm: defaultHeight,
      weightKg: defaultWeight,
      waistCm: defaultWaist,
      medical: {
        bloodType: userProfile.medical?.bloodType || '',
        allergies: userProfile.medical?.allergies || ['None'],
        medications: userProfile.medical?.medications || [],
        conditions: userProfile.medical?.conditions?.length
          ? userProfile.medical.conditions
          : ['None of these'],
        surgeries: userProfile.medical?.surgeries || [],
        familyHistory: userProfile.medical?.familyHistory?.length
          ? userProfile.medical.familyHistory
          : ['None known'],
      },
      mensHealth: {
        maritalStatus: userProfile.mensHealth?.maritalStatus || 'unmarried',
        marriageYears: userProfile.mensHealth?.marriageYears ?? 0,
        hasKids: userProfile.mensHealth?.hasKids ?? false,
        kidsCount: userProfile.mensHealth?.kidsCount ?? 0,
        tryingToConceive: userProfile.mensHealth?.tryingToConceive ?? false,
        intimacyFrequency: userProfile.mensHealth?.intimacyFrequency || 'regular',
        intimacySatisfaction: userProfile.mensHealth?.intimacySatisfaction || 'satisfied',
        energyLevel: userProfile.mensHealth?.energyLevel || 'moderate',
        sexDrive: userProfile.mensHealth?.sexDrive || 'normal',
        erectileDifficulties: userProfile.mensHealth?.erectileDifficulties || 'none',
        muscleStrengthChanges: userProfile.mensHealth?.muscleStrengthChanges || 'stable',
        bodyHairChanges: userProfile.mensHealth?.bodyHairChanges || 'no_change',
        moodChanges: userProfile.mensHealth?.moodChanges || [],
        sleepQuality: userProfile.mensHealth?.sleepQuality || 'restful',
        hadTestosteroneTest: userProfile.mensHealth?.hadTestosteroneTest || 'no',
        testosteroneValue: userProfile.mensHealth?.testosteroneValue || null,
        testosteroneUnit: userProfile.mensHealth?.testosteroneUnit || 'ng/dL',
        testDrawTime: userProfile.mensHealth?.testDrawTime || 'morning_fasting',
        priorMedications: userProfile.mensHealth?.priorMedications?.length
          ? userProfile.mensHealth.priorMedications
          : ['None of the above'],
      },
      lifestyle: {
        dietaryPreference: userProfile.lifestyle?.dietaryPreference || 'Balanced',
        dailyWaterGlasses: userProfile.lifestyle?.dailyWaterGlasses || 8,
        activityLevel: userProfile.lifestyle?.activityLevel || 'moderate',
        exercisePreferences: userProfile.lifestyle?.exercisePreferences?.length
          ? userProfile.lifestyle.exercisePreferences
          : ['Resistance Training', 'Running / Cardio'],
        sleepHours: userProfile.lifestyle?.sleepHours || 7.5,
        fastFoodIntake: userProfile.lifestyle?.fastFoodIntake || 'occasional',
        regularExercise: userProfile.lifestyle?.regularExercise ?? true,
      },
      goals: {
        selectedGoals: userProfile.goals?.selectedGoals?.length
          ? userProfile.goals.selectedGoals
          : [
              'Understand energy, stamina, and recovery patterns',
              'Monitor hormone and male vitality indicators',
              'Track daily symptoms and strength trends over time',
            ],
        supportPreference: userProfile.goals?.supportPreference || 'structured_weekly',
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
      womensHealth: userProfile.womensHealth || {
        cycleLength: 28,
        lastPeriodDate: '',
        periodRegularity: 'mostly_regular',
        periodDuration: 5,
        commonSymptoms: [],
        currentCycleDay: 14,
        currentPhase: 'follicular',
      },
    };
  });

  // Preload dashboard route chunk when user reaches late onboarding steps
  useEffect(() => {
    if (currentStep >= 4) {
      preloadDashboardRoutes();
    }
  }, [currentStep]);

  // Route protection: If already onboarded, go directly to AndroSense app
  if (userProfile.isOnboarded) {
    return <Navigate to={ROUTES.APP.ANDROSENSE} replace />;
  }
  if (userProfile.pathway === 'female') {
    return <Navigate to={ROUTES.ONBOARDING_FEMALE} replace />;
  }

  const updateDraft = (field: string, value: any) => {
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateMedical = (medical: MedicalProfile) => {
    setDraftProfile((prev) => ({ ...prev, medical }));
  };

  const updateMensHealth = (mensHealth: MensHealthProfile) => {
    setDraftProfile((prev) => ({ ...prev, mensHealth }));
  };

  const updateLifestyle = (lifestyle: LifestyleProfile) => {
    setDraftProfile((prev) => ({ ...prev, lifestyle }));
  };

  const validateStep = (stepNum: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNum === 1) {
      if (!draftProfile.fullName.trim()) errs.fullName = 'Full Name is required.';

      const dobCheck = validateDateOfBirth(draftProfile.dateOfBirth);
      if (!dobCheck.isValid) errs.dateOfBirth = dobCheck.error!;

      const phoneCheck = validatePakistaniPhone(draftProfile.phone);
      if (!phoneCheck.isValid) errs.phone = phoneCheck.error!;

      if (!draftProfile.email.trim()) errs.email = 'Email address is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep < MALE_STEPS.length) {
      if (!validateStep(currentStep)) return;
      setCurrentStep((prev) => prev + 1);
    } else {
      handleEnterAndroSense();
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

  const handleEnterAndroSense = async () => {
    setIsSubmitting(true);
    setIsProcessingScreening(true);
    setSaveError(undefined);
    setScreeningStatusMessage('Saving your health profile...');

    try {
      const maleTier1Inputs = deriveMaleTier1InputsFromProfile(draftProfile);

      const res = await finalizeOnboardingAndScreen(
        draftProfile,
        'male',
        maleTier1Inputs,
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
        navigate(ROUTES.APP.ANDROSENSE, { replace: true });
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

  return (
    <MaleOnboardingLayout
      currentStep={currentStep}
      totalSteps={MALE_STEPS.length}
      steps={MALE_STEPS}
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
          {currentStep === 1 && (
            <MaleStep1BasicInfo
              data={{
                fullName: draftProfile.fullName,
                email: draftProfile.email,
                phone: draftProfile.phone,
                dateOfBirth: draftProfile.dateOfBirth,
                avatarUrl: draftProfile.avatarUrl,
                heightCm: draftProfile.heightCm,
                weightKg: draftProfile.weightKg,
                waistCm: draftProfile.waistCm,
              }}
              onChange={updateDraft}
              errors={errors}
            />
          )}

          {currentStep === 2 && (
            <MaleStep2HealthProfile
              medical={draftProfile.medical}
              mensHealth={draftProfile.mensHealth!}
              onMedicalChange={updateMedical}
              onMensHealthChange={updateMensHealth}
            />
          )}

          {currentStep === 3 && (
            <MaleStep3SymptomsADAM
              data={draftProfile.mensHealth!}
              onChange={updateMensHealth}
            />
          )}

          {currentStep === 4 && (
            <MaleStep4Lifestyle
              data={draftProfile.lifestyle}
              onChange={updateLifestyle}
            />
          )}

          {currentStep === 5 && (
            <MaleStep5ReviewReady
              profile={draftProfile}
              saveError={saveError}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </MaleOnboardingLayout>
  );
};

export default MaleOnboarding;
