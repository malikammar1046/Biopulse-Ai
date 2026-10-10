import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud01, FileCheck02, ShieldTick } from '@untitledui/icons';
import type { ReportSummaryStats } from '../../types/report';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

interface ReportHeroUploadProps {
  stats: ReportSummaryStats;
  onFileSelected: (file: File) => void;
  onOpenUploadWizard: () => void;
}

export const ReportHeroUpload: React.FC<ReportHeroUploadProps> = ({
  stats,
  onFileSelected,
  onOpenUploadWizard,
}) => {
  const { t } = useTranslation(['reports', 'common']);
  const { userProfile } = useUserHealth();
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const isFemale = pathway === 'female';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        onFileSelected(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
      alert('Please upload a PDF document or an image (JPG, PNG).');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit. Please upload a smaller document.');
      return false;
    }
    return true;
  };

  return (
    <div className={`p-6 sm:p-8 shadow-xs text-left select-none relative overflow-hidden space-y-6 rounded-2xl bg-white border ${
      isFemale ? 'border-[#EAECF0]' : 'border-[#BAE6FD]'
    }`}>
      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            isFemale
              ? 'bg-[#FDE6EF] text-[#DC326C] border-[rgba(244,63,125,0.2)]'
              : 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
          }`}>
            <FileCheck02 className={`w-3.5 h-3.5 ${isFemale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`} aria-hidden="true" />
            <span>{t('reports:healthDocHub', { defaultValue: 'Health Document Hub' })}</span>
          </div>
        </div>

        {/* Quick Metric Pills */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className={`p-3 rounded-xl border shadow-xs text-left ${
            isFemale ? 'bg-[#FAFAFC] border-[#EAECF0]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <span className={`text-[10px] font-mono uppercase tracking-wider block ${
              isFemale ? 'text-[#98A2B3]' : 'text-[#64748B]'
            }`}>
              {t('reports:totalReportsCount', { defaultValue: 'Total Reports' })}
            </span>
            <span className={`text-lg font-bold font-display ${
              isFemale ? 'text-[#111318]' : 'text-[#0F172A]'
            }`}>
              {stats.totalReportsCount}
            </span>
          </div>

          <div className={`p-3 rounded-xl border shadow-xs text-left ${
            isFemale ? 'bg-[#FAFAFC] border-[#EAECF0]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}>
            <span className={`text-[10px] font-mono uppercase tracking-wider block ${
              isFemale ? 'text-[#98A2B3]' : 'text-[#64748B]'
            }`}>
              {t('reports:needsCloserLook', { defaultValue: 'Needs a closer look' })}
            </span>
            <span
              className={`text-lg font-bold font-display ${
                stats.needsReviewCount > 0
                  ? isFemale ? 'text-[#E8A23A]' : 'text-[#D97706]'
                  : isFemale ? 'text-[#16A36A]' : 'text-[#059669]'
              }`}
            >
              {stats.needsReviewCount} {stats.needsReviewCount === 1 ? t('reports:testLabel', { defaultValue: 'test' }) : t('reports:testsLabel', { defaultValue: 'tests' })}
            </span>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative z-10 p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all duration-300 text-center cursor-pointer flex flex-col items-center justify-center gap-3 ${
          isDragOver
            ? isFemale
              ? 'border-[#F43F7D] bg-[#FDE6EF]/40 scale-[0.99]'
              : 'border-[#0288D1] bg-[#E0F2FE] scale-[0.99]'
            : isFemale
              ? 'border-[#EAECF0] bg-[#F8FAFC] hover:bg-[#FDE6EF]/20 hover:border-[rgba(244,63,125,0.3)]'
              : 'border-[#BAE6FD] bg-[#F8FAFC] hover:bg-[#F0F9FF] hover:border-[#0288D1]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/png,image/jpeg,image/jpg"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xs border ${
          isFemale
            ? 'bg-[#FDE6EF] text-[#F43F7D] border-[rgba(244,63,125,0.2)]'
            : 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
        }`}>
          <UploadCloud01 className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-[#0F172A]">
            {t('reports:dragDropLabReports', { defaultValue: 'Drag & drop your lab reports here, or click to browse' })}
          </p>
          <p className="text-xs text-[#64748B]">
            {t('reports:supportedFormats', { defaultValue: 'Supports PDF, JPG, PNG up to 10MB • Secured with authenticated access' })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1">
          <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white border text-[#475569] ${
            isFemale ? 'border-[#EAECF0]' : 'border-[#BAE6FD]'
          }`}>
            PDF
          </span>
          <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white border text-[#475569] ${
            isFemale ? 'border-[#EAECF0]' : 'border-[#BAE6FD]'
          }`}>
            JPG / PNG
          </span>
          <span className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white border text-[#475569] ${
            isFemale ? 'border-[#EAECF0]' : 'border-[#BAE6FD]'
          }`}>
            Ultrasound
          </span>
        </div>
      </div>

      {/* Trust & Privacy Assurance Banner */}
      <div className="relative z-10 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-t text-[#64748B] border-[#EAECF0]">
        <div className="flex items-center gap-2">
          <ShieldTick className="w-4 h-4 text-[#059669]" aria-hidden="true" />
          <span>{t('auth:secureDataTransfer', { defaultValue: 'Your medical reports are stored in your private, encrypted account.' })}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenUploadWizard();
          }}
          className={`text-xs font-semibold underline cursor-pointer ${
            isFemale ? 'text-[#DC326C] hover:text-[#B82558]' : 'text-[#0288D1] hover:text-[#01579B]'
          }`}
        >
          {t('reports:browseFileCTA', { defaultValue: 'Open manual report wizard' })}
        </button>
      </div>
    </div>
  );
};
