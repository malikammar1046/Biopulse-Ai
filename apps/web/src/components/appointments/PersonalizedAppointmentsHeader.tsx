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

  const accentColor = isFemale ? '#F43F7D' : '#0288D1';
  const accentHover = isFemale ? '#DC326C' : '#0277BD';
  const badgeBg = isFemale ? '#FDE6EF' : '#F0F9FF';
  const badgeBorder = isFemale ? 'rgba(244,63,125,0.2)' : '#BAE6FD';
  const badgeText = isFemale ? '#DC326C' : '#0288D1';

  return (
    <div className="rounded-2xl bg-white border border-[#EAECF0] p-5 sm:p-6 shadow-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Quick Metrics Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold"
            style={{ backgroundColor: badgeBg, borderColor: badgeBorder, color: badgeText }}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Doctor Visits & Care</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-mono text-[#0F172A]">
            <MedicalCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>
              {upcomingAppointment
                ? `Next: ${upcomingAppointment.scheduledDate}`
                : 'No upcoming visits'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs font-mono text-[#0F172A]">
            <Clock className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span>{totalAppointmentsCount} Total Records</span>
          </div>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenBookModal}
            className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs sm:text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Book Appointment</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#EAECF0] text-xs font-semibold text-[#344054] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <MessageChatCircle className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
            <span className="hidden sm:inline">Clinical Visit Companion</span>
            <span className="sm:hidden">AI Companion</span>
          </button>
        </div>
      </div>
    </div>
  );
};
