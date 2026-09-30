import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MarkerPin01,
  VideoRecorder,
  File01,
  HelpCircle,
  ArrowRight,
  CreditCard01,
  CheckCircle,
  AlertCircle,
  DotsVertical,
  MedicalCross,
} from '@untitledui/icons';
import { ShieldCheck } from 'lucide-react';
import type { AppointmentItem } from '../../types/appointment';
import type { Doctor } from '../../types/doctor';
import {
  getAppointmentDaysRemaining,
  enrichAppointmentWithDoctor,
  getDoctorInitials,
  formatAppointmentDate,
} from '../../utils/appointmentUtils';

export interface BookedAppointmentCardProps {
  appointment: AppointmentItem;
  doctor?: Doctor | null;
  allDoctors?: Doctor[];
  isMale?: boolean;
  onPrepare?: (appointment: AppointmentItem) => void;
  onViewDetails?: (appointment: AppointmentItem) => void;
  isFeatured?: boolean;
}

export const BookedAppointmentCard: React.FC<BookedAppointmentCardProps> = ({
  appointment,
  doctor,
  allDoctors,
  isMale = false,
  onPrepare,
  onViewDetails,
  isFeatured = false,
}) => {
  const [imgError, setImgError] = useState(false);

  // Enrich appointment details from passed doctor or canonical doctors list
  const enriched = enrichAppointmentWithDoctor(
    appointment,
    allDoctors || (doctor ? [doctor] : [])
  );

  const displayImage = imgError ? null : enriched.image || null;
  const displaySpecialty =
    appointment.providerSpecialty ||
    enriched.specialty ||
    (isMale ? 'Endocrinologist & Andrology Specialist' : 'Specialist Gynecologist & PCOS Consultant');
  const displayFee = appointment.fee || enriched.fee || null;
  const displayLocation = appointment.location || enriched.location || 'Clinic Consultation';

  // Days remaining & timing
  const daysInfo = getAppointmentDaysRemaining(appointment.scheduledDate);
  const formattedDate = formatAppointmentDate(appointment.scheduledDate);
  const isVideo =
    Boolean(appointment.meetingUrl) ||
    displayLocation.toLowerCase().includes('video') ||
    displayLocation.toLowerCase().includes('online');

  // Pathway badge resolution
  const pathwayLabel =
    enriched.relevanceReason ||
    (enriched.pathway === 'male_hypogonadism'
      ? 'Male Hormonal Care'
      : enriched.pathway === 'female_pcos'
      ? 'PCOS Care Specialist'
      : enriched.pathway === 'both'
      ? 'Reproductive & Sexual Health'
      : isMale
      ? 'Men’s Health & Andrology'
      : 'PCOS & Women’s Health');

  // Question counts
  const questionCount = appointment.doctorQuestions?.length || 0;
  const answeredCount = appointment.doctorQuestions?.filter((q) => q.isDiscussed).length || 0;

  // Status Styling Badges
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD] text-[11px] font-mono font-bold tracking-wide uppercase">
            <CheckCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>Completed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[11px] font-mono font-bold tracking-wide uppercase">
            <AlertCircle className="w-3.5 h-3.5 text-[#B91C1C]" aria-hidden="true" />
            <span>Cancelled</span>
          </span>
        );
      case 'rescheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[11px] font-mono font-bold tracking-wide uppercase">
            <Calendar className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />
            <span>Rescheduled</span>
          </span>
        );
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD] text-[11px] font-mono font-bold tracking-wide uppercase">
            <Clock className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>Visit Requested</span>
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-[11px] font-mono font-bold tracking-wide uppercase">
            <CheckCircle className="w-3.5 h-3.5 text-[#047857]" aria-hidden="true" />
            <span>Upcoming Visit</span>
          </span>
        );
    }
  };

  // Days Remaining Pill
  const getDaysRemainingPill = () => {
    if (appointment.status === 'cancelled' || appointment.status === 'completed' || daysInfo.isPast) {
      return null;
    }

    if (daysInfo.isToday) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />
          <span>Today</span>
        </span>
      );
    }

    if (daysInfo.isTomorrow) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] text-xs font-mono font-bold">
          <Clock className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
          <span>Tomorrow</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD] text-xs font-mono font-bold">
        <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
        <span>{daysInfo.label}</span>
      </span>
    );
  };

  // Theme Accent Variables
  const cardBorderClass = isFeatured
    ? isMale
      ? 'border-[#0288D1] ring-1 ring-[#0288D1]/20'
      : 'border-[#16B8C4] ring-1 ring-[#16B8C4]/20'
    : 'border-[#E2E8F0] hover:border-[#BAE6FD]';

  const avatarFallbackBg = isMale ? 'bg-[#F0F9FF] text-[#0288D1]' : 'bg-[#FDF2F8] text-[#DB2777]';
  const avatarFallbackBorder = isMale ? 'border-[#BAE6FD]' : 'border-[#FBCFE8]';

  const actionPrimaryBg = isMale
    ? 'bg-[#0288D1] hover:bg-[#0277BD] text-white'
    : 'bg-[#16B8C4] hover:bg-[#0EA5E9] text-white';

  const pathwayBadgeClass = isMale
    ? 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]'
    : 'bg-[#FDF2F8] text-[#BE185D] border-[#FBCFE8]';

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-white border ${cardBorderClass} shadow-xs hover:shadow-md transition-all select-none text-left p-6 sm:p-7 space-y-6`}
    >
      {/* ── 1. Top Status & Highlights Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
        <div className="flex flex-wrap items-center gap-2">
          {getStatusBadge()}
          {getDaysRemainingPill()}

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${pathwayBadgeClass}`}
          >
            <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{pathwayLabel}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
          <span className="capitalize">{appointment.appointmentType.replace('_', ' ')}</span>
          <span>•</span>
          <span>{appointment.durationMinutes} mins</span>
        </div>
      </div>

      {/* ── 2. Main Doctor & Details Layout (Left Image / Right Details) ── */}
      <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
        {/* Doctor Photo / Avatar */}
        <div className="relative shrink-0 self-center sm:self-start">
          {displayImage ? (
            <img
              src={displayImage}
              alt={appointment.providerName}
              onError={() => setImgError(true)}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-[#E2E8F0] shadow-xs"
              loading="lazy"
            />
          ) : (
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ${avatarFallbackBg} border ${avatarFallbackBorder} flex flex-col items-center justify-center shadow-xs p-2 text-center`}
            >
              <MedicalCross className="w-5 h-5 mb-1 opacity-70" aria-hidden="true" />
              <span className="text-xl font-bold font-display tracking-tight">
                {getDoctorInitials(appointment.providerName)}
              </span>
              <span className="text-[10px] font-mono font-medium opacity-80 uppercase tracking-wider mt-0.5">
                Specialist
              </span>
            </div>
          )}
        </div>

        {/* Doctor Details & Clinical Information */}
        <div className="flex-1 space-y-4 min-w-0 w-full">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-display text-[#0F172A] tracking-tight truncate">
              {appointment.providerName}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-[#0288D1] mt-0.5">
              {displaySpecialty}
            </p>

            <div className="pt-2">
              <h4 className="text-sm font-semibold text-[#1E293B]">
                {appointment.title}
              </h4>
              {appointment.reason && (
                <p className="text-xs text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                  {appointment.reason}
                </p>
              )}
            </div>
          </div>

          {/* Structured Details Grid (Date, Time, Location, Fee) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            {/* Date Box */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <span>Date</span>
              </div>
              <p className="text-xs font-bold text-[#0F172A] truncate">
                {formattedDate}
              </p>
            </div>

            {/* Time Box */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#0288D1] shrink-0" aria-hidden="true" />
                <span>Time & Slot</span>
              </div>
              <p className="text-xs font-bold text-[#0F172A] truncate">
                {appointment.scheduledTime} ({appointment.durationMinutes}m)
              </p>
            </div>

            {/* Location Box */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                {isVideo ? (
                  <VideoRecorder className="w-3.5 h-3.5 text-[#059669] shrink-0" aria-hidden="true" />
                ) : (
                  <MarkerPin01 className="w-3.5 h-3.5 text-[#0288D1] shrink-0" aria-hidden="true" />
                )}
                <span>Location</span>
              </div>
              <p className="text-xs font-bold text-[#0F172A] truncate" title={displayLocation}>
                {displayLocation}
              </p>
            </div>

            {/* Fee Box */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <CreditCard01 className="w-3.5 h-3.5 text-[#059669] shrink-0" aria-hidden="true" />
                <span>Consultation Fee</span>
              </div>
              <p className="text-xs font-bold text-[#0F172A] truncate">
                {displayFee || 'Fee on Request'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Preparation Bar & Supported Action Buttons ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Pre-Consultation Questions Counter */}
        <div className="flex items-center gap-2 text-[#0F172A]">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#0288D1] shrink-0 shadow-2xs">
            <HelpCircle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
          </div>
          <span className="font-semibold text-[#334155]">
            {questionCount > 0
              ? `${questionCount} clinical questions prepared (${answeredCount} discussed)`
              : 'No patient questions prepared for doctor yet'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
          {onPrepare && (
            <button
              type="button"
              onClick={() => onPrepare(appointment)}
              className={`px-4 py-2.5 rounded-xl ${actionPrimaryBg} font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]`}
            >
              <File01 className="w-4 h-4" aria-hidden="true" />
              <span>Prepare for Visit</span>
              <ArrowRight className="w-3 h-3 ml-0.5" aria-hidden="true" />
            </button>
          )}

          {onViewDetails && (
            <button
              type="button"
              onClick={() => onViewDetails(appointment)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#BAE6FD] hover:bg-[#F0F9FF] text-[#0288D1] font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98]"
            >
              <DotsVertical className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Manage Details</span>
            </button>
          )}

          {appointment.meetingUrl && (
            <a
              href={appointment.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] hover:bg-[#D1FAE5] text-[#047857] font-bold text-xs shadow-xs transition-all flex items-center gap-1"
            >
              <VideoRecorder className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
              <span>Join Video</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookedAppointmentCard;
