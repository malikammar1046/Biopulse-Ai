import React, { useState } from 'react';
import { User01, Mail01, Phone01, Calendar, Ruler, Scales01, Activity, Camera01, InfoCircle } from '@untitledui/icons';
import {
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
} from '../../../utils/unitConversions';
import { getDobInputBounds } from '../../../utils/profileValidation';
import { WhyWeAskCard } from './WhyWeAskCard';

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

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const FemaleStep1BasicInfo: React.FC<FemaleStep1Props> = ({
  data,
  onChange,
  errors,
}) => {
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [waistUnit, setWaistUnit] = useState<'cm' | 'in'>('cm');

  const dobBounds = getDobInputBounds();
  const { feet, inches } = cmToFtIn(data.heightCm);
  const displayLbs = kgToLbs(data.weightKg);
  const displayWaistInches = cmToInches(data.waistCm);

  return (
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-2xs">
          <User01 className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#0288D1] uppercase tracking-wider block leading-none">
            Let's get started
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            What is your date of birth & basic profile?
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            We need your date of birth to calculate your age and provide guidance suitable for you.
          </p>
        </div>
      </div>

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Inputs Column */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Row 1: Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Full Name */}
            <div className="sm:col-span-7 space-y-1">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
                <span>Full Name <span className="text-[#F43F7D]">*</span></span>
                <span className="text-[10px] text-[#55718F] font-normal lowercase">required</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Your full name"
                  value={data.fullName}
                  onChange={(e) => onChange('fullName', e.target.value)}
                  className={`w-full h-10 px-3.5 pl-9 rounded-xl bg-white border text-sm text-[#073B72] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/15 focus:border-[#F43F7D] transition-all ${
                    errors.fullName ? 'border-[#F43F7D] bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
                <User01 className="w-3.5 h-3.5 text-[#55718F] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-[#F43F7D] font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
                <span>Email Address <span className="text-[#F43F7D]">*</span></span>
                <span className="text-[10px] text-[#55718F] font-normal lowercase">required</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={data.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  className={`w-full h-10 px-3.5 pl-9 rounded-xl bg-white border text-sm text-[#073B72] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/15 focus:border-[#F43F7D] transition-all ${
                    errors.email ? 'border-[#F43F7D] bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
                <Mail01 className="w-3.5 h-3.5 text-[#55718F] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
              {errors.email && (
                <p className="text-[11px] text-[#F43F7D] font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Row 2: Date of Birth & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
                <span>Date of birth <span className="text-[#F43F7D]">*</span></span>
                <span className="text-[10px] text-[#55718F] font-normal lowercase">DD / MM / YYYY</span>
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[#55718F] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  type="date"
                  min={dobBounds.min}
                  max={dobBounds.max}
                  value={data.dateOfBirth}
                  onChange={(e) => onChange('dateOfBirth', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl bg-white border text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] transition-all focus:outline-none ${
                    errors.dateOfBirth
                      ? 'border-[#E87084] focus:border-[#E87084]'
                      : 'border-[#D7EAF2] focus:border-[#0288D1]'
                  }`}
                />
              </div>
              {errors.dateOfBirth ? (
                <p className="text-[11px] text-[#F43F7D] font-medium">{errors.dateOfBirth}</p>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-[#55718F]">
                  <InfoCircle className="w-3 h-3 text-[#0288D1] shrink-0" aria-hidden="true" />
                  <span>You must be 12 years or older to continue.</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
                <span>Phone Number <span className="text-[#F43F7D]">*</span></span>
                <span className="text-[10px] text-[#55718F] font-normal lowercase">11 digits (03xx or +92)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="e.g. 0300 1234567"
                  value={data.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  className={`w-full h-10 px-3.5 pl-9 rounded-xl bg-white border text-sm text-[#073B72] placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#F43F7D]/15 focus:border-[#F43F7D] transition-all ${
                    errors.phone ? 'border-[#F43F7D] bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
                <Phone01 className="w-3.5 h-3.5 text-[#55718F] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-[#F43F7D] font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Row 3: Biometrics in 3 columns (Height, Weight, Waist) */}
          <div className="pt-2 border-t border-[#E8F1F5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold font-mono text-[#073B72] uppercase tracking-wider">
                Physical Measurements
              </span>
              <span className="text-[10px] text-[#55718F]">Toggle units anytime</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Height */}
              <div className="p-2.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#073B72] flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                    <span>Height</span>
                  </label>
                  {/* Apple-style segmented control */}
                  <div className="flex rounded-lg bg-[#EAEFF4] p-0.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`px-1.5 py-0.5 rounded-md transition-all ${
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
                      className={`px-1.5 py-0.5 rounded-md transition-all ${
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
                      className="w-full h-8 px-2.5 pr-8 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-[#55718F]">cm</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
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
                        className="w-full h-8 px-2 pr-5 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                      />
                      <span className="absolute right-1.5 top-2 text-[10px] text-[#55718F]">ft</span>
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
                        className="w-full h-8 px-2 pr-5 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                      />
                      <span className="absolute right-1.5 top-2 text-[10px] text-[#55718F]">in</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div className="p-2.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#073B72] flex items-center gap-1">
                    <Scales01 className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                    <span>Weight</span>
                  </label>
                  <div className="flex rounded-lg bg-[#EAEFF4] p-0.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`px-1.5 py-0.5 rounded-md transition-all ${
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
                      className={`px-1.5 py-0.5 rounded-md transition-all ${
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
                      className="w-full h-8 px-2.5 pr-8 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-[#55718F]">kg</span>
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
                      className="w-full h-8 px-2.5 pr-8 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-[#55718F]">lbs</span>
                  </div>
                )}
              </div>

              {/* Waist */}
              <div className="p-2.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#073B72] flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#0288D1]" aria-hidden="true" />
                    <span>Waist</span>
                  </label>
                  <div className="flex rounded-lg bg-[#EAEFF4] p-0.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setWaistUnit('cm')}
                      className={`px-1.5 py-0.5 rounded-md transition-all ${
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
                      className={`px-1.5 py-0.5 rounded-md transition-all ${
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
                      className="w-full h-8 px-2.5 pr-8 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-[#55718F]">cm</span>
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
                      className="w-full h-8 px-2.5 pr-8 rounded-lg bg-white border border-[#D7EAF2] text-xs text-[#073B72] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#F43F7D]"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-[#55718F]">in</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Compact Profile Photo Bar */}
          <div className="p-2.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#0288D1] bg-[#E0F2FE] flex items-center justify-center shrink-0">
                {data.avatarUrl ? (
                  <img
                    src={data.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                )}
                <span className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-[#0288D1] text-white">
                  <Camera01 className="w-2 h-2" aria-hidden="true" />
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#073B72] block leading-tight">
                  Profile Photo <span className="text-[10px] font-normal text-[#55718F]">(Optional)</span>
                </span>
                <span className="text-[10px] text-[#55718F]">Choose an avatar or leave default</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange('avatarUrl', url)}
                  className={`w-6 h-6 rounded-full overflow-hidden border transition-transform cursor-pointer ${
                    data.avatarUrl === url
                      ? 'border-[#F43F7D] scale-110 ring-2 ring-[#FDE6EF]'
                      : 'border-[#D7EAF2] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info Column: Single Concise "Why we ask this" Card */}
        <div className="lg:col-span-4">
          <WhyWeAskCard
            description="Age and body measurements help BioPulse AI interpret your screening information in the appropriate health context."
          />
        </div>
      </div>
    </div>
  );
};
