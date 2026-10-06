import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  CalendarCheck,
} from 'lucide-react';
import { useDoctors } from '../../services/doctorService';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES } from '../../constants/routes';
import type { Doctor } from '../../types/doctor';
import {
  getNearestUpcomingAppointment,
  getAppointmentDaysRemaining,
  enrichAppointmentWithDoctor,
  getDoctorInitials,
  formatAppointmentDate,
} from '../../utils/appointmentUtils';

interface RecommendedCareCardProps {
  pathway: 'female' | 'male';
}

export const RecommendedCareCard: React.FC<RecommendedCareCardProps> = ({ pathway }) => {
  const navigate = useNavigate();
  const isMale = pathway === 'male';
  const [imgError, setImgError] = useState(false);

  const { appointments } = useUserHealth();
  const upcomingAppointment = useMemo(() => getNearestUpcomingAppointment(appointments), [appointments]);

  // Load all doctors so we can enrich the booked doctor or show pathway recommendations
  const { doctors, loading } = useDoctors();

  // If no upcoming appointment, filter top 2 pathway-relevant specialists
  const pathwayDoctors = useMemo(() => {
    return doctors.filter((d) =>
      isMale
        ? d.pathway === 'male_hypogonadism' || d.pathway === 'both'
        : d.pathway === 'female_pcos' || d.pathway === 'both'
    );
  }, [doctors, isMale]);

  const specialists = pathwayDoctors.slice(0, 2);

  // ─────────────────────────────────────────────────────────────
  // 1. BEHAVIOR A: User has an upcoming booked appointment
  // ─────────────────────────────────────────────────────────────
  if (upcomingAppointment) {
    const enriched = enrichAppointmentWithDoctor(upcomingAppointment, doctors);
    const displayImage = imgError ? null : enriched.image;
    const daysInfo = getAppointmentDaysRemaining(upcomingAppointment.scheduledDate);
    const formattedDate = formatAppointmentDate(upcomingAppointment.scheduledDate);
    const displaySpecialty =
      upcomingAppointment.providerSpecialty ||
      enriched.specialty ||
      (isMale ? 'Endocrinologist & Andrology Specialist' : 'Specialist Gynecologist & PCOS Consultant');
    const displayLocation =
      upcomingAppointment.location || enriched.location || 'Clinic Consultation';
    const isVideo =
      Boolean(upcomingAppointment.meetingUrl) ||
      displayLocation.toLowerCase().includes('video') ||
      displayLocation.toLowerCase().includes('online');

    const pathwayTag =
      enriched.relevanceReason ||
      (isMale ? 'Male Hormonal Care' : 'PCOS Care Specialist');

    const accentBg = isMale ? 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]' : 'bg-[#FDF2F8] text-[#DB2777] border-[#FBCFE8]';
    const primaryBtnStyle = isMale
      ? 'bg-[#0288D1] hover:bg-[#0277BD] text-white'
      : 'bg-[#16B8C4] hover:bg-[#0EA5E9] text-white';

    return (
      <div className="rounded-2xl bg-white border border-[#BAE6FD] p-5 sm:p-6 shadow-xs select-none space-y-5 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${accentBg}`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Your Scheduled Doctor</span>
            </span>

            {/* Days Remaining Highlight Badge */}
            {daysInfo.isToday ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] text-[11px] font-mono font-bold">
                <Clock className="w-3 h-3 text-[#B45309]" />
                <span>Today</span>
              </span>
            ) : daysInfo.isTomorrow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] text-[11px] font-mono font-bold">
                <Clock className="w-3 h-3 text-[#0288D1]" />
                <span>Tomorrow</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD] text-[11px] font-mono font-bold">
                <Calendar className="w-3 h-3 text-[#0288D1]" />
                <span>{daysInfo.label}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-[11px] font-mono font-bold uppercase">
              <CheckCircle2 className="w-3 h-3 text-[#047857]" />
              <span>Confirmed Visit</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate(ROUTES.APP.APPOINTMENTS)}
            className="text-xs font-bold inline-flex items-center gap-1 text-[#0288D1] hover:text-[#0277BD] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>View Appointment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Doctor Highlight Body (Left Image / Right Details) */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          {/* Doctor Image / Fallback Avatar */}
          <div className="relative shrink-0 self-center sm:self-start">
            {displayImage ? (
              <img
                src={displayImage}
                alt={upcomingAppointment.providerName}
                onError={() => setImgError(true)}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border border-[#EAECF0] shadow-2xs"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-22 sm:h-22 rounded-2xl ${accentBg} flex flex-col items-center justify-center p-2 text-center shadow-2xs`}
              >
                <Stethoscope className="w-4 h-4 mb-0.5 opacity-75" />
                <span className="text-base font-bold font-display tracking-tight">
                  {getDoctorInitials(upcomingAppointment.providerName)}
                </span>
                <span className="text-[9px] font-mono uppercase tracking-wider opacity-80">
                  Doctor
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3 min-w-0 w-full">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base sm:text-lg font-bold text-[#101828] truncate">
                  {upcomingAppointment.providerName}
                </h4>
                {pathwayTag && (
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md truncate">
                    {pathwayTag}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-[#0288D1] mt-0.5">
                {displaySpecialty}
              </p>
            </div>

            {/* Quick Metrics Bar: Date, Time, Location */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#475569] pt-0.5">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#0288D1] shrink-0" />
                <span>{formattedDate}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-[#0288D1] shrink-0" />
                <span>{upcomingAppointment.scheduledTime} ({upcomingAppointment.durationMinutes} mins)</span>
              </span>

              <span className="inline-flex items-center gap-1.5 font-medium truncate max-w-xs">
                {isVideo ? (
                  <Video className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-[#0288D1] shrink-0" />
                )}
                <span className="truncate">{displayLocation}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Supporting Notice & Action Strip */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#475569]">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span className="text-xs">
              You already booked your consultation. Please attend on time.
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => navigate(ROUTES.APP.APPOINTMENTS)}
              className={`px-4 py-2 rounded-xl ${primaryBtnStyle} font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98]`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Open Appointments</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. BEHAVIOR B: No upcoming appointments (Default Recommended Doctors)
  // ─────────────────────────────────────────────────────────────
  const title = 'Recommended Care';
  const subtitle = isMale
    ? 'Specialists relevant to male hormonal health'
    : 'Based on your current PCOS screening pathway';

  const badgeBg = isMale ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-pink-50 text-pink-800 border-pink-200';
  const buttonStyle = isMale
    ? 'text-[#0288D1] hover:text-[#0277BD]'
    : 'text-[#F43F7D] hover:text-[#DC326C]';

  if (loading && specialists.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-[#EAECF0] p-5 shadow-xs select-none">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (specialists.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white border border-[#EAECF0] p-5 sm:p-6 shadow-xs select-none space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F2F4F7] pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeBg}`}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              {title}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#111318] pt-1">
            {subtitle}
          </h3>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(`/doctors?pathway=${isMale ? 'male_hypogonadism' : 'female_pcos'}`)
          }
          className={`text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto ${buttonStyle}`}
        >
          <span>View all specialists</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Specialists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {specialists.map((doc: Doctor) => (
          <div
            key={doc.id}
            className="p-4 rounded-xl bg-white border border-[#E4E7EC] hover:border-[#D0D5DD] transition-all flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-xs group"
          >
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                {doc.profile_image ? (
                  <img
                    src={doc.profile_image}
                    alt={doc.name}
                    className="w-11 h-11 rounded-xl object-cover border border-[#EAECF0] shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-[#EAECF0] flex items-center justify-center text-slate-500 shrink-0">
                    <Stethoscope className="w-5 h-5 text-slate-600" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#101828] truncate group-hover:text-[#073B72] transition-colors">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] font-medium text-[#667085] truncate">
                    {doc.specialty}
                  </p>
                </div>
              </div>

              {doc.relevance_reason && (
                <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-2 py-0.5 rounded-md truncate">
                  {doc.relevance_reason}
                </div>
              )}

              {doc.location && (
                <div className="flex items-center gap-1 text-[11px] text-[#667085] truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.location}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#F2F4F7] flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#344054]">
                {doc.fee || 'Fee on Request'}
              </span>

              <button
                type="button"
                onClick={() => navigate(`/doctors?doctorId=${doc.id}&intent=book`)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] border border-[#EAECF0] transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Consult</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedCareCard;
