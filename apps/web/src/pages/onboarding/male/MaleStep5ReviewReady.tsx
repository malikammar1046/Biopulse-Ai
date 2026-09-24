import React from 'react';
import {
  CheckCircle,
  ShieldTick,
  AlertCircle,
  Beaker01,
} from '@untitledui/icons';
import type { UserProfile } from '../../../types/onboarding';
import { MaleWhyWeAskCard } from './MaleWhyWeAskCard';

interface MaleStep5Props {
  profile: UserProfile;
  saveError?: string;
}

export const MaleStep5ReviewReady: React.FC<MaleStep5Props> = ({
  profile,
  saveError,
}) => {
  const mh = profile.mensHealth || {
    energyLevel: 'moderate',
    sexDrive: 'normal',
    erectileDifficulties: 'none',
    muscleStrengthChanges: 'stable',
    bodyHairChanges: 'no_change',
    moodChanges: [],
    sleepQuality: 'restful',
  };

  // BMI Calculation
  const heightM = (profile.heightCm || 178) / 100;
  const bmiValue = profile.weightKg
    ? (profile.weightKg / (heightM * heightM)).toFixed(1)
    : null;

  // Active symptoms count
  const symptomFlags: string[] = [];
  if (mh.sexDrive === 'reduced' || mh.sexDrive === 'significantly_reduced') symptomFlags.push('Reduced libido');
  if (mh.energyLevel === 'low' || mh.energyLevel === 'very_low') symptomFlags.push('Low energy / fatigue');
  if (mh.sleepQuality === 'poor' || mh.sleepQuality === 'frequently_waking') symptomFlags.push('Sleep disruption');
  if (mh.muscleStrengthChanges === 'reduced' || mh.muscleStrengthChanges === 'significantly_reduced') symptomFlags.push('Reduced strength');
  if (mh.erectileDifficulties === 'occasional' || mh.erectileDifficulties === 'frequent') symptomFlags.push('Firmness dips');
  if ((mh.moodChanges || []).length > 0) symptomFlags.push('Mood / motivation shifts');
  if (mh.bodyHairChanges === 'thinning' || mh.bodyHairChanges === 'reduced_growth') symptomFlags.push('Hair thinning');

  const symptomsSummary =
    symptomFlags.length === 0
      ? 'No active symptoms reported'
      : `${symptomFlags.length} indicator${symptomFlags.length > 1 ? 's' : ''} noted (${symptomFlags.slice(0, 2).join(', ')}${symptomFlags.length > 2 ? '...' : ''})`;

  const reviewRows = [
    {
      label: 'Personal & Biometrics',
      val: `${profile.fullName || 'User'} • ${profile.heightCm ? `${profile.heightCm} cm` : 'Height set'} / ${
        profile.weightKg ? `${profile.weightKg} kg` : 'Weight set'
      } • Waist: ${profile.waistCm ? `${profile.waistCm} cm` : 'Waist set'}${bmiValue ? ` (BMI: ${bmiValue})` : ''}`,
    },
    {
      label: 'Medical Baseline',
      val:
        (profile.medical?.conditions?.length || 0) === 0 || profile.medical?.conditions?.includes('None of these conditions')
          ? 'No chronic conditions reported'
          : profile.medical?.conditions?.join(', '),
    },
    {
      label: 'Hormone & Vitality Symptoms (ADAM)',
      val: symptomsSummary,
    },
    {
      label: 'Lifestyle & Recovery',
      val: `${profile.lifestyle?.sleepHours || 7.5} hrs sleep • ${profile.lifestyle?.activityLevel || 'moderate'} activity • ${
        profile.lifestyle?.regularExercise ? 'Regular workouts' : 'Casual activity'
      }`,
    },
    {
      label: 'BioPulse AI Screening Status',
      val: 'Profile Ready • Non-diagnostic ML analysis enabled',
    },
  ];

  const exploreList = [
    'Baseline male hormone & vitality overview',
    'Epidemiological hypogonadism risk screening',
    'Activity rhythms, recovery, and stamina tracking',
    'Actionable health habits for natural vitality',
  ];

  return (
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#DDF7F7] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldTick className="w-5 h-5 text-[#0E9EAA]" aria-hidden="true" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#0E9EAA] uppercase tracking-wider block leading-none">
            Final Confirmation
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            Review your BioPulse AI profile
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            Confirm your baseline information below to finalize your secure profile and begin exploring male hypogonadism screening.
          </p>
        </div>
      </div>

      {/* ── Error Banner if Save Failed ── */}
      {saveError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Review Cards Column */}
        <div className="lg:col-span-8 space-y-3">
          {/* Summary Details Card */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#D7EAF2] shadow-2xs space-y-2.5">
            {reviewRows.map((row, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-[#F0F5F8] last:border-0 last:pb-0"
              >
                <span className="text-[11px] font-bold font-mono text-[#55718F] uppercase tracking-wide">
                  {row.label}
                </span>
                <span className="text-xs font-semibold text-[#073B72] text-left sm:text-right max-w-sm truncate">
                  {row.val}
                </span>
              </div>
            ))}
          </div>

          {/* Tier 2 Laboratory Blood Tests Notice */}
          <div className="p-3 rounded-xl bg-[#EAFBFC] border border-[#B2EBF2] flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#DDF7F7] flex items-center justify-center text-[#0E9EAA] shrink-0 mt-0.5">
              <Beaker01 className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="text-[11px] text-[#55718F] leading-snug">
              <span className="font-bold text-[#073B72] block">Clinical Lab Results (Tier 2):</span>
              You can add laboratory results (such as morning fasting total testosterone, SHBG, and metabolic labs) later in your AndroSense Assessment to refine your screening estimate.
            </div>
          </div>

          {/* What to Expect Card */}
          <div className="p-3.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
            <span className="text-[11px] font-bold font-mono text-[#0E9EAA] uppercase tracking-wider block">
              What You Can Explore in AndroSense AI:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exploreList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-[#55718F]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0E9EAA] shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contextual Helper Card Column */}
        <div className="lg:col-span-4 space-y-3">
          <MaleWhyWeAskCard
            title="Screening Confirmation"
            description="BioPulse AI calculates an initial non-diagnostic screening score calibrated against CDC epidemiological reference data. Your profile provides the foundation for progressive assessment."
            icon={ShieldTick}
          />

          <div className="p-3.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] text-[11px] text-[#55718F] space-y-1.5">
            <span className="font-bold text-[#073B72] block">Privacy & Security:</span>
            <p>
              Your health data is encrypted and strictly confidential. You retain full control over your profile and can update measurements or symptoms anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
