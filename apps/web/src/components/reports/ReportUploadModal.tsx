import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XClose,
  UploadCloud01,
  File06,
  Check,
  AlertTriangle,
  Loading01,
  FileSearch01,
  Plus,
  Trash01,
  ShieldTick,
  LinkExternal01,
  CheckCircle,
  Clock,
  Eye,
} from '@untitledui/icons';
import {
  REPORT_CATEGORIES,
  type MedicalReportInput,
  type ReportResultInput,
  type ReportType,
} from '../../types/report';
import { ocrService } from '../../services/ocrService';
import { evaluateResultStatus, parseNumericValue } from '../../utils/reportCalculations';
import { findTestKnowledge } from '../../utils/reportKnowledge';

interface ReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReport: (input: MedicalReportInput) => Promise<{ success: boolean; error?: string }>;
  initialFile?: File | null;
}

type WizardStep = 1 | 2 | 3 | 4;
type MobileViewTab = 'results' | 'document';

export const ReportUploadModal: React.FC<ReportUploadModalProps> = ({
  isOpen,
  onClose,
  onSaveReport,
  initialFile,
}) => {
  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // File & Meta State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<ReportType>('hormone_test');
  const [reportDate, setReportDate] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Mobile Tab in Step 4
  const [mobileTab, setMobileTab] = useState<MobileViewTab>('results');

  // OCR Extracted Results State
  const [extractedResults, setExtractedResults] = useState<ReportResultInput[]>([]);

  // UI / Async State
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Cleanup object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      setReportDate(todayStr);
      setGeneralError(null);
      setIsSaving(false);
      setMobileTab('results');

      if (initialFile) {
        handleFileSelected(initialFile);
      } else {
        setSelectedFile(null);
        setReportTitle('');
        setReportType('hormone_test');
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setExtractedResults([]);
        setCurrentStep(1);
      }
    }
  }, [isOpen, initialFile]);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    const rawName = file.name.replace(/\.[^/.]+$/, '');
    const cleanTitle =
      rawName
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Medical Lab Report';
    setReportTitle(cleanTitle);

    // Auto-detect report type from file name keywords
    const lowerName = file.name.toLowerCase();
    let detectedType: ReportType = 'hormone_test';
    if (lowerName.includes('blood') || lowerName.includes('cbc') || lowerName.includes('hemoglobin')) {
      detectedType = 'blood_test';
    } else if (lowerName.includes('ultrasound') || lowerName.includes('scan') || lowerName.includes('pelvic')) {
      detectedType = 'ultrasound';
    } else if (lowerName.includes('thyroid') || lowerName.includes('tsh')) {
      detectedType = 'thyroid_test';
    } else if (lowerName.includes('glucose') || lowerName.includes('sugar') || lowerName.includes('hba1c')) {
      detectedType = 'glucose_sugar';
    } else if (lowerName.includes('lipid') || lowerName.includes('cholesterol')) {
      detectedType = 'lipid_cholesterol';
    } else if (lowerName.includes('vitamin') || lowerName.includes('vit')) {
      detectedType = 'vitamin_test';
    }
    setReportType(detectedType);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Advance to Step 2 (Document Details & Preview)
    setCurrentStep(2);
  };

  const handleStartOcrExtraction = async () => {
    if (!selectedFile) return;
    setCurrentStep(3);
    setGeneralError(null);

    try {
      const data = await ocrService.extractReportData(selectedFile, reportType);
      // OCR extracted values start as unverified until the patient explicitly confirms them
      const unverifiedResults = data.extractedResults.map((r) => ({
        ...r,
        userVerified: false,
        verificationState: 'extracted' as const,
      }));
      setExtractedResults(unverifiedResults);
      setCurrentStep(4);
    } catch {
      setGeneralError('OCR text extraction encountered an issue. You can enter results manually.');
      setExtractedResults([]);
      setCurrentStep(4);
    }
  };

  const handleUpdateResultRow = (index: number, updates: Partial<ReportResultInput>) => {
    setExtractedResults((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const updated = { ...current, ...updates };

      // Recalculate status if result or references change
      const numVal = updated.resultNumeric ?? parseNumericValue(updated.resultValue);
      updated.resultNumeric = numVal;
      updated.status = evaluateResultStatus(
        updated.resultValue,
        updated.referenceLow,
        updated.referenceHigh
      );

      // Enhance explanation if test name changes
      if (updates.testName) {
        const kb = findTestKnowledge(updates.testName);
        if (kb) {
          updated.explanation = kb.whatIsIt;
          updated.timelineConnection = kb.timelineConnection;
        }
      }

      copy[index] = updated;
      return copy;
    });
  };

  const handleToggleVerifyRow = (index: number) => {
    setExtractedResults((prev) => {
      const copy = [...prev];
      const current = copy[index];
      const nextVerified = !current.userVerified;
      copy[index] = {
        ...current,
        userVerified: nextVerified,
        verificationState: nextVerified ? 'user_confirmed' : 'extracted',
      };
      return copy;
    });
  };

  const handleConfirmAllRows = () => {
    setExtractedResults((prev) =>
      prev.map((r) => ({
        ...r,
        userVerified: true,
        verificationState: 'user_confirmed',
      }))
    );
  };

  const handleAddResultRow = () => {
    const newRow: ReportResultInput = {
      testName: 'New Test Result',
      resultValue: '',
      resultNumeric: null,
      unit: '',
      referenceRange: '',
      status: 'insufficient_info',
      ocrConfidence: 1.0,
      userVerified: true, // Manually entered by user
      verificationState: 'user_confirmed',
      explanation: 'User-entered lab observation.',
    };
    setExtractedResults((prev) => [...prev, newRow]);
  };

  const handleDeleteResultRow = (index: number) => {
    setExtractedResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveWithMode = async (confirmAll: boolean) => {
    if (!reportTitle.trim()) {
      setGeneralError('Please enter a title for your report.');
      return;
    }
    if (!reportDate) {
      setGeneralError('Please select the date of the report.');
      return;
    }

    // Determine final verification flags
    const finalizedResults: ReportResultInput[] = extractedResults.map((res) => {
      if (confirmAll) {
        return {
          ...res,
          userVerified: true,
          verificationState: 'user_confirmed' as const,
        };
      }
      return {
        ...res,
        userVerified: Boolean(res.userVerified),
        verificationState: res.userVerified ? ('user_confirmed' as const) : ('extracted' as const),
      };
    });

    // Parent report status: 'verified' ONLY if all results are confirmed by the patient
    const hasResults = finalizedResults.length > 0;
    const allVerified = hasResults && finalizedResults.every((r) => r.userVerified);
    const parentStatus = allVerified ? 'verified' : 'needs_verification';

    const payload: MedicalReportInput = {
      title: reportTitle.trim(),
      reportType,
      reportDate,
      fileName: selectedFile?.name || `${reportTitle}.pdf`,
      fileSize: selectedFile?.size,
      mimeType: selectedFile?.type || 'application/pdf',
      status: parentStatus,
      results: finalizedResults,
    };

    setIsSaving(true);
    setGeneralError(null);
    try {
      const res = await onSaveReport(payload);
      if (res.success) {
        onClose();
      } else {
        setGeneralError(res.error || 'Failed to save report.');
      }
    } catch (err: any) {
      setGeneralError(err?.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const confirmedCount = extractedResults.filter((r) => r.userVerified).length;
  const isAllConfirmed = extractedResults.length > 0 && confirmedCount === extractedResults.length;

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
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`relative w-full ${
            currentStep === 4 ? 'max-w-6xl' : 'max-w-2xl'
          } rounded-[32px] bg-white border border-[#BAE6FD] shadow-2xl p-5 sm:p-8 text-left space-y-5 z-10 select-none my-6 max-h-[92vh] overflow-y-auto transition-all duration-300`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#E0F2FE] text-[#0288D1]">
                <File06 className="w-5 h-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-display text-[#0F172A]">
                  {currentStep === 4 ? 'Review & Confirm Extracted Values' : 'Upload Medical Report'}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Step {currentStep} of 4 • {currentStep === 1 && 'Select Document'}
                  {currentStep === 2 && 'Preview & Details'}
                  {currentStep === 3 && 'Reading Document with OCR'}
                  {currentStep === 4 && 'Review Side-by-Side & Verify Numbers'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            >
              <XClose className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  s <= currentStep
                    ? 'bg-[#0288D1]'
                    : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>

          {/* Error Banner */}
          {generalError && (
            <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] flex items-start gap-3 text-xs text-[#9F1239]">
              <AlertTriangle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{generalError}</span>
            </div>
          )}

          {/* ── STEP 1: Select File ── */}
          {currentStep === 1 && (
            <div className="space-y-5 text-center py-4">
              <div className="p-8 rounded-3xl border-2 border-dashed border-[#BAE6FD] bg-[#F8FAFC] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] flex items-center justify-center mx-auto">
                  <UploadCloud01 className="w-6 h-6 text-[#0288D1]" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#0F172A]">
                    Choose a lab report, blood test, or ultrasound file
                  </p>
                  <p className="text-xs text-[#64748B]">PDF, JPG, PNG up to 10MB</p>
                </div>
                <input
                  type="file"
                  id="modal-file-upload"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="modal-file-upload"
                  className="px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm inline-block cursor-pointer"
                >
                  Browse File
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 2: Document Details ── */}
          {currentStep === 2 && selectedFile && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-[#0288D1] border border-[#BAE6FD]/60 shadow-xs">
                  <File06 className="w-6 h-6 text-[#0288D1]" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#0F172A] block truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B]">
                    {Math.round(selectedFile.size / 1024)} KB • {selectedFile.type || 'Document'}
                  </span>
                </div>
              </div>

              {previewUrl && selectedFile.type.startsWith('image/') && (
                <div className="p-2 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] max-h-48 overflow-hidden flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="max-h-44 object-contain rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0F172A] block">Report Title *</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0288D1]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0F172A] block">Report Date *</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:border-[#0288D1]"
                    required
                  />
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A] block">Report Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setReportType(cat.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-medium text-left transition-all cursor-pointer truncate ${
                        reportType === cat.id
                          ? 'bg-[#0288D1] text-white font-bold shadow-xs border-[#0288D1]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                >
                  Choose another file
                </button>

                <button
                  type="button"
                  onClick={handleStartOcrExtraction}
                  className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <FileSearch01 className="w-4 h-4" aria-hidden="true" />
                  <span>Scan & Read Numbers (OCR)</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Reading Document / OCR Extraction ── */}
          {currentStep === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-[#0288D1] flex items-center justify-center shadow-lg shadow-sky-950/20 animate-pulse">
                  <FileSearch01 className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white shadow-xs">
                  <Loading01 className="w-4 h-4 animate-spin text-[#0288D1]" aria-hidden="true" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-lg font-bold font-display text-[#0F172A]">
                  Reading your medical report...
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Extracting test names, numerical results, units, and laboratory reference intervals. Remember: OCR data is never trusted until you verify it.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4: Side-by-Side Review & Verification Screen ── */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Mandatory Review Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-2.5 text-xs text-[#0288D1]">
                <ShieldTick className="w-5 h-5 text-[#0288D1] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="font-bold text-[#0F172A] text-sm">
                    Please review the values extracted from your report. Check them against your original report before confirming.
                  </p>
                  <p className="text-[#64748B] leading-relaxed">
                    OCR-extracted numbers stay marked as <strong>Waiting for confirmation</strong> and are not added to your trusted health profile until you explicitly verify them.
                  </p>
                </div>
              </div>

              {/* Mobile View Switcher (< lg) */}
              <div className="flex lg:hidden items-center justify-between gap-2 p-1 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setMobileTab('results')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    mobileTab === 'results'
                      ? 'bg-white text-[#0288D1] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  Extracted Values ({extractedResults.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('document')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mobileTab === 'document'
                      ? 'bg-white text-[#0288D1] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Original Document</span>
                </button>
              </div>

              {/* Main Side-by-Side Grid (Desktop: 2 cols, Mobile: tabs) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* ── LEFT COLUMN: Original Document Preview ── */}
                <div
                  className={`lg:col-span-5 space-y-2.5 ${
                    mobileTab === 'document' ? 'block' : 'hidden lg:block'
                  }`}
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <File06 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                      Original Document
                    </span>
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-[#0288D1] hover:underline flex items-center gap-1"
                      >
                        <LinkExternal01 className="w-3 h-3" aria-hidden="true" />
                        <span>Open in new tab</span>
                      </a>
                    )}
                  </div>

                  <div className="h-[480px] rounded-2xl border border-[#BAE6FD] bg-[#F8FAFC] overflow-hidden flex flex-col justify-center items-center relative">
                    {previewUrl && selectedFile?.type === 'application/pdf' ? (
                      <iframe
                        src={previewUrl}
                        title="Original Medical Report PDF"
                        className="w-full h-full border-0 rounded-2xl"
                      />
                    ) : previewUrl && selectedFile?.type.startsWith('image/') ? (
                      <div className="w-full h-full p-2 overflow-auto flex items-center justify-center">
                        <img
                          src={previewUrl}
                          alt="Original Medical Report"
                          className="max-h-full max-w-full object-contain rounded-xl shadow-xs"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-2 text-[#64748B]">
                        <File06 className="w-10 h-10 text-[#0288D1] mx-auto" aria-hidden="true" />
                        <p className="text-xs font-semibold">{selectedFile?.name || 'Report Document'}</p>
                        <p className="text-[11px] text-[#64748B]">
                          Preview not available for this file type.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Extracted Results & Review Editor ── */}
                <div
                  className={`lg:col-span-7 space-y-3 ${
                    mobileTab === 'results' ? 'block' : 'hidden lg:block'
                  }`}
                >
                  {/* Status & Quick Action Bar */}
                  <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0F172A]">
                        {confirmedCount} of {extractedResults.length} confirmed
                      </span>
                      {isAllConfirmed ? (
                        <span className="text-[10px] font-mono font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" aria-hidden="true" />
                          Ready for trusted profile
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]/60 flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          Needs confirmation
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmAllRows}
                        className="px-2.5 py-1 rounded-xl bg-white border border-[#BAE6FD] text-xs font-bold text-[#0288D1] hover:bg-[#E0F2FE] transition-colors cursor-pointer"
                      >
                        Confirm All Values
                      </button>
                      <button
                        type="button"
                        onClick={handleAddResultRow}
                        className="px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                        <span>Add Missing</span>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Results List */}
                  <div className="h-[420px] overflow-y-auto pr-1 space-y-3">
                    {extractedResults.length === 0 ? (
                      <div className="text-center py-12 p-6 rounded-2xl border-2 border-dashed border-[#BAE6FD] space-y-2">
                        <p className="text-xs font-bold text-[#0F172A]">No numbers extracted</p>
                        <p className="text-xs text-[#64748B]">
                          The report could not be read cleanly. Click "Add Missing" to enter results manually.
                        </p>
                      </div>
                    ) : (
                      extractedResults.map((res, index) => (
                        <div
                          key={index}
                          className={`p-3.5 rounded-2xl border transition-all text-left text-xs space-y-2.5 ${
                            res.userVerified
                              ? 'bg-[#F0FDF4] border-[#86EFAC]/80'
                              : 'bg-[#F8FAFC] border-[#E2E8F0]'
                          }`}
                        >
                          {/* Row 1: Test Name + Confidence & Verification Badges + Delete */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <label className="text-[10px] font-mono text-[#64748B] block">
                                Test Name
                              </label>
                              <input
                                type="text"
                                value={res.testName}
                                onChange={(e) =>
                                  handleUpdateResultRow(index, { testName: e.target.value })
                                }
                                placeholder="Test Name"
                                className="font-bold text-[#0F172A] bg-transparent border-b border-transparent hover:border-[#BAE6FD] focus:border-[#0288D1] focus:outline-none w-full py-0.5 truncate text-xs"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Confidence Badge */}
                              {res.ocrConfidence && res.ocrConfidence >= 0.9 ? (
                                <span className="text-[10px] font-mono text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                                  {Math.round(res.ocrConfidence * 100)}% Confidence
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-md border border-[#FDE68A]/60">
                                  Please check value
                                </span>
                              )}

                              {/* Verification State Badge */}
                              {res.userVerified ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                                  Confirmed by you ✓
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-700" aria-hidden="true" />
                                  Waiting for confirmation
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteResultRow(index)}
                                className="p-1 text-[#64748B] hover:text-[#E11D48] transition-colors cursor-pointer"
                                title="Remove test"
                                aria-label="Remove test"
                              >
                                <Trash01 className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Value, Unit, Reference Range */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-mono text-[#64748B] block">
                                Result *
                              </label>
                              <input
                                type="text"
                                value={res.resultValue}
                                onChange={(e) =>
                                  handleUpdateResultRow(index, { resultValue: e.target.value })
                                }
                                placeholder="e.g. 12.4"
                                className="w-full px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] font-bold text-[#0F172A] focus:outline-none focus:border-[#0288D1] text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono text-[#64748B] block">
                                Unit
                              </label>
                              <input
                                type="text"
                                value={res.unit}
                                onChange={(e) =>
                                  handleUpdateResultRow(index, { unit: e.target.value })
                                }
                                placeholder="e.g. ng/dL"
                                className="w-full px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] focus:outline-none focus:border-[#0288D1] text-xs"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-mono text-[#64748B] block">
                                Typical Range
                              </label>
                              <input
                                type="text"
                                value={res.referenceRange}
                                onChange={(e) =>
                                  handleUpdateResultRow(index, { referenceRange: e.target.value })
                                }
                                placeholder="e.g. 15 – 70"
                                className="w-full px-2.5 py-1 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] focus:outline-none focus:border-[#0288D1] text-xs"
                              />
                            </div>
                          </div>

                          {/* Row 3: Item Confirmation Toggle */}
                          <div className="pt-1 flex items-center justify-between border-t border-[#E2E8F0]">
                            <span className="text-[10px] text-[#64748B]">
                              {res.userVerified
                                ? 'Included in your verified screening calculations'
                                : 'Needs your verification before adding to profile'}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleToggleVerifyRow(index)}
                              className={`px-3 py-1 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                                res.userVerified
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                  : 'bg-white text-[#0288D1] hover:bg-[#E0F2FE] border border-[#BAE6FD]'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{res.userVerified ? 'Confirmed ✓' : 'Confirm this test'}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] disabled:opacity-50 self-start sm:self-auto cursor-pointer"
                >
                  Back to Details
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  {/* Secondary: Save without verifying */}
                  <button
                    type="button"
                    onClick={() => handleSaveWithMode(false)}
                    disabled={isSaving}
                    className="px-4 py-2.5 rounded-2xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Save Without Verifying
                  </button>

                  {/* Primary: Confirm & Verify */}
                  <button
                    type="button"
                    onClick={() => handleSaveWithMode(true)}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loading01 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        <span>Saving Report...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" aria-hidden="true" />
                        <span>Confirm & Verify All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
