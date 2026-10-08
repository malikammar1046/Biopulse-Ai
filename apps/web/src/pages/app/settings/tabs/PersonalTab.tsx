import React from 'react';
import {
  Ruler,
  Scales01,
  Camera01,
  Trash01,
  CheckCircle,
  AlertCircle,
  Loading01,
} from '@untitledui/icons';
import type { UserProfile } from '../../../../types/onboarding';
import { AssessmentImpactBadge } from '../AssessmentImpactBadge';
import { useAuth } from '../../../../context/AuthContext';
import { avatarService, validateAvatarFile } from '../../../../services/avatarService';
import { UserAvatar } from '../../../../components/common/UserAvatar';
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
  const [heightUnit, setHeightUnit] = React.useState<'cm' | 'ft_in'>('cm');
  const [weightUnit, setWeightUnit] = React.useState<'kg' | 'lbs'>('kg');
  const [waistUnit, setWaistUnit] = React.useState<'cm' | 'in'>('cm');

  // Separate editing states (string buffers) to prevent keystroke conversions and cursor jumps
  const [heightCmInput, setHeightCmInput] = React.useState<string>(
    draft.heightCm != null ? String(draft.heightCm) : ''
  );
  const initialFtIn = cmToFtInNullable(draft.heightCm);
  const [heightFeetInput, setHeightFeetInput] = React.useState<string>(
    initialFtIn.feet != null ? String(initialFtIn.feet) : ''
  );
  const [heightInchesInput, setHeightInchesInput] = React.useState<string>(
    initialFtIn.inches != null ? String(initialFtIn.inches) : ''
  );

  const [weightKgInput, setWeightKgInput] = React.useState<string>(
    draft.weightKg != null ? String(draft.weightKg) : ''
  );
  const [weightLbsInput, setWeightLbsInput] = React.useState<string>(() => {
    const lbs = kgToLbs(draft.weightKg);
    return lbs != null ? String(lbs) : '';
  });

  const [waistCmInput, setWaistCmInput] = React.useState<string>(
    draft.waistCm != null ? String(draft.waistCm) : ''
  );
  const [waistInchesInput, setWaistInchesInput] = React.useState<string>(() => {
    const inches = cmToInches(draft.waistCm);
    return inches != null ? String(inches) : '';
  });

  // Track last committed canonical values to avoid overwriting active user typing
  const lastCanonicalRef = React.useRef({
    heightCm: draft.heightCm,
    weightKg: draft.weightKg,
    waistCm: draft.waistCm,
  });

  React.useEffect(() => {
    if (draft.heightCm !== lastCanonicalRef.current.heightCm) {
      lastCanonicalRef.current.heightCm = draft.heightCm;
      setHeightCmInput(draft.heightCm != null ? String(draft.heightCm) : '');
      const ftIn = cmToFtInNullable(draft.heightCm);
      setHeightFeetInput(ftIn.feet != null ? String(ftIn.feet) : '');
      setHeightInchesInput(ftIn.inches != null ? String(ftIn.inches) : '');
    }
    if (draft.weightKg !== lastCanonicalRef.current.weightKg) {
      lastCanonicalRef.current.weightKg = draft.weightKg;
      setWeightKgInput(draft.weightKg != null ? String(draft.weightKg) : '');
      const lbs = kgToLbs(draft.weightKg);
      setWeightLbsInput(lbs != null ? String(lbs) : '');
    }
    if (draft.waistCm !== lastCanonicalRef.current.waistCm) {
      lastCanonicalRef.current.waistCm = draft.waistCm;
      setWaistCmInput(draft.waistCm != null ? String(draft.waistCm) : '');
      const inches = cmToInches(draft.waistCm);
      setWaistInchesInput(inches != null ? String(inches) : '');
    }
  }, [draft.heightCm, draft.weightKg, draft.waistCm]);

  // Height handlers
  const handleHeightCmChange = (val: string) => {
    setHeightCmInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      lastCanonicalRef.current.heightCm = null;
      setDraft((p) => ({ ...p, heightCm: null }));
      return;
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) {
      lastCanonicalRef.current.heightCm = num;
      setDraft((p) => ({ ...p, heightCm: num }));
    }
  };

  const handleHeightFeetChange = (val: string) => {
    setHeightFeetInput(val);
    const feet = parseFloat(val.trim()) || 0;
    const inches = parseFloat(heightInchesInput.trim()) || 0;
    if (!val.trim() && !heightInchesInput.trim()) {
      lastCanonicalRef.current.heightCm = null;
      setDraft((p) => ({ ...p, heightCm: null }));
    } else {
      const cm = ftInToCm(feet, inches);
      lastCanonicalRef.current.heightCm = cm;
      setDraft((p) => ({ ...p, heightCm: cm }));
    }
  };

  const handleHeightInchesChange = (val: string) => {
    setHeightInchesInput(val);
    const feet = parseFloat(heightFeetInput.trim()) || 0;
    const inches = parseFloat(val.trim()) || 0;
    if (!heightFeetInput.trim() && !val.trim()) {
      lastCanonicalRef.current.heightCm = null;
      setDraft((p) => ({ ...p, heightCm: null }));
    } else {
      const cm = ftInToCm(feet, inches);
      lastCanonicalRef.current.heightCm = cm;
      setDraft((p) => ({ ...p, heightCm: cm }));
    }
  };

  const handleSwitchHeightUnit = (newUnit: 'cm' | 'ft_in') => {
    if (newUnit === heightUnit) return;
    if (newUnit === 'cm') {
      setHeightCmInput(draft.heightCm != null ? String(Math.round(draft.heightCm)) : '');
    } else {
      const ftIn = cmToFtInNullable(draft.heightCm);
      setHeightFeetInput(ftIn.feet != null ? String(ftIn.feet) : '');
      setHeightInchesInput(ftIn.inches != null ? String(ftIn.inches) : '');
    }
    setHeightUnit(newUnit);
  };

  // Weight handlers
  const handleWeightKgChange = (val: string) => {
    setWeightKgInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      lastCanonicalRef.current.weightKg = null;
      setDraft((p) => ({ ...p, weightKg: null }));
      return;
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) {
      lastCanonicalRef.current.weightKg = num;
      setDraft((p) => ({ ...p, weightKg: num }));
    }
  };

  const handleWeightLbsChange = (val: string) => {
    setWeightLbsInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      lastCanonicalRef.current.weightKg = null;
      setDraft((p) => ({ ...p, weightKg: null }));
      return;
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) {
      const kg = lbsToKg(num);
      lastCanonicalRef.current.weightKg = kg;
      setDraft((p) => ({ ...p, weightKg: kg }));
    }
  };

  const handleSwitchWeightUnit = (newUnit: 'kg' | 'lbs') => {
    if (newUnit === weightUnit) return;
    if (newUnit === 'kg') {
      setWeightKgInput(
        draft.weightKg != null ? String(Math.round(draft.weightKg * 10) / 10) : ''
      );
    } else {
      const lbs = kgToLbs(draft.weightKg);
      setWeightLbsInput(lbs != null ? String(lbs) : '');
    }
    setWeightUnit(newUnit);
  };

  // Waist handlers
  const handleWaistCmChange = (val: string) => {
    setWaistCmInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      lastCanonicalRef.current.waistCm = null;
      setDraft((p) => ({ ...p, waistCm: null }));
      return;
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) {
      lastCanonicalRef.current.waistCm = num;
      setDraft((p) => ({ ...p, waistCm: num }));
    }
  };

  const handleWaistInchesChange = (val: string) => {
    setWaistInchesInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      lastCanonicalRef.current.waistCm = null;
      setDraft((p) => ({ ...p, waistCm: null }));
      return;
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num > 0) {
      const cm = inchesToCm(num);
      lastCanonicalRef.current.waistCm = cm;
      setDraft((p) => ({ ...p, waistCm: cm }));
    }
  };

  const handleSwitchWaistUnit = (newUnit: 'cm' | 'in') => {
    if (newUnit === waistUnit) return;
    if (newUnit === 'cm') {
      setWaistCmInput(
        draft.waistCm != null ? String(Math.round(draft.waistCm * 10) / 10) : ''
      );
    } else {
      const inches = cmToInches(draft.waistCm);
      setWaistInchesInput(inches != null ? String(inches) : '');
    }
    setWaistUnit(newUnit);
  };

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

  // Auth context for persisting photo updates
  const { user, userProfile, updateUserProfile } = useAuth();

  // Avatar upload and remove state
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset native input so selecting the same file triggers again if needed
    e.target.value = '';

    setUploadError(null);
    setUploadSuccess(null);

    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid file format or size.');
      return;
    }

    const activeUserId = user?.id || userProfile?.id || draft?.id;
    if (!activeUserId) {
      setUploadError('Active session not found. Please log in again.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await avatarService.uploadAvatar(activeUserId, file);
      if (!res.success || !res.avatarUrl) {
        setUploadError(res.error || 'Failed to upload profile photo.');
        return;
      }

      // Update state across AuthContext and draft
      await updateUserProfile({ avatarUrl: res.avatarUrl });
      setDraft((prev) => ({ ...prev, avatarUrl: res.avatarUrl }));
      setUploadSuccess('Profile photo updated successfully!');
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err?.message || 'An unexpected error occurred during photo upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRemove = async () => {
    const activeUserId = user?.id || userProfile?.id || draft?.id;
    if (!activeUserId) return;

    setIsRemoving(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await avatarService.removeAvatar(activeUserId);
      if (!res.success) {
        setUploadError(res.error || 'Failed to remove photo.');
        return;
      }

      await updateUserProfile({ avatarUrl: '' });
      setDraft((prev) => ({ ...prev, avatarUrl: undefined }));
      setShowRemoveConfirm(false);
      setUploadSuccess('Profile photo removed.');
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err?.message || 'An unexpected error occurred while removing photo.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── PROFILE PHOTO SECTION ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Profile Photo</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personal avatar shown across your BioPulse dashboard, header, and care circle
            </p>
          </div>
          {isMale ? (
            <span className="text-[11px] font-semibold text-[#0284C7] bg-[#E0F2FE] px-2.5 py-1 rounded-full">
              Male Pathway
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#E11D48] bg-[#FDE6EF] px-2.5 py-1 rounded-full">
              Female Pathway
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-1">
          {/* Circular Avatar */}
          <div className="relative group">
            <UserAvatar
              avatarUrl={draft.avatarUrl || userProfile?.avatarUrl}
              name={draft.fullName || userProfile?.fullName}
              email={draft.email || userProfile?.email}
              size="xl"
              pathway={draft.pathway || userProfile?.pathway}
              gender={draft.gender || userProfile?.gender}
              className="ring-4 ring-slate-100 shadow-md transition-transform group-hover:scale-[1.02]"
            />
            {isUploading && (
              <div className="absolute inset-0 rounded-full bg-slate-900/60 flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                <Loading01 className="w-7 h-7 animate-spin text-white" />
                <span className="text-[10px] font-semibold mt-1">Uploading...</span>
              </div>
            )}
          </div>

          {/* User Details & Action Controls */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <div>
              <h4 className="text-lg font-bold text-slate-800">
                {draft.fullName?.trim() || userProfile?.fullName?.trim() || 'BioPulse Member'}
              </h4>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {draft.email || userProfile?.email || 'member@biopulse.ai'}
              </p>
            </div>

            {/* Error or Success notification banner */}
            {uploadError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{uploadError}</span>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading || isRemoving}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isRemoving}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isMale
                    ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white disabled:opacity-50'
                    : 'bg-[#E11D48] hover:bg-[#BE123C] text-white disabled:opacity-50'
                }`}
              >
                <Camera01 className="w-4 h-4" />
                <span>{isUploading ? 'Optimizing...' : 'Change Photo'}</span>
              </button>

              {(draft.avatarUrl || userProfile?.avatarUrl) && (
                <>
                  {!showRemoveConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowRemoveConfirm(true)}
                      disabled={isUploading || isRemoving}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 transition-colors border border-rose-200/60 cursor-pointer disabled:opacity-50"
                    >
                      <Trash01 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 border border-slate-200">
                      <span className="text-[11px] font-medium text-slate-600 px-1">
                        Remove photo?
                      </span>
                      <button
                        type="button"
                        onClick={handleConfirmRemove}
                        disabled={isRemoving}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {isRemoving ? 'Removing...' : 'Yes, Remove'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRemoveConfirm(false)}
                        disabled={isRemoving}
                        className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Supported formats: JPEG, PNG, WebP. Maximum size: 5 MB. Photos are automatically cropped to a square and optimized.
            </p>
          </div>
        </div>
      </div>

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
                <Ruler className="w-3.5 h-3.5 text-primary-teal" aria-hidden="true" />
                Height
              </span>

              {/* Unit Toggle */}
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => handleSwitchHeightUnit('cm')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    heightUnit === 'cm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchHeightUnit('ft_in')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
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
                  type="text"
                  inputMode="decimal"
                  value={heightCmInput}
                  onChange={(e) => handleHeightCmChange(e.target.value)}
                  placeholder="e.g. 168"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">cm</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={heightFeetInput}
                    onChange={(e) => handleHeightFeetChange(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">ft</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={heightInchesInput}
                    onChange={(e) => handleHeightInchesChange(e.target.value)}
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
                <Scales01 className="w-3.5 h-3.5 text-[#0E9EAA]" aria-hidden="true" />
                Weight
              </span>

              {/* Unit Toggle */}
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => handleSwitchWeightUnit('kg')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    weightUnit === 'kg' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  kg
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchWeightUnit('lbs')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
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
                  type="text"
                  inputMode="decimal"
                  value={weightKgInput}
                  onChange={(e) => handleWeightKgChange(e.target.value)}
                  placeholder="e.g. 64.5"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">kg</span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={weightLbsInput}
                  onChange={(e) => handleWeightLbsChange(e.target.value)}
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
                  onClick={() => handleSwitchWaistUnit('cm')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    waistUnit === 'cm' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchWaistUnit('in')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
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
                  type="text"
                  inputMode="decimal"
                  value={waistCmInput}
                  onChange={(e) => handleWaistCmChange(e.target.value)}
                  placeholder="e.g. 84"
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E9EAA]/20 focus:border-[#0E9EAA]"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-medium">cm</span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={waistInchesInput}
                  onChange={(e) => handleWaistInchesChange(e.target.value)}
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
