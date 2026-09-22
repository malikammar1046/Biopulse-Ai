import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck01, Calendar, File06, Activity, HelpCircle, ArrowRight } from '@untitledui/icons';
import type { AppointmentItem } from '../../types/appointment';
import { ROUTES } from '../../constants/routes';

interface AppointmentPreparationCardProps {
  upcomingAppointment: AppointmentItem | null;
  currentPhase?: string;
  symptomsCount: number;
  flaggedReportsCount: number;
  onPrepareAppointment: () => void;
}

export const AppointmentPreparationCard: React.FC<AppointmentPreparationCardProps> = ({
  upcomingAppointment,
  currentPhase,
  symptomsCount,
  flaggedReportsCount,
  onPrepareAppointment,
}) => {
  const unansweredQuestions =
    upcomingAppointment?.doctorQuestions?.filter((q) => !q.isDiscussed).length || 0;

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-white border border-[#BAE6FD] shadow-none space-y-4 select-none text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <CalendarCheck01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
              Prepare for Your Next Appointment
            </h2>
            <p className="text-xs text-[#64748B]">
              Synthesize your longitudinal timeline into a 1-page clinical brief for your doctor.
            </p>
          </div>
        </div>

        {upcomingAppointment && (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
            Upcoming Visit
          </span>
        )}
      </div>

      {/* Appointment Overview or Booking Prompt */}
      {upcomingAppointment ? (
        <div className="space-y-3.5">
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-[#0F172A] block">
                {upcomingAppointment.providerName} ({upcomingAppointment.providerSpecialty || 'Specialist'})
              </span>
              <span className="text-xs text-[#0288D1] font-semibold block mt-0.5">
                Scheduled for {upcomingAppointment.scheduledDate} at {upcomingAppointment.scheduledTime}
              </span>
            </div>

            {/* Quick Metrics Badges for Preparation */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#E0F2FE] text-[#01579B] border border-[#BAE6FD] font-mono font-bold">
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{currentPhase || 'Cycle'}</span>
              </span>

              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-mono font-bold">
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{symptomsCount} Symptoms</span>
              </span>

              {flaggedReportsCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 font-mono font-bold">
                  <File06 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{flaggedReportsCount} Lab Findings</span>
                </span>
              )}

              {unansweredQuestions > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold">
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{unansweredQuestions} Questions</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-[#64748B]">
              Ready to compile your health snapshot and questions?
            </p>

            <button
              type="button"
              onClick={onPrepareAppointment}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all cursor-pointer"
            >
              <span>Prepare Consultation Summary</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#64748B]">
            No upcoming appointment scheduled. You can book an appointment with your Care Circle provider and generate a consultation snapshot at any time.
          </p>

          <Link
            to={ROUTES.APP.APPOINTMENTS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#01579B] bg-[#E0F2FE] hover:bg-[#BAE6FD] transition-colors shrink-0"
          >
            <span>+ Book Consultation</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
};
