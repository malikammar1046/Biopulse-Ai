import React from 'react';
import { FileText, Calendar, Eye, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MedicalReport } from '../../types/report';
import { REPORT_CATEGORIES } from '../../types/report';

interface ReportCardProps {
  report: MedicalReport;
  onViewDetail: (report: MedicalReport) => void;
  onDelete: (report: MedicalReport) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onViewDetail,
  onDelete,
}) => {
  const categoryMeta =
    REPORT_CATEGORIES.find((c) => c.id === report.reportType) || REPORT_CATEGORIES[7];

  const outsideRangeCount = (report.results || []).filter(
    (r) => r.status === 'outside_range' || r.status === 'needs_review'
  ).length;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E7DFEF] hover:border-[#8E3EAF]/30 shadow-2xs hover:shadow-sm transition-all duration-200 text-left select-none space-y-4 flex flex-col justify-between group">
      {/* Top Row: Title, Date, Type Badge */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] shrink-0">
              <FileText className="w-5 h-5 text-[#8E3EAF]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-display text-[#1C1326] block truncate">
                {report.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#584B68] font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#8E3EAF]" />
                  {report.reportDate}
                </span>
                <span>•</span>
                <span>{report.results.length} tests recorded</span>
              </div>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${categoryMeta.badgeClass}`}
          >
            {categoryMeta.label}
          </span>
        </div>

        {/* Key Biomarker Quick Snippet Chips */}
        {report.results.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {report.results.slice(0, 3).map((res) => (
              <span
                key={res.id}
                className="text-[11px] font-sans px-2.5 py-0.5 rounded-lg bg-[#F8F5FA] border border-[#E7DFEF] text-[#584B68]"
              >
                <strong className="text-[#1C1326] font-semibold">{res.testName}:</strong>{' '}
                {res.resultValue} {res.unit}
              </span>
            ))}
            {report.results.length > 3 && (
              <span className="text-[10px] font-mono text-[#8D7E9E] px-2 py-0.5">
                +{report.results.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row: Status & Actions */}
      <div className="pt-3 border-t border-[#F0EAF5] flex items-center justify-between gap-2">
        <div>
          {outsideRangeCount > 0 ? (
            <span className="text-[11px] font-mono font-semibold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]/60 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-[#D97706]" />
              {outsideRangeCount} {outsideRangeCount === 1 ? 'number needs a look' : 'numbers need a look'}
            </span>
          ) : (
            <span className="text-[11px] font-mono font-semibold text-[#047857] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]/60 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#047857]" />
              Within typical lab range
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDelete(report)}
            className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
            title="Delete report"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onViewDetail(report)}
            className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-[#6E2D8B] bg-[#EDE4F7] hover:bg-[#D8B4FE]/40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
