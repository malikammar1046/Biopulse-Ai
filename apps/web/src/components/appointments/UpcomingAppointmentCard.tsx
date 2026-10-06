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
}

export const UpcomingAppointmentCard: React.FC<UpcomingAppointmentCardProps> = ({
  appointment,
  onPrepare,
  onViewDetails,
  onBookNew,
}) => {
  const navigate = useNavigate();
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isMale = pathway === 'male';

  const { doctors } = useDoctors();

  if (!appointment) {
    return (
      <div className="p-8 rounded-[28px] bg-white border border-[#BAE6FD] shadow-xs text-center select-none space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD] flex items-center justify-center">
          <Calendar className="w-7 h-7 text-[#0288D1]" aria-hidden="true" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold font-display text-[#0F172A]">
            No upcoming appointments
          </h3>
          <p className="text-xs text-[#475569]">
            When you're ready, you can explore specialists relevant to your BioPulse pathway.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onBookNew}
            className="px-5 py-2.5 rounded-xl bg-[#0288D1] hover:bg-[#0277BD] text-white font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Request an Appointment</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(`/doctors?pathway=${isMale ? 'male_hypogonadism' : 'female_pcos'}`)}
            className="px-5 py-2.5 rounded-xl bg-white border border-[#BAE6FD] hover:bg-[#F0F9FF] text-[#0288D1] font-semibold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-[0.98]"
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
      isMale={isMale}
      onPrepare={onPrepare}
      onViewDetails={onViewDetails}
      isFeatured={true}
    />
  );
};

export default UpcomingAppointmentCard;
