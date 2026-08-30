import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
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

  // OCR Extracted Results State
  const [extractedResults, setExtractedResults] = useState<ReportResultInput[]>([]);

  // UI / Async State
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().split('T')[0];
      setReportDate(todayStr);
      setGeneralError(null);
      setIsSaving(false);

      if (initialFile) {
        handleFileSelected(initialFile);
      } else {
        setSelectedFile(null);
        setReportTitle('');
        setReportType('hormone_test');
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

    if (file.type.startsWith('image/')) {
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
      setExtractedResults(data.extractedResults);
      setCurrentStep(4);
    } catch {
      setGeneralError('OCR text extraction encountered an issue. You can enter results manually.');
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

  const handleAddResultRow = () => {
    const newRow: ReportResultInput = {
      testName: 'New Test',
      resultValue: '',
      resultNumeric: null,
      unit: '',
      referenceRange: '',
      status: 'insufficient_info',
      ocrConfidence: 1.0,
      userVerified: true,
      explanation: 'User-entered lab observation.',
    };
    setExtractedResults((prev) => [...prev, newRow]);
  };

  const handleDeleteResultRow = (index: number) => {
    setExtractedResults((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveFinalReport = async () => {
    if (!reportTitle.trim()) {
      setGeneralError('Please enter a title for your report.');
      return;
    }
    if (!reportDate) {
      setGeneralError('Please select the date of the report.');
      return;
    }

    const payload: MedicalReportInput = {
      title: reportTitle.trim(),
      reportType,
      reportDate,
      fileName: selectedFile?.name || `${reportTitle}.pdf`,
      fileSize: selectedFile?.size,
      mimeType: selectedFile?.type || 'application/pdf',
      status: 'verified',
      results: extractedResults,
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
          className="relative w-full max-w-2xl rounded-[32px] bg-white border border-[#E7DFEF] shadow-2xl p-6 sm:p-8 text-left space-y-6 z-10 select-none my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F0EAF5]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B]">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold font-display text-[#1C1326]">
                  {currentStep === 4 ? 'Verify Extracted Numbers' : 'Upload Health Report'}
                </h2>
                <p className="text-xs text-[#584B68]">
                  Step {currentStep} of 4 • {currentStep === 1 && 'Select Document'}
                  {currentStep === 2 && 'Preview & Details'}
                  {currentStep === 3 && 'Reading Document (OCR)'}
                  {currentStep === 4 && 'Confirm Your Numbers'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#8D7E9E] hover:text-[#1C1326] hover:bg-[#F8F5FA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  s <= currentStep
                    ? 'bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF]'
                    : 'bg-[#E7DFEF]'
                }`}
              />
            ))}
          </div>

          {/* Error Banner */}
          {generalError && (
            <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FDA4AF] flex items-start gap-3 text-xs text-[#9F1239]">
              <AlertTriangle className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* ── STEP 1: Select File ── */}
          {currentStep === 1 && (
            <div className="space-y-5 text-center py-4">
              <div className="p-8 rounded-3xl border-2 border-dashed border-[#D8B4FE] bg-[#F8F5FA] space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-[#8E3EAF]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#1C1326]">
                    Choose a lab report or ultrasound file
                  </p>
                  <p className="text-xs text-[#8D7E9E]">PDF, JPG, PNG up to 10MB</p>
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
                  className="px-5 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md inline-block cursor-pointer"
                >
                  Browse File
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 2: Document Preview & Details ── */}
          {currentStep === 2 && selectedFile && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white text-[#6E2D8B] shadow-2xs">
                  <FileText className="w-6 h-6 text-[#8E3EAF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-[#1C1326] block truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#8D7E9E]">
                    {Math.round(selectedFile.size / 1024)} KB • {selectedFile.type || 'Document'}
                  </span>
                </div>
              </div>

              {previewUrl && (
                <div className="p-2 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] max-h-48 overflow-hidden flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    className="max-h-44 object-contain rounded-xl"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1C1326] block">Report Title *</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-medium text-[#1C1326] focus:bg-white focus:outline-none focus:border-[#8E3EAF]"
                    required
                  />
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1C1326] block">Report Date *</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-medium text-[#1C1326] focus:bg-white focus:outline-none focus:border-[#8E3EAF]"
                    required
                  />
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1C1326] block">Report Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setReportType(cat.id)}
                      className={`p-2.5 rounded-2xl border text-xs font-medium text-left transition-all cursor-pointer truncate ${
                        reportType === cat.id
                          ? 'bg-[#6E2D8B] text-white font-bold shadow-xs'
                          : 'bg-[#F8F5FA] border-[#E7DFEF] text-[#584B68] hover:bg-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-[#F0EAF5]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-[#584B68] hover:text-[#1C1326]"
                >
                  Choose another file
                </button>

                <button
                  type="button"
                  onClick={handleStartOcrExtraction}
                  className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Scan & Read Numbers</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Reading Document / OCR Extraction ── */}
          {currentStep === 3 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#6E2D8B] via-[#8E3EAF] to-[#FB7185] flex items-center justify-center shadow-lg shadow-purple-950/30 animate-pulse">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white shadow-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8E3EAF]" />
                </div>
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-lg font-bold font-display text-[#1C1326]">
                  Reading your report...
                </h3>
                <p className="text-xs text-[#584B68] leading-relaxed">
                  OvaSense is extracting test names, numerical results, units, and laboratory reference intervals from your document.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 4: OCR Verification Screen (Human Confirmation) ── */}
          {currentStep === 4 && (
            <div className="space-y-5">
              {/* Notice Banner */}
              <div className="p-3.5 rounded-2xl bg-[#EDE4F7] border border-[#D8B4FE]/50 flex items-start gap-2.5 text-xs text-[#6E2D8B]">
                <ShieldCheck className="w-4 h-4 text-[#8E3EAF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Please verify your extracted numbers:</span>
                  <span className="text-[#584B68]">
                    We extracted {extractedResults.length} test numbers from your report. You can review or edit any value below before saving.
                  </span>
                </div>
              </div>

              {/* Extracted Results Table / Cards */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {extractedResults.map((res, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-2.5 text-left text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Test Name */}
                      <input
                        type="text"
                        value={res.testName}
                        onChange={(e) => handleUpdateResultRow(index, { testName: e.target.value })}
                        placeholder="Test Name"
                        className="font-bold text-[#1C1326] bg-transparent border-b border-transparent hover:border-[#D8B4FE] focus:border-[#8E3EAF] focus:outline-none w-1/2 py-0.5 truncate"
                      />

                      {/* Confidence Tag & Delete */}
                      <div className="flex items-center gap-2">
                        {res.ocrConfidence && res.ocrConfidence >= 0.9 ? (
                          <span className="text-[10px] font-mono text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]/60">
                            High confidence
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-md border border-[#FDE68A]/60">
                            Please check value
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteResultRow(index)}
                          className="p-1 text-[#8D7E9E] hover:text-[#E11D48] transition-colors"
                          title="Remove test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Result, Unit, Range Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#8D7E9E] block">Result *</span>
                        <input
                          type="text"
                          value={res.resultValue}
                          onChange={(e) =>
                            handleUpdateResultRow(index, { resultValue: e.target.value })
                          }
                          placeholder="e.g. 12.4"
                          className="w-full px-2 py-1 rounded-xl bg-white border border-[#E7DFEF] font-bold text-[#1C1326] focus:outline-none focus:border-[#8E3EAF]"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-[#8D7E9E] block">Unit</span>
                        <input
                          type="text"
                          value={res.unit}
                          onChange={(e) => handleUpdateResultRow(index, { unit: e.target.value })}
                          placeholder="e.g. ng/dL"
                          className="w-full px-2 py-1 rounded-xl bg-white border border-[#E7DFEF] text-[#584B68] focus:outline-none focus:border-[#8E3EAF]"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-[#8D7E9E] block">Typical Range</span>
                        <input
                          type="text"
                          value={res.referenceRange}
                          onChange={(e) =>
                            handleUpdateResultRow(index, { referenceRange: e.target.value })
                          }
                          placeholder="e.g. 15 – 70"
                          className="w-full px-2 py-1 rounded-xl bg-white border border-[#E7DFEF] text-[#584B68] focus:outline-none focus:border-[#8E3EAF]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Row Button */}
              <button
                type="button"
                onClick={handleAddResultRow}
                className="w-full py-2 rounded-xl border border-dashed border-[#D8B4FE] text-xs font-semibold text-[#6E2D8B] hover:bg-[#EDE4F7]/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add another test result</span>
              </button>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-[#F0EAF5]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-[#584B68] hover:text-[#1C1326] disabled:opacity-50"
                >
                  Back to Details
                </button>

                <button
                  type="button"
                  onClick={handleSaveFinalReport}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Report...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Verified Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
