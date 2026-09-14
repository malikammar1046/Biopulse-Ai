import React from 'react';
import { Calendar, Clock, MapPin, Video, Stethoscope, FileText, HelpCircle, ArrowRight } from 'lucide-react';
import type { AppointmentItem } from '../../types/appointment';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

interface UpcomingAppointmentCardProps {
  appointment: AppointmentItem | null;
  onPrepare: (appointment: AppointmentItem) => void;
  onViewDetails: (appointment: AppointmentItem) => void;
  onBookNew: () => void;
}

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({
  appointment,
  onPrepare,
  onViewDetails,
  onBookNew,
}) => {
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isMale = pathway === 'male';

  if (!appointment) {
    return (
      <div className="p-8 rounded-[32px] bg-white border border-[#BAE6FD] shadow-sm text-center select-none space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] flex items-center justify-center">
          <Calendar className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold font-display text-[#0F172A]">
            No Upcoming Visits Scheduled
          </h3>
          <p className="text-xs text-[#64748B]">
            {isMale
              ? 'Plan your next consultation, lab review, or routine male health check-up and generate a personalized health brief.'
              : 'Plan your next consultation, lab review, or routine health check-up and generate a personalized health brief.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onBookNew}
          className="px-5 py-2.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book an Appointment</span>
        </button>
      </div>
    );
  }

  const formattedDate = new Date(appointment.scheduledDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const questionCount = appointment.doctorQuestions?.length || 0;
  const answeredCount = appointment.doctorQuestions?.filter((q) => q.isDiscussed).length || 0;

  return (
    <div className="relative overflow-hidden p-6 sm:p-7 rounded-[32px] bg-white border-2 border-[#BAE6FD] shadow-sm select-none text-left space-y-5">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#0288D1] text-white text-[11px] font-mono font-bold uppercase tracking-wider shadow-xs">
            ★ Upcoming Visit
          </span>
          <span className="text-xs font-mono font-bold text-[#0288D1] capitalize">
            {appointment.appointmentType.replace('_', ' ')}
          </span>
        </div>

        <span className="text-xs font-mono text-[#64748B]">
          {appointment.durationMinutes} minutes
        </span>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Doctor & Specialty */}
        <div className="md:col-span-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] flex items-center justify-center shrink-0 shadow-xs">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-[#0F172A]">
                {appointment.providerName}
              </h3>
              <p className="text-xs text-[#0288D1] font-medium">
                {appointment.providerSpecialty || (isMale ? 'Endocrinology & Men’s Health Specialist' : 'Specialist Gynecologist & Endocrinologist')}
              </p>
            </div>
          </div>

          <div className="pt-1">
            <h4 className="text-sm font-semibold text-[#0F172A]">{appointment.title}</h4>
            {appointment.reason && (
              <p className="text-xs text-[#64748B] line-clamp-2 mt-0.5">
                {appointment.reason}
              </p>
            )}
          </div>
        </div>

        {/* Date, Time & Location Pill Box */}
        <div className="md:col-span-6 bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
            <Calendar className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <Clock className="w-4 h-4 text-[#0288D1] shrink-0" />
            <span>{appointment.scheduledTime} ({appointment.durationMinutes} mins)</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-[#64748B] pt-1 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 truncate">
              {appointment.meetingUrl ? (
                <Video className="w-3.5 h-3.5 text-[#059669] shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-[#0288D1] shrink-0" />
              )}
              <span className="truncate">{appointment.location}</span>
            </div>

            {appointment.meetingUrl && (
              <a
                href={appointment.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#059669] hover:underline shrink-0"
              >
                Join Video →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Consultation Questions & Preparation Bar */}
      <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#01579B]">
          <HelpCircle className="w-4 h-4 text-[#0288D1] shrink-0" />
          <span className="font-semibold">
            {questionCount > 0
              ? `${questionCount} questions prepared (${answeredCount} discussed)`
              : 'No doctor questions added yet'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPrepare(appointment)}
            className="px-4 py-2 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prepare for Visit</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewDetails(appointment)}
            className="px-3 py-2 rounded-xl bg-white border border-[#BAE6FD] text-[#0288D1] font-bold text-xs hover:bg-[#E0F2FE] transition-all cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
