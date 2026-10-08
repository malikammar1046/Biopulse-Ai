import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  XClose,
  MarkerPin01,
  CreditCard01,
  Clock,
  Phone,
  Mail01,
  MedicalCircle,
  CalendarCheck01,
  User01,
  ArrowRight,
} from '@untitledui/icons';
import { Star } from 'lucide-react';
import type { Doctor } from '../../types/doctor';
import { getDoctorInitials, getDoctorClinicalInterests } from '../../utils/doctorPathway';

export interface SpecialistProfileModalProps {
  doctor: Doctor | null;
  pathway?: 'female' | 'male' | string;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: (doctor: Doctor) => void;
}

export const SpecialistProfileModal: React.FC<SpecialistProfileModalProps> = ({
  doctor,
  pathway = 'female',
  isOpen,
  onClose,
  onBookAppointment,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [doctor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doctor) return null;

  const isFemale = pathway === 'female';
  const initials = getDoctorInitials(doctor.name);
  const clinicalInterests = getDoctorClinicalInterests(doctor);

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

  const servicesList = doctor.services_offered
    ? doctor.services_offered
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="specialist-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#EAECF0] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-left"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAECF0] flex items-start justify-between gap-4 bg-slate-50/60">
          <div className="flex items-start gap-4">
            {/* Portrait */}
            <div className="shrink-0 relative">
              {doctor.profile_image && !imgError ? (
                <img
                  src={doctor.profile_image}
                  alt={`Photograph of ${doctor.name}`}
                  onError={() => setImgError(true)}
                  className="w-20 h-20 rounded-2xl object-cover border border-[#EAECF0] shadow-xs"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl border border-[#EAECF0] flex flex-col items-center justify-center shadow-xs"
                  style={{ backgroundColor: softBg }}
                  aria-label={`Avatar for ${doctor.name}`}
                >
                  <span
                    className="text-xl font-bold font-display"
                    style={{ color: accentColor }}
                  >
                    {initials}
                  </span>
                  <User01 className="w-4 h-4 mt-0.5 opacity-60" style={{ color: accentColor }} aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Title & Qualifications */}
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${borderTone} ${badgeText} mb-1`}
                style={{ backgroundColor: softBg }}
              >
                <MedicalCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{pathwayBadgeLabel}</span>
              </span>

              <h2
                id="specialist-modal-title"
                className="text-lg sm:text-xl font-bold text-[#111318] leading-tight font-display"
              >
                {doctor.name}
              </h2>

              {doctor.specialty && (
                <p className="text-sm font-semibold text-[#344054] mt-0.5">
                  {doctor.specialty}
                </p>
              )}

              {doctor.qualifications && (
                <p className="text-xs text-[#667085] mt-0.5">
                  {doctor.qualifications}
                </p>
              )}

              {doctor.experience_years ? (
                <p className="text-xs text-[#475569] mt-1 font-medium">
                  {doctor.experience_years} years clinical experience
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#667085] hover:text-[#111318] hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            aria-label="Close specialist profile"
          >
            <XClose className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Key Metrics / Snapshot Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Consultation Fee */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EAECF0] space-y-1">
              <span className="text-xs font-semibold text-[#667085] flex items-center gap-1.5">
                <CreditCard01 className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />
                Fee Structure
              </span>
              <p className="text-sm font-bold text-[#111318]">
                {doctor.fee || 'Contact clinic'}
              </p>
            </div>

            {/* Location */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EAECF0] space-y-1">
              <span className="text-xs font-semibold text-[#667085] flex items-center gap-1.5">
                <MarkerPin01 className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />
                Location
              </span>
              <p className="text-sm font-bold text-[#111318] truncate">
                {doctor.location || 'Lahore'}
              </p>
            </div>

            {/* Wait Time / Rating */}
            <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#EAECF0] space-y-1 col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-[#667085] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#98A2B3]" aria-hidden="true" />
                Wait Time
              </span>
              <p className="text-sm font-bold text-[#111318]">
                {doctor.wait_time || 'Under 25 mins'}
              </p>
            </div>
          </div>

          {/* Real Patient Rating if available */}
          {doctor.rating ? (
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden="true" />
                <span className="font-bold text-[#111318] text-sm">{doctor.rating}</span>
                <span className="text-[#667085]">
                  based on verified patient consultations
                </span>
              </div>
              {doctor.reviews_count ? (
                <span className="font-semibold text-[#344054]">
                  {doctor.reviews_count} Reviews
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Clinical Focus / "Best for" */}
          {clinicalInterests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                Specialized Clinical Focus
              </h3>
              <div className="flex flex-wrap gap-2">
                {clinicalInterests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-[#D0D5DD] text-xs font-semibold text-[#111318]"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Biography / Background */}
          {doctor.short_bio ? (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                Professional Background
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                {doctor.short_bio}
              </p>
            </div>
          ) : null}

          {/* Services Offered */}
          {servicesList.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                Services &amp; Clinical Procedures
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {servicesList.map((service, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-[#EAECF0] text-xs text-[#344054] font-medium"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Direct Options if available */}
          {(doctor.phone || doctor.email) && (
            <div className="pt-3 border-t border-[#EAECF0] flex flex-wrap items-center gap-4 text-xs text-[#667085]">
              {doctor.phone && (
                <a
                  href={`tel:${doctor.phone}`}
                  className="flex items-center gap-1.5 text-[#344054] hover:text-[#111318] font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{doctor.phone}</span>
                </a>
              )}
              {doctor.email && (
                <a
                  href={`mailto:${doctor.email}`}
                  className="flex items-center gap-1.5 text-[#344054] hover:text-[#111318] font-semibold"
                >
                  <Mail01 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{doctor.email}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#EAECF0] bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#D0D5DD] hover:bg-white text-xs font-semibold text-[#344054] transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onBookAppointment(doctor);
            }}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 active:scale-[0.98] ${buttonClass}`}
          >
            <CalendarCheck01 className="w-4 h-4" aria-hidden="true" />
            <span>Book Appointment with {doctor.name}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
