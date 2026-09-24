import React from 'react';
import { useNavigate } from 'react-router-dom';
import { File06, Calendar, ArrowRight } from '@untitledui/icons';
import { ROUTES } from '../../constants/routes';
import type { MedicalReport } from '../../types/report';
import type { AppointmentItem } from '../../types/appointment';

interface RecentActivityRowProps {
  latestReport?: MedicalReport | null;
  upcomingAppointment?: AppointmentItem | null;
}

export const RecentActivityRow: React.FC<RecentActivityRowProps> = ({
  latestReport,
  upcomingAppointment,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none text-left">
      {/* 1. Latest Lab Report Card */}
      <div
        onClick={() => navigate(ROUTES.APP.REPORTS)}
        className="rounded-[18px] bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-medical-primary-border hover:shadow-[0_4px_12px_rgba(2,136,209,0.06)] cursor-pointer transition-all duration-200 p-4 sm:p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-medical-primary-muted border border-medical-primary-border flex items-center justify-center text-medical-primary-hover shrink-0">
            <File06 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-medium text-medical-text-muted block">
              Recent Clinical Report
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-medical-text-primary truncate">
              {latestReport?.title || latestReport?.fileName || 'No reports uploaded yet'}
            </h4>
            <p className="text-[11px] text-[#98A2B3]">
              {latestReport
                ? new Date(latestReport.reportDate || latestReport.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Upload lab work to extract biomarkers'}
            </p>
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-[#98A2B3] shrink-0 ml-2" aria-hidden="true" />
      </div>

      {/* 2. Upcoming Appointment Card */}
      <div
        onClick={() => navigate(ROUTES.APP.APPOINTMENTS)}
        className="rounded-[18px] bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-medical-primary-border hover:shadow-[0_4px_12px_rgba(2,136,209,0.06)] cursor-pointer transition-all duration-200 p-4 sm:p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-medical-primary-muted border border-medical-primary-border flex items-center justify-center text-medical-primary-hover shrink-0">
            <Calendar className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-medium text-medical-text-muted block">
              Upcoming Appointment
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-medical-text-primary truncate">
              {upcomingAppointment
                ? `${upcomingAppointment.providerName || 'Physician'} · ${upcomingAppointment.appointmentType || 'Consultation'}`
                : 'No appointments scheduled'}
            </h4>
            <p className="text-[11px] text-[#98A2B3]">
              {upcomingAppointment
                ? `${upcomingAppointment.scheduledDate} at ${upcomingAppointment.scheduledTime}`
                : 'Prepare clinical questions for your doctor'}
            </p>
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-[#98A2B3] shrink-0 ml-2" aria-hidden="true" />
      </div>
    </div>
  );
};

export default RecentActivityRow;
