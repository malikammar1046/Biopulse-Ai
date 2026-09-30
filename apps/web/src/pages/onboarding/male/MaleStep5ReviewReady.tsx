import React, { useState } from 'react';
import {
  CheckCircle,
  ShieldTick,
  AlertCircle,
  Beaker01,
} from '@untitledui/icons';
import type { UserProfile } from '../../../types/onboarding';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';
import { UserAvatar } from '../../../components/common/UserAvatar';

interface MaleStep5Props {
  profile: UserProfile;
  saveError?: string;
}

export const MaleStep5ReviewReady: React.FC<MaleStep5Props> = ({
  profile,
  saveError,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
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
  const adam = mh.adamResponses || {};
  const adamAnswered = Object.values(adam).filter((v) => v !== null && v !== undefined).length;
  const adamYesCount = Object.values(adam).filter((v) => v === true).length;

  const symptomFlags: string[] = [];
  if (mh.sexDrive === 'reduced' || mh.sexDrive === 'significantly_reduced') symptomFlags.push('Reduced libido');
  if (mh.energyLevel === 'low' || mh.energyLevel === 'very_low') symptomFlags.push('Low energy / fatigue');
  if (mh.sleepQuality === 'poor' || mh.sleepQuality === 'frequently_waking') symptomFlags.push('Sleep disruption');
  if (mh.muscleStrengthChanges === 'reduced' || mh.muscleStrengthChanges === 'significantly_reduced') symptomFlags.push('Reduced strength');
  if (mh.erectileDifficulties === 'occasional' || mh.erectileDifficulties === 'frequent') symptomFlags.push('Firmness dips');
  if ((mh.moodChanges || []).length > 0) symptomFlags.push('Mood / motivation shifts');
  if (mh.bodyHairChanges === 'thinning' || mh.bodyHairChanges === 'reduced_growth') symptomFlags.push('Hair thinning');

  const symptomsSummary =
    adamAnswered > 0
      ? `${adamAnswered} of 10 ADAM questions answered • ${adamYesCount} positive indicator${adamYesCount === 1 ? '' : 's'}`
      : symptomFlags.length === 0
      ? 'No active symptoms reported'
      : `${symptomFlags.length} indicator${symptomFlags.length > 1 ? 's' : ''} noted (${symptomFlags.slice(0, 2).join(', ')}${symptomFlags.length > 2 ? '...' : ''})`;

  const reviewRows = [
    {
      label: 'Profile Picture',
      val: profile.avatarUrl ? 'Configured' : 'Avatar set',
    },
    {
      label: 'Personal & Biometrics',
      val: `${profile.fullName || 'User'} • ${profile.heightCm ? `${profile.heightCm} cm` : 'Height set'} / ${
        profile.weightKg ? `${profile.weightKg} kg` : 'Weight set'
      } • Waist: ${profile.waistCm ? `${profile.waistCm} cm` : 'Waist set'}${bmiValue ? ` (BMI: ${bmiValue})` : ''}`,
    },
    {
      label: 'Medical Baseline',
      val:
        (profile.medical?.conditions?.length || 0) === 0 ||
        profile.medical?.conditions?.includes('None of these conditions') ||
        profile.medical?.conditions?.includes('None of these')
          ? 'No chronic conditions reported'
          : profile.medical?.conditions?.join(', '),
    },
    {
      label: 'ADAM Questionnaire & Symptoms',
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
      val: 'Profile Ready • Tier 1 Hypogonadism screening will run upon entry',
    },
  ];

  const exploreList = [
    'Baseline male hormone & vitality overview',
    'Epidemiological hypogonadism risk screening',
    'Activity rhythms, recovery, and stamina tracking',
    'Actionable health habits for natural vitality',
  ];

  return (
    <div className="space-y-5 text-left max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldTick className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#0288D1] uppercase tracking-wider block leading-none">
              Final Confirmation
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              Review your BioPulse AI profile
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger
          onClick={() => setShowWhyModal(true)}
          label="Privacy & Security"
          accentColor="blue"
        />
      </div>

      <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
        Confirm your baseline information below to finalize your secure profile and generate your initial hypogonadism screening.
      </p>

      {/* ── Error Banner if Save Failed ── */}
      {saveError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ── Main Review Content (Full Width) ── */}
      <div className="w-full space-y-4">
          {/* Profile Hero Card with Avatar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAFCFF] via-[#F0F9FF] to-[#E0F2FE]/30 border border-[#D7EAF2] flex items-center gap-4">
            <UserAvatar
              avatarUrl={profile.avatarUrl}
              name={profile.fullName}
              pathway="male"
              size="lg"
              className="ring-2 ring-[#0288D1]/30 shadow-xs shrink-0"
            />

            <div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-[#073B72] leading-tight">
                {profile.fullName ? `Welcome, ${profile.fullName}` : 'Your BioPulse AI profile is ready'}
              </h3>
              <p className="text-sm text-[#55718F] font-sans mt-0.5">
                Baseline calibrated • Ready to explore personalized insights
              </p>
            </div>
          </div>

          {/* Summary Details Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D7EAF2] text-sm font-sans text-[#073B72]">
              <span className="flex items-center gap-2 font-bold tracking-wide text-[13px] sm:text-sm uppercase text-[#073B72]">
                <ShieldTick className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                Configured Baselines
              </span>
              <span className="text-[#0288D1] font-bold text-xs sm:text-[13px] bg-[#E0F2FE] px-2.5 py-0.5 rounded-full border border-[#BAE6FD]">
                100% Complete
              </span>
            </div>

            <div className="space-y-2">
              {reviewRows.map((row, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 border-b border-[#E8F1F5] last:border-0"
                >
                  <span className="text-[13px] sm:text-sm font-medium font-sans text-[#073B72]">
                    {row.label}
                  </span>
                  <span className="text-[12px] sm:text-[13px] text-[#55718F] font-sans text-left sm:text-right max-w-sm truncate">
                    {row.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2 Laboratory Blood Tests Notice */}
          <div className="p-4 rounded-xl bg-[#F0F8FF] border border-[#BAE6FD] flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#DDEFFD] flex items-center justify-center text-[#0288D1] shrink-0 mt-0.5">
              <Beaker01 className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="text-xs sm:text-[13px] text-[#55718F] leading-relaxed">
              <span className="font-bold text-[#073B72] block">Clinical Lab Results (Tier 2):</span>
              You can add laboratory results (such as morning fasting total testosterone, SHBG, and metabolic labs) later in your AndroSense Assessment to refine your screening estimate.
            </div>
          </div>

          {/* What to Expect Card */}
          <div className="p-4 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
            <span className="text-xs font-bold font-sans uppercase tracking-wider text-[#0288D1] block">
              What You Can Explore in AndroSense AI:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exploreList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs sm:text-[13px] text-[#55718F]">
                  <CheckCircle className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Screening & Privacy Confirmation"
        icon={ShieldTick}
        accentColor="blue"
      >
        <div className="p-3.5 rounded-xl bg-[#F0F8FF] border border-[#BAE6FD]">
          <span className="font-bold text-[#0288D1] block mb-1">Epidemiological Foundation</span>
          <p>
            BioPulse AI calculates an initial non-diagnostic screening score calibrated against CDC epidemiological reference data. Your profile provides the foundation for progressive assessment.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2]">
          <span className="font-bold text-[#073B72] block mb-1">Privacy &amp; Security:</span>
          <p>
            Your health data is encrypted and strictly confidential. You retain full control over your profile and can update measurements or symptoms anytime.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};

export default MaleStep5ReviewReady;
