import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  HeartPulse,
  Pill,
  AlertCircle,
  Stethoscope,
  Sparkles,
  Phone,
  Scale,
  Calendar,
  Edit3,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { calculateAge, calculateProfileCompletion } from '../../utils/profileCompletion';
import { ROUTES } from '../../constants/routes';

export const HealthProfileSummaryCard: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useUserHealth();

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
    <div className="p-6 sm:p-8 rounded-[36px] bg-gradient-to-br from-white via-[#FCFAFD] to-[#F7F2FA] border border-[#E7DFEF] shadow-sm select-none text-left space-y-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#EDE4F7]/60 via-[#FDF2F8]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Row: Header, Profile Completion Progress Bar & Edit CTA ── */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#F0EAF5]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-xs font-mono font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Personal Health Command Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
            {userProfile.fullName || 'User'}'s Health Profile
          </h2>
          <p className="text-xs text-[#584B68] font-sans">
            Continuous personal baseline recorded for longitudinal health intelligence.
          </p>
        </div>

        {/* Dynamic Profile Completion Widget */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/80 p-3.5 sm:p-4 rounded-3xl border border-[#E7DFEF] shadow-xs">
          <div className="space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-[#1C1326] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
                Profile Completion
              </span>
              <span className="font-mono font-extrabold text-[#6E2D8B]">
                {completion.percentage}%
              </span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="h-2 rounded-full bg-[#EDE4F7] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>

            {completion.nextAction && (
              <span className="text-[10px] font-mono text-[#8D7E9E] block truncate">
                Missing: <span className="text-[#FB7185] font-semibold">{completion.nextAction.label}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCompleteOrEdit}
            className="px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{completion.percentage < 100 ? 'Complete Profile' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* ── Key Biometric & Emergency Identifiers Grid ── */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* 1. Age & Date of Birth */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8D7E9E]">
            <Calendar className="w-3.5 h-3.5 text-[#6E2D8B]" />
            <span>Age / DOB</span>
          </div>
          {age !== null ? (
            <div>
              <span className="text-base font-bold text-[#1C1326] block font-display">
                {age} yrs old
              </span>
              <span className="text-[10px] font-mono text-[#8D7E9E]">{userProfile.dateOfBirth}</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#8D7E9E] block">Not recorded</span>
              <button
                onClick={handleCompleteOrEdit}
                className="text-[10px] text-[#6E2D8B] font-bold hover:underline"
              >
                + Add DOB
              </button>
            </div>
          )}
        </div>

        {/* 2. Blood Type */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8D7E9E]">
            <HeartPulse className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Blood Type</span>
          </div>
          {userProfile.medical?.bloodType && userProfile.medical.bloodType !== 'Not Sure' ? (
            <div>
              <span className="text-base font-bold text-[#1C1326] block font-display">
                {userProfile.medical.bloodType}
              </span>
              <span className="text-[10px] font-mono text-[#047857] font-semibold">Verified</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#8D7E9E] block">Not added yet</span>
              <button
                onClick={handleCompleteOrEdit}
                className="text-[10px] text-[#FB7185] font-bold hover:underline"
              >
                + Add Blood Type
              </button>
            </div>
          )}
        </div>

        {/* 3. Physical Measurements (Height & Weight) */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8D7E9E]">
            <Scale className="w-3.5 h-3.5 text-[#8E3EAF]" />
            <span>Height & Weight</span>
          </div>
          {userProfile.heightCm || userProfile.weightKg ? (
            <div>
              <span className="text-base font-bold text-[#1C1326] block font-display">
                {userProfile.heightCm ? `${userProfile.heightCm}cm` : '—'} • {userProfile.weightKg ? `${userProfile.weightKg}kg` : '—'}
              </span>
              <span className="text-[10px] font-mono text-[#8D7E9E]">Baseline metrics</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#8D7E9E] block">Not recorded</span>
              <button
                onClick={handleCompleteOrEdit}
                className="text-[10px] text-[#8E3EAF] font-bold hover:underline"
              >
                + Add Measurements
              </button>
            </div>
          )}
        </div>

        {/* 4. Primary Emergency Contact */}
        <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] space-y-1 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#8D7E9E]">
            <Phone className="w-3.5 h-3.5 text-[#047857]" />
            <span>Emergency Contact</span>
          </div>
          {primaryEmergency?.name?.trim() ? (
            <div>
              <span className="text-xs sm:text-sm font-bold text-[#1C1326] block truncate">
                {primaryEmergency.name}
              </span>
              <span className="text-[10px] font-mono text-[#584B68] block truncate">
                {primaryEmergency.relationship}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#FB7185] block">Not added</span>
              <button
                onClick={handleCompleteOrEdit}
                className="text-[10px] text-[#FB7185] font-bold hover:underline"
              >
                + Add Emergency Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Medical Baseline Chips Row (Allergies, Medications, Conditions) ── */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Allergies Chip Box */}
        <div className="p-4 rounded-2xl bg-white/90 border border-[#E7DFEF] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#1C1326] uppercase flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-[#FB7185]" />
              Known Allergies
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FDF2F8] text-[#FB7185]">
              {allergies.length}
            </span>
          </div>

          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-[#FDF2F8] border border-[#FDA4AF]/40 text-xs font-medium text-[#1C1326]"
                >
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#8D7E9E] py-1">
              <span>No known allergies recorded</span>
              <button
                type="button"
                onClick={handleCompleteOrEdit}
                className="text-[11px] text-[#6E2D8B] font-bold hover:underline"
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {/* Medications & Supplements Chip Box */}
        <div className="p-4 rounded-2xl bg-white/90 border border-[#E7DFEF] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#1C1326] uppercase flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-[#34D399]" />
              Active Regimen
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
              {medications.length}
            </span>
          </div>

          {medications.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {medications.map((med) => (
                <span
                  key={med.id}
                  className="px-2.5 py-1 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]/40 text-xs font-medium text-[#1C1326]"
                >
                  {med.name} {med.dosage ? `(${med.dosage})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#8D7E9E] py-1">
              <span>No medications added</span>
              <button
                type="button"
                onClick={handleCompleteOrEdit}
                className="text-[11px] text-[#047857] font-bold hover:underline"
              >
                + Add Med
              </button>
            </div>
          )}
        </div>

        {/* Diagnosed Conditions Chip Box */}
        <div className="p-4 rounded-2xl bg-white/90 border border-[#E7DFEF] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#1C1326] uppercase flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-[#8E3EAF]" />
              Recorded Conditions
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B]">
              {conditions.length}
            </span>
          </div>

          {conditions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((cond, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-xl bg-[#EDE4F7] border border-[#D8B4FE]/40 text-xs font-medium text-[#1C1326]"
                >
                  {cond}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-[#8D7E9E] py-1">
              <span>No diagnosed conditions recorded</span>
              <button
                type="button"
                onClick={handleCompleteOrEdit}
                className="text-[11px] text-[#8E3EAF] font-bold hover:underline"
              >
                + Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
