import React, { useState } from 'react';
import {
  MarkerPin01,
  Clock,
  CreditCard01,
  MedicalCircle,
  ArrowRight,
  User01,
} from '@untitledui/icons';
import { Star } from 'lucide-react';
import type { Doctor } from '../../types/doctor';
import { getDoctorInitials, getDoctorClinicalInterests } from '../../utils/doctorPathway';

export interface SpecialistCardProps {
  doctor: Doctor;
  pathway?: 'female' | 'male' | string;
  onSelectDoctor?: (doctor: Doctor) => void;
  onBookAppointment: (doctor: Doctor) => void;
  compact?: boolean;
}

export const SpecialistCard: React.FC<SpecialistCardProps> = ({
  doctor,
  pathway = 'female',
  onSelectDoctor,
  onBookAppointment,
  compact = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const isFemale = pathway === 'female';
  const initials = getDoctorInitials(doctor.name);
  const clinicalInterests = getDoctorClinicalInterests(doctor);

  // Pathway specific color tokens
  const accentColor = isFemale ? '#F43F7D' : '#0288D1';
  const softBg = isFemale ? '#FDE6EF' : '#E1F5FE';
  const borderTone = isFemale ? 'border-pink-200/80' : 'border-sky-200/80';
  const badgeText = isFemale ? 'text-[#BE185D]' : 'text-[#0288D1]';
  const buttonClass = isFemale
    ? 'bg-[#F43F7D] hover:bg-[#DC326C] text-white shadow-xs'
    : 'bg-[#0288D1] hover:bg-[#0277BD] text-white shadow-xs';

  const pathwayBadgeLabel =
    doctor.pathway === 'female_pcos'
      ? 'PCOS Specialist'
      : doctor.pathway === 'male_hypogonadism'
      ? 'Male Hormone Specialist'
      : doctor.pathway === 'both'
      ? 'Endocrine & Reproductive Health'
      : isFemale
      ? 'Women’s Health Specialist'
      : 'Men’s Health Specialist';

  return (
    <article
      className={`bg-white rounded-2xl sm:rounded-3xl border border-[#EAECF0] p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 relative text-left select-none ${
        compact ? 'p-4 sm:p-4' : ''
      }`}
    >
      <div className="space-y-4">
        {/* Top Header: Pathway Badge & Wait Time/Experience */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${borderTone} ${badgeText}`}
            style={{ backgroundColor: softBg }}
          >
            <MedicalCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{pathwayBadgeLabel}</span>
          </span>

          {doctor.experience_years ? (
            <span className="text-xs font-medium text-[#64748B]">
              {doctor.experience_years} years experience
            </span>
          ) : null}
        </div>

        {/* Doctor Identity: Portrait + Name + Specialty + Qualifications */}
        <div className="flex items-start gap-3.5 sm:gap-4">
          {/* Portrait Container (76px - 84px restrained size) */}
          <div className="shrink-0 relative">
            {doctor.profile_image && !imgError ? (
              <img
                src={doctor.profile_image}
                alt={`Photograph of ${doctor.name}`}
                onError={() => setImgError(true)}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#EAECF0] shadow-2xs"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl border border-[#EAECF0] flex flex-col items-center justify-center relative shadow-2xs`}
                style={{ backgroundColor: softBg }}
                aria-label={`Avatar for ${doctor.name}`}
              >
                <span
                  className="text-base sm:text-lg font-bold font-display"
                  style={{ color: accentColor }}
                >
                  {initials}
                </span>
                <User01 className="w-3.5 h-3.5 mt-0.5 opacity-60" style={{ color: accentColor }} aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Name & Clinical Specialty */}
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-[#111318] leading-snug truncate font-display">
              {doctor.name}
            </h3>

            {doctor.specialty && (
              <p className="text-sm font-semibold text-[#344054] mt-0.5 leading-snug">
                {doctor.specialty}
              </p>
            )}

            {doctor.qualifications && (
              <p className="text-xs text-[#667085] mt-0.5 line-clamp-1" title={doctor.qualifications}>
                {doctor.qualifications}
              </p>
            )}

            {/* Real Rating ONLY if real data exists */}
            {doctor.rating ? (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#475569]">
                <div className="flex items-center gap-1 font-semibold text-[#111318]">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
                  <span>{doctor.rating}</span>
                </div>
                {doctor.reviews_count ? (
                  <span className="text-[#98A2B3]">({doctor.reviews_count} patient reviews)</span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Clinical Focus / "Best for" */}
        {clinicalInterests.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <span className="text-xs font-semibold text-[#667085] block">
              Best for
            </span>
            <div className="flex flex-wrap gap-1.5">
              {clinicalInterests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#EAECF0] text-xs font-medium text-[#344054]"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Short Doctor Bio if available and not compact */}
        {!compact && doctor.short_bio && (
          <p className="text-sm text-[#475569] line-clamp-2 leading-relaxed">
            {doctor.short_bio}
          </p>
        )}

        {/* Practice Details & Logistics (Location, Fee, Wait Time) */}
        <div className="pt-3 border-t border-[#F2F4F7] space-y-1.5 text-xs text-[#475569]">
          {doctor.location && (
            <div className="flex items-center gap-2">
              <MarkerPin01 className="w-4 h-4 text-[#98A2B3] shrink-0" aria-hidden="true" />
              <span className="truncate">{doctor.location}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {doctor.fee ? (
              <div className="flex items-center gap-2 font-medium text-[#111318]">
                <CreditCard01 className="w-4 h-4 text-[#98A2B3] shrink-0" aria-hidden="true" />
                <span className="font-semibold">{doctor.fee}</span>
                <span className="text-xs text-[#667085] font-normal">consultation</span>
              </div>
            ) : (
              <span className="text-xs text-[#667085]">Standard consultation fee</span>
            )}

            {doctor.wait_time && (
              <div className="flex items-center gap-1.5 text-[#667085]">
                <Clock className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" aria-hidden="true" />
                <span>Wait: <strong className="text-[#344054] font-medium">{doctor.wait_time}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Actions Footer: [ View Profile ] [ Book Appointment ] */}
      <div className="mt-5 pt-4 border-t border-[#F2F4F7] flex flex-col sm:flex-row items-center gap-2.5">
        {onSelectDoctor && (
          <button
            type="button"
            onClick={() => onSelectDoctor(doctor)}
            className="w-full sm:w-auto flex-1 py-2.5 px-3.5 rounded-xl border border-[#D0D5DD] hover:bg-slate-50 text-[#344054] text-xs font-semibold transition-all cursor-pointer text-center"
          >
            View Profile
          </button>
        )}

        <button
          type="button"
          onClick={() => onBookAppointment(doctor)}
          className={`w-full ${
            onSelectDoctor ? 'sm:flex-1' : 'sm:w-full'
          } py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] ${buttonClass}`}
        >
          <span>Book Appointment</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
};
