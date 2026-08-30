import React from 'react';
import { User, Mail, Phone, Calendar, Sparkles, Camera } from 'lucide-react';

interface Step1Props {
  data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    avatarUrl?: string;
    heightCm?: number | null;
    weightKg?: number | null;
  };
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
];

export const Step1PersonalInfo: React.FC<Step1Props> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6 text-left">
      {/* Header Info */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
          Let’s start with your basics.
        </h2>
        <p className="text-sm text-[#CDBDD8] font-sans">
          This helps OvaSense personalize your hormone calendar and secure your health profile.
        </p>
      </div>

      {/* Avatar Picker (Optional) */}
      <div className="p-4 rounded-3xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#FB7185] bg-[#1C0D2E] flex items-center justify-center shadow-lg">
            {data.avatarUrl ? (
              <img
                src={data.avatarUrl}
                alt="Selected Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 text-[#D8B4FE]" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#8E3EAF] text-white shadow">
            <Camera className="w-3 h-3" />
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
                    ? 'border-[#FB7185] scale-110 shadow-md'
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
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] transition-all ${
                errors.fullName ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <User className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          {errors.fullName && <p className="text-xs text-[#FB7185] font-medium">{errors.fullName}</p>}
        </div>

        {/* Date of Birth */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Date of Birth <span className="text-[#FB7185]">*</span></span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">required</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] transition-all ${
                errors.dateOfBirth ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <Calendar className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-[#FB7185] font-medium">{errors.dateOfBirth}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Phone Number <span className="text-[#FB7185]">*</span></span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">required</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              placeholder="+92 300 1234567"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] transition-all ${
                errors.phone ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <Phone className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
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
              className={`w-full px-4 py-3 pl-10 rounded-2xl bg-[#140924] border text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] transition-all ${
                errors.email ? 'border-[#FB7185]' : 'border-white/15'
              }`}
            />
            <Mail className="w-4 h-4 text-[#A797BD] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          {errors.email && <p className="text-xs text-[#FB7185] font-medium">{errors.email}</p>}
        </div>

        {/* Height (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Height (cm)</span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">optional</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 165"
            min="100"
            max="250"
            value={data.heightCm ?? ''}
            onChange={(e) => onChange('heightCm', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-4 py-3 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] transition-all"
          />
        </div>

        {/* Weight (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold font-mono text-[#EDE4F7] uppercase tracking-wider flex items-center justify-between">
            <span>Weight (kg)</span>
            <span className="text-[10px] text-[#A797BD] font-normal lowercase">optional</span>
          </label>
          <input
            type="number"
            placeholder="e.g. 62"
            min="30"
            max="300"
            step="0.5"
            value={data.weightKg ?? ''}
            onChange={(e) => onChange('weightKg', e.target.value ? parseFloat(e.target.value) : null)}
            className="w-full px-4 py-3 rounded-2xl bg-[#140924] border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] transition-all"
          />
        </div>
      </div>

      {/* Reassurance Note */}
      <div className="p-3.5 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 flex items-center gap-2.5 text-xs text-[#CDBDD8]">
        <Sparkles className="w-4 h-4 text-[#FB7185] shrink-0" />
        <span>Your data is encrypted end-to-end and stored with strict clinical privacy standards.</span>
      </div>
    </div>
  );
};
