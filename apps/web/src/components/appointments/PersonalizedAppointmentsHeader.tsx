import React from 'react';
import { Calendar, Plus, Clock, Stethoscope, Sparkles } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-[24px] bg-white border border-[#EAECF0] p-6 sm:p-8 text-[#111318] shadow-xs select-none">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Title & Description */}
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FBE7F0] border border-[#FCE1ED] text-xs font-mono text-[#A92D61] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#E84A8A]" />
              <span>Doctor Visits & Clinical Care</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-[#111318]">
              Appointments
            </h1>

            <p className="text-sm sm:text-base text-[#667085] leading-relaxed">
              Stay organized before, during, and after your healthcare visits with real longitudinal health briefs and doctor questions.
            </p>

            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFC] border border-[#EAECF0] text-xs font-mono text-[#344054]">
                <Stethoscope className="w-3.5 h-3.5 text-[#E84A8A]" />
                <span>
                  {upcomingAppointment
                    ? `Next: ${upcomingAppointment.scheduledDate}`
                    : 'No upcoming visits'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFC] border border-[#EAECF0] text-xs font-mono text-[#344054]">
                <Clock className="w-3.5 h-3.5 text-[#E8A23A]" />
                <span>{totalAppointmentsCount} Total Records</span>
              </div>
            </div>
          </div>

          {/* Right CTA Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenBookModal}
              className="px-5 py-3 rounded-xl bg-[#E84A8A] hover:bg-[#D93B7A] text-white font-semibold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              type="button"
              onClick={onAskAi}
              className="px-4 py-2.5 rounded-xl bg-[#FAFAFC] hover:bg-[#F2F4F7] border border-[#EAECF0] text-xs font-semibold text-[#344054] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E84A8A]" />
              <span>Ask AI Companion</span>
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
            <Calendar className="w-3.5 h-3.5 text-[#29B6F6]" />
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
              <Stethoscope className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>
                {upcomingAppointment
                  ? `Next: ${upcomingAppointment.scheduledDate}`
                  : 'No upcoming visits'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-mono text-white">
              <Clock className="w-3.5 h-3.5 text-[#FCD34D]" />
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
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#29B6F6]" />
            <span>Ask AI: What to ask my doctor?</span>
          </button>
        </div>
      </div>
    </div>
  );
};
