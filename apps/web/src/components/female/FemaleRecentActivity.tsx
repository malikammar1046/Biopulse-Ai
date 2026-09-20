import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { FemaleCard } from './FemaleDesignPrimitives';
import type { MedicalReport } from '../../types/report';
import type { AppointmentItem } from '../../types/appointment';

interface FemaleRecentActivityProps {
  latestReport?: MedicalReport | null;
  upcomingAppointment?: AppointmentItem | null;
}

export const FemaleRecentActivity: React.FC<FemaleRecentActivityProps> = ({
  latestReport,
  upcomingAppointment,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
      {/* 1. Latest Lab Report Card */}
      <FemaleCard
        hoverable
        onClick={() => navigate(ROUTES.APP.REPORTS)}
        className="flex items-center justify-between p-4 sm:p-5"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5F9] border border-[#FBE7F0] flex items-center justify-center text-[#E84A8A] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-medium text-[#667085] block">
              Recent Clinical Report
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-[#111318] truncate">
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

        <ArrowRight className="w-4 h-4 text-[#98A2B3] shrink-0 ml-2" />
      </FemaleCard>

      {/* 2. Upcoming Appointment Card */}
      <FemaleCard
        hoverable
        onClick={() => navigate(ROUTES.APP.APPOINTMENTS)}
        className="flex items-center justify-between p-4 sm:p-5"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFF5F9] border border-[#FBE7F0] flex items-center justify-center text-[#E84A8A] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-medium text-[#667085] block">
              Upcoming Appointment
            </span>
            <h4 className="text-xs sm:text-sm font-semibold text-[#111318] truncate">
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

        <ArrowRight className="w-4 h-4 text-[#98A2B3] shrink-0 ml-2" />
      </FemaleCard>
    </div>
  );
};
