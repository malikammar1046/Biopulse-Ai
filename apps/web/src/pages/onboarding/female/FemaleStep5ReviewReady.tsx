import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Heart,
  AlertCircle,
} from 'lucide-react';
import type { UserProfile } from '../../../types/onboarding';
import { WhyWeAskCard } from './WhyWeAskCard';

interface FemaleStep5Props {
  profile: UserProfile;
  saveError?: string;
}

export const FemaleStep5ReviewReady: React.FC<FemaleStep5Props> = ({
  profile,
  saveError,
}) => {
  const symptomsList = profile.womensHealth?.commonSymptoms || [];
  const symptomsText =
    symptomsList.length === 0
      ? 'No symptoms reported'
      : `${symptomsList.length} symptom${symptomsList.length > 1 ? 's' : ''} noted`;

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
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#FDE6EF] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-[#F43F7D]" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#F43F7D] uppercase tracking-wider block leading-none">
            Final Confirmation
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            Review your BioPulse AI profile
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            Confirm your baseline information below to finalize your secure profile and begin exploring PCOS screening.
          </p>
        </div>
      </div>

      {/* ── Error Banner if Save Failed ── */}
      {saveError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-3">
          {/* Luminous Compact Hero Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAFCFF] via-[#FDF9FB] to-[#F5FAFC] border border-[#D7EAF2] flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-[#0E9EAA] to-[#F43F7D] p-0.5 shadow-xs flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#F43F7D]" />
              </div>
              <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#0E9EAA] border-2 border-white" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold font-display text-[#073B72] leading-tight">
                Your BioPulse AI profile is{' '}
                <span className="text-[#F43F7D]">ready.</span>
              </h3>
              <p className="text-xs text-[#55718F] italic font-serif">
                “Let’s understand your health, one pattern at a time.”
              </p>
            </div>
          </div>

          {/* Configured Baselines Checklist */}
          <div className="p-4 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#D7EAF2] text-xs font-mono text-[#073B72]">
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Configured Baselines
              </span>
              <span className="text-[#0E9EAA] font-bold text-[11px]">100% Complete</span>
            </div>

            <div className="space-y-1.5">
              {checks.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 border-b border-[#E8F1F5] last:border-none"
                >
                  <div className="flex items-center gap-2 text-[#073B72] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0E9EAA] shrink-0" />
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
          <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#073B72] block">
              You can now explore:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#55718F]">
              {focusList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F43F7D] shrink-0" />
                  <span className="leading-tight text-[11px]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Single Concise "Why we ask this" Card */}
        <div className="lg:col-span-4 space-y-3">
          <WhyWeAskCard
            title="Why we verify this"
            description="Reviewing your baseline ensures maximum accuracy for non-diagnostic PCOS stratification. You can update your biometrics, cycle dates, and symptom logs at any point from your dashboard."
          />

          <div className="p-3.5 rounded-2xl bg-[#DDF7F7]/50 border border-[#DDF7F7] text-xs text-[#073B72] space-y-1">
            <span className="font-bold text-[#0E9EAA] block font-mono text-[10px] uppercase tracking-wide">
              Clinical Disclaimer
            </span>
            <p className="text-[#55718F] text-[10px] leading-relaxed">
              BioPulse AI provides evidence-informed screening. It is not a diagnostic tool and does not replace professional medical consultation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
