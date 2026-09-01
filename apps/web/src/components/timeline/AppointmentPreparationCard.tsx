import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, FileText, Activity, HelpCircle, ArrowRight } from 'lucide-react';
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
    <div className="p-6 sm:p-7 rounded-[32px] bg-gradient-to-br from-[#FAF5FF] via-[#F4EBFD] to-[#EDE4F7] border border-[#D8B4FE] shadow-sm space-y-4 select-none text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#6E2D8B] text-white shadow-md shadow-purple-950/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-[#1C1326]">
              Prepare for Your Next Appointment
            </h2>
            <p className="text-xs text-[#584B68]">
              Synthesize your longitudinal timeline into a 1-page clinical brief for your doctor.
            </p>
          </div>
        </div>

        {upcomingAppointment && (
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#ECFDF5] text-[#047857] w-fit">
            Upcoming Visit
          </span>
        )}
      </div>

      {/* Appointment Overview or Booking Prompt */}
      {upcomingAppointment ? (
        <div className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-white border border-[#E7DFEF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-[#1C1326] block">
                {upcomingAppointment.providerName} ({upcomingAppointment.providerSpecialty || 'Specialist'})
              </span>
              <span className="text-xs text-[#6E2D8B] font-semibold block mt-0.5">
                Scheduled for {upcomingAppointment.scheduledDate} at {upcomingAppointment.scheduledTime}
              </span>
            </div>

            {/* Quick Metrics Badges for Preparation */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAF5FF] text-[#6E2D8B] border border-[#EDE4F7] font-mono font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>{currentPhase || 'Cycle'}</span>
              </span>

              <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FFF1F2] text-[#BE123C] border border-[#FFE4E6] font-mono font-bold">
                <Activity className="w-3.5 h-3.5" />
                <span>{symptomsCount} Symptoms</span>
              </span>

              {flaggedReportsCount > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE] font-mono font-bold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{flaggedReportsCount} Lab Findings</span>
                </span>
              )}

              {unansweredQuestions > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-mono font-bold">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{unansweredQuestions} Questions</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-[#584B68]">
              Ready to compile your health snapshot and questions?
            </p>

            <button
              type="button"
              onClick={onPrepareAppointment}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-xs transition-all cursor-pointer"
            >
              <span>Prepare Consultation Summary</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white border border-[#E7DFEF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[#584B68]">
            No upcoming appointment scheduled. You can book an appointment with your Care Circle provider and generate a consultation snapshot at any time.
          </p>

          <Link
            to={ROUTES.APP.APPOINTMENTS}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#6E2D8B] bg-[#EDE4F7] hover:bg-[#E5D4F5] transition-colors shrink-0"
          >
            <span>+ Book Consultation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
