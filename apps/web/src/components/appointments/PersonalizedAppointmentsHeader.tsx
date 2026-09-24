import React from 'react';
import { Calendar, Plus, Clock, MedicalCircle, MessageChatCircle } from '@untitledui/icons';
import type { AppointmentItem } from '../../types/appointment';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

interface PersonalizedAppointmentsHeaderProps {
  upcomingAppointment: AppointmentItem | null;
  totalAppointmentsCount: number;
  onOpenBookModal: () => void;
  onAskAi: () => void;
}

export const PersonalizedAppointmentsHeader: React.FC<PersonalizedAppointmentsHeaderProps> = ({
  upcomingAppointment,
  totalAppointmentsCount,
  onOpenBookModal,
  onAskAi,
}) => {
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isFemale = pathway === 'female';

  if (isFemale) {
    return (
      <div className="relative overflow-hidden rounded-[24px] bg-white border border-[#BAE6FD] p-6 sm:p-8 text-[#0F172A] shadow-xs select-none">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Title & Description */}
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] text-xs font-mono text-[#0288D1] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
              <span>Doctor Visits & Clinical Care</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-[#0F172A]">
              Appointments
            </h1>

            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              Stay organized before, during, and after your healthcare visits with real longitudinal health briefs and doctor questions.
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] text-xs font-mono text-[#0F172A]">
                <MedicalCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                <span>
                  {upcomingAppointment
                    ? `Next: ${upcomingAppointment.scheduledDate}`
                    : 'No upcoming visits'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#BAE6FD] text-xs font-mono text-[#0F172A]">
                <Clock className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                <span>{totalAppointmentsCount} Total Records</span>
              </div>
            </div>
          </div>

          {/* Right CTA Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenBookModal}
              className="px-5 py-3 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Book Appointment</span>
            </button>

            <button
              type="button"
              onClick={onAskAi}
              className="px-4 py-2.5 rounded-xl bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-semibold text-[#0288D1] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <MessageChatCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
              <span>Clinical Visit Companion</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-[#01579B] border border-[#0288D1] p-6 sm:p-8 text-white shadow-md select-none">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Title & Description */}
        <div className="space-y-2 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0288D1]/40 border border-[#BAE6FD]/40 text-xs font-mono text-[#E0F2FE]">
            <Calendar className="w-3.5 h-3.5 text-[#29B6F6]" aria-hidden="true" />
            <span>Doctor Visits & Clinical Care</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-white">
            Appointments
          </h1>

          <p className="text-sm sm:text-base text-[#E0F2FE] leading-relaxed">
            Stay organized before, during, and after your healthcare visits with real longitudinal health briefs and doctor questions.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-mono text-white">
              <MedicalCircle className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span>
                {upcomingAppointment
                  ? `Next: ${upcomingAppointment.scheduledDate}`
                  : 'No upcoming visits'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-mono text-white">
              <Clock className="w-3.5 h-3.5 text-[#FCD34D]" aria-hidden="true" />
              <span>{totalAppointmentsCount} Total Records</span>
            </div>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenBookModal}
            className="px-5 py-3.5 rounded-2xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Book Appointment</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageChatCircle className="w-3.5 h-3.5 text-[#29B6F6]" aria-hidden="true" />
            <span>Clinical Visit Companion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
