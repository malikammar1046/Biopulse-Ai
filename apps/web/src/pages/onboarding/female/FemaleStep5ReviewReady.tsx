import React, { useState } from 'react';
import {
  CheckCircle,
  ShieldTick,
  AlertCircle,
} from '@untitledui/icons';
import type { UserProfile } from '../../../types/onboarding';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';
import { UserAvatar } from '../../../components/common/UserAvatar';

interface FemaleStep5Props {
  profile: UserProfile;
  saveError?: string;
}

export const FemaleStep5ReviewReady: React.FC<FemaleStep5Props> = ({
  profile,
  saveError,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const symptomsList = profile.womensHealth?.commonSymptoms || [];
  const symptomsText =
    symptomsList.length === 0
      ? 'No symptoms reported'
      : `${symptomsList.length} symptom${symptomsList.length > 1 ? 's' : ''} noted`;

  const checks = [
    {
      label: 'Profile Picture',
      val: profile.avatarUrl ? 'Configured' : 'Avatar set',
    },
    {
      label: 'Personal & Biometrics',
      val: `${profile.fullName || 'User'} • ${
        profile.heightCm ? `${profile.heightCm} cm` : 'Height set'
      } / ${profile.weightKg ? `${profile.weightKg} kg` : 'Weight set'}`,
    },
    {
      label: 'Medical Baseline',
      val:
        (profile.medical?.conditions?.length || 0) + (profile.medical?.allergies?.length || 0) === 0
          ? 'No active conditions reported'
          : `${profile.medical?.conditions?.length || 0} conditions • ${
              profile.medical?.allergies?.length || 0
            } allergies`,
    },
    {
      label: 'Period & Cycle',
      val: `${
        typeof profile.womensHealth?.cycleLength === 'number'
          ? `${profile.womensHealth.cycleLength}-day cycle`
          : 'Cycle recorded'
      } • ${
        profile.womensHealth?.periodRegularity
          ? profile.womensHealth.periodRegularity.replace(/_/g, ' ')
          : 'Tracked'
      }`,
    },
    {
      label: 'Symptoms & Patterns',
      val: symptomsText,
    },
    {
      label: 'BioPulse AI Screening Status',
      val: 'Profile Ready • Non-diagnostic ML analysis enabled',
    },
  ];

  const focusList = [
    'Health overview & PCOS screening',
    'Menstrual cycle rhythm & symptoms',
    'Lab reports & nutrition tracking',
    'Explainable AI insights & monitoring',
  ];

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FCE7F3] flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldTick className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#F43F7D] uppercase tracking-wider block leading-none">
              Final Confirmation
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              Review your BioPulse AI profile
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger
          onClick={() => setShowWhyModal(true)}
          label="Why we verify this"
          accentColor="rose"
        />
      </div>

      <p className="text-[14px] sm:text-[15px] text-[#55718F] font-sans leading-relaxed">
        Confirm your baseline information below to finalize your secure profile and begin exploring PCOS screening.
      </p>

      {/* ── Error Banner if Save Failed ── */}
      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-[14px] sm:text-[15px] text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Main Review Content (Full Width) ── */}
      <div className="w-full space-y-4">
          {/* Profile Hero Card with Avatar */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FAFCFF] via-[#FDF2F8]/40 to-[#F0FDF4]/30 border border-[#D7EAF2] flex items-center gap-5">
            <UserAvatar
              avatarUrl={profile.avatarUrl}
              name={profile.fullName}
              pathway="female"
              size="lg"
              className="ring-3 ring-[#F43F7D]/30 shadow-xs shrink-0"
            />

            <div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] leading-tight">
                {profile.fullName ? `Welcome, ${profile.fullName}` : 'Your BioPulse AI profile is ready'}
              </h3>
              <p className="text-[14px] sm:text-[15px] text-[#55718F] font-sans mt-1">
                Baseline calibrated • Ready to explore personalized insights
              </p>
            </div>
          </div>

          {/* Configured Baselines Checklist */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D7EAF2]">
              <span className="flex items-center gap-2.5 font-bold tracking-wide text-[15px] sm:text-[16px] uppercase text-[#073B72]">
                <ShieldTick className="w-5 h-5 text-[#F43F7D]" aria-hidden="true" />
                Configured Baselines
              </span>
              <span className="text-[#0E9EAA] font-bold text-[13px] bg-[#EAFBFC] px-3 py-1 rounded-full border border-[#B2EBF2]">
                100% Complete
              </span>
            </div>

            <div className="space-y-1">
              {checks.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5 sm:py-3 border-b border-[#E8F1F5] last:border-none gap-4"
                >
                  <div className="flex items-center gap-2.5 text-[#073B72] font-semibold shrink-0">
                    <CheckCircle className="w-5 h-5 text-[#0E9EAA] shrink-0" aria-hidden="true" />
                    <span className="text-[14px] sm:text-[15px] font-sans">{item.label}</span>
                  </div>
                  <span className="text-[14px] sm:text-[15px] text-[#486581] font-sans text-right max-w-sm sm:max-w-md">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What You Can Explore Overview */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <span className="text-[14px] sm:text-[15px] font-bold font-sans uppercase tracking-wider text-[#073B72] block">
              You can now explore:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#486581]">
              {focusList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#F43F7D] shrink-0" />
                  <span className="leading-snug text-[14px] sm:text-[15px] font-sans font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Why we verify your baseline"
        icon={ShieldTick}
        accentColor="rose"
      >
        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3]">
          <span className="font-bold text-[14px] sm:text-[15px] text-[#F43F7D] block mb-1">Baseline Accuracy</span>
          <p className="text-[13px] sm:text-[14px] text-[#486581] leading-relaxed">
            Reviewing your baseline ensures maximum accuracy for non-diagnostic PCOS stratification. You can update your biometrics, cycle dates, and symptom logs at any point from your dashboard.
          </p>
        </div>

        <div className="p-4 sm:p-4.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1">
          <span className="font-bold text-[12px] sm:text-[13px] text-[#0288D1] block uppercase tracking-wide">
            Clinical Disclaimer
          </span>
          <p className="text-[13px] sm:text-[14px] text-[#55718F] leading-relaxed">
            BioPulse AI provides evidence-informed screening. It is not a diagnostic tool and does not replace professional medical consultation.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
