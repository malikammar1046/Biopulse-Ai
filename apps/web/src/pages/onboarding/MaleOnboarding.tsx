import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Phone,
  User,
  AlertCircle,
  Loader2,
  Check,
  Activity,
  Heart,
  Moon,
  Sparkles,
  Scale,
  Ruler,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type { UserProfile, MensHealthProfile, LifestyleProfile } from '../../types/onboarding';
import { Logo } from '../../components/brand/Logo';
import { OnboardingProgressBar } from '../../components/onboarding/OnboardingProgressBar';
import {
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
} from '../../utils/unitConversions';

const MALE_STEPS = [
  { number: '1', label: 'Basic Info' },
  { number: '2', label: 'Marriage & Family' },
  { number: '3', label: 'Vitality & Health' },
  { number: '4', label: 'Review & Ready' },
];

const MALE_MOOD_OPTIONS = [
  'Low Morning Motivation',
  'Brain Fog / Focus Dips',
  'Irritability or Mood Shifts',
  'Afternoon Energy Crashes',
  'Restless Sleep',
];

const MALE_MEDICATION_FACTORS = [
  'Prescription Opioids / Pain Regimens',
  'Prior Testosterone or Anabolic Steroid Use',
  'Glucocorticoids / Corticosteroid Therapy',
  'Blood Pressure / Cardiovascular Medication',
  'None of the above',
];

