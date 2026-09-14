import React, { useState } from 'react';
import { User, Mail, Phone, Calendar, Ruler, Scale, Activity, Camera, Info } from 'lucide-react';
import {
  cmToFtIn,
  ftInToCm,
  kgToLbs,
  lbsToKg,
  cmToInches,
  inchesToCm,
} from '../../../utils/unitConversions';
import { getDobInputBounds } from '../../../utils/profileValidation';
import { MaleWhyWeAskCard } from './MaleWhyWeAskCard';

interface MaleStep1Props {
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
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
];

export const MaleStep1BasicInfo: React.FC<MaleStep1Props> = ({
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

  // Live BMI calculation
  const heightM = (data.heightCm || 178) / 100;
  const bmiValue = data.weightKg
    ? (data.weightKg / (heightM * heightM)).toFixed(1)
    : null;

  return (
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#DDF7F7] flex items-center justify-center shrink-0 shadow-2xs">
          <User className="w-5 h-5 text-[#0E9EAA]" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#0E9EAA] uppercase tracking-wider block leading-none">
            Let's get started
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            What is your date of birth & basic profile?
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            We use your date of birth and physical measurements to calibrate metabolic and male hypogonadism screening.
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
                <span>Full Name <span className="text-[#0E9EAA]">*</span></span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8FA3B8] absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={data.fullName}
                  onChange={(e) => onChange('fullName', e.target.value)}
                  placeholder="Your full name"
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border text-xs sm:text-sm text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA] transition-all shadow-2xs ${
                    errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-[10px] text-rose-500 font-mono">{errors.fullName}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
                <span>Email Address <span className="text-[#0E9EAA]">*</span></span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8FA3B8] absolute left-3.5 top-2.5" />
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border text-xs sm:text-sm text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA] transition-all shadow-2xs ${
                    errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] text-rose-500 font-mono">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Row 2: Date of Birth & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date of Birth */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
                <span>Date of Birth <span className="text-[#0E9EAA]">*</span></span>
                <span className="text-[9px] text-[#8FA3B8] font-normal lowercase">age &ge; 12</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#8FA3B8] absolute left-3.5 top-2.5" />
                <input
                  type="date"
                  min={dobBounds.min}
                  max={dobBounds.max}
                  value={data.dateOfBirth}
                  onChange={(e) => onChange('dateOfBirth', e.target.value)}
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border text-xs sm:text-sm text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA] transition-all shadow-2xs ${
                    errors.dateOfBirth ? 'border-rose-400 bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-[10px] text-rose-500 font-mono">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Pakistani Phone Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center justify-between">
                <span>Phone (Pakistan) <span className="text-[#0E9EAA]">*</span></span>
                <span className="text-[9px] text-[#8FA3B8] font-normal">03xx or +92</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8FA3B8] absolute left-3.5 top-2.5" />
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  placeholder="e.g. 0300 1234567"
                  className={`w-full pl-10 pr-3.5 py-2 rounded-xl bg-white border text-xs sm:text-sm text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA] transition-all shadow-2xs ${
                    errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-[#D7EAF2]'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-[10px] text-rose-500 font-mono">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Row 3: Biometrics Section with Segmented Unit Switches */}
          <div className="pt-2 border-t border-[#E8F1F5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wider">
                Physical Biometrics
              </span>
              {bmiValue && (
                <span className="text-[10px] font-mono text-[#0E9EAA] font-bold bg-[#EAFBFC] border border-[#B2EBF2] px-2 py-0.5 rounded-md">
                  Est. BMI: {bmiValue} kg/m²
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Height */}
              <div className="p-2.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-[#0E9EAA]" />
                    <span>Height</span>
                  </label>
                  <div className="flex rounded-md bg-[#EAFBFC] p-0.5 border border-[#B2EBF2] text-[9px] font-mono">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('cm')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        heightUnit === 'cm' ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('ft_in')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        heightUnit === 'ft_in' ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
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
                      min={100}
                      max={250}
                      value={data.heightCm || ''}
                      onChange={(e) => onChange('heightCm', Number(e.target.value) || null)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D7EAF2] text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:border-[#0E9EAA]"
                      placeholder="178"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-[#8FA3B8]">cm</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="relative">
                      <input
                        type="number"
                        min={3}
                        max={7}
                        value={feet || ''}
                        onChange={(e) => {
                          const newFeet = parseInt(e.target.value, 10) || 0;
                          onChange('heightCm', ftInToCm(newFeet, inches));
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#D7EAF2] text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:border-[#0E9EAA]"
                        placeholder="5"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-[#8FA3B8]">ft</span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={11}
                        value={inches ?? ''}
                        onChange={(e) => {
                          const newInches = parseInt(e.target.value, 10) || 0;
                          onChange('heightCm', ftInToCm(feet, newInches));
                        }}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#D7EAF2] text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:border-[#0E9EAA]"
                        placeholder="10"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-[#8FA3B8]">in</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Weight */}
              <div className="p-2.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center gap-1">
                    <Scale className="w-3 h-3 text-[#0E9EAA]" />
                    <span>Weight</span>
                  </label>
                  <div className="flex rounded-md bg-[#EAFBFC] p-0.5 border border-[#B2EBF2] text-[9px] font-mono">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('kg')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        weightUnit === 'kg' ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('lbs')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        weightUnit === 'lbs' ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
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
                      min={30}
                      max={250}
                      step="0.5"
                      value={data.weightKg || ''}
                      onChange={(e) => onChange('weightKg', Number(e.target.value) || null)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D7EAF2] text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:border-[#0E9EAA]"
                      placeholder="80"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-[#8FA3B8]">kg</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={65}
                      max={550}
                      step="1"
                      value={displayLbs || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange('weightKg', lbsToKg(val));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D7EAF2] text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:border-[#0E9EAA]"
                      placeholder="176"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-[#8FA3B8]">lbs</span>
                  </div>
                )}
              </div>

              {/* 3. Waist Circumference (Key #1 Tier 1 ML Predictor) */}
              <div className="p-2.5 rounded-xl bg-[#FAFCFF] border border-[#D7EAF2] space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold font-mono text-[#073B72] uppercase tracking-wide flex items-center gap-1">
                    <Activity className="w-3 h-3 text-[#0E9EAA]" />
                    <span>Waist Size</span>
                  </label>
                  <div className="flex rounded-md bg-[#EAFBFC] p-0.5 border border-[#B2EBF2] text-[9px] font-mono">
                    <button
                      type="button"
                      onClick={() => setWaistUnit('cm')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        waistUnit === 'cm' ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaistUnit('in')}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                        waistUnit === 'in' ? 'bg-[#0E9EAA] text-white font-bold' : 'text-[#55718F]'
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
                      min={50}
                      max={180}
                      value={data.waistCm || ''}
                      onChange={(e) => onChange('waistCm', Number(e.target.value) || null)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D7EAF2] text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:border-[#0E9EAA]"
                      placeholder="88"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-[#8FA3B8]">cm</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={20}
                      max={70}
                      step="0.5"
                      value={displayWaistInches || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange('waistCm', inchesToCm(val));
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#D7EAF2] text-xs font-semibold text-[#073B72] placeholder-[#8FA3B8] focus:outline-none focus:border-[#0E9EAA]"
                      placeholder="34.5"
                    />
                    <span className="absolute right-2.5 top-1.5 text-[10px] text-[#8FA3B8]">in</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Compact Profile Photo Picker */}
          <div className="pt-2 border-t border-[#E8F1F5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-[#0E9EAA]" />
              <span className="text-[11px] font-bold font-mono text-[#073B72] uppercase tracking-wide">
                Profile Photo (Optional)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange('avatarUrl', url)}
                  className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    data.avatarUrl === url
                      ? 'border-[#0E9EAA] ring-2 ring-[#DDF7F7] scale-110'
                      : 'border-white opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contextual Helper Card Column */}
        <div className="lg:col-span-4 space-y-3">
          <MaleWhyWeAskCard
            title="Why we ask this"
            description="Age, waist circumference, and BMI are primary physical metrics in clinical male hypogonadism screening. Waist circumference in particular directly reflects visceral adiposity and endocrine balance."
            icon={Info}
          />

          <div className="p-3.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] text-[11px] text-[#55718F] space-y-1.5">
            <span className="font-bold text-[#073B72] block">Screening Context:</span>
            <p>
              Under CDC reference data, waist measurement (&ge;94 cm or &ge;102 cm) is the single strongest clinical indicator of circulating testosterone and metabolic health.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
