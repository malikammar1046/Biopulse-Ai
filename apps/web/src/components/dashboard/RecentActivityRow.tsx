import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, ArrowRight, Upload, Clock } from 'lucide-react';
import type { MedicalReport } from '../../types/report';
import type { AppointmentItem } from '../../types/appointment';
import { ROUTES } from '../../constants/routes';

interface RecentActivityRowProps {
  latestReport?: MedicalReport | null;
  upcomingAppointment?: AppointmentItem | null;
}

export const RecentActivityRow: React.FC<RecentActivityRowProps> = ({
  latestReport,
  upcomingAppointment,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none text-left">
      {/* ── 1. Latest Lab Report Tile ── */}
      <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#64748B] block">
              Latest report
            </span>

            {latestReport ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                  {latestReport.title || latestReport.fileName}
                </span>
                <span className="text-[10px] text-[#64748B] shrink-0">
                  {latestReport.reportDate}
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#475569] mt-0.5">
                No reports yet
              </p>
            )}
          </div>
        </div>

        <div>
          {latestReport ? (
            <Link
              to={ROUTES.APP.REPORTS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0288D1] hover:text-[#01579B] shrink-0 transition-colors"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to={ROUTES.APP.REPORTS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0288D1] hover:text-[#01579B] shrink-0 transition-colors"
            >
              <Upload className="w-3 h-3" />
              <span>Upload →</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 2. Upcoming Appointment Tile ── */}
      <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0288D1] shrink-0">
            <Calendar className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-[#64748B] block">
              Upcoming appointment
            </span>

            {upcomingAppointment ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                  {upcomingAppointment.providerName}
                </span>
                <span className="text-[10px] text-[#64748B] shrink-0">
                  {upcomingAppointment.scheduledDate} · {upcomingAppointment.scheduledTime}
                </span>
              </div>
            ) : (
              <p className="text-xs text-[#475569] mt-0.5">
                None scheduled
              </p>
            )}
          </div>
        </div>

        <div>
          {upcomingAppointment ? (
            <Link
              to={ROUTES.APP.APPOINTMENTS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0288D1] hover:text-[#01579B] shrink-0 transition-colors"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to={ROUTES.APP.APPOINTMENTS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0288D1] hover:text-[#01579B] shrink-0 transition-colors"
            >
              <Clock className="w-3 h-3" />
              <span>Book →</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivityRow;
