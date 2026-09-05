import React, { useState } from 'react';
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
  Clock,
  Edit2,
  Check,
  Loader2,
} from 'lucide-react';
import type { MedicalReport, ReportResult } from '../../types/report';
import { REPORT_CATEGORIES } from '../../types/report';
import { findTestKnowledge } from '../../utils/reportKnowledge';
import { useUserHealth } from '../../context/UserHealthContext';

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
  const { reports, verifyReportBiomarker, updateReportBiomarker } = useUserHealth();

  // Find the most up-to-date version of this report from the health context
  const currentReport = reports.find((r) => r.id === report?.id) || report;

  // Inline edit state
  const [editingResultId, setEditingResultId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    testName: string;
    resultValue: string;
    unit: string;
    referenceRange: string;
  }>({
    testName: '',
    resultValue: '',
    unit: '',
    referenceRange: '',
  });

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !currentReport) return null;

  const categoryMeta =
    REPORT_CATEGORIES.find((c) => c.id === currentReport.reportType) || REPORT_CATEGORIES[7];

  const unverifiedCount = (currentReport.results || []).filter((r) => !r.userVerified).length;
  const isAllVerified = (currentReport.results || []).length > 0 && unverifiedCount === 0;

  const handleStartEdit = (res: ReportResult) => {
    setEditingResultId(res.id);
    setEditForm({
      testName: res.testName,
      resultValue: res.resultValue,
      unit: res.unit || '',
      referenceRange: res.referenceRange || '',
    });
    setActionError(null);
  };

  const handleCancelEdit = () => {
    setEditingResultId(null);
    setActionError(null);
  };

  const handleSaveEdit = async (resultId: string) => {
    if (!editForm.testName.trim() || !editForm.resultValue.trim()) {
      setActionError('Test name and result value cannot be empty.');
      return;
    }

    setLoadingActionId(resultId);
    setActionError(null);

    try {
      await updateReportBiomarker(
        currentReport.id,
        resultId,
        {
          testName: editForm.testName.trim(),
          resultValue: editForm.resultValue.trim(),
          unit: editForm.unit.trim(),
          referenceRange: editForm.referenceRange.trim(),
        },
        true // mark as user-verified
      );
      setEditingResultId(null);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update and verify result.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleConfirmSingle = async (resultId: string) => {
    setLoadingActionId(resultId);
    setActionError(null);
    try {
      await verifyReportBiomarker(currentReport.id, resultId);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to verify result.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleConfirmAllRemaining = async () => {
    setLoadingActionId('all');
    setActionError(null);
    try {
      const unverifiedItems = (currentReport.results || []).filter((r) => !r.userVerified);
      for (const item of unverifiedItems) {
        await verifyReportBiomarker(currentReport.id, item.id);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to verify all results.');
    } finally {
      setLoadingActionId(null);
    }
  };

  const getStatusBadge = (status: ReportResult['status']) => {
    switch (status) {
      case 'within_range':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#047857]" />
            Within typical range
          </span>
        );
      case 'outside_range':
        return (
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]/60 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-[#D97706]" />
            Outside typical range
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#10071A]/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl rounded-[32px] bg-white border border-[#E7DFEF] shadow-2xl p-6 sm:p-8 text-left space-y-5 z-10 select-none my-6 max-h-[90vh] overflow-y-auto"
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
                    {currentReport.title}
                  </h2>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${categoryMeta.badgeClass}`}
                  >
                    {categoryMeta.label}
                  </span>
                </div>
                <p className="text-xs text-[#584B68]">
                  Report Date: <strong>{currentReport.reportDate}</strong> • {currentReport.fileName}
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

          {/* Action Error Banner */}
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] text-xs text-[#9F1239] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#E11D48] shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Verification Status Overview Banner */}
          {isAllVerified ? (
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-between gap-3 text-xs text-[#065F46]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#047857] shrink-0" />
                <div>
                  <span className="font-bold block text-sm">Verified Report</span>
                  <span>
                    All numbers in this report have been confirmed by you and are trusted by your adaptive health profile.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#92400E]">
              <div className="flex items-start gap-2.5">
                <Clock className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-sm">
                    {unverifiedCount} {unverifiedCount === 1 ? 'value waiting' : 'values waiting'} for your confirmation
                  </span>
                  <span>
                    OCR-extracted numbers are not added to your trusted screening tiers until you confirm them.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmAllRemaining}
                disabled={loadingActionId === 'all'}
                className="px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] hover:brightness-110 shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loadingActionId === 'all' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm All Remaining</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Document Attachment Bar */}
          <div className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#584B68] min-w-0">
              <FileText className="w-4 h-4 text-[#8E3EAF] shrink-0" />
              <span className="truncate">Original Document: {currentReport.fileName}</span>
            </div>

            {currentReport.filePath && (
              <a
                href={currentReport.filePath}
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
                Extracted Test Results ({currentReport.results.length})
              </h3>
              <span className="text-xs font-mono text-[#8D7E9E]">
                {currentReport.results.filter((r) => r.userVerified).length} of {currentReport.results.length} verified
              </span>
            </div>

            <div className="space-y-3.5">
              {currentReport.results.map((res) => {
                const isEditing = editingResultId === res.id;
                const isLoadingThis = loadingActionId === res.id;
                const kb = findTestKnowledge(res.testName);
                const explanation = kb?.whatIsIt || res.explanation;
                const timelineText = kb?.timelineConnection || res.timelineCorrelation;

                return (
                  <div
                    key={res.id}
                    className={`p-5 rounded-3xl bg-white border transition-all shadow-2xs space-y-3 text-left ${
                      res.userVerified
                        ? 'border-[#E7DFEF]'
                        : 'border-[#FDE68A] bg-[#FFFDF7]'
                    }`}
                  >
                    {/* Top Row: Test Name, Result, Status, and Verification Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#F0EAF5]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1C1326] font-display">
                            {res.testName}
                          </span>
                          {res.ocrConfidence && (
                            <span className="text-[10px] font-mono text-[#8D7E9E] bg-[#F8F5FA] px-1.5 py-0.5 rounded border border-[#E7DFEF]">
                              OCR: {Math.round(res.ocrConfidence * 100)}%
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#584B68]">
                          Typical range: <strong>{res.referenceRange || 'Not specified'}</strong>
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

                    {/* Verification Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
                      {res.userVerified ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]/70 text-[#047857] text-xs font-medium font-sans">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" />
                          <span>Verified by you ✓</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-[#92400E] bg-[#FEF3C7] px-2.5 py-1 rounded-full border border-[#FDE68A] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#D97706]" />
                            Waiting for your confirmation
                          </span>
                        </div>
                      )}

                      {/* Action Buttons: Edit or Confirm */}
                      {!isEditing && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(res)}
                            disabled={isLoadingThis}
                            className="px-2.5 py-1 rounded-xl bg-white border border-[#E7DFEF] hover:bg-[#F8F5FA] text-xs font-semibold text-[#584B68] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Edit2 className="w-3 h-3 text-[#8D7E9E]" />
                            <span>Edit</span>
                          </button>

                          {!res.userVerified && (
                            <button
                              type="button"
                              onClick={() => handleConfirmSingle(res.id)}
                              disabled={isLoadingThis}
                              className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white text-xs font-bold shadow-xs hover:brightness-110 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {isLoadingThis ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Confirm & Verify</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline Editing Form */}
                    {isEditing && (
                      <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#D8B4FE]/80 space-y-3">
                        <span className="text-xs font-bold text-[#1C1326] block">
                          Edit Test Value Before Verifying:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-mono text-[#8D7E9E] block">
                              Test Name
                            </label>
                            <input
                              type="text"
                              value={editForm.testName}
                              onChange={(e) =>
                                setEditForm({ ...editForm, testName: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-bold text-[#1C1326] focus:outline-none focus:border-[#8E3EAF]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-[#8D7E9E] block">
                              Result Value
                            </label>
                            <input
                              type="text"
                              value={editForm.resultValue}
                              onChange={(e) =>
                                setEditForm({ ...editForm, resultValue: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-bold text-[#1C1326] focus:outline-none focus:border-[#8E3EAF]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono text-[#8D7E9E] block">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={editForm.unit}
                              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs text-[#584B68] focus:outline-none focus:border-[#8E3EAF]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-[#8D7E9E] block">
                            Typical Range
                          </label>
                          <input
                            type="text"
                            value={editForm.referenceRange}
                            onChange={(e) =>
                              setEditForm({ ...editForm, referenceRange: e.target.value })
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs text-[#584B68] focus:outline-none focus:border-[#8E3EAF]"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isLoadingThis}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#584B68] hover:text-[#1C1326] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(res.id)}
                            disabled={isLoadingThis}
                            className="px-4 py-1.5 rounded-xl bg-[#6E2D8B] hover:bg-[#8E3EAF] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isLoadingThis ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>Save & Verify</span>
                          </button>
                        </div>
                      </div>
                    )}

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

                      {/* Connection to Health Timeline */}
                      {timelineText && (
                        <div className="p-3.5 rounded-2xl bg-[#FAF8FC] border border-[#D8B4FE]/40 space-y-1">
                          <span className="text-[11px] font-mono font-bold text-[#8E3EAF] uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
                            Related to your health journey
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
