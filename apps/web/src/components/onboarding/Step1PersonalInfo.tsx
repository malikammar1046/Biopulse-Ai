import React, { useState } from 'react';
import {
  User01,
  Mail01,
  Phone01,
  Calendar,
  ShieldTick,
  Camera01,
  Heart,
  ActivityHeart,
  Compass01,
  Ruler,
  Scales01,
} from '@untitledui/icons';
import type { UserGender } from '../../types/onboarding';
import {
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
} from '../../utils/unitConversions';
import { getDobInputBounds } from '../../utils/profileValidation';

interface Step1Props {
  data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender?: UserGender;
    avatarUrl?: string;
    heightCm?: number | null;
    weightKg?: number | null;
    waistCm?: number | null;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
  hideGenderSelection?: boolean;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const Step1PersonalInfo: React.FC<Step1Props> = ({ data, onChange, errors, hideGenderSelection }) => {
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [waistUnit, setWaistUnit] = useState<'cm' | 'in'>('cm');

  const dobBounds = getDobInputBounds();
  const { feet, inches } = cmToFtIn(data.heightCm);
  const displayLbs = kgToLbs(data.weightKg);
  const displayWaistInches = cmToInches(data.waistCm);

  const handleSelectGender = (selected: UserGender) => {
    onChange('gender', selected);
    // Also auto-sync corresponding pathway
    const pathway = selected === 'female' ? 'female' : selected === 'male' ? 'male' : 'general';
    onChange('pathway', pathway);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Let’s start with your basics.
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          This helps BioPulse AI personalize your health pathway, calendar, and secure your profile.
        </p>
      </div>

      {/* ── Gender & Health Pathway Selection (Mandatory for Adaptive Routing, Hidden when preset) ── */}
      {!hideGenderSelection && (
        <div className="space-y-2.5">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Your Health Pathway <span className="text-[#FB7185]">*</span></span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">determines companion experience</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Female / OvaSense Option */}
            <button
              type="button"
              onClick={() => handleSelectGender('female')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                data.gender === 'female'
                  ? 'bg-gradient-to-b from-[#2A0E3D] to-[#1A0826] border-[#FB7185] shadow-lg shadow-purple-950/40 ring-1 ring-[#FB7185]'
                  : 'bg-[#140924] border-white/10 hover:border-white/20 text-[#CDBDD8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#0288D1]/20 border border-[#0288D1]/40 flex items-center justify-center text-[#29B6F6]">
                  <Heart className="w-4 h-4" aria-hidden="true" />
                </div>
                {data.gender === 'female' && (
                  <span className="w-2 h-2 rounded-full bg-[#0288D1]" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Female</span>
                <span className="text-[11px] text-[#29B6F6] font-medium block">PCOS Pathway</span>
                <span className="text-[10px] text-[#A797BD] leading-tight block mt-1">
                  PCOS screening, period rhythms & women's health
                </span>
              </div>
            </button>

            {/* Male / AndroSense Option */}
            <button
              type="button"
              onClick={() => handleSelectGender('male')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                data.gender === 'male'
                  ? 'bg-gradient-to-b from-[#102038] to-[#0A1224] border-[#0288D1] shadow-lg shadow-sky-950/40 ring-1 ring-[#0288D1]'
                  : 'bg-[#140924] border-white/10 hover:border-white/20 text-[#CDBDD8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#0288D1]/20 border border-[#0288D1]/40 flex items-center justify-center text-[#29B6F6]">
                  <ActivityHeart className="w-4 h-4" aria-hidden="true" />
                </div>
                {data.gender === 'male' && (
                  <span className="w-2 h-2 rounded-full bg-[#0288D1]" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Male</span>
                <span className="text-[11px] text-[#29B6F6] font-medium block">Hypogonadism Pathway</span>
                <span className="text-[10px] text-[#A797BD] leading-tight block mt-1">
                  Hormone vitality, hypogonadism screening & energy
                </span>
              </div>
            </button>

            {/* Other / General Option */}
            <button
              type="button"
              onClick={() => handleSelectGender('other')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                data.gender === 'other' || data.gender === 'prefer_not_to_say'
                  ? 'bg-gradient-to-b from-[#1C162E] to-[#100C1F] border-[#0288D1] shadow-lg shadow-blue-950/40 ring-1 ring-[#0288D1]'
                  : 'bg-[#140924] border-white/10 hover:border-white/20 text-[#CDBDD8]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-[#0288D1]/20 border border-[#0288D1]/40 flex items-center justify-center text-[#29B6F6]">
                  <Compass01 className="w-4 h-4" aria-hidden="true" />
                </div>
                {(data.gender === 'other' || data.gender === 'prefer_not_to_say') && (
                  <span className="w-2 h-2 rounded-full bg-[#0288D1]" />
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">Other / General</span>
                <span className="text-[11px] text-[#29B6F6] font-medium block">General Baseline</span>
                <span className="text-[10px] text-[#A797BD] leading-tight block mt-1">
                  General wellness, lifestyle, reports & monitoring
                </span>
              </div>
            </button>
          </div>

          {errors.gender && (
            <p className="text-xs text-[#FB7185] font-medium mt-1">{errors.gender}</p>
          )}

          <p className="text-[11px] text-[#A797BD] italic pt-0.5">
            Selection determines which health companion you see. It is never a medical diagnosis.
          </p>
        </div>
      )}

      {/* Avatar Picker (Optional) */}
      <div className="p-4 rounded-3xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#0288D1] bg-[#1C0D2E] flex items-center justify-center shadow-lg">
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt="Selected Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User01 className="w-7 h-7 text-[#38BDF8]" aria-hidden="true" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0288D1] text-white shadow">
            <Camera01 className="w-3 h-3" aria-hidden="true" />
          </span>
        </div>

        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Profile Photo
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
              Optional
            </span>
          </div>
          <p className="text-xs text-[#A797BD]">
            Choose a personalized avatar or leave it default.
          </p>

          <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
            {PRESET_AVATARS.map((url, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChange('avatarUrl', url)}
                className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                  data.avatarUrl === url
                    ? 'border-[#0288D1] scale-110 shadow-md'
                    : 'border-white/20 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Full Name <span className="text-[#FB7185]">*</span></span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">required</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Ayesha Khan"
              value={data.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all ${
                errors.fullName ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <User01 className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
          {errors.fullName && <p className="text-xs text-[#FB7185] font-medium">{errors.fullName}</p>}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Date of Birth <span className="text-[#FB7185]">*</span></span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">min. 13 years</span>
          </label>
          <div className="relative">
            <input
              type="date"
              min={dobBounds.min}
              max={dobBounds.max}
              value={data.dateOfBirth}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all ${
                errors.dateOfBirth ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <Calendar className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-[#FB7185] font-medium">{errors.dateOfBirth}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Phone Number <span className="text-[#FB7185]">*</span></span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">11 digits (03xx or +92)</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              placeholder="03001234567 or +923001234567"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all ${
                errors.phone ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <Phone01 className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
          {errors.phone && <p className="text-xs text-[#FB7185] font-medium">{errors.phone}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Email Address <span className="text-[#FB7185]">*</span></span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">required</span>
          </label>
          <div className="relative">
            <input
              type="email"
              placeholder="ayesha.khan@example.com"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all ${
                errors.email ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <Mail01 className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
          {errors.email && <p className="text-xs text-[#FB7185] font-medium">{errors.email}</p>}
        </div>

        {/* Height, Weight, and Waist with Unit Conversions */}
        <div className="sm:col-span-2 pt-2 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider">
              Physical Measurements & Unit Conversion
            </span>
            <span className="text-[10px] text-[#A797BD]">Toggle units anytime</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Height (cm vs ft/in) */}
            <div className="p-3.5 rounded-2xl bg-[#140924] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#EDE4F7] flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                  <span>Height</span>
                </label>
                <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setHeightUnit('cm')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      heightUnit === 'cm' ? 'bg-[#0288D1] text-white font-bold shadow' : 'text-[#A797BD]'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit('ft_in')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      heightUnit === 'ft_in' ? 'bg-[#0288D1] text-white font-bold shadow' : 'text-[#A797BD]'
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
                    onChange={(e) => onChange('heightCm', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1D0C30] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#A797BD]">cm</span>
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
                      className="w-full px-3 py-2 rounded-xl bg-[#1D0C30] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                    />
                    <span className="absolute right-2 top-2 text-xs text-[#A797BD]">ft</span>
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
                      className="w-full px-3 py-2 rounded-xl bg-[#1D0C30] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                    />
                    <span className="absolute right-2 top-2 text-xs text-[#A797BD]">in</span>
                  </div>
                </div>
              )}
            </div>

            {/* Weight (kg vs lbs) */}
            <div className="p-3.5 rounded-2xl bg-[#140924] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#EDE4F7] flex items-center gap-1.5">
                  <Scales01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                  <span>Weight</span>
                </label>
                <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('kg')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      weightUnit === 'kg' ? 'bg-[#0288D1] text-white font-bold shadow' : 'text-[#A797BD]'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('lbs')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      weightUnit === 'lbs' ? 'bg-[#0288D1] text-white font-bold shadow' : 'text-[#A797BD]'
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
                    onChange={(e) => onChange('weightKg', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1D0C30] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#A797BD]">kg</span>
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
                    className="w-full px-3 py-2 rounded-xl bg-[#1D0C30] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#A797BD]">lbs</span>
                </div>
              )}
            </div>

            {/* Waist Circumference (cm vs in) */}
            <div className="p-3.5 rounded-2xl bg-[#140924] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#EDE4F7] flex items-center gap-1.5">
                  <ActivityHeart className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                  <span>Waist</span>
                </label>
                <div className="flex rounded-lg bg-white/5 p-0.5 border border-white/10 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setWaistUnit('cm')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      waistUnit === 'cm' ? 'bg-[#0288D1] text-white font-bold shadow' : 'text-[#A797BD]'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaistUnit('in')}
                    className={`px-2 py-0.5 rounded-md transition-all ${
                      waistUnit === 'in' ? 'bg-[#0288D1] text-white font-bold shadow' : 'text-[#A797BD]'
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
                    onChange={(e) => onChange('waistCm', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1D0C30] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#A797BD]">cm</span>
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
                    className="w-full px-3 py-2 rounded-xl bg-[#1D0C30] border border-white/15 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#0288D1]"
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#A797BD]">in</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reassurance Note */}
      <div className="p-3.5 rounded-2xl bg-[#0288D1]/10 border border-[#0288D1]/30 flex items-center gap-2.5 text-xs text-[#CDBDD8]">
        <ShieldTick className="w-4 h-4 text-[#0288D1] shrink-0" aria-hidden="true" />
        <span>Your data is encrypted end-to-end and stored with strict clinical privacy standards.</span>
      </div>
    </div>
  );
};
