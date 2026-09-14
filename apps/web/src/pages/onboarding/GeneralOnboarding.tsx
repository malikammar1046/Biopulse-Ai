import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Compass,
  Calendar,
  CheckCircle2,
  Phone,
  User,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import type { UserProfile, GeneralHealthProfile, LifestyleProfile } from '../../types/onboarding';
import { Logo } from '../../components/brand/Logo';
import { OnboardingProgressBar } from '../../components/onboarding/OnboardingProgressBar';
import { validateDateOfBirth, validatePakistaniPhone, getDobInputBounds } from '../../utils/profileValidation';

const GENERAL_STEPS = [
  { number: '1', label: 'Basic Info' },
  { number: '2', label: 'Health Focus' },
  { number: '3', label: 'Medical History' },
  { number: '4', label: 'Daily Habits' },
  { number: '5', label: 'Health Goals' },
  { number: '6', label: 'Review & Ready' },
];

const GENERAL_FOCUS_OPTIONS = [
  'Metabolic & Energy Balance',
  'Cardiovascular & Heart Health',
  'Deep Sleep & Circadian Rhythm',
  'Stress Resilience & Recovery',
  'Preventive Lab Panel Tracking',
  'Daily Nutrition & Hydration',
];

const GENERAL_GOALS_OPTIONS = [
  'Build consistent evidence-based wellness routines',
  'Organize and interpret verified medical lab reports',
  'Monitor vital health indicators over time',
  'Understand factors affecting daily energy and stamina',
  'Prepare informed questions for preventive doctor visits',
];

