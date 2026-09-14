import React, { useState } from 'react';
import { FileText, Filter, Plus, Calendar } from 'lucide-react';
import type { MedicalReport } from '../../types/report';
import { REPORT_CATEGORIES } from '../../types/report';
import { ReportCard } from './ReportCard';

interface ReportTimelineProps {
  reports: MedicalReport[];
  onViewDetail: (report: MedicalReport) => void;
  onDelete: (report: MedicalReport) => void;
  onOpenUploadModal: () => void;
}

export const ReportTimeline: React.FC<ReportTimelineProps> = ({
  reports,
  onViewDetail,
  onDelete,
  onOpenUploadModal,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredReports =
    selectedFilter === 'all'
      ? reports
      : reports.filter((r) => r.reportType === selectedFilter);

  // Group reports by Month Year (e.g. "August 2026")
  const groupedByMonth: Record<string, MedicalReport[]> = {};
  for (const rep of filteredReports) {
    const d = new Date(rep.reportDate + 'T00:00:00');
    const monthYear = isNaN(d.getTime())
      ? 'Recent'
      : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!groupedByMonth[monthYear]) {
      groupedByMonth[monthYear] = [];
    }
    groupedByMonth[monthYear].push(rep);
  }

  return (
    <div className="space-y-6 text-left select-none">
      {/* Filter Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#E0F2FE] text-[#0288D1]">
            <Filter className="w-4 h-4" />
          </span>
          <h2 className="text-lg font-bold font-display text-[#0F172A]">
            Report Timeline
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#0288D1] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F0F9FF] border border-[#E2E8F0]'
            }`}
          >
            All Reports ({reports.length})
          </button>

          {REPORT_CATEGORIES.slice(0, 5).map((cat) => {
            const count = reports.filter((r) => r.reportType === cat.id).length;
            if (count === 0 && selectedFilter !== cat.id) return null;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedFilter === cat.id
                    ? 'bg-[#0288D1] text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F0F9FF] border border-[#E2E8F0]'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-[32px] bg-white border border-[#BAE6FD] shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-[#E0F2FE] text-[#0288D1] flex items-center justify-center mx-auto shadow-xs border border-[#BAE6FD]">
            <FileText className="w-7 h-7 text-[#0288D1]" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-bold font-display text-[#0F172A]">
              {reports.length === 0 ? 'No health reports yet' : 'No matching reports found'}
            </h3>
            <p className="text-xs text-[#64748B]">
              {reports.length === 0
                ? 'Upload your first blood test, hormone panel, or ultrasound report to securely organize your health information in one place.'
                : 'Try selecting a different report category filter above.'}
            </p>
          </div>
          {reports.length === 0 && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Upload Your First Report</span>
            </button>
          )}
        </div>
      ) : (
        /* Chronological Monthly Timeline */
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([monthYear, monthReports]) => (
            <div key={monthYear} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#0288D1] uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>{monthYear}</span>
                <span className="text-[#64748B] font-normal">
                  ({monthReports.length} {monthReports.length === 1 ? 'report' : 'reports'})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onViewDetail={onViewDetail}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
