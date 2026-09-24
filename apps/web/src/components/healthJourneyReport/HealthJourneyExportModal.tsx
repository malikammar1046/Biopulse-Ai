import React, { useState, useMemo } from 'react';
import {
  XClose,
  File01,
  Download01,
  Printer,
  Share01,
  Calendar,
  ActivityHeart,
  MedicalCircle,
  Scales01,
  CalendarCheck01,
  BarChart01,
  CheckCircle,
  AlertCircle,
  RefreshCw01,
  Sliders01,
} from '@untitledui/icons';
import type {
  HealthJourneyReportOptions,
  HealthJourneyReportDateRange,
  HealthJourneyExportProgressState,
} from '../../types/healthJourneyReport';
import type { TimelineDataInputs } from '../../services/timelineService';
import { healthJourneyReportService } from '../../services/healthJourneyReportService';

interface HealthJourneyExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: TimelineDataInputs;
  defaultDateRange?: HealthJourneyReportDateRange;
}

export const HealthJourneyExportModal: React.FC<HealthJourneyExportModalProps> = ({
  isOpen,
  onClose,
  inputs,
  defaultDateRange = '30d',
}) => {
  const [options, setOptions] = useState<HealthJourneyReportOptions>({
    dateRange: defaultDateRange,
    sections: {
      overview: true,
      cycle: true,
      symptoms: true,
      reports: true,
      medications: true,
      nutrition: true,
      fitness: true,
      patterns: true,
      trajectory: true,
      appointments: true,
      doctorQuestions: true,
      patientNotes: true,
    },
    patientCustomNote: '',
    includeDisclaimer: true,
  });

  const [progressState, setProgressState] = useState<HealthJourneyExportProgressState>({
    stage: 'idle',
    message: '',
    progressPercent: 0,
  });

  // Calculate live availability for each section
  const availability = useMemo(() => {
    return healthJourneyReportService.checkDataAvailability(inputs);
  }, [inputs]);

  if (!isOpen) return null;

  const dateRanges: { label: string; value: HealthJourneyReportDateRange }[] = [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Last 6 Months', value: '6m' },
    { label: 'Last 1 Year', value: '1y' },
    { label: 'All Available Data', value: 'all' },
  ];

  const sectionConfigs = [
    { key: 'overview', label: 'Executive Health Overview', icon: File01, desc: 'Patient snapshot & key health indicators', available: true },
    { key: 'cycle', label: 'Cycle & Period History', icon: Calendar, desc: availability.cycle.description, available: availability.cycle.hasData },
    { key: 'symptoms', label: 'Symptoms & Severity Distribution', icon: ActivityHeart, desc: availability.symptoms.description, available: availability.symptoms.hasData },
    { key: 'reports', label: 'Medical Reports & Lab Biomarkers', icon: File01, desc: availability.reports.description, available: availability.reports.hasData },
    { key: 'medications', label: 'Medications & Adherence', icon: MedicalCircle, desc: availability.medications.description, available: availability.medications.hasData },
    { key: 'nutrition', label: 'Nutrition & Daily Hydration', icon: Scales01, desc: availability.nutrition.description, available: availability.nutrition.hasData },
    { key: 'fitness', label: 'Fitness & Movement Sessions', icon: ActivityHeart, desc: availability.fitness.description, available: availability.fitness.hasData },
    { key: 'patterns', label: 'Observed Clinical Patterns', icon: BarChart01, desc: 'AI-assisted correlations & doctor prompts', available: true },
    { key: 'appointments', label: 'Consultations & Doctor Questions', icon: CalendarCheck01, desc: availability.appointments.description, available: availability.appointments.hasData },
  ] as const;

  const handleToggleSection = (key: keyof HealthJourneyReportOptions['sections']) => {
    setOptions((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [key]: !prev.sections[key],
      },
    }));
  };

  const handleStartGeneration = async () => {
    try {
      await healthJourneyReportService.generateReport(inputs, options, (state) => {
        setProgressState(state);
      });
    } catch (err: any) {
      setProgressState({
        stage: 'error',
        message: 'We couldn’t generate the report right now. Your health data is safe.',
        progressPercent: 0,
        error: err?.message || 'Unknown error occurred.',
      });
    }
  };

  const handleDownload = () => {
    if (progressState.pdfBlobUrl && progressState.pdfFileName) {
      healthJourneyReportService.downloadReport(progressState.pdfBlobUrl, progressState.pdfFileName);
    }
  };

  const handlePrint = () => {
    if (progressState.pdfBlobUrl) {
      healthJourneyReportService.printReport(progressState.pdfBlobUrl);
    }
  };

  const handleShare = async () => {
    if (navigator.share && progressState.pdfBlob && progressState.pdfFileName) {
      try {
        const file = new File([progressState.pdfBlob], progressState.pdfFileName, {
          type: 'application/pdf',
        });
        await navigator.share({
          title: 'BioPulse AI Health Journey Clinical Brief',
          text: 'Here is my longitudinal health journey clinical brief from BioPulse AI.',
          files: [file],
        });
      } catch {
        // user cancelled or share failed
      }
    }
  };

  const handleReset = () => {
    setProgressState({ stage: 'idle', message: '', progressPercent: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/75 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-[36px] bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Close Button */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
        >
          <XClose className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <File01 className="w-7 h-7 text-[#0288D1] shrink-0 mt-1" aria-hidden="true" />

          <div className="space-y-1 pr-6">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#0288D1] uppercase tracking-wider">
              <span>Doctor-Ready Summary</span>
            </div>
            <h2 className="text-xl font-bold font-display text-[#0F172A]">
              Complete Health Journey — Clinical Brief
            </h2>
            <p className="text-xs text-[#475569]">
              Compile a structured, multi-page PDF briefing of your longitudinal health data for your next doctor consultation.
            </p>
          </div>
        </div>

        {/* ── STAGE 1: CONFIGURATION FORM ── */}
        {progressState.stage === 'idle' && (
          <div className="space-y-6">
            {/* Date Range Selection */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold font-display text-[#0F172A] flex items-center gap-1.5">
                <Sliders01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                <span>1. Select Reporting Period</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dateRanges.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setOptions((prev) => ({ ...prev, dateRange: r.value }))}
                    className={`p-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer border ${
                      options.dateRange === r.value
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                        : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sections to Include Checkboxes */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold font-display text-[#0F172A] flex items-center gap-1.5">
                <File01 className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                <span>2. Choose Sections to Include</span>
              </span>

              <div className="space-y-2">
                {sectionConfigs.map((sec) => {
                  const isChecked = options.sections[sec.key as keyof HealthJourneyReportOptions['sections']];
                  const Icon = sec.icon;

                  return (
                    <label
                      key={sec.key}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isChecked
                          ? 'bg-[#F0F9FF] border-[#BAE6FD]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSection(sec.key as keyof HealthJourneyReportOptions['sections'])}
                          className="w-4 h-4 rounded-md text-[#0288D1] focus:ring-[#0288D1] border-[#CBD5E1] cursor-pointer"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#0F172A] block truncate flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5 text-[#0288D1]" aria-hidden="true" />
                            <span>{sec.label}</span>
                          </span>
                          <span className="text-[10px] text-[#64748B] block">
                            {sec.desc}
                          </span>
                        </div>
                      </div>

                      {sec.available ? (
                        <span className="text-[10px] font-mono font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full shrink-0">
                          Data Ready
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full shrink-0">
                          No Data
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional Patient Custom Note */}
            <div className="space-y-2">
              <span className="text-xs font-bold font-display text-[#0F172A] block">
                3. Optional Note for Your Doctor
              </span>
              <textarea
                value={options.patientCustomNote}
                onChange={(e) => setOptions((prev) => ({ ...prev, patientCustomNote: e.target.value }))}
                placeholder="E.g., I've been feeling more fatigued during my luteal phase and wanted to ask about adjusting my supplement routine..."
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] focus:outline-hidden focus:border-[#0288D1] text-xs text-[#0F172A] placeholder-[#94A3B8]"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#64748B] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartGeneration}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all cursor-pointer"
              >
                <Download01 className="w-4 h-4" aria-hidden="true" />
                <span>Generate Clinical Brief PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 2: GENERATING PROGRESS SCREEN ── */}
        {(progressState.stage === 'collecting' ||
          progressState.stage === 'analyzing' ||
          progressState.stage === 'building' ||
          progressState.stage === 'finalizing') && (
          <div className="py-12 px-4 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#E0F2FE] text-[#0288D1] flex items-center justify-center mx-auto shadow-sm">
              <RefreshCw01 className="w-8 h-8 animate-spin" aria-hidden="true" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold font-display text-[#0F172A]">
                Preparing Your Health Journey
              </h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                {progressState.message}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-xs mx-auto space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-[#E0F2FE] overflow-hidden">
                <div
                  className="h-full bg-[#0288D1] transition-all duration-300 rounded-full"
                  style={{ width: `${progressState.progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-[#64748B]">
                {progressState.progressPercent}% Completed
              </span>
            </div>
          </div>
        )}

        {/* ── STAGE 3: SUCCESS / READY SCREEN ── */}
        {progressState.stage === 'ready' && (
          <div className="py-8 px-4 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-xl font-bold font-display text-[#0F172A]">
                Your Health Journey Is Ready!
              </h3>
              <p className="text-xs text-[#475569]">
                {progressState.pdfFileName}
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-sm transition-all cursor-pointer"
              >
                <Download01 className="w-4 h-4" aria-hidden="true" />
                <span>Download PDF Now</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                <span>Print Document</span>
              </button>

              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-bold text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-all cursor-pointer"
                >
                  <Share01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                  <span>Share</span>
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-[#0288D1] hover:underline cursor-pointer"
              >
                ← Generate Another with Different Options
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 4: ERROR SCREEN ── */}
        {progressState.stage === 'error' && (
          <div className="py-8 px-4 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold font-display text-[#0F172A]">
                Generation Encountered an Issue
              </h3>
              <p className="text-xs text-[#BE123C]">
                {progressState.message}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#0288D1] hover:bg-[#0277BD] transition-all cursor-pointer"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#64748B] bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
