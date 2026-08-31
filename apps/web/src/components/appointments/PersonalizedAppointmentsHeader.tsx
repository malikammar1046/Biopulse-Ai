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
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2E123D] via-[#4A154B] to-[#6E2D8B] p-6 sm:p-8 text-white shadow-xl select-none">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#FB7185]/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-[#8E3EAF]/30 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Title & Description */}
        <div className="space-y-2 max-w-2xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono text-[#FBCFE8]">
            <Calendar className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Doctor Visits & Clinical Care</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight text-white">
            Appointments
          </h1>

          <p className="text-sm sm:text-base text-[#E9D5FF] leading-relaxed">
            Stay organized before, during, and after your healthcare visits with real longitudinal health briefs and doctor questions.
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-mono">
              <Stethoscope className="w-3.5 h-3.5 text-[#34D399]" />
              <span>
                {upcomingAppointment
                  ? `Next: ${upcomingAppointment.scheduledDate}`
                  : 'No upcoming visits'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-mono">
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
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#FB7185] to-[#E11D48] text-white font-bold text-sm shadow-lg hover:shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#FDF4FF] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
            <span>Ask AI: What to ask my doctor?</span>
          </button>
        </div>
      </div>
    </div>
  );
};
