import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Video,
  Stethoscope,
  FileText,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import type { AppointmentItem, AppointmentStatus } from '../../types/appointment';

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

  const filtered = appointments.filter((a) => {
    if (filterStatus === 'all') return true;
    return a.status === filterStatus;
  });

  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#BAE6FD] shadow-sm select-none text-left space-y-5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
            <Calendar className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-bold font-display text-[#0F172A]">
              Appointment History & Logs
            </h3>
            <p className="text-xs text-[#64748B]">
              {appointments.length} total visits recorded
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
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((appt) => {
            const questionCount = appt.doctorQuestions?.length || 0;
            const formattedDate = new Date(appt.scheduledDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={appt.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] hover:bg-[#F0F9FF] border border-[#E2E8F0] hover:border-[#BAE6FD] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: Doctor & Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Stethoscope className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#0F172A] truncate">
                        {appt.providerName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize ${
                          appt.status === 'scheduled'
                            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                            : appt.status === 'completed'
                            ? 'bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]'
                            : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-[#0288D1] truncate">
                      {appt.title}
                    </h4>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#64748B] pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-[#0288D1]" />
                        {formattedDate} at {appt.scheduledTime}
                      </span>

                      <span className="flex items-center gap-1">
                        {appt.meetingUrl ? (
                          <Video className="w-3 h-3 text-[#059669]" />
                        ) : (
                          <MapPin className="w-3 h-3 text-[#0288D1]" />
                        )}
                        <span className="truncate max-w-[180px]">{appt.location}</span>
                      </span>

                      {questionCount > 0 && (
                        <span className="flex items-center gap-1 text-[#0288D1] font-semibold">
                          <HelpCircle className="w-3 h-3" />
                          {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => onPrepare(appt)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-[#BAE6FD] hover:border-[#0288D1] text-[#0288D1] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Prepare</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewDetails(appt)}
                    className="p-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F0F9FF] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                    title="View Full Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center rounded-2xl bg-[#F8FAFC] border border-dashed border-[#BAE6FD] text-xs text-[#64748B] space-y-1">
            <p className="font-semibold text-[#0F172A]">No appointments match filter.</p>
            <p>Select another filter or book a new appointment.</p>
          </div>
        )}
      </div>
    </div>
  );
};
