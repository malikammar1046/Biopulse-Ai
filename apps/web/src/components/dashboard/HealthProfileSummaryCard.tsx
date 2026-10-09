import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldTick,
  ActivityHeart,
  MedicalCross,
  MedicalCircle,
  AlertCircle,
  Phone,
  Scales01,
  Calendar,
  Edit01,
  Sliders01,
} from '@untitledui/icons';
import { useUserHealth } from '../../context/UserHealthContext';
import { calculateAge, calculateProfileCompletion } from '../../utils/profileCompletion';
import { resolvePathway } from '../../types/onboarding';
import { ROUTES } from '../../constants/routes';

interface HealthProfileSummaryCardProps {
  isMale?: boolean;
}

export const HealthProfileSummaryCard: React.FC<HealthProfileSummaryCardProps> = ({
  isMale: isMaleProp,
}) => {
  const navigate = useNavigate();
  const { userProfile } = useUserHealth();

  const isMale =
    isMaleProp !== undefined
      ? isMaleProp
      : resolvePathway(userProfile.gender, userProfile.pathway) === 'male';

  const primaryAccent = isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]';
  const primaryBg = isMale ? 'bg-[#0288D1] hover:bg-[#0277BD]' : 'bg-[#F43F7D] hover:bg-[#E11D48]';
  const badgeClasses = isMale
    ? 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
    : 'bg-[#FDE6EF] text-[#E11D48] border-[#F43F7D]/20';
  const badgeIconClass = isMale ? 'text-[#0288D1]' : 'text-[#E11D48]';
  const progressBarColor = isMale ? 'bg-[#29B6F6]' : 'bg-[#F43F7D]';

  const completion = calculateProfileCompletion(userProfile);
  const age = calculateAge(userProfile.dateOfBirth);
  const primaryEmergency = userProfile.emergencyContacts?.[0];

  const allergies = userProfile.medical?.allergies?.filter((a) => a !== 'None') || [];
  const medications = userProfile.medical?.medications || [];
  const conditions = userProfile.medical?.conditions?.filter((c) => c !== 'None') || [];

  const handleCompleteOrEdit = () => {
    navigate(ROUTES.APP.SETTINGS);
  };

  return (
    <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E8F0] shadow-xs select-none text-left space-y-6 relative overflow-hidden">
      {/* ── Top Row: Header, Profile Completion Progress Bar & Edit CTA ── */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${badgeClasses}`}>
            <ShieldTick className={`w-3.5 h-3.5 ${badgeIconClass}`} aria-hidden="true" />
            <span>Your Health Record</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[#0F172A]">
            {userProfile.fullName || 'User'}&apos;s Health Profile
          </h2>
          <p className="text-xs text-[#64748B] font-sans">
            Your health background, baseline numbers, and medical history in one secure place.
          </p>
        </div>

        {/* Dynamic Profile Completion Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#F8FAFC] p-3.5 sm:p-4 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-[#0F172A] flex items-center gap-1.5">
                <Sliders01 className={`w-3.5 h-3.5 ${primaryAccent}`} aria-hidden="true" />
                Profile Completion
              </span>
              <span className={`font-mono font-extrabold ${primaryAccent}`}>
                {completion.percentage}%
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${progressBarColor}`}
                style={{ width: `${completion.percentage}%` }}
              />
            </div>

            {completion.nextAction && (
              <span className="text-[10px] font-mono text-[#64748B] block truncate">
                Missing: <span className={`font-semibold ${primaryAccent}`}>{completion.nextAction.label}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCompleteOrEdit}
            className={`px-4 py-2 rounded-xl font-sans font-bold text-xs text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${primaryBg}`}
          >
            <Edit01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{completion.percentage < 100 ? 'Complete Profile' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* ── Key Biometric & Emergency Identifiers Grid ── */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* 1. Age & Date of Birth */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
            <Calendar className={`w-3.5 h-3.5 ${primaryAccent}`} aria-hidden="true" />
            <span>Age / DOB</span>
          </div>
          {age !== null ? (
            <div>
              <span className="text-base font-bold text-[#0F172A] block font-display">
                {age} yrs old
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">{userProfile.dateOfBirth}</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">Not recorded</span>
              <button
                onClick={handleCompleteOrEdit}
                className={`text-[10px] font-bold hover:underline cursor-pointer ${primaryAccent}`}
              >
                Add DOB
              </button>
            </div>
          )}
        </div>

        {/* 2. Blood Type */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
            <ActivityHeart className={`w-3.5 h-3.5 ${primaryAccent}`} aria-hidden="true" />
            <span>Blood Type</span>
          </div>
          {userProfile.medical?.bloodType && userProfile.medical.bloodType !== 'Not Sure' ? (
            <div>
              <span className="text-base font-bold text-[#0F172A] block font-display">
                {userProfile.medical.bloodType}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">Verified</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">Not added yet</span>
              <button
                onClick={handleCompleteOrEdit}
                className={`text-[10px] font-bold hover:underline cursor-pointer ${primaryAccent}`}
              >
                Add Blood Type
              </button>
            </div>
          )}
        </div>

        {/* 3. Physical Measurements (Height & Weight) */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
            <Scales01 className={`w-3.5 h-3.5 ${primaryAccent}`} aria-hidden="true" />
            <span>Height & Weight</span>
          </div>
          {userProfile.heightCm || userProfile.weightKg ? (
            <div>
              <span className="text-base font-bold text-[#0F172A] block font-display">
                {userProfile.heightCm ? `${userProfile.heightCm}cm` : '—'} • {userProfile.weightKg ? `${userProfile.weightKg}kg` : '—'}
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">Baseline metrics</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">Not recorded</span>
              <button
                onClick={handleCompleteOrEdit}
                className={`text-[10px] font-bold hover:underline cursor-pointer ${primaryAccent}`}
              >
                Add Measurements
              </button>
            </div>
          )}
        </div>

        {/* 4. Primary Emergency Contact */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#64748B]">
            <Phone className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Emergency Contact</span>
          </div>
          {primaryEmergency?.name?.trim() ? (
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#0F172A] block truncate">
                {primaryEmergency.name}
              </span>
              <span className="text-[10px] font-mono text-[#64748B] block truncate">
                {primaryEmergency.relationship}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#64748B] block">Not added</span>
              <button
                onClick={handleCompleteOrEdit}
                className={`text-[10px] font-bold hover:underline cursor-pointer ${primaryAccent}`}
              >
                Add Emergency Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Medical Baseline Chips Row (Allergies, Medications, Conditions) ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Allergies Chip Box */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#0F172A] uppercase flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
              Known Allergies
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
              {allergies.length}
            </span>
          </div>

          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A]"
                >
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#64748B] py-1">
              <span>No known allergies recorded</span>
              <button
                type="button"
                onClick={handleCompleteOrEdit}
                className={`text-[11px] font-bold hover:underline cursor-pointer ${primaryAccent}`}
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Medications & Supplements Chip Box */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#0F172A] uppercase flex items-center gap-1.5">
              <MedicalCross className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              Medications & Supplements
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              {medications.length}
            </span>
          </div>

          {medications.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {medications.map((med) => (
                <span
                  key={med.id}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A]"
                >
                  {med.name} {med.dosage ? `(${med.dosage})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#64748B] py-1">
              <span>No medications recorded</span>
              <button
                type="button"
                onClick={handleCompleteOrEdit}
                className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* Diagnosed Conditions Chip Box */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#0F172A] uppercase flex items-center gap-1.5">
              <MedicalCircle className={`w-3.5 h-3.5 ${primaryAccent}`} aria-hidden="true" />
              Health Conditions
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeClasses}`}>
              {conditions.length}
            </span>
          </div>

          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((cond, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A]"
                >
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#64748B] py-1">
              <span>No diagnosed conditions recorded</span>
              <button
                type="button"
                onClick={handleCompleteOrEdit}
                className={`text-[11px] font-bold hover:underline cursor-pointer ${primaryAccent}`}
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
