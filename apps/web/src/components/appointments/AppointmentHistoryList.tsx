import React, { useState } from 'react';
import { Calendar } from '@untitledui/icons';
import type { AppointmentItem, AppointmentStatus } from '../../types/appointment';
import { useDoctors } from '../../services/doctorService';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';
import { BookedAppointmentCard } from './BookedAppointmentCard';

interface AppointmentHistoryListProps {
  appointments: AppointmentItem[];
  onPrepare: (appointment: AppointmentItem) => void;
  onViewDetails: (appointment: AppointmentItem) => void;
}

export const AppointmentHistoryList: React.FC<AppointmentHistoryListProps> = ({
  appointments,
  onPrepare,
  onViewDetails,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | AppointmentStatus>('all');
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile?.gender, userProfile?.pathway);
  const isMale = pathway === 'male';

  const { doctors } = useDoctors();

  const filtered = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#BAE6FD] shadow-xs select-none text-left space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
            <Calendar className="w-5 h-5 text-[#0288D1]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              Appointment History & Logs
            </h3>
            <p className="text-xs text-[#64748B]">
              {appointments.length} total visits recorded in your clinical log
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-2xl border border-[#E2E8F0] self-start sm:self-auto">
          {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold capitalize transition-all cursor-pointer ${
                filterStatus === status
                  ? 'bg-white text-[#0288D1] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((appt) => (
            <BookedAppointmentCard
              key={appt.id}
              appointment={appt}
              allDoctors={doctors}
              isMale={isMale}
              onPrepare={onPrepare}
              onViewDetails={onViewDetails}
              isFeatured={false}
            />
          ))
        ) : (
          <div className="p-10 text-center rounded-2xl bg-[#F8FAFC] border border-dashed border-[#BAE6FD] text-xs text-[#64748B] space-y-1.5">
            <p className="font-bold text-sm text-[#0F172A]">No appointments found</p>
            <p>
              {filterStatus === 'all'
                ? 'You do not have any consultations logged yet. Request an appointment to connect with specialists.'
                : `There are currently no visits marked as "${filterStatus}".`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentHistoryList;
