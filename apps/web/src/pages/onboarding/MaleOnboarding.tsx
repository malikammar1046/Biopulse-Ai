import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type {
  UserProfile,
  MedicalProfile,
  MensHealthProfile,
  LifestyleProfile,
} from '../../types/onboarding';
import { validateMaleScreeningAge, validatePakistaniPhone } from '../../utils/profileValidation';
import { MaleOnboardingLayout } from './male/MaleOnboardingLayout';
import { MaleStep1BasicInfo } from './male/MaleStep1BasicInfo';
import { MaleStep2HealthProfile } from './male/MaleStep2HealthProfile';
import { MaleStep3SymptomsADAM } from './male/MaleStep3SymptomsADAM';
import { MaleStep4Lifestyle } from './male/MaleStep4Lifestyle';
import { MaleStep5ReviewReady } from './male/MaleStep5ReviewReady';
import { preloadDashboardRoutes } from '../../utils/routePreloaders';
import { BioPulseLoadingScreen } from '../../components/brand/BioPulseLoadingScreen';
import { deriveMaleTier1InputsFromProfile } from '../../utils/tier1InputMappers';

export const MaleOnboarding: React.FC = () => {
  const { t } = useTranslation(['onboarding', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, finalizeOnboardingAndScreen, fetchClinicalState } = useUserHealth();
  const shouldReduceMotion = useReducedMotion();

  const isExplicitRelaunch = Boolean((location.state as any)?.allowReonboard);
  const isUpdatingProfile = Boolean(userProfile.isOnboarded && isExplicitRelaunch);

  const maleSteps = useMemo(() => [
    { number: '1', label: t('onboarding:stepLabels.basicInfo', 'Basic Info') },
    { number: '2', label: t('onboarding:stepLabels.healthProfile', 'Health Profile') },
    { number: '3', label: t('onboarding:stepLabels.symptomsAdam', 'Symptoms / ADAM') },
    { number: '4', label: t('onboarding:stepLabels.lifestyle', 'Lifestyle') },
    { number: '5', label: t('onboarding:stepLabels.reviewReady', 'Review & Ready') },
  ], [t]);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [isProcessingScreening, setIsProcessingScreening] = useState(false);
  const [screeningStatusMessage, setScreeningStatusMessage] = useState('Preparing your health profile...');

  // Editable draft profile state — 100% preserved with safe defaults
  const [draftProfile, setDraftProfile] = useState<UserProfile>(() => {
    const defaultHeight = userProfile.heightCm ?? null;
    const defaultWeight = userProfile.weightKg ?? null;
    const defaultWaist = (userProfile.waistCm && userProfile.waistCm > 0) ? userProfile.waistCm : null;

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
          : [],
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
        adamResponses: userProfile.mensHealth?.adamResponses,
        adamScore: userProfile.mensHealth?.adamScore,
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

  // Re-sync draft profile when userProfile is loaded or updated
  useEffect(() => {
    if (userProfile && (userProfile.fullName || userProfile.dateOfBirth || userProfile.medical || userProfile.mensHealth)) {
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
        mensHealth: prev.mensHealth ? {
          ...userProfile.mensHealth,
          ...prev.mensHealth,
          energyLevel: prev.mensHealth.energyLevel || userProfile.mensHealth?.energyLevel || 'moderate',
          sexDrive: prev.mensHealth.sexDrive || userProfile.mensHealth?.sexDrive || 'normal',
          erectileDifficulties: prev.mensHealth.erectileDifficulties || userProfile.mensHealth?.erectileDifficulties || 'none',
          muscleStrengthChanges: prev.mensHealth.muscleStrengthChanges || userProfile.mensHealth?.muscleStrengthChanges || 'stable',
          bodyHairChanges: prev.mensHealth.bodyHairChanges || userProfile.mensHealth?.bodyHairChanges || 'no_change',
          moodChanges: prev.mensHealth.moodChanges || userProfile.mensHealth?.moodChanges || [],
          sleepQuality: prev.mensHealth.sleepQuality || userProfile.mensHealth?.sleepQuality || 'restful',
        } : prev.mensHealth,
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
      fetchClinicalState('male_hypogonadism').then((state) => {
        if (!active || !state) return;
        setDraftProfile((prev) => {
          const t1 = state.tier_1_inputs || {};
          const next = { ...prev };
          if (t1.height_cm && (!prev.heightCm || prev.heightCm === 178)) {
            next.heightCm = Number(t1.height_cm);
          }
          if (t1.weight_kg && (!prev.weightKg || prev.weightKg === 80)) {
            next.weightKg = Number(t1.weight_kg);
          }
          if (t1.waist_cm && !prev.waistCm) {
            next.waistCm = Number(t1.waist_cm);
          }
          if (t1.adam_responses && (!prev.mensHealth?.adamResponses || Object.keys(prev.mensHealth.adamResponses).length === 0) && prev.mensHealth) {
            next.mensHealth = {
              ...prev.mensHealth,
              adamResponses: t1.adam_responses,
              adamScore: t1.adam_score ?? prev.mensHealth.adamScore,
            };
          }
          return next;
        });
      }).catch((e) => console.warn('Male onboarding clinical state notice:', e));
    }
    return () => { active = false; };
  }, [fetchClinicalState]);

  // Preload dashboard route chunk when user reaches late onboarding steps
  useEffect(() => {
    if (currentStep >= 4) {
      preloadDashboardRoutes();
    }
  }, [currentStep]);

  // Route protection: If already onboarded and not explicitly re-onboarding, go directly to AndroSense app
  if (userProfile.isOnboarded && !isExplicitRelaunch) {
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

      const dobCheck = validateMaleScreeningAge(draftProfile.dateOfBirth);
      if (!dobCheck.isValid) errs.dateOfBirth = dobCheck.error!;

      const phoneCheck = validatePakistaniPhone(draftProfile.phone, { optional: true });
      if (!phoneCheck.isValid) errs.phone = phoneCheck.error!;

      if (!draftProfile.email.trim()) errs.email = 'Email address is required.';
    }

    if (stepNum === 3) {
      const adam = draftProfile.mensHealth?.adamResponses || {};
      const answeredCount = Object.values(adam).filter((v) => v !== null && v !== undefined).length;
      if (answeredCount < 10) {
        errs.adam = 'Please answer all 10 ADAM questions to continue.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep < maleSteps.length) {
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
    // Blocking eligibility gate: Ensure age 19–60 before onboarding completion
    const dobCheck = validateMaleScreeningAge(draftProfile.dateOfBirth);
    if (!dobCheck.isValid) {
      setIsSubmitting(false);
      setIsProcessingScreening(false);
      setSaveError(dobCheck.error || 'BioPulse AI male screening is calibrated for adult men aged 19 to 60.');
      setCurrentStep(1);
      setErrors((prev) => ({ ...prev, dateOfBirth: dobCheck.error! }));
      return;
    }

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

  const handleCancel = () => {
    navigate(ROUTES.APP.SETTINGS);
  };

  return (
    <MaleOnboardingLayout
      currentStep={currentStep}
      totalSteps={maleSteps.length}
      steps={maleSteps}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      isSubmitting={isSubmitting}
      canGoBack={currentStep > 1}
      hideBottomNav={currentStep === 3}
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
              onComplete={handleNext}
              onBackToHealthProfile={handleBack}
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
