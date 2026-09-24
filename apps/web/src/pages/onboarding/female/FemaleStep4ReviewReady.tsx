import React from 'react';
import {
  CheckCircle,
  ShieldTick,
  Heart,
  AlertCircle,
} from '@untitledui/icons';
import type { UserProfile } from '../../../types/onboarding';
import { WhyWeAskCard } from './WhyWeAskCard';

interface FemaleStep4Props {
  profile: UserProfile;
  saveError?: string;
}

export const FemaleStep4ReviewReady: React.FC<FemaleStep4Props> = ({
  profile,
  saveError,
}) => {
  const checks = [
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
          ? 'No active conditions / allergies reported'
          : `${profile.medical?.conditions?.length || 0} conditions • ${
              profile.medical?.allergies?.length || 0
            } allergies`,
    },
    {
      label: 'Reproductive & Period Profile',
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
      label: 'BioPulse AI Screening Status',
      val: 'Profile Ready • Non-diagnostic ML analysis enabled',
    },
  ];

  const focusList = [
    'Health overview & PCOS screening',
    'Menstrual cycle rhythm & symptoms',
    'Lab reports & nutrition tracking',
    'Explainable AI insights & longitudinal monitoring',
  ];

  return (
    <div className="space-y-6 text-left">
      {/* ── Question Header ── */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldTick className="w-6 h-6 sm:w-7 sm:h-7 text-[#0288D1]" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] sm:text-xs font-bold font-mono text-[#0288D1] uppercase tracking-wider block">
            Final Confirmation
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#073B72] tracking-tight">
            Review your BioPulse AI profile.
          </h2>
          <p className="text-xs sm:text-sm text-[#55718F] font-sans">
            Confirm your baseline information below to finalize your secure profile and begin exploring PCOS screening.
          </p>
        </div>
      </div>

      {/* ── Error Banner if Save Failed ── */}
      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Luminous Hero Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#FAFCFF] via-[#F0F9FF] to-[#F5FAFC] border border-[#D7EAF2] flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#0288D1] to-[#01579B] p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Heart className="w-8 h-8 text-[#0288D1]" aria-hidden="true" />
              </div>
              <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-[#0288D1] border-2 border-white shadow-2xs" />
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold font-display text-[#073B72]">
                Your BioPulse AI profile is{' '}
                <span className="text-[#0288D1]">ready.</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#55718F] italic font-serif">
                “Let’s understand your health, one pattern at a time.”
              </p>
            </div>
          </div>

          {/* Configured Baselines Checklist */}
          <div className="p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D7EAF2] text-xs font-mono text-[#073B72]">
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider">
                <ShieldTick className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                Configured Baselines
              </span>
              <span className="text-[#0288D1] font-bold">100% Complete</span>
            </div>

            <div className="space-y-2.5">
              {checks.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 border-b border-[#E8F1F5] last:border-none"
                >
                  <div className="flex items-center gap-2 text-[#073B72] font-medium">
                    <CheckCircle className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[11px] text-[#55718F] font-mono truncate max-w-[220px] text-right">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* What You Can Explore Overview */}
          <div className="p-4 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#073B72] block">
              You can now explore:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#55718F]">
              {focusList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1] shrink-0" />
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: "Why we verify this?" Card */}
        <div className="lg:col-span-4 space-y-4">
          <WhyWeAskCard
            title="Why we verify this?"
            description="Reviewing your baseline ensures maximum accuracy for non-diagnostic PCOS stratification. You can update your biometrics, cycle dates, and symptom logs at any point from your dashboard."
          />

          <div className="p-4 rounded-2xl bg-[#E0F2FE]/50 border border-[#BAE6FD] text-xs text-[#073B72] space-y-1.5">
            <span className="font-bold text-[#0288D1] block font-mono text-[11px] uppercase tracking-wide">
              Clinical Disclaimer
            </span>
            <p className="text-[#55718F] text-[11px] leading-relaxed">
              BioPulse AI provides evidence-informed screening and risk indicators. It is not a diagnostic tool and does not replace medical consultation with a licensed endocrinologist or gynecologist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
