import React, { useState } from 'react';
import { User01, Mail01, Phone01, Calendar, Ruler, Scales01, Activity, InfoCircle } from '@untitledui/icons';
import {
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
} from '../../../utils/unitConversions';
import { getDobInputBounds } from '../../../utils/profileValidation';
import { OnboardingWhyModal, OnboardingWhyTrigger } from '../../../components/onboarding/OnboardingWhyModal';
import { ProfilePictureSelector } from '../../../components/onboarding/ProfilePictureSelector';

interface FemaleStep1Props {
  data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    avatarUrl?: string;
    heightCm?: number | null;
    weightKg?: number | null;
    waistCm?: number | null;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const FemaleStep1BasicInfo: React.FC<FemaleStep1Props> = ({
  data,
  onChange,
  errors,
}) => {
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [waistUnit, setWaistUnit] = useState<'cm' | 'in'>('cm');

  const dobBounds = getDobInputBounds();
  const { feet, inches } = cmToFtIn(data.heightCm);
  const displayLbs = kgToLbs(data.weightKg);
  const displayWaistInches = cmToInches(data.waistCm);

  return (
    <div className="space-y-5 text-left font-sans max-w-4xl mx-auto">
      {/* ── Question Header with Why We Ask Trigger ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
            <User01 className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
          </div>

          <div>
            <span className="text-xs font-bold font-sans text-[#0288D1] uppercase tracking-wider block leading-none">
              Let's get started
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-[#073B72] tracking-tight leading-tight mt-1">
              What is your date of birth &amp; basic profile?
            </h2>
          </div>
        </div>

        <OnboardingWhyTrigger onClick={() => setShowWhyModal(true)} accentColor="rose" />
      </div>

      <p className="text-xs sm:text-sm text-[#55718F] font-sans leading-relaxed">
        We need your date of birth to calculate your age and provide guidance suitable for you.
      </p>

      {/* ── Main Form Inputs (Full Width) ── */}
      <div className="w-full space-y-4 sm:space-y-4.5">
          {/* Row 1: Full Name & Email (Balanced 2-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[14px] sm:text-[15px] font-semibold font-sans text-[#073B72] flex items-center justify-between">
                <span>Full Name <span className="text-[#F43F7D]">*</span></span>
                <span className="text-xs text-[#55718F] font-normal">required</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your full name"
                  value={data.fullName}
                  onChange={(e) => onChange('fullName', e.target.value)}
                  className={`w-full h-11 sm:h-12 px-3.5 pl-10 rounded-xl bg-white border text-base text-[#073B72] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/20 focus:border-[#F43F7D] transition-all ${
                    errors.fullName ? 'border-[#F43F7D] bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
                <User01 className="w-4 h-4 text-[#55718F] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
              {errors.fullName && (
                <p className="text-xs text-[#F43F7D] font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[14px] sm:text-[15px] font-semibold font-sans text-[#073B72] flex items-center justify-between">
                <span>Email Address <span className="text-[#F43F7D]">*</span></span>
                <span className="text-xs text-[#55718F] font-normal">required</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={data.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  className={`w-full h-11 sm:h-12 px-3.5 pl-10 rounded-xl bg-white border text-base text-[#073B72] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/20 focus:border-[#F43F7D] transition-all ${
                    errors.email ? 'border-[#F43F7D] bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
                <Mail01 className="w-4 h-4 text-[#55718F] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
              {errors.email && (
                <p className="text-xs text-[#F43F7D] font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Row 2: Date of Birth & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-[14px] sm:text-[15px] font-semibold font-sans text-[#073B72] flex items-center justify-between">
                <span>Date of birth <span className="text-[#F43F7D]">*</span></span>
                <span className="text-xs text-[#55718F] font-normal">DD / MM / YYYY</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#55718F] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="date"
                  min={dobBounds.min}
                  max={dobBounds.max}
                  value={data.dateOfBirth}
                  onChange={(e) => onChange('dateOfBirth', e.target.value)}
                  className={`w-full h-11 sm:h-12 pl-10 pr-3 rounded-xl bg-white border text-[15px] sm:text-base font-medium text-[#073B72] placeholder-[#8FA3B8] transition-all focus:outline-none ${
                    errors.dateOfBirth
                      ? 'border-[#E87084] focus:border-[#E87084]'
                      : 'border-[#D7EAF2] focus:border-[#0288D1]'
                  }`}
                />
              </div>
              {errors.dateOfBirth ? (
                <p className="text-xs text-[#F43F7D] font-medium">{errors.dateOfBirth}</p>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-[#55718F]">
                  <InfoCircle className="w-3.5 h-3.5 text-[#0288D1] shrink-0" aria-hidden="true" />
                  <span>You must be 12 years or older to continue.</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[14px] sm:text-[15px] font-semibold font-sans text-[#073B72] flex items-center justify-between">
                <span>Phone Number <span className="text-[#F43F7D]">*</span></span>
                <span className="text-xs text-[#55718F] font-normal">11 digits (03xx or +92)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 0300 1234567"
                  value={data.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  className={`w-full h-11 sm:h-12 px-3.5 pl-10 rounded-xl bg-white border text-base text-[#073B72] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/20 focus:border-[#F43F7D] transition-all ${
                    errors.phone ? 'border-[#F43F7D] bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
                <Phone01 className="w-4 h-4 text-[#55718F] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
              {errors.phone && (
                <p className="text-xs text-[#F43F7D] font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Row 3: Biometrics in 3 columns (Height, Weight, Waist) */}
          <div className="pt-2 border-t border-[#E8F1F5] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] sm:text-[15px] font-bold font-sans text-[#073B72] tracking-wide">
                Physical Measurements
              </span>
              <span className="text-xs text-[#55718F] font-sans">Toggle units anytime</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Height */}
              <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] sm:text-[14px] font-semibold text-[#073B72] flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                    <span>Height</span>
                  </label>
                  <div className="flex rounded-lg bg-[#EAEFF4] p-0.5 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        heightUnit === 'cm'
                          ? 'bg-white text-[#073B72] font-bold shadow-2xs'
                          : 'text-[#55718F]'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('ft_in')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        heightUnit === 'ft_in'
                          ? 'bg-white text-[#073B72] font-bold shadow-2xs'
                          : 'text-[#55718F]'
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
                      min="100"
                      max="250"
                      placeholder="e.g. 165"
                      value={data.heightCm ?? ''}
                      onChange={(e) =>
                        onChange('heightCm', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full h-10 sm:h-11 px-3 pr-9 rounded-xl bg-white border border-[#D7EAF2] text-sm sm:text-base font-medium text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-3 top-2.5 sm:top-3 text-xs text-[#55718F]">cm</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="3"
                        max="7"
                        placeholder="5"
                        value={feet || ''}
                        onChange={(e) => {
                          const newFeet = parseInt(e.target.value, 10) || 0;
                          onChange('heightCm', ftInToCm(newFeet, inches));
                        }}
                        className="w-full h-10 sm:h-11 px-2.5 pr-6 rounded-xl bg-white border border-[#D7EAF2] text-sm sm:text-base font-medium text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                      />
                      <span className="absolute right-2 top-2.5 sm:top-3 text-xs text-[#55718F]">ft</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="11"
                        placeholder="5"
                        value={inches ?? ''}
                        onChange={(e) => {
                          const newInches = parseInt(e.target.value, 10) || 0;
                          onChange('heightCm', ftInToCm(feet, newInches));
                        }}
                        className="w-full h-10 sm:h-11 px-2.5 pr-6 rounded-xl bg-white border border-[#D7EAF2] text-sm sm:text-base font-medium text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                      />
                      <span className="absolute right-2 top-2.5 sm:top-3 text-xs text-[#55718F]">in</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] sm:text-[14px] font-semibold text-[#073B72] flex items-center gap-1.5">
                    <Scales01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                    <span>Weight</span>
                  </label>
                  <div className="flex rounded-lg bg-[#EAEFF4] p-0.5 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        weightUnit === 'kg'
                          ? 'bg-white text-[#073B72] font-bold shadow-2xs'
                          : 'text-[#55718F]'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        weightUnit === 'lbs'
                          ? 'bg-white text-[#073B72] font-bold shadow-2xs'
                          : 'text-[#55718F]'
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
                      step="0.5"
                      placeholder="e.g. 62"
                      value={data.weightKg ?? ''}
                      onChange={(e) =>
                        onChange('weightKg', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full h-10 sm:h-11 px-3 pr-9 rounded-xl bg-white border border-[#D7EAF2] text-sm sm:text-base font-medium text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-3 top-2.5 sm:top-3 text-xs text-[#55718F]">kg</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min="65"
                      max="550"
                      step="1"
                      placeholder="136"
                      value={displayLbs ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange('weightKg', lbsToKg(val));
                      }}
                      className="w-full h-10 sm:h-11 px-3 pr-9 rounded-xl bg-white border border-[#D7EAF2] text-sm sm:text-base font-medium text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-3 top-2.5 sm:top-3 text-xs text-[#55718F]">lbs</span>
                  </div>
                )}
              </div>

              {/* Waist */}
              <div className="p-3 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] sm:text-[14px] font-semibold text-[#073B72] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                    <span>Waist</span>
                  </label>
                  <div className="flex rounded-lg bg-[#EAEFF4] p-0.5 text-xs font-sans">
                    <button
                      type="button"
                      onClick={() => setWaistUnit('cm')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        waistUnit === 'cm'
                          ? 'bg-white text-[#073B72] font-bold shadow-2xs'
                          : 'text-[#55718F]'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaistUnit('in')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        waistUnit === 'in'
                          ? 'bg-white text-[#073B72] font-bold shadow-2xs'
                          : 'text-[#55718F]'
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
                      max="200"
                      placeholder="e.g. 78"
                      value={data.waistCm ?? ''}
                      onChange={(e) =>
                        onChange('waistCm', e.target.value ? parseFloat(e.target.value) : null)
                      }
                      className="w-full h-10 sm:h-11 px-3 pr-9 rounded-xl bg-white border border-[#D7EAF2] text-sm sm:text-base font-medium text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-3 top-2.5 sm:top-3 text-xs text-[#55718F]">cm</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min="15"
                      max="80"
                      step="0.5"
                      placeholder="30.5"
                      value={displayWaistInches ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange('waistCm', inchesToCm(val));
                      }}
                      className="w-full h-10 sm:h-11 px-3 pr-9 rounded-xl bg-white border border-[#D7EAF2] text-sm sm:text-base font-medium text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-3 top-2.5 sm:top-3 text-xs text-[#55718F]">in</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Profile Picture Selector */}
          <ProfilePictureSelector
            value={data.avatarUrl}
            onChange={(url) => onChange('avatarUrl', url)}
            error={errors.avatarUrl}
            pathway="female"
          />
        </div>

      {/* ── "Why We Ask This" Modal Dialog ── */}
      <OnboardingWhyModal
        isOpen={showWhyModal}
        onClose={() => setShowWhyModal(false)}
        title="Why we ask about physical metrics"
        accentColor="rose"
      >
        <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3]">
          <span className="font-bold text-[#F43F7D] block mb-1">Health Context</span>
          <p>
            Age and body measurements help BioPulse AI interpret your screening information in the appropriate clinical and endocrine context.
          </p>
        </div>
      </OnboardingWhyModal>
    </div>
  );
};
