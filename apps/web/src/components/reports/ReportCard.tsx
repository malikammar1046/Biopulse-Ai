import React from 'react';
import { File06, Calendar, Eye, Trash01, CheckCircle, AlertCircle } from '@untitledui/icons';
import type { MedicalReport } from '../../types/report';
import { REPORT_CATEGORIES } from '../../types/report';

interface ReportCardProps {
  report: MedicalReport;
  onViewDetail: (report: MedicalReport) => void;
  onDelete: (report: MedicalReport) => void;
  isMale?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onViewDetail,
  onDelete,
  isMale = false,
}) => {
  const categoryMeta =
    REPORT_CATEGORIES.find((c) => c.id === report.reportType) || REPORT_CATEGORIES[7];

  const outsideRangeCount = (report.results || []).filter(
    (r) => r.status === 'outside_range' || r.status === 'needs_review'
  ).length;

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl bg-white border transition-all duration-200 text-left select-none space-y-4 flex flex-col justify-between group shadow-xs hover:shadow-sm ${
        isMale
          ? 'border-[#BAE6FD] hover:border-[#0288D1]'
          : 'border-[#EAECF0] hover:border-[rgba(244,63,125,0.3)]'
      }`}
    >
      {/* Top Row: Title, Date, Type Badge */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <File06 className={`w-5 h-5 shrink-0 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`} aria-hidden="true" />
            <div>
              <h3 className="text-sm sm:text-base font-bold font-display text-[#0F172A] block truncate">
                {report.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className={`w-3.5 h-3.5 ${isMale ? 'text-[#0288D1]' : 'text-[#F43F7D]'}`} aria-hidden="true" />
                  {report.reportDate}
                </span>
                <span>•</span>
                <span>{report.results.length} tests recorded</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                isMale
                  ? 'bg-[#F0F9FF] text-[#0288D1] border-[#BAE6FD]'
                  : 'bg-[#FDE6EF] text-[#DC326C] border-[rgba(244,63,125,0.2)]'
              }`}
            >
              {categoryMeta.label}
            </span>
            {report.status === 'needs_verification' || (report.results && report.results.some((r) => !r.userVerified)) ? (
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Waiting for confirmation
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified ✓
              </span>
            )}
          </div>
        </div>

        {/* Key Biomarker Quick Snippet Chips */}
        {report.results.length > 0 && (
          <div className="pt-2 flex flex-wrap gap-1.5">
            {report.results.slice(0, 3).map((res) => (
              <span
                key={res.id}
                className="text-[11px] font-sans px-2.5 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569]"
              >
                <strong className="text-[#0F172A] font-semibold">{res.testName}:</strong>{' '}
                {res.resultValue} {res.unit}
              </span>
            ))}
            {report.results.length > 3 && (
              <span className="text-[10px] font-mono text-[#64748B] px-2 py-0.5">
                +{report.results.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Row: Status & Actions */}
      <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
        <div>
          {outsideRangeCount > 0 ? (
            <span className="text-[11px] font-mono font-semibold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-full border border-[#FDE68A]/60 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" aria-hidden="true" />
              {outsideRangeCount} {outsideRangeCount === 1 ? 'number needs a look' : 'numbers need a look'}
            </span>
          ) : (
            <span className="text-[11px] font-mono font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
              Within typical lab range
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDelete(report)}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
            title="Delete report"
            aria-label="Delete report"
          >
            <Trash01 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onViewDetail(report)}
            className={`h-9 px-3.5 rounded-xl font-bold text-xs text-white transition-colors flex items-center gap-1 cursor-pointer shadow-xs ${
              isMale
                ? 'bg-[#0288D1] hover:bg-[#0277BD]'
                : 'bg-[#F43F7D] hover:bg-[#DC326C]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
