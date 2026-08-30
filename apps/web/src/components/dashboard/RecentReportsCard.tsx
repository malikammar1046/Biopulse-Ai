import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Plus } from 'lucide-react';
import type { MedicalReport } from '../../types/report';
import { ROUTES } from '../../constants/routes';

interface ReportsCardProps {
  reports: MedicalReport[];
}

export const RecentReportsCard: React.FC<ReportsCardProps> = ({ reports }) => {
  return (
    <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm flex flex-col justify-between select-none text-left space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
            <FileText className="w-4 h-4" />
          </span>
          <h3 className="text-base font-bold font-display text-[#1C1326]">
            Recent Health Reports
          </h3>
        </div>

        <Link
          to={ROUTES.APP.REPORTS}
          className="text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors"
        >
          View all ({reports.length})
        </Link>
      </div>

      {/* Reports List / Empty State */}
      <div className="space-y-3 flex-1">
        {reports.length === 0 ? (
          <div className="py-6 px-4 rounded-2xl bg-[#F8F5FA] border border-dashed border-[#E7DFEF] text-center space-y-2">
            <p className="text-xs font-medium text-[#584B68]">
              No lab or ultrasound reports uploaded yet.
            </p>
            <Link
              to={ROUTES.APP.REPORTS}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF]"
            >
              <Plus className="w-3.5 h-3.5" />
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
                className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] hover:border-[#8E3EAF]/30 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white border border-[#E7DFEF] text-[#6E2D8B] shrink-0 group-hover:bg-[#EDE4F7] transition-colors">
                    <FileText className="w-4 h-4 text-[#8E3EAF]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#1C1326] block truncate">
                      {rep.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#8D7E9E] block truncate">
                      {rep.reportDate} • {summarySnippet}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] shrink-0 border border-[#A7F3D0]/60">
                  Verified
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer Action */}
      <div className="pt-2 border-t border-[#F0EAF5] flex items-center justify-between">
        <Link
          to={ROUTES.APP.REPORTS}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors group"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload New Report</span>
        </Link>

        <span className="text-[10px] font-mono text-[#8D7E9E]">
          Secure OCR extraction
        </span>
      </div>
    </div>
  );
};
