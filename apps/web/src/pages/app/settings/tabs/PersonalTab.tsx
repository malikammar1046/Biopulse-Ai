import React from 'react';
import { Scale, Ruler } from 'lucide-react';
import type { UserProfile } from '../../../../types/onboarding';
import { AssessmentImpactBadge } from '../AssessmentImpactBadge';
import {
  cmToFtInNullable,
  ftInToCm,
  cmToInches,
  inchesToCm,
  kgToLbs,
  lbsToKg,
} from '../../../../utils/unitConversions';
import { getDobInputBounds } from '../../../../utils/profileValidation';

interface PersonalTabProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
  validationErrors: { dateOfBirth?: string; phone?: string };
  isMale: boolean;
}

export const PersonalTab: React.FC<PersonalTabProps> = ({
  draft,
  setDraft,
  validationErrors,
  isMale,
}) => {
  const dobBounds = getDobInputBounds();

  // Unit conversion state
  const [heightUnit, setHeightUnit] = React.useState<'cm' | 'ft_in' | 'in'>('cm');
  const [weightUnit, setWeightUnit] = React.useState<'kg' | 'lbs'>('kg');
  const [waistUnit, setWaistUnit] = React.useState<'cm' | 'in'>('cm');

  const { feet: heightFeet, inches: heightInches } = cmToFtInNullable(draft.heightCm);
  const weightLbs = kgToLbs(draft.weightKg);
  const waistInches = cmToInches(draft.waistCm);

  // Live BMI calculation
  const calculatedBmi = React.useMemo(() => {
    if (!draft.heightCm || !draft.weightKg || draft.heightCm <= 0 || draft.weightKg <= 0) return null;
    const heightM = draft.heightCm / 100;
    const bmi = draft.weightKg / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  }, [draft.heightCm, draft.weightKg]);

  const bmiCategory = React.useMemo(() => {
    if (!calculatedBmi) return null;
    if (calculatedBmi < 18.5) return { label: 'Underweight', color: 'text-amber-600 bg-amber-50' };
    if (calculatedBmi < 25) return { label: 'Normal Weight', color: 'text-emerald-600 bg-emerald-50' };
    if (calculatedBmi < 30) return { label: 'Overweight', color: 'text-amber-600 bg-amber-50' };
    return { label: 'Obesity Range', color: 'text-rose-600 bg-rose-50' };
  }, [calculatedBmi]);

  // Derived approximate age
  const calculatedAge = React.useMemo(() => {
    if (!draft.dateOfBirth) return null;
    try {
      const bDate = new Date(draft.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) age--;
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  }, [draft.dateOfBirth]);

  return (
    <div className="space-y-6">
      {/* Section 1: Demographics */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Identity & Contact</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal contact details and biological reference sex
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={draft.fullName || ''}
                onChange={(e) => setDraft((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="e.g. Alex Morgan"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA] transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Reference Sex */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Biological Reference Sex
              </label>
              <AssessmentImpactBadge impact />
            </div>
            <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 flex items-center justify-between">
              <span className="capitalize font-medium">
                {draft.gender || (isMale ? 'Male' : 'Female')} ({isMale ? 'Hypogonadism Pathway' : 'PCOS Pathway'})
              </span>
              <span className="text-[11px] font-semibold text-[#0E9EAA] bg-[#0E9EAA]/10 px-2 py-0.5 rounded-md">
                Active Protocol
              </span>
            </div>
          </div>

          {/* Date of Birth */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Date of Birth
              </label>
              <div className="flex items-center gap-2">
                {calculatedAge && (
                  <span className="text-xs font-medium text-slate-500">
                    ({calculatedAge} yrs)
                  </span>
                )}
                <AssessmentImpactBadge impact />
              </div>
            </div>
            <input
              type="date"
              min={dobBounds.min}
              max={dobBounds.max}
              value={draft.dateOfBirth || ''}
              onChange={(e) => setDraft((p) => ({ ...p, dateOfBirth: e.target.value }))}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all text-slate-800 ${
                validationErrors.dateOfBirth
                  ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]'
              }`}
            />
            {validationErrors.dateOfBirth && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {validationErrors.dateOfBirth}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={draft.phone || ''}
              onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. +92 300 1234567"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all text-slate-800 ${
                validationErrors.phone
                  ? 'border-rose-300 focus:ring-rose-200 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]'
              }`}
            />
            {validationErrors.phone && (
              <p className="text-xs text-rose-500 mt-1 font-medium">
                {validationErrors.phone}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={draft.email || ''}
              disabled
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Your primary authentication email managed via your BioPulse account.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Biometrics & Anthropometrics */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800">Biometrics & Body Composition</h3>
              <AssessmentImpactBadge impact />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Height, weight, and waist measurements directly calculate BMI and metabolic risk scores
            </p>
          </div>

          {/* Live BMI Pill */}
          {calculatedBmi && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">BMI</span>
                <span className="text-sm font-bold text-slate-800">{calculatedBmi}</span>
                {bmiCategory && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${bmiCategory.color}`}>
                    {bmiCategory.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Height */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-primary-teal" />
                Height
              </span>

              {/* Unit Toggle */}
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setHeightUnit('cm')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    heightUnit === 'cm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setHeightUnit('ft_in')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    heightUnit === 'ft_in' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
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
                  min="80"
                  max="250"
                  value={draft.heightCm || ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      heightCm: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g. 168"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">cm</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="3"
                    max="7"
                    value={heightFeet ?? ''}
                    onChange={(e) => {
                      const f = e.target.value ? Number(e.target.value) : null;
                      setDraft((p) => ({
                        ...p,
                        heightCm: ftInToCm(f ?? 0, heightInches ?? 0),
                      }));
                    }}
                    placeholder="5"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">ft</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightInches ?? ''}
                    onChange={(e) => {
                      const inch = e.target.value ? Number(e.target.value) : null;
                      setDraft((p) => ({
                        ...p,
                        heightCm: ftInToCm(heightFeet ?? 0, inch ?? 0),
                      }));
                    }}
                    placeholder="6"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">in</span>
                </div>
              </div>
            )}
          </div>

          {/* Weight */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#0E9EAA]" />
                Weight
              </span>

              {/* Unit Toggle */}
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setWeightUnit('kg')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    weightUnit === 'kg' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => setWeightUnit('lbs')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    weightUnit === 'lbs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
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
                  min="30"
                  max="250"
                  step="0.1"
                  value={draft.weightKg || ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      weightKg: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g. 64.5"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">kg</span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="60"
                  max="500"
                  step="0.1"
                  value={weightLbs || ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      weightKg: e.target.value ? lbsToKg(Number(e.target.value)) : null,
                    }))
                  }
                  placeholder="e.g. 142"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">lbs</span>
              </div>
            )}
          </div>

          {/* Waist Circumference (Required/highlighted for male, optional for female) */}
          <div
            className={`p-4 rounded-2xl border ${
              isMale
                ? 'bg-teal-50/50 border-teal-200'
                : 'bg-slate-50/70 border-slate-200/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-700">Waist</span>
                {isMale && (
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded">
                    Key Marker
                  </span>
                )}
              </div>

              {/* Unit Toggle */}
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setWaistUnit('cm')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    waistUnit === 'cm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setWaistUnit('in')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    waistUnit === 'in' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
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
                  min="40"
                  max="180"
                  step="0.5"
                  value={draft.waistCm || ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      waistCm: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="e.g. 84"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">cm</span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="16"
                  max="70"
                  step="0.5"
                  value={waistInches || ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      waistCm: e.target.value ? inchesToCm(Number(e.target.value)) : null,
                    }))
                  }
                  placeholder="e.g. 33"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">in</span>
              </div>
            )}
            {isMale && (
              <p className="text-[10px] text-slate-500 mt-1">
                Waist circumference assesses visceral adiposity and endocrine health.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
