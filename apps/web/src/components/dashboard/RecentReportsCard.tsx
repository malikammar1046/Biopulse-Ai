import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload } from 'lucide-react';
import type { MedicalReportItem } from '../../types/dashboard';
import { ROUTES } from '../../constants/routes';

interface ReportsCardProps {
  reports: MedicalReportItem[];
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
          View all
        </Link>
      </div>

      {/* Reports List */}
      <div className="space-y-3 flex-1">
        {reports.slice(0, 3).map((rep) => (
          <div
            key={rep.id}
            className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] hover:border-[#8E3EAF]/30 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-white border border-[#E7DFEF] text-[#6E2D8B] shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#1C1326] block truncate">
                  {rep.title}
                </span>
                <span className="text-[10px] font-mono text-[#8D7E9E] block">
                  {rep.date} • {rep.keyBiomarker}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shrink-0 ${
                rep.status === 'reviewed'
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : 'bg-[#EDE4F7] text-[#6E2D8B]'
              }`}
            >
              {rep.status === 'reviewed' ? 'Reviewed' : 'Uploaded'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Action: Upload New Report */}
      <div className="pt-2 border-t border-[#F0EAF5] flex items-center justify-between">
        <Link
          to={ROUTES.APP.REPORTS}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6E2D8B] hover:text-[#A21CAF] transition-colors group"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload New Lab / Scan</span>
        </Link>

        <span className="text-[10px] font-mono text-[#8D7E9E]">
          OCR Extraction Ready
        </span>
      </div>
    </div>
  );
};
