import React from 'react';
import { Calendar, MedicalCircle } from '@untitledui/icons';
import type { AppointmentItem } from '../../types/appointment';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';
import { useNavigate } from 'react-router-dom';
import { useDoctors } from '../../services/doctorService';
import { BookedAppointmentCard } from './BookedAppointmentCard';

interface UpcomingAppointmentCardProps {
  appointment: AppointmentItem | null;
  onPrepare: (appointment: AppointmentItem) => void;
  onViewDetails: (appointment: AppointmentItem) => void;
  onBookNew: () => void;
  onFindSpecialists?: () => void;
}

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({
  appointment,
  onPrepare,
  onViewDetails,
  onBookNew,
  onFindSpecialists,
}) => {
  const navigate = useNavigate();
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isFemale = pathway === 'female';

  const { doctors } = useDoctors();

  const accentColor = isFemale ? '#F43F7D' : '#0288D1';
  const accentHover = isFemale ? '#DC326C' : '#0277BD';
  const softBg = isFemale ? '#FDE6EF' : '#F0F9FF';
  const borderTone = isFemale ? 'border-pink-200' : 'border-[#BAE6FD]';

  if (!appointment) {
    return (
      <div className={`p-8 rounded-[28px] bg-white border ${borderTone} shadow-xs text-center select-none space-y-4`}>
        <div
          className={`w-14 h-14 mx-auto rounded-2xl border ${borderTone} flex items-center justify-center`}
          style={{ backgroundColor: softBg, color: accentColor }}
        >
          <Calendar className="w-7 h-7" aria-hidden="true" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold font-display text-[#0F172A]">
            No upcoming appointments
          </h3>
          <p className="text-xs text-[#475569]">
            When you're ready, you can explore specialists relevant to your BioPulse care pathway.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onBookNew}
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Request an Appointment</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (onFindSpecialists) {
                onFindSpecialists();
              } else {
                navigate('/app/appointments?tab=specialists');
              }
            }}
            className={`px-5 py-2.5 rounded-xl bg-white border ${borderTone} hover:bg-slate-50 font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98]`}
            style={{ color: accentColor }}
          >
            <MedicalCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Find Relevant Specialists</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <BookedAppointmentCard
      appointment={appointment}
      allDoctors={doctors}
      isMale={!isFemale}
      onPrepare={onPrepare}
      onViewDetails={onViewDetails}
      isFeatured={true}
    />
  );
};

export default UpcomingAppointmentCard;
