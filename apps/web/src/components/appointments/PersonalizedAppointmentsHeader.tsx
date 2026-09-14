import React from 'react';
import { Calendar, Plus, Clock, Stethoscope, Sparkles } from 'lucide-react';
import type { AppointmentItem } from '../../types/appointment';

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