export const MaleOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, completeOnboarding } = useUserHealth();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Unit toggle states for Biometrics
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [waistUnit, setWaistUnit] = useState<'cm' | 'in'>('cm');

  // Editable draft profile state
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
      heightCm: defaultHeight,
      weightKg: defaultWeight,
      waistCm: defaultWaist,
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
        priorMedications: userProfile.mensHealth?.priorMedications || [],
      },
      lifestyle: {
        dietaryPreference: userProfile.lifestyle?.dietaryPreference || 'High Protein / Balanced',
        dailyWaterGlasses: userProfile.lifestyle?.dailyWaterGlasses || 8,
        activityLevel: userProfile.lifestyle?.activityLevel || 'moderate',
        exercisePreferences: userProfile.lifestyle?.exercisePreferences || ['Resistance Training', 'Running'],
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
    };
  });

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

  const updateMensHealth = (field: keyof MensHealthProfile, value: any) => {
    setDraftProfile((prev) => ({
      ...prev,
      mensHealth: { ...prev.mensHealth!, [field]: value },
    }));
  };

  const updateLifestyle = (field: keyof LifestyleProfile, value: any) => {
    setDraftProfile((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: value },
    }));
  };

  const toggleMoodChange = (item: string) => {
    const existing = draftProfile.mensHealth?.moodChanges || [];
    const next = existing.includes(item)
      ? existing.filter((i) => i !== item)
      : [...existing, item];
    updateMensHealth('moodChanges', next);
  };

  const toggleMedicationFactor = (factor: string) => {
    const existing = draftProfile.mensHealth?.priorMedications || [];
    if (factor === 'None of the above') {
      updateMensHealth('priorMedications', ['None of the above']);
      return;
    }
    const filtered = existing.filter((f) => f !== 'None of the above');
    const next = filtered.includes(factor)
      ? filtered.filter((f) => f !== factor)
      : [...filtered, factor];
    updateMensHealth('priorMedications', next.length > 0 ? next : ['None of the above']);
  };

  const validateStep = (stepNum: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNum === 1) {
      if (!draftProfile.fullName.trim()) errs.fullName = 'Full Name is required.';
      if (!draftProfile.phone.trim()) errs.phone = 'Phone number is required for alerts.';
      if (!draftProfile.dateOfBirth) errs.dateOfBirth = 'Date of birth is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < MALE_STEPS.length) {
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

  const handleEnterAndroSense = async () => {
    setIsSubmitting(true);
    setSaveError(undefined);
    try {
      const res = await completeOnboarding({
        ...draftProfile,
        gender: 'male',
        pathway: 'male',
        isOnboarded: true,
      });

      if (res.success) {
        navigate(ROUTES.APP.ANDROSENSE, { replace: true });
      } else {
        setSaveError(res.error || 'Unable to save profile. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setSaveError('A network error occurred while finalizing your profile.');
      setIsSubmitting(false);
    }
  };

  // Helper values for Feet/Inches display
  const { feet, inches } = cmToFtIn(draftProfile.heightCm);
  const displayLbs = kgToLbs(draftProfile.weightKg);
  const displayWaistInches = cmToInches(draftProfile.waistCm);

  // BMI Calculation
  const heightM = (draftProfile.heightCm || 178) / 100;
  const bmiValue = draftProfile.weightKg
    ? (draftProfile.weightKg / (heightM * heightM)).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-[#0A101D] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <Logo size="sm" theme="dark" showTagline tagline="Men's Health Companion" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/30 font-bold">
            AndroSense AI
          </span>
          <span className="text-[11px] text-[#94A3B8] hidden sm:inline">Encrypted Onboarding</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl w-full mx-auto my-8 flex-1">
        <OnboardingProgressBar
          currentStep={currentStep}
          totalSteps={MALE_STEPS.length}
          steps={MALE_STEPS}
          onStepClick={(step) => {
            if (step < currentStep) setCurrentStep(step);
          }}
        />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Basic Info & Biometrics (with Unit Conversion) ── */}
          {currentStep === 1 && (
            <motion.div
              key="male-step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] font-bold">
                  Step 1 • Basic Profile & Biometrics
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Let’s start with your baseline information.
                </h2>
                <p className="text-sm text-[#94A3B8]">
                  This helps AndroSense AI calibrate metabolic indices, hormone screening, and body composition context.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#131D31]/80 border border-white/10 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-1">
                    Full Name <span className="text-[#38BDF8]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={draftProfile.fullName}
                      onChange={(e) => updateDraft('fullName', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0F172A] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                      placeholder="e.g. Tariq Mahmood"
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-[#38BDF8] mt-1">{errors.fullName}</p>}
                </div>

                {/* Date of Birth & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-1">
                      Date of Birth <span className="text-[#38BDF8]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                      <input
                        type="date"
                        value={draftProfile.dateOfBirth}
                        onChange={(e) => updateDraft('dateOfBirth', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0F172A] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-xs text-[#38BDF8] mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-1">
                      Phone Number <span className="text-[#38BDF8]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={draftProfile.phone}
                        onChange={(e) => updateDraft('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0F172A] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                        placeholder="+92 300 1234567"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-[#38BDF8] mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Biometrics with Interactive Unit Conversions */}
                <div className="pt-3 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider font-mono">
                      Physical Measurements & Units
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">Switch units anytime</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* 1. Height (cm vs ft/in) */}
                    <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#E2E8F0] flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Height</span>
                        </label>
                        {/* Unit Toggle */}
                        <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setHeightUnit('cm')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              heightUnit === 'cm' ? 'bg-[#38BDF8] text-[#0F172A] font-bold shadow' : 'text-[#94A3B8]'
                            }`}
                          >
                            cm
                          </button>
                          <button
                            type="button"
                            onClick={() => setHeightUnit('ft_in')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              heightUnit === 'ft_in' ? 'bg-[#38BDF8] text-[#0F172A] font-bold shadow' : 'text-[#94A3B8]'
                            }`}
                          >
                            ft/in
                          </button>
                        </div>
                      </div>

                      {heightUnit === 'cm' ? (
                        <div className="relative">
                          <input
                            type="number"
                            min={100}
                            max={250}
                            value={draftProfile.heightCm || ''}
                            onChange={(e) => updateDraft('heightCm', Number(e.target.value) || null)}
                            className="w-full px-3 py-2 rounded-xl bg-[#131D31] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                            placeholder="178"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#94A3B8]">cm</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input
                              type="number"
                              min={3}
                              max={7}
                              value={feet || ''}
                              onChange={(e) => {
                                const newFeet = parseInt(e.target.value, 10) || 0;
                                updateDraft('heightCm', ftInToCm(newFeet, inches));
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[#131D31] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                              placeholder="5"
                            />
                            <span className="absolute right-2.5 top-2.5 text-xs text-[#94A3B8]">ft</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={11}
                              value={inches ?? ''}
                              onChange={(e) => {
                                const newInches = parseInt(e.target.value, 10) || 0;
                                updateDraft('heightCm', ftInToCm(feet, newInches));
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-[#131D31] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                              placeholder="10"
                            />
                            <span className="absolute right-2.5 top-2.5 text-xs text-[#94A3B8]">in</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Weight (kg vs lbs) */}
                    <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#E2E8F0] flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Weight</span>
                        </label>
                        {/* Unit Toggle */}
                        <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setWeightUnit('kg')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              weightUnit === 'kg' ? 'bg-[#38BDF8] text-[#0F172A] font-bold shadow' : 'text-[#94A3B8]'
                            }`}
                          >
                            kg
                          </button>
                          <button
                            type="button"
                            onClick={() => setWeightUnit('lbs')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              weightUnit === 'lbs' ? 'bg-[#38BDF8] text-[#0F172A] font-bold shadow' : 'text-[#94A3B8]'
                            }`}
                          >
                            lbs
                          </button>
                        </div>
                      </div>

                      {weightUnit === 'kg' ? (
                        <div className="relative">
                          <input
                            type="number"
                            min={30}
                            max={250}
                            step="0.5"
                            value={draftProfile.weightKg || ''}
                            onChange={(e) => updateDraft('weightKg', Number(e.target.value) || null)}
                            className="w-full px-3 py-2 rounded-xl bg-[#131D31] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                            placeholder="80"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#94A3B8]">kg</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min={65}
                            max={550}
                            step="1"
                            value={displayLbs || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateDraft('weightKg', lbsToKg(val));
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#131D31] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                            placeholder="176"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#94A3B8]">lbs</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Waist Circumference (cm vs in) */}
                    <div className="p-3.5 rounded-2xl bg-[#0F172A] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#E2E8F0] flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Waist</span>
                        </label>
                        {/* Unit Toggle */}
                        <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setWaistUnit('cm')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              waistUnit === 'cm' ? 'bg-[#38BDF8] text-[#0F172A] font-bold shadow' : 'text-[#94A3B8]'
                            }`}
                          >
                            cm
                          </button>
                          <button
                            type="button"
                            onClick={() => setWaistUnit('in')}
                            className={`px-2 py-0.5 rounded-md transition-all ${
                              waistUnit === 'in' ? 'bg-[#38BDF8] text-[#0F172A] font-bold shadow' : 'text-[#94A3B8]'
                            }`}
                          >
                            in
                          </button>
                        </div>
                      </div>

                      {waistUnit === 'cm' ? (
                        <div className="relative">
                          <input
                            type="number"
                            min={50}
                            max={180}
                            value={draftProfile.waistCm || ''}
                            onChange={(e) => updateDraft('waistCm', Number(e.target.value) || null)}
                            className="w-full px-3 py-2 rounded-xl bg-[#131D31] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                            placeholder="88"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#94A3B8]">cm</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            min={20}
                            max={70}
                            step="0.5"
                            value={displayWaistInches || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              updateDraft('waistCm', inchesToCm(val));
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-[#131D31] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
                            placeholder="34.5"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-[#94A3B8]">in</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {bmiValue && (
                    <div className="p-3 rounded-2xl bg-[#0F172A]/80 border border-white/10 flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8]">Estimated BMI:</span>
                      <span className="font-mono font-bold text-[#38BDF8]">{bmiValue} kg/m²</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Marriage, Family & Intimacy ── */}
          {currentStep === 2 && (
            <motion.div
              key="male-step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] font-bold">
                  Step 2 • Marriage, Family & Reproductive Health
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Family context and intimacy indicators.
                </h2>
                <p className="text-sm text-[#94A3B8]">
                  Hormonal rhythms, testosterone bioavailability, and reproductive health are deeply connected to life stages and marital vitality.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#131D31]/80 border border-white/10 space-y-6">
                {/* 1. Marital Status Selection */}
                <div>
                  <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-2">
                    Marital Status <span className="text-[#38BDF8]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateMensHealth('maritalStatus', 'unmarried')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        draftProfile.mensHealth?.maritalStatus === 'unmarried'
                          ? 'bg-gradient-to-r from-[#0284C7]/40 to-[#38BDF8]/30 border-[#38BDF8] ring-1 ring-[#38BDF8]/50 text-white shadow-md'
                          : 'bg-[#0F172A] text-[#94A3B8] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">Single / Unmarried</span>
                        {draftProfile.mensHealth?.maritalStatus === 'unmarried' && (
                          <Check className="w-4 h-4 text-[#38BDF8]" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#94A3B8] block">Individual wellness & vitality</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateMensHealth('maritalStatus', 'married')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        draftProfile.mensHealth?.maritalStatus === 'married'
                          ? 'bg-gradient-to-r from-[#0284C7]/40 to-[#38BDF8]/30 border-[#38BDF8] ring-1 ring-[#38BDF8]/50 text-white shadow-md'
                          : 'bg-[#0F172A] text-[#94A3B8] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">Married</span>
                        {draftProfile.mensHealth?.maritalStatus === 'married' && (
                          <Check className="w-4 h-4 text-[#38BDF8]" />
                        )}
                      </div>
                      <span className="text-[11px] text-[#94A3B8] block">Family, children & intimacy health</span>
                    </button>
                  </div>
                </div>

                {/* ── Married Conditional Section ── */}
                {draftProfile.mensHealth?.maritalStatus === 'married' ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-5 pt-4 border-t border-white/10"
                  >
                    {/* Marriage Duration */}
                    <div>
                      <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-2">
                        Years Married: <span className="text-[#38BDF8] font-mono">{draftProfile.mensHealth.marriageYears} {draftProfile.mensHealth.marriageYears === 1 ? 'Year' : 'Years'}</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: '< 1 Year', val: 1 },
                          { label: '2–3 Years', val: 3 },
                          { label: '4–7 Years', val: 5 },
                          { label: '8+ Years', val: 10 },
                        ].map((m) => (
                          <button
                            key={m.val}
                            type="button"
                            onClick={() => updateMensHealth('marriageYears', m.val)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                              draftProfile.mensHealth?.marriageYears === m.val
                                ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                                : 'bg-[#0F172A] text-[#94A3B8] border-white/10 hover:border-white/20'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Children / Kids */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block">
                        Children & Family Planning
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            updateMensHealth('hasKids', false);
                            updateMensHealth('kidsCount', 0);
                          }}
                          className={`p-3 rounded-2xl border text-center text-xs font-semibold cursor-pointer ${
                            !draftProfile.mensHealth?.hasKids
                              ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                              : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                          }`}
                        >
                          No Children Yet
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateMensHealth('hasKids', true);
                            if (!draftProfile.mensHealth?.kidsCount) updateMensHealth('kidsCount', 1);
                          }}
                          className={`p-3 rounded-2xl border text-center text-xs font-semibold cursor-pointer ${
                            draftProfile.mensHealth?.hasKids
                              ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                              : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                          }`}
                        >
                          Have Children
                        </button>
                      </div>

                      {draftProfile.mensHealth?.hasKids && (
                        <div className="pt-2">
                          <label className="text-[11px] text-[#94A3B8] block mb-1">
                            Number of Children:
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map((count) => (
                              <button
                                key={count}
                                type="button"
                                onClick={() => updateMensHealth('kidsCount', count)}
                                className={`p-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                  draftProfile.mensHealth?.kidsCount === count
                                    ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8]'
                                    : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                                }`}
                              >
                                {count === 4 ? '4+' : count}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Trying to Conceive / Fertility Planning */}
                      <div className="pt-2">
                        <label className="text-xs font-semibold text-[#E2E8F0] block mb-2">
                          Are you and your partner actively planning or trying to conceive?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: true, label: 'Yes, actively trying' },
                            { key: false, label: 'Not at this time' },
                          ].map((plan) => (
                            <button
                              key={String(plan.key)}
                              type="button"
                              onClick={() => updateMensHealth('tryingToConceive', plan.key)}
                              className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                draftProfile.mensHealth?.tryingToConceive === plan.key
                                  ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                                  : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                              }`}
                            >
                              {plan.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sex Life & Intimacy (Clinical & Respectful) */}
                    <div className="space-y-4 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-[#38BDF8]" />
                        <span className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider font-mono">
                          Intimacy & Marital Vitality
                        </span>
                      </div>

                      {/* Sex Drive */}
                      <div>
                        <label className="text-xs font-semibold text-[#E2E8F0] block mb-1.5">
                          How would you describe your current sex drive & desire?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'normal', label: 'Normal & Healthy' },
                            { key: 'reduced', label: 'Noticeably Reduced' },
                            { key: 'significantly_reduced', label: 'Significantly Low' },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => updateMensHealth('sexDrive', opt.key)}
                              className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                draftProfile.mensHealth?.sexDrive === opt.key
                                  ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                                  : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Firmness / Erectile Difficulties */}
                      <div>
                        <label className="text-xs font-semibold text-[#E2E8F0] block mb-1.5">
                          Have you experienced difficulties with firmness or maintaining intimacy?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'none', label: 'No Difficulties' },
                            { key: 'occasional', label: 'Occasional Dips' },
                            { key: 'frequent', label: 'Frequent / Noticeable' },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => updateMensHealth('erectileDifficulties', opt.key)}
                              className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                draftProfile.mensHealth?.erectileDifficulties === opt.key
                                  ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                                  : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Intimacy Satisfaction */}
                      <div>
                        <label className="text-xs font-semibold text-[#E2E8F0] block mb-1.5">
                          Overall Intimacy Satisfaction:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: 'satisfied', label: 'Satisfied & Healthy' },
                            { key: 'mild_concerns', label: 'Mild Concerns' },
                            { key: 'significant_difficulty', label: 'Noticeable Strain' },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => updateMensHealth('intimacySatisfaction', opt.key)}
                              className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                                draftProfile.mensHealth?.intimacySatisfaction === opt.key
                                  ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                                  : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Unmarried Section ── */
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                      <span className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider font-mono">
                        Vitality & Hormonal Baseline
                      </span>
                    </div>

                    {/* Sex Drive */}
                    <div>
                      <label className="text-xs font-semibold text-[#E2E8F0] block mb-1.5">
                        How would you describe your baseline sex drive & libido?
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'normal', label: 'Normal & Healthy' },
                          { key: 'reduced', label: 'Noticeably Reduced' },
                          { key: 'significantly_reduced', label: 'Significantly Low' },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => updateMensHealth('sexDrive', opt.key)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                              draftProfile.mensHealth?.sexDrive === opt.key
                                ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                                : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Spontaneous Firmness */}
                    <div>
                      <label className="text-xs font-semibold text-[#E2E8F0] block mb-1.5">
                        Morning & Spontaneous Firmness:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'none', label: 'Regular & Healthy' },
                          { key: 'occasional', label: 'Occasional / Inconsistent' },
                          { key: 'frequent', label: 'Rare / Absent' },
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => updateMensHealth('erectileDifficulties', opt.key)}
                            className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                              draftProfile.mensHealth?.erectileDifficulties === opt.key
                                ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold'
                                : 'bg-[#0F172A] text-[#94A3B8] border-white/10'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Vitality, Health History & Sleep Recovery ── */}
          {currentStep === 3 && (
            <motion.div
              key="male-step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] font-bold">
                  Step 3 • Vitality, Symptoms & Sleep Recovery
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Energy, strength, and sleep rhythms.
                </h2>
                <p className="text-sm text-[#94A3B8]">
                  Testosterone synthesis peaks during deep REM sleep. Evaluating energy patterns helps establish your clinical screening profile.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#131D31]/80 border border-white/10 space-y-5">
                {/* 1. Daily Energy Level */}
                <div>
                  <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-2">
                    Daily Energy Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { key: 'high', label: 'High & Consistent' },
                      { key: 'moderate', label: 'Moderate' },
                      { key: 'low', label: 'Low Energy' },
                      { key: 'very_low', label: 'Frequently Exhausted' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updateMensHealth('energyLevel', opt.key)}
                        className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                          draftProfile.mensHealth?.energyLevel === opt.key
                            ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold shadow-md'
                            : 'bg-[#0F172A] text-[#94A3B8] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Muscle Strength & Physical Recovery */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-2">
                    Muscle Strength & Physical Recovery
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: 'stable', label: 'Stable & Strong' },
                      { key: 'reduced', label: 'Reduced Strength' },
                      { key: 'significantly_reduced', label: 'Noticeable Loss' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => updateMensHealth('muscleStrengthChanges', opt.key)}
                        className={`p-3 rounded-2xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                          draftProfile.mensHealth?.muscleStrengthChanges === opt.key
                            ? 'bg-[#38BDF8] text-[#0F172A] border-[#38BDF8] font-bold shadow-md'
                            : 'bg-[#0F172A] text-[#94A3B8] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Sleep Recovery (Integrated from removed daily recovery step) */}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>Average Sleep Duration</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-[#38BDF8]">
                      {draftProfile.lifestyle.sleepHours} Hours / Night
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    step={0.5}
                    value={draftProfile.lifestyle.sleepHours}
                    onChange={(e) => updateLifestyle('sleepHours', parseFloat(e.target.value))}
                    className="w-full accent-[#38BDF8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1 font-mono">
                    <span>4 hrs</span>
                    <span>7–8 hrs (Optimized)</span>
                    <span>12 hrs</span>
                  </div>
                </div>

                {/* 4. Mood & Focus Patterns */}
                <div className="pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-2">
                    Have you noticed any of these mood or focus patterns?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {MALE_MOOD_OPTIONS.map((item) => {
                      const isSelected = draftProfile.mensHealth?.moodChanges?.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleMoodChange(item)}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white font-semibold'
                              : 'bg-[#0F172A] border-white/10 text-[#94A3B8] hover:border-white/20'
                          }`}
                        >
                          <span>{item}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#38BDF8]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Relevant Medication & Health History */}
                <div className="pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-[#E2E8F0] uppercase tracking-wider block mb-2">
                    Relevant Medication & Medical History:
                  </label>
                  <div className="space-y-2">
                    {MALE_MEDICATION_FACTORS.map((factor) => {
                      const isSelected = draftProfile.mensHealth?.priorMedications?.includes(factor);
                      return (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => toggleMedicationFactor(factor)}
                          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-white font-semibold'
                              : 'bg-[#0F172A] border-white/10 text-[#94A3B8] hover:border-white/20'
                          }`}
                        >
                          <span>{factor}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#38BDF8]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Review & Ready (Step 4 Complete Card) ── */}
          {currentStep === 4 && (
            <motion.div
              key="male-step-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="text-center space-y-2 py-2">
                <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-tr from-[#0284C7] via-[#38BDF8] to-[#67E8F9] flex items-center justify-center text-[#0F172A] shadow-xl shadow-sky-950/50 font-bold">
                  <Activity className="w-8 h-8 text-[#0F172A]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Your AndroSense AI profile is ready.
                </h2>
                <p className="text-sm text-[#E2E8F0] max-w-md mx-auto">
                  Your personalized men’s health companion has been initialized with your physical biometrics, family context, and vitality indicators.
                </p>
              </div>

              {saveError && (
                <div className="p-3.5 rounded-2xl bg-[#E87084]/15 border border-[#E87084]/40 text-xs text-[#F48498] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Profile Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Biometrics Card */}
                <div className="p-4 rounded-2xl bg-[#131D31]/80 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-bold tracking-wider">
                    Biometrics
                  </span>
                  <p className="text-sm font-bold text-white">
                    {draftProfile.heightCm} cm • {draftProfile.weightKg} kg
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    Waist: {draftProfile.waistCm} cm {bmiValue ? `• BMI: ${bmiValue}` : ''}
                  </p>
                </div>

                {/* 2. Family & Marital Status */}
                <div className="p-4 rounded-2xl bg-[#131D31]/80 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-bold tracking-wider">
                    Family & Life Stage
                  </span>
                  <p className="text-sm font-bold text-white capitalize">
                    {draftProfile.mensHealth?.maritalStatus === 'married'
                      ? `Married (${draftProfile.mensHealth.marriageYears} yrs)`
                      : 'Single / Unmarried'}
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {draftProfile.mensHealth?.maritalStatus === 'married'
                      ? draftProfile.mensHealth.hasKids
                        ? `${draftProfile.mensHealth.kidsCount} Children`
                        : 'No children yet'
                      : 'Independent wellness'}
                  </p>
                </div>

                {/* 3. Vitality & Sleep */}
                <div className="p-4 rounded-2xl bg-[#131D31]/80 border border-white/10 space-y-1">
                  <span className="text-[10px] font-mono text-[#38BDF8] uppercase font-bold tracking-wider">
                    Vitality Baseline
                  </span>
                  <p className="text-sm font-bold text-white capitalize">
                    {draftProfile.mensHealth?.energyLevel} Energy
                  </p>
                  <p className="text-xs text-[#94A3B8]">
                    {draftProfile.lifestyle.sleepHours} hrs sleep / night
                  </p>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="p-6 rounded-3xl bg-[#131D31]/80 border border-white/10 space-y-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[#38BDF8] font-bold block">
                  What You Can Now Explore in AndroSense AI:
                </span>
                <ul className="space-y-2 text-xs text-[#94A3B8]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Personalized male health & hormone vitality overview</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Male hypogonadism screening context & explainable insights</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Energy rhythm logging, sleep recovery, and stamina patterns</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Longitudinal monitoring & doctor consultation prep</span>
                  </li>
                </ul>
              </div>

              <motion.button
                type="button"
                disabled={isSubmitting}
                onClick={handleEnterAndroSense}
                whileHover={!isSubmitting ? { y: -2, boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.4)' } : undefined}
                whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                className="w-full min-h-[50px] px-6 py-3.5 rounded-2xl font-sans font-bold text-sm text-[#0F172A] bg-gradient-to-r from-[#38BDF8] via-[#67E8F9] to-[#38BDF8] border border-white/20 hover:brightness-110 shadow-xl shadow-sky-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0F172A]" />
                    <span>Initializing AndroSense AI...</span>
                  </>
                ) : (
                  <>
                    <span>Enter AndroSense AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Navigation Buttons (Steps 1 to 3) */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-xs text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 rounded-xl font-sans font-semibold text-xs text-[#0F172A] bg-gradient-to-r from-[#38BDF8] to-[#67E8F9] border border-[#38BDF8]/40 hover:brightness-110 shadow-md shadow-sky-950/40 transition-all flex items-center gap-2 cursor-pointer font-bold"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#94A3B8] gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#34D399]" />
          <span>Encrypted HIPAA-grade health data container.</span>
        </div>
        <div>
          <span>AndroSense AI provides health guidance and does not replace medical advice.</span>
        </div>
      </footer>
    </div>
  );
};

export default MaleOnboarding;