export const GeneralOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, completeOnboarding } = useUserHealth();

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Editable draft profile state
  const [draftProfile, setDraftProfile] = useState<UserProfile>(() => ({
    ...userProfile,
    gender: userProfile.gender || 'other',
    pathway: 'general',
    fullName: userProfile.fullName || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    dateOfBirth: userProfile.dateOfBirth || '',
    heightCm: userProfile.heightCm || 170,
    weightKg: userProfile.weightKg || 70,
    generalHealth: {
      primaryFocus: userProfile.generalHealth?.primaryFocus || ['Metabolic & Energy Balance', 'Deep Sleep & Circadian Rhythm'],
      energyPatterns: userProfile.generalHealth?.energyPatterns || 'Consistent with afternoon dips',
      stressLevel: userProfile.generalHealth?.stressLevel || 'moderate',
    },
    lifestyle: {
      dietaryPreference: userProfile.lifestyle?.dietaryPreference || 'Balanced Whole Foods',
      dailyWaterGlasses: userProfile.lifestyle?.dailyWaterGlasses || 8,
      activityLevel: userProfile.lifestyle?.activityLevel || 'moderate',
      exercisePreferences: userProfile.lifestyle?.exercisePreferences || ['Walking', 'Functional Fitness'],
      sleepHours: userProfile.lifestyle?.sleepHours || 7.5,
    },
    goals: {
      selectedGoals: userProfile.goals?.selectedGoals?.length
        ? userProfile.goals.selectedGoals
        : ['Build consistent evidence-based wellness routines', 'Organize and interpret verified medical lab reports'],
      supportPreference: userProfile.goals?.supportPreference || 'gentle_nudges',
    },
    emergencyContacts: userProfile.emergencyContacts?.length
      ? userProfile.emergencyContacts
      : [
          {
            name: '',
            relationship: 'Contact / Family',
            phone: '',
            isPrimary: true,
          },
        ],
  }));

  // Route protection: If already onboarded or wrong pathway
  if (userProfile.isOnboarded) {
    return <Navigate to={ROUTES.APP.VITASENSE} replace />;
  }
  if (userProfile.pathway !== 'general') {
    if (userProfile.pathway === 'female') {
      return <Navigate to={ROUTES.ONBOARDING_FEMALE} replace />;
    }
    if (userProfile.pathway === 'male') {
      return <Navigate to={ROUTES.ONBOARDING_MALE} replace />;
    }
    return <Navigate to={ROUTES.ONBOARDING} replace />;
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

  const updateGeneralHealth = (field: keyof GeneralHealthProfile, value: any) => {
    setDraftProfile((prev) => ({
      ...prev,
      generalHealth: { ...prev.generalHealth!, [field]: value },
    }));
  };

  const updateLifestyle = (field: keyof LifestyleProfile, value: any) => {
    setDraftProfile((prev) => ({
      ...prev,
      lifestyle: { ...prev.lifestyle, [field]: value },
    }));
  };

  const toggleFocus = (item: string) => {
    const existing = draftProfile.generalHealth?.primaryFocus || [];
    const next = existing.includes(item)
      ? existing.filter((i) => i !== item)
      : [...existing, item];
    updateGeneralHealth('primaryFocus', next);
  };

  const toggleGoal = (goal: string) => {
    const existing = draftProfile.goals?.selectedGoals || [];
    const next = existing.includes(goal)
      ? existing.filter((g: string) => g !== goal)
      : [...existing, goal];
    setDraftProfile((prev) => ({
      ...prev,
      goals: {
        selectedGoals: next,
        supportPreference: prev.goals?.supportPreference || 'gentle_nudges',
      },
    }));
  };

  const dobBounds = getDobInputBounds();

  const validateStep = (stepNum: number): boolean => {
    const errs: Record<string, string> = {};

    if (stepNum === 1) {
      if (!draftProfile.fullName.trim()) errs.fullName = 'Full Name is required.';
      
      const dobCheck = validateDateOfBirth(draftProfile.dateOfBirth);
      if (!dobCheck.isValid) errs.dateOfBirth = dobCheck.error!;

      const phoneCheck = validatePakistaniPhone(draftProfile.phone);
      if (!phoneCheck.isValid) errs.phone = phoneCheck.error!;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < GENERAL_STEPS.length) {
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

  const handleEnterVITASense = async () => {
    setIsSubmitting(true);
    setSaveError(undefined);
    try {
      const res = await completeOnboarding({
        ...draftProfile,
        pathway: 'general',
        isOnboarded: true,
      });

      if (res.success) {
        navigate(ROUTES.APP.VITASENSE, { replace: true });
      } else {
        setSaveError(res.error || 'Unable to save profile. Please try again.');
        setIsSubmitting(false);
      }
    } catch {
      setSaveError('A network error occurred while finalizing your profile.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1A12] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-white/10">
        <Link to={ROUTES.HOME} className="flex items-center gap-2 group transition-transform hover:scale-[1.01]">
          <Logo size="sm" theme="dark" />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/30 font-bold">
            BIOPulse AI Baseline
          </span>
          <span className="text-[11px] text-[#A7F3D0]/70 hidden sm:inline">Encrypted Onboarding</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl w-full mx-auto my-8 flex-1">
        <OnboardingProgressBar
          currentStep={currentStep}
          totalSteps={GENERAL_STEPS.length}
          steps={GENERAL_STEPS}
          onStepClick={(step) => {
            if (step < currentStep) setCurrentStep(step);
          }}
        />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Basic Information ── */}
          {currentStep === 1 && (
            <motion.div
              key="general-step-1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] font-bold">
                  Step 1 • Basic Profile
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Let’s start with your baseline profile.
                </h2>
                <p className="text-sm text-[#A7F3D0]/80">
                  This establishes your secure personal health record and sets your wellness baseline.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#122A1E]/80 border border-white/10 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider block mb-1">
                    Full Name <span className="text-[#34D399]">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#A7F3D0]/60 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={draftProfile.fullName}
                      onChange={(e) => updateDraft('fullName', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0B1E15] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#34D399]"
                      placeholder="Taylor Smith"
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-[#34D399] mt-1">{errors.fullName}</p>}
                </div>

                {/* Date of Birth & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider flex items-center justify-between mb-1">
                      <span>Date of Birth <span className="text-[#34D399]">*</span></span>
                      <span className="text-[10px] text-[#A7F3D0]/70 font-mono">16 – 50 years</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[#A7F3D0]/60 absolute left-3.5 top-3.5" />
                      <input
                        type="date"
                        min={dobBounds.min}
                        max={dobBounds.max}
                        value={draftProfile.dateOfBirth}
                        onChange={(e) => updateDraft('dateOfBirth', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0B1E15] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#34D399]"
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-xs text-[#34D399] mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider flex items-center justify-between mb-1">
                      <span>Phone Number <span className="text-[#34D399]">*</span></span>
                      <span className="text-[10px] text-[#A7F3D0]/70 font-mono">11 digits (03xx or +92)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#A7F3D0]/60 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        value={draftProfile.phone}
                        onChange={(e) => updateDraft('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#0B1E15] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#34D399]"
                        placeholder="03001234567 or +923001234567"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-[#34D399] mt-1">{errors.phone}</p>}
                  </div>
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider block mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={240}
                      value={draftProfile.heightCm || ''}
                      onChange={(e) => updateDraft('heightCm', Number(e.target.value) || null)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#0B1E15] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#34D399]"
                      placeholder="170"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider block mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={250}
                      value={draftProfile.weightKg || ''}
                      onChange={(e) => updateDraft('weightKg', Number(e.target.value) || null)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#0B1E15] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#34D399]"
                      placeholder="70"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Health Focus & Baseline Priorities ── */}
          {currentStep === 2 && (
            <motion.div
              key="general-step-2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] font-bold">
                  Step 2 • Baseline Health Focus
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  What health priorities matter most to you?
                </h2>
                <p className="text-sm text-[#A7F3D0]/80">
                  Select the pillars you want BioPulse AI to highlight across your tracking and report analytics.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#122A1E]/80 border border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GENERAL_FOCUS_OPTIONS.map((item) => {
                    const isSelected = draftProfile.generalHealth?.primaryFocus?.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleFocus(item)}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#34D399]/20 border-[#34D399] text-white font-semibold'
                            : 'bg-[#0B1E15] border-white/10 text-[#A7F3D0]/70 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs">{item}</span>
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#34D399] border-[#34D399] text-[#0A1A12]' : 'border-white/30'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Medical History & Preventive Context ── */}
          {currentStep === 3 && (
            <motion.div
              key="general-step-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] font-bold">
                  Step 3 • Medical & Preventive Context
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Routine care & health background.
                </h2>
                <p className="text-sm text-[#A7F3D0]/80">
                  Understanding your routine checkup cadence helps coordinate preventive reminders.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#122A1E]/80 border border-white/10 space-y-4">
                <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider block">
                  How recently did you complete a general annual checkup or blood panel?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Within last 6 months', desc: 'Recent records available' },
                    { label: 'Within last 1-2 years', desc: 'Relatively current' },
                    { label: 'Over 2 years ago', desc: 'Due for routine evaluation' },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      className="p-3.5 rounded-2xl bg-[#0B1E15] border border-white/10 text-left hover:border-white/20 transition-all cursor-pointer"
                    >
                      <div className="font-semibold text-xs text-white">{opt.label}</div>
                      <div className="text-[10px] text-[#A7F3D0]/60 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Daily Habits & Lifestyle ── */}
          {currentStep === 4 && (
            <motion.div
              key="general-step-4"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] font-bold">
                  Step 4 • Daily Habits & Lifestyle
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Sleep, movement, and hydration.
                </h2>
                <p className="text-sm text-[#A7F3D0]/80">
                  Foundational habits that support metabolic health and steady energy.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#122A1E]/80 border border-white/10 space-y-4">
                {/* Sleep */}
                <div>
                  <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider block mb-1">
                    Average Sleep: <span className="text-[#34D399]">{draftProfile.lifestyle.sleepHours} hours / night</span>
                  </label>
                  <input
                    type="range"
                    min={4}
                    max={12}
                    step={0.5}
                    value={draftProfile.lifestyle.sleepHours}
                    onChange={(e) => updateLifestyle('sleepHours', parseFloat(e.target.value))}
                    className="w-full accent-[#34D399] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#A7F3D0]/60 mt-1 font-mono">
                    <span>4 hrs</span>
                    <span>7-8 hrs (Optimal)</span>
                    <span>12 hrs</span>
                  </div>
                </div>

                {/* Activity Level */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-[#E6F4EA] uppercase tracking-wider block mb-2">
                    Physical Activity Routine
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'sedentary', label: 'Light / Desk' },
                      { key: 'light', label: '1-2 Days / Wk' },
                      { key: 'moderate', label: '3-4 Days / Wk' },
                      { key: 'very_active', label: '5+ Days / Wk' },
                    ].map((act) => (
                      <button
                        key={act.key}
                        type="button"
                        onClick={() => updateLifestyle('activityLevel', act.key)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                          draftProfile.lifestyle.activityLevel === act.key
                            ? 'bg-[#34D399] text-[#0A1A12] border-[#34D399] font-bold'
                            : 'bg-[#0B1E15] text-[#A7F3D0]/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 5: Health Goals ── */}
          {currentStep === 5 && (
            <motion.div
              key="general-step-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] font-bold">
                  Step 5 • Your Health Goals
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  What would you like to focus on?
                </h2>
                <p className="text-sm text-[#A7F3D0]/80">
                  Select the primary outcomes you want BioPulse AI to prioritize.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#122A1E]/80 border border-white/10 space-y-3">
                {GENERAL_GOALS_OPTIONS.map((goal) => {
                  const isSelected = draftProfile.goals?.selectedGoals?.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#34D399]/20 border-[#34D399] text-white font-semibold'
                          : 'bg-[#0B1E15] border-white/10 text-[#A7F3D0]/70 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">{goal}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#34D399] border-[#34D399] text-[#0A1A12]' : 'border-white/30'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Step 6: Review & Ready ── */}
          {currentStep === 6 && (
            <motion.div
              key="general-step-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              <div className="text-center space-y-2 py-2">
                <div className="w-16 h-16 rounded-full mx-auto bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#34D399] flex items-center justify-center text-[#0A1A12] shadow-xl shadow-emerald-950/50 font-bold">
                  <Compass className="w-8 h-8 text-[#0A1A12]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  Your BIOPulse AI profile is ready.
                </h2>
                <p className="text-sm text-[#E6F4EA] max-w-md mx-auto">
                  Your baseline health dashboard has been provisioned with your wellness priorities and lifestyle tracking tools.
                </p>
              </div>

              {saveError && (
                <div className="p-3.5 rounded-2xl bg-[#E87084]/15 border border-[#E87084]/40 text-xs text-[#F48498] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Feature Highlights */}
              <div className="p-6 rounded-3xl bg-[#122A1E]/80 border border-white/10 space-y-3">
                <span className="text-xs font-mono uppercase tracking-widest text-[#34D399] font-bold block">
                  What You Can Now Explore in BIOPulse AI:
                </span>
                <ul className="space-y-2 text-xs text-[#A7F3D0]/80">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Baseline health overview, daily vitals, and wellness index</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Evidence-based lifestyle, nutrition, and hydration tracking</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Verified lab report integration & OCR report organization</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Longitudinal monitoring & preventive health timelines</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                    <span>Interactive health education & conversational AI explanations</span>
                  </li>
                </ul>
              </div>

              <motion.button
                type="button"
                disabled={isSubmitting}
                onClick={handleEnterVITASense}
                whileHover={!isSubmitting ? { y: -2, boxShadow: '0 10px 25px -5px rgba(52, 211, 153, 0.4)' } : undefined}
                whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                className="w-full min-h-[50px] px-6 py-3.5 rounded-2xl font-sans font-bold text-sm text-[#0A1A12] bg-gradient-to-r from-[#34D399] via-[#6EE7B7] to-[#34D399] border border-white/20 hover:brightness-110 shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#0A1A12]" />
                    <span>Initializing BIOPulse AI...</span>
                  </>
                ) : (
                  <>
                    <span>Enter BIOPulse AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Navigation Buttons (Steps 1 to 5) */}
        {currentStep < 6 && (
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2.5 rounded-xl border border-white/15 text-xs text-[#A7F3D0]/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <motion.button
              type="button"
              onClick={handleNext}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 rounded-xl font-sans font-semibold text-xs text-[#0A1A12] bg-gradient-to-r from-[#34D399] to-[#6EE7B7] border border-[#34D399]/40 hover:brightness-110 shadow-md shadow-emerald-950/40 transition-all flex items-center gap-2 cursor-pointer font-bold"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#A7F3D0]/60 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#34D399]" />
          <span>Encrypted HIPAA-grade health data container.</span>
        </div>
        <div>
          <span>BIOPulse AI provides baseline health guidance and does not replace medical advice.</span>
        </div>
      </footer>
    </div>
  );
};

export default GeneralOnboarding;
