import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import type { MedicalReport, ReportResult } from '../../types/report';
import { REPORT_CATEGORIES } from '../../types/report';
import { findTestKnowledge } from '../../utils/reportKnowledge';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MedicalReport | null;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  if (!isOpen || !report) return null;

  const categoryMeta =
    REPORT_CATEGORIES.find((c) => c.id === report.reportType) || REPORT_CATEGORIES[7];

  const getStatusBadge = (status: ReportResult['status']) => {
    switch (status) {
      case 'within_range':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#047857]" />
            Within typical lab range
          </span>
        );
      case 'outside_range':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]/60 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#D97706]" />
            Outside typical lab range
          </span>
        );
      case 'needs_review':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#FFF1F2] text-[#E11D48] border border-[#FDA4AF]/60 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#E11D48]" />
            Needs a closer look
          </span>
        );
      case 'insufficient_info':
      default:
        return (
          <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-[#F8F5FA] text-[#584B68] border border-[#E7DFEF]">
            Recorded observation
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#10071A]/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl rounded-[32px] bg-white border border-[#E7DFEF] shadow-2xl p-6 sm:p-8 text-left space-y-6 z-10 select-none my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EAF5]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] shrink-0 shadow-xs">
                <FileText className="w-6 h-6 text-[#8E3EAF]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
                    {report.title}
                  </h2>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${categoryMeta.badgeClass}`}
                  >
                    {categoryMeta.label}
                  </span>
                </div>
                <p className="text-xs text-[#584B68]">
                  Report Date: <strong>{report.reportDate}</strong> • {report.fileName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#1C1326] hover:bg-[#F8F5FA] transition-colors cursor-pointer self-start sm:self-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Document Attachment Bar */}
          <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#584B68] min-w-0">
              <FileText className="w-4 h-4 text-[#8E3EAF] shrink-0" />
              <span className="truncate">Original Document: {report.fileName}</span>
            </div>

            {report.filePath && (
              <a
                href={report.filePath}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-bold text-[#6E2D8B] hover:bg-[#EDE4F7] transition-colors flex items-center gap-1.5 shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open File</span>
              </a>
            )}
          </div>

          {/* Extracted Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-display text-[#1C1326]">
                Extracted Test Results ({report.results.length})
              </h3>
              <span className="text-xs font-mono text-[#8D7E9E]">Human-verified numbers</span>
            </div>

            <div className="space-y-3">
              {report.results.map((res) => {
                const kb = findTestKnowledge(res.testName);
                const explanation = kb?.whatIsIt || res.explanation;
                const timelineText = kb?.timelineConnection || res.timelineCorrelation;

                return (
                  <div
                    key={res.id}
                    className="p-5 rounded-3xl bg-white border border-[#E7DFEF] shadow-2xs space-y-3 text-left"
                  >
                    {/* Top Row: Test Name, Result, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0EAF5]">
                      <div>
                        <span className="text-sm font-bold text-[#1C1326] font-display block">
                          {res.testName}
                        </span>
                        <span className="text-xs text-[#584B68]">
                          Typical range for this lab: <strong>{res.referenceRange || 'Not specified'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-extrabold font-display text-[#1C1326]">
                            {res.resultValue}
                          </span>
                          <span className="text-xs text-[#8D7E9E] font-medium ml-1">
                            {res.unit}
                          </span>
                        </div>
                        <div>{getStatusBadge(res.status)}</div>
                      </div>
                    </div>

                    {/* Plain-English Explanation Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* What is this? */}
                      {explanation && (
                        <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF]/60 space-y-1">
                          <span className="text-[11px] font-mono font-bold text-[#6E2D8B] uppercase tracking-wider flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-[#8E3EAF]" />
                            What is this test?
                          </span>
                          <p className="text-xs text-[#584B68] leading-relaxed font-sans">
                            {explanation}
                          </p>
                        </div>
                      )}

                      {/* Connection to OvaSense Timeline */}
                      {timelineText && (
                        <div className="p-3.5 rounded-2xl bg-[#FAF8FC] border border-[#D8B4FE]/40 space-y-1">
                          <span className="text-[11px] font-mono font-bold text-[#8E3EAF] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
                            Related to your timeline
                          </span>
                          <p className="text-xs text-[#584B68] leading-relaxed font-sans">
                            {timelineText}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Safety & Non-Diagnostic Reassurance */}
          <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-start gap-3 text-xs text-[#584B68] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#8E3EAF] shrink-0 mt-0.5" />
            <span>
              This result alone cannot tell us the cause. OvaSense helps organize and explain health information; it does not replace medical advice. This report should be reviewed together with your healthcare professional.
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
