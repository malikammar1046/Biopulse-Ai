import React, { useRef, useState } from 'react';
import { Upload01, Check, Trash01, Image01, AlertCircle } from '@untitledui/icons';
import { validateAvatarFile, optimizeAvatarImage } from '../../services/avatarService';

export interface CartoonAvatar {
  id: string;
  name: string;
  src: string;
  presentation: 'male' | 'female';
}

export const CARTOON_AVATARS: CartoonAvatar[] = [
  {
    id: 'male-1',
    name: 'Friendly Avatar 1 (Male)',
    src: '/avatars/avatar-male-1.svg',
    presentation: 'male',
  },
  {
    id: 'male-2',
    name: 'Friendly Avatar 2 (Male)',
    src: '/avatars/avatar-male-2.svg',
    presentation: 'male',
  },
  {
    id: 'female-1',
    name: 'Friendly Avatar 3 (Female)',
    src: '/avatars/avatar-female-1.svg',
    presentation: 'female',
  },
  {
    id: 'female-2',
    name: 'Friendly Avatar 4 (Female)',
    src: '/avatars/avatar-female-2.svg',
    presentation: 'female',
  },
];

interface ProfilePictureSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  error?: string;
  pathway?: 'female' | 'male' | 'general';
}

export const ProfilePictureSelector: React.FC<ProfilePictureSelectorProps> = ({
  value,
  onChange,
  error,
  pathway = 'female',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(() => {
    // If current value is not one of the preset cartoon avatars, treat as custom photo
    if (value && !CARTOON_AVATARS.some((a) => a.src === value)) {
      return value;
    }
    return null;
  });

  const isMalePathway = pathway === 'male';

  // Dynamic pathway accents
  const accentBorder = isMalePathway ? 'border-[#0288D1]' : 'border-[#F43F7D]';
  const accentRing = isMalePathway ? 'ring-4 ring-[#E0F2FE]' : 'ring-4 ring-[#FDE6EF]';
  const accentBg = isMalePathway ? 'bg-[#0288D1]' : 'bg-[#F43F7D]';
  const accentButton = isMalePathway
    ? 'bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-sky-500/20'
    : 'bg-[#0E9EAA] hover:bg-[#0C8893] text-white shadow-teal-500/20';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate format (.jpg, .jpeg, .png, .webp) and size (<5MB)
    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Please upload a valid JPG, PNG, or WebP image under 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsProcessing(true);
    try {
      // Optimize to high-resolution square 512x512
      const { blob } = await optimizeAvatarImage(file, 512, 0.88);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCustomPhotoUrl(dataUrl);
        onChange(dataUrl);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setUploadError('Unable to process the selected photo. Please try another image.');
        setIsProcessing(false);
      };
      reader.readAsDataURL(blob);
    } catch {
      // Direct file reader fallback
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCustomPhotoUrl(dataUrl);
        onChange(dataUrl);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAvatarSelect = (avatarSrc: string) => {
    setUploadError(null);
    onChange(avatarSrc);
  };

  const handleRemoveCustomPhoto = () => {
    setCustomPhotoUrl(null);
    if (value === customPhotoUrl) {
      // Default to first avatar or empty
      onChange('');
    }
  };

  const isCustomPhotoSelected = Boolean(
    value &&
    customPhotoUrl &&
    value === customPhotoUrl &&
    !CARTOON_AVATARS.some((a) => a.src === value)
  );

  return (
    <div className="w-full rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] p-4 sm:p-5 lg:p-6 space-y-4">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h3 className="text-base sm:text-lg font-bold font-display text-[#073B72] tracking-tight leading-snug">
            Choose your profile picture
          </h3>
          <p className="text-[14px] sm:text-[15px] text-[#55718F] font-sans leading-relaxed mt-0.5">
            Upload your own photo or choose an avatar.
          </p>
        </div>

        {/* Selected badge if user has chosen */}
        {value && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#D7EAF2] shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-semibold text-[#073B72]">Picture selected</span>
          </div>
        )}
      </div>

      {/* ── Option A: Upload Custom Photo ── */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#E2EEF4] transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Custom Photo Preview / Placeholder */}
            <div
              className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden shrink-0 flex items-center justify-center transition-all ${
                isCustomPhotoSelected
                  ? `${accentBorder} ${accentRing} shadow-md`
                  : 'border-2 border-dashed border-[#BCD5E3] bg-[#F5F9FC]'
              }`}
            >
              {customPhotoUrl ? (
                <img
                  src={customPhotoUrl}
                  alt="Your uploaded profile photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image01 className="w-7 h-7 text-[#8FA3B8]" aria-hidden="true" />
              )}

              {/* Checkmark badge when custom photo is active */}
              {isCustomPhotoSelected && (
                <div
                  className={`absolute bottom-0 right-0 w-5 h-5 rounded-full ${accentBg} text-white flex items-center justify-center shadow-xs ring-2 ring-white`}
                >
                  <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <span className="text-[14px] sm:text-[15px] font-bold text-[#073B72] block leading-tight">
                {customPhotoUrl ? 'Your Uploaded Photo' : 'Upload your photo'}
              </span>
              <span className="text-[12px] sm:text-[13px] text-[#55718F] block leading-tight mt-1">
                {customPhotoUrl
                  ? isCustomPhotoSelected
                    ? 'Currently selected as your profile picture'
                    : 'Click to select this uploaded photo'
                  : 'Supported formats: JPG, PNG, or WebP (max 5 MB)'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {customPhotoUrl ? (
              <>
                {!isCustomPhotoSelected && (
                  <button
                    type="button"
                    onClick={() => onChange(customPhotoUrl)}
                    className="px-3.5 py-2 rounded-xl text-[13px] font-semibold text-[#073B72] bg-[#F0F7FB] hover:bg-[#E2EEF5] border border-[#D7EAF2] transition-colors cursor-pointer"
                  >
                    Select photo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-3.5 py-2 rounded-xl text-[13px] font-semibold text-[#073B72] bg-white hover:bg-slate-50 border border-[#D7EAF2] transition-colors cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCustomPhoto}
                  className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                  title="Remove uploaded photo"
                  aria-label="Remove uploaded photo"
                >
                  <Trash01 className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className={`px-4 sm:px-5 py-2.5 rounded-full text-[14px] sm:text-[15px] font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${accentButton} disabled:opacity-60`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload01 className="w-4 h-4" aria-hidden="true" />
                    <span>Upload Photo</span>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload profile photo"
            />
          </div>
        </div>

        {uploadError && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* ── Divider: or choose an avatar ── */}
      <div className="relative flex items-center justify-center py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-[#D7EAF2]" />
        </div>
        <span className="relative px-3 bg-[#FAFCFF] text-[13px] font-medium text-[#55718F]">
          or choose an avatar
        </span>
      </div>

      {/* ── Option B: 4 Friendly Cartoon Avatars ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {CARTOON_AVATARS.map((avatar) => {
          const isSelected = value === avatar.src;

          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => handleAvatarSelect(avatar.src)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  handleAvatarSelect(avatar.src);
                }
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={avatar.name}
              className={`relative group rounded-2xl p-2.5 sm:p-3 flex flex-col items-center text-center transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0288D1] ${
                isSelected
                  ? `bg-white ${accentBorder} border-2 ${accentRing} shadow-md -translate-y-0.5`
                  : 'bg-white border border-[#D7EAF2] hover:border-[#BCD5E3] hover:shadow-xs hover:-translate-y-0.5'
              }`}
            >
              {/* Avatar Tile: 80–92px */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden shrink-0 transition-transform group-hover:scale-[1.03]">
                <img
                  src={avatar.src}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div
                    className={`absolute bottom-0 right-0 w-6 h-6 rounded-full ${accentBg} text-white flex items-center justify-center shadow-md ring-2 ring-white`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                  </div>
                )}
              </div>

              {/* Avatar Label */}
              <span
                className={`mt-2 text-[12px] sm:text-[13px] font-semibold tracking-tight transition-colors ${
                  isSelected ? 'text-[#073B72]' : 'text-[#55718F] group-hover:text-[#073B72]'
                }`}
              >
                {avatar.presentation === 'male' ? 'Avatar (Male)' : 'Avatar (Female)'}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Validation Warning (Gentle & Friendly) ── */}
      {error && (
        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[13px] sm:text-[14px] text-amber-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
