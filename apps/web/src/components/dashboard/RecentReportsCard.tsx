import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck01, File01, Upload01, Plus } from '@untitledui/icons';
import type { MedicalReport } from '../../types/report';
import { ROUTES } from '../../constants/routes';

interface ReportsCardProps {
  reports: MedicalReport[];
}

export const RecentReportsCard: React.FC<ReportsCardProps> = ({ reports }) => {
  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#BAE6FD] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck01 className="w-5 h-5 text-[#0288D1] shrink-0" aria-hidden="true" />
          <h3 className="text-base font-bold font-display text-[#0F172A]">
            Recent Health Reports
          </h3>
        </div>

        <Link
          to={ROUTES.APP.REPORTS}
          className="text-xs font-bold text-[#0288D1] hover:text-[#01579B] transition-colors"
        >
          View all ({reports.length})
        </Link>
      </div>

      {/* Reports List / Empty State */}
      <div className="space-y-3 flex-1">
        {reports.length === 0 ? (
          <div className="py-6 px-4 rounded-2xl bg-[#F8FAFC] border border-dashed border-[#BAE6FD] text-center space-y-2">
            <p className="text-xs font-medium text-[#64748B]">
              No lab or ultrasound reports uploaded yet.
            </p>
            <Link
              to={ROUTES.APP.REPORTS}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0288D1] hover:text-[#01579B]"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Scan your first report</span>
            </Link>
          </div>
        ) : (
          reports.slice(0, 3).map((rep) => {
            const firstResult = rep.results?.[0];
            const summarySnippet = firstResult
              ? `${firstResult.testName}: ${firstResult.resultValue} ${firstResult.unit}`
              : `${rep.results.length} tests recorded`;

            return (
              <Link
                key={rep.id}
                to={ROUTES.APP.REPORTS}
                className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#F0F9FF] transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white border border-[#BAE6FD]/60 text-[#0288D1] shrink-0 group-hover:bg-[#E0F2FE] transition-colors">
                    <File01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#0F172A] block truncate">
                      {rep.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B] block truncate">
                      {rep.reportDate} • {summarySnippet}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] shrink-0 border border-[#A7F3D0]">
                  Verified
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer Action */}
      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
        <Link
          to={ROUTES.APP.REPORTS}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0288D1] hover:text-[#01579B] transition-colors group"
        >
          <Upload01 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Upload New Report</span>
        </Link>

        <span className="text-[10px] font-mono text-[#64748B]">
          Secure OCR extraction
        </span>
      </div>
    </div>
  );
};
