import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Activity, Compass, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import type { HealthPathway, UserGender } from '../../types/onboarding';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthCard } from '../../components/auth/AuthCard';

export const OnboardingDispatcher: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useUserHealth();
  const [selectedPathway, setSelectedPathway] = useState<HealthPathway>(() => {
    if (userProfile.pathway === 'male') return 'male';
    if (userProfile.pathway === 'general') return 'general';
    return 'female';
  });
  const [saving, setSaving] = useState(false);

  // 1. If already onboarded, go to user's specialized dashboard
  if (userProfile.isOnboarded) {
    return <Navigate to={getPathwayDashboardRoute(userProfile)} replace />;
  }

  // 2. Interactive Pathway Selector
  const handleConfirmPathway = async () => {
    setSaving(true);
    const derivedGender: UserGender =
      selectedPathway === 'female' ? 'female' : selectedPathway === 'male' ? 'male' : 'other';

    await updateUserProfile({
      pathway: selectedPathway,
      gender: derivedGender,
    });

    const target =
      selectedPathway === 'female'
        ? ROUTES.ONBOARDING_FEMALE
        : selectedPathway === 'male'
        ? ROUTES.ONBOARDING_MALE
        : ROUTES.ONBOARDING_GENERAL;

    navigate(target, { replace: true });
  };

  return (
    <AuthShell
      headlineLine1="Welcome to"
      headlineLine2="VITASense Health Intelligence."
      supportingCopy="Please choose your specialized health pathway to begin your tailored onboarding experience."
      identityTag="Select Health Pathway"
    >
      <AuthCard
        heading="Select your health pathway"
        subheading="Choose the companion experience and screening focus tailored to you."
        headerAccessory={
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE4F7]/10 border border-[#8E3EAF]/30 text-xs text-[#D8B4FE]">
            <Sparkles className="w-3.5 h-3.5 text-[#E87084]" />
            <span>Personalized Experience</span>
          </div>
        }
      >
        <div className="space-y-4 text-left">
          {/* Informative Guidance */}
          <div className="p-3.5 rounded-2xl bg-[#12071F]/80 border border-[#8E3EAF]/30 space-y-1">
            <p className="text-xs text-[#EDE4F7] font-medium leading-relaxed">
              We’ll use your selection to personalize your onboarding questions and health tools.
            </p>
            <p className="text-[11px] text-[#A797BD]">
              This sets your companion experience and is not a medical diagnosis.
            </p>
          </div>

          {/* Pathway Selection Cards */}
          <div className="space-y-3 pt-1">
            {/* 1. Women's Health (OvaSense AI) */}
            <button
              type="button"
              onClick={() => setSelectedPathway('female')}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                selectedPathway === 'female'
                  ? 'bg-gradient-to-r from-[#6E2D8B]/40 to-[#8E3EAF]/30 border-[#FB7185] ring-1 ring-[#FB7185]/50 shadow-md shadow-purple-950/40'
                  : 'bg-[#180A26]/80 border-white/10 hover:border-[#8E3EAF]/50 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPathway === 'female'
                      ? 'bg-gradient-to-br from-[#FB7185] to-[#E87084] text-white shadow-md'
                      : 'bg-white/10 text-[#CDBDD8]'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#FB7185] font-bold">
                      Women's Health
                    </span>
                    <span className="text-sm font-bold text-white font-display">
                      OvaSense AI
                    </span>
                  </div>
                  <p className="text-xs text-[#CDBDD8] mt-1 leading-relaxed">
                    PCOS screening, cycle tracking, reproductive health, and hormonal patterns.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedPathway === 'female'
                    ? 'border-[#FB7185] bg-[#FB7185] text-white'
                    : 'border-white/30 bg-transparent'
                }`}
              >
                {selectedPathway === 'female' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* 2. Men's Health (AndroSense AI) */}
            <button
              type="button"
              onClick={() => setSelectedPathway('male')}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                selectedPathway === 'male'
                  ? 'bg-gradient-to-r from-[#1E293B]/60 to-[#334155]/40 border-[#38BDF8] ring-1 ring-[#38BDF8]/50 shadow-md shadow-sky-950/40'
                  : 'bg-[#180A26]/80 border-white/10 hover:border-[#38BDF8]/50 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPathway === 'male'
                      ? 'bg-gradient-to-br from-[#38BDF8] to-[#0284C7] text-white shadow-md'
                      : 'bg-white/10 text-[#CDBDD8]'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#38BDF8] font-bold">
                      Men's Health
                    </span>
                    <span className="text-sm font-bold text-white font-display">
                      AndroSense AI
                    </span>
                  </div>
                  <p className="text-xs text-[#CDBDD8] mt-1 leading-relaxed">
                    Male hypogonadism screening, hormone vitality, energy rhythms, and symptoms.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedPathway === 'male'
                    ? 'border-[#38BDF8] bg-[#38BDF8] text-white'
                    : 'border-white/30 bg-transparent'
                }`}
              >
                {selectedPathway === 'male' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>

            {/* 3. General Health (VITASense) */}
            <button
              type="button"
              onClick={() => setSelectedPathway('general')}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                selectedPathway === 'general'
                  ? 'bg-gradient-to-r from-[#14532D]/40 to-[#166534]/30 border-[#34D399] ring-1 ring-[#34D399]/50 shadow-md shadow-emerald-950/40'
                  : 'bg-[#180A26]/80 border-white/10 hover:border-[#34D399]/50 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedPathway === 'general'
                      ? 'bg-gradient-to-br from-[#34D399] to-[#059669] text-white shadow-md'
                      : 'bg-white/10 text-[#CDBDD8]'
                  }`}
                >
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#34D399] font-bold">
                      General Health
                    </span>
                    <span className="text-sm font-bold text-white font-display">
                      VITASense
                    </span>
                  </div>
                  <p className="text-xs text-[#CDBDD8] mt-1 leading-relaxed">
                    Baseline health tracking, metabolic wellness, nutrition, and routine monitoring.
                  </p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedPathway === 'general'
                    ? 'border-[#34D399] bg-[#34D399] text-white'
                    : 'border-white/30 bg-transparent'
                }`}
              >
                {selectedPathway === 'general' && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>

          {/* Action Button */}
          <div className="pt-3">
            <motion.button
              type="button"
              disabled={saving}
              onClick={handleConfirmPathway}
              whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(162, 28, 175, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full min-h-[48px] px-6 py-3 rounded-2xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#A21CAF] border border-[#8E3EAF]/40 hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>Continue to Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
};

export default OnboardingDispatcher;
