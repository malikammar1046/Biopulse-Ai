import React, { useState } from 'react';
import { FileText, Filter, Plus, Calendar } from 'lucide-react';
import type { MedicalReport } from '../../types/report';
import { REPORT_CATEGORIES } from '../../types/report';
import { ReportCard } from './ReportCard';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

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
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isFemale = pathway === 'female';

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
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b ${
        isFemale ? 'border-[#EAECF0]' : 'border-[#E2E8F0]'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-xl ${
            isFemale ? 'bg-[#FBE7F0] text-[#E84A8A]' : 'bg-[#E0F2FE] text-[#0288D1]'
          }`}>
            <Filter className="w-4 h-4" />
          </span>
          <h2 className={`text-lg font-bold font-display ${isFemale ? 'text-[#111318]' : 'text-[#0F172A]'}`}>
            Report Timeline
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
              selectedFilter === 'all'
                ? isFemale
                  ? 'bg-[#E84A8A] text-white shadow-xs'
                  : 'bg-[#0288D1] text-white shadow-xs'
                : isFemale
                ? 'bg-[#FAFAFC] text-[#667085] hover:bg-[#FFF5F9] border border-[#EAECF0]'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                  selectedFilter === cat.id
                    ? isFemale
                      ? 'bg-[#E84A8A] text-white shadow-xs'
                      : 'bg-[#0288D1] text-white shadow-xs'
                    : isFemale
                    ? 'bg-[#FAFAFC] text-[#667085] hover:bg-[#FFF5F9] border border-[#EAECF0]'
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
        <div className={`p-8 sm:p-12 text-center space-y-4 shadow-xs ${
          isFemale
            ? 'rounded-[24px] bg-white border border-[#EAECF0]'
            : 'rounded-[32px] bg-white border border-[#BAE6FD]'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-2xs ${
            isFemale
              ? 'bg-[#FBE7F0] text-[#E84A8A] border border-[#FCE1ED]'
              : 'bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD]'
          }`}>
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className={`text-lg font-bold font-display ${isFemale ? 'text-[#111318]' : 'text-[#0F172A]'}`}>
              {reports.length === 0 ? 'No health reports yet' : 'No matching reports found'}
            </h3>
            <p className={`text-xs ${isFemale ? 'text-[#667085]' : 'text-[#64748B]'}`}>
              {reports.length === 0
                ? 'Upload your first blood test, hormone panel, or ultrasound report to securely organize your health information in one place.'
                : 'Try selecting a different report category filter above.'}
            </p>
          </div>
          {reports.length === 0 && (
            <button
              type="button"
              onClick={onOpenUploadModal}
              className={`px-5 py-2.5 rounded-xl font-sans font-semibold text-xs text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-[0.98] ${
                isFemale
                  ? 'bg-[#E84A8A] hover:bg-[#D93B7A]'
                  : 'bg-[#0288D1] hover:bg-[#0277BD]'
              }`}
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
              <div className={`flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider ${
                isFemale ? 'text-[#A92D61]' : 'text-[#0288D1]'
              }`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>{monthYear}</span>
                <span className={`${isFemale ? 'text-[#98A2B3]' : 'text-[#64748B]'} font-normal`}>
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
