import React from 'react';
import { Calendar, Clock, MapPin, Video, Stethoscope, FileText, HelpCircle, ArrowRight } from 'lucide-react';
import type { AppointmentItem } from '../../types/appointment';

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
  if (!appointment) {
    return (
      <div className="p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm text-center select-none space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
          <Calendar className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold font-display text-[#1C1326]">
            No Upcoming Visits Scheduled
          </h3>
          <p className="text-xs text-[#584B68]">
            Plan your next consultation, lab review, or routine PCOS check-up and generate a personalized health brief.
          </p>
        </div>
        <button
          type="button"
          onClick={onBookNew}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white font-bold text-xs shadow-xs hover:brightness-110 transition-all cursor-pointer inline-flex items-center gap-1.5"
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
    <div className="relative overflow-hidden p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-white via-[#FAF5FF] to-[#FDF2F8] border-2 border-[#D8B4FE]/80 shadow-md select-none text-left space-y-5">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#6E2D8B] text-white text-[11px] font-mono font-bold uppercase tracking-wider shadow-xs">
            ★ Upcoming Visit
          </span>
          <span className="text-xs font-mono font-bold text-[#8E3EAF] capitalize">
            {appointment.appointmentType.replace('_', ' ')}
          </span>
        </div>

        <span className="text-xs font-mono text-[#8D7E9E]">
          {appointment.durationMinutes} minutes
        </span>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Doctor & Specialty */}
        <div className="md:col-span-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6E2D8B] to-[#FB7185] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                {appointment.providerName}
              </h3>
              <p className="text-xs text-[#6E2D8B] font-medium">
                {appointment.providerSpecialty || 'Gynecology & Endocrinology Specialist'}
              </p>
            </div>
          </div>

          <div className="pt-1">
            <h4 className="text-sm font-semibold text-[#1C1326]">{appointment.title}</h4>
            {appointment.reason && (
              <p className="text-xs text-[#584B68] line-clamp-2 mt-0.5">
                {appointment.reason}
              </p>
            )}
          </div>
        </div>

        {/* Date, Time & Location Pill Box */}
        <div className="md:col-span-6 bg-white/80 p-4 rounded-2xl border border-[#E7DFEF] space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1C1326]">
            <Calendar className="w-4 h-4 text-[#6E2D8B] shrink-0" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#584B68]">
            <Clock className="w-4 h-4 text-[#FB7185] shrink-0" />
            <span>{appointment.scheduledTime} ({appointment.durationMinutes} mins)</span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-[#584B68] pt-1 border-t border-[#F5F0FA]">
            <div className="flex items-center gap-1.5 truncate">
              {appointment.meetingUrl ? (
                <Video className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-[#8E3EAF] shrink-0" />
              )}
              <span className="truncate">{appointment.location}</span>
            </div>

            {appointment.meetingUrl && (
              <a
                href={appointment.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#047857] hover:underline shrink-0"
              >
                Join Video →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Consultation Questions & Preparation Bar */}
      <div className="p-3.5 rounded-2xl bg-[#EDE4F7]/40 border border-[#D8B4FE]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#6E2D8B]">
          <HelpCircle className="w-4 h-4 text-[#8E3EAF] shrink-0" />
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
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white font-bold text-xs shadow-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prepare for Visit</span>
            <ArrowRight className="w-3 h-3 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewDetails(appointment)}
            className="px-3 py-2 rounded-xl bg-white border border-[#E7DFEF] text-[#6E2D8B] font-bold text-xs hover:bg-[#F8F5FA] transition-all cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
