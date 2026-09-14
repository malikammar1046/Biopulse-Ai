import React, { useRef, useState } from 'react';
import { Upload, Sparkles, ShieldCheck } from 'lucide-react';
import type { ReportSummaryStats } from '../../types/report';

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
    <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#BAE6FD] shadow-sm text-left select-none relative overflow-hidden space-y-6">
      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#0288D1]" />
            <span>Health Document Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
            Your Health Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-sans leading-relaxed">
            Keep your important health reports in one secure place. BioPulse AI can help you understand what the numbers and terms mean in simple language.
          </p>
        </div>

        {/* Quick Metric Pills */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
              Total Reports
            </span>
            <span className="text-lg font-bold font-display text-[#0F172A]">
              {stats.totalReportsCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] shadow-xs text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
              Needs a closer look
            </span>
            <span
              className={`text-lg font-bold font-display ${
                stats.needsReviewCount > 0 ? 'text-[#D97706]' : 'text-[#059669]'
              }`}
            >
              {stats.needsReviewCount} {stats.needsReviewCount === 1 ? 'test' : 'tests'}
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
        className={`relative z-10 p-6 sm:p-8 rounded-3xl border-2 border-dashed transition-all duration-300 text-center cursor-pointer flex flex-col items-center justify-center gap-3 ${
          isDragOver
            ? 'border-[#0288D1] bg-[#E0F2FE] scale-[0.99]'
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

        <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0288D1] border border-[#BAE6FD] flex items-center justify-center shadow-xs">
          <Upload className="w-6 h-6 text-[#0288D1]" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-[#0F172A]">
            Drag & drop your lab or ultrasound document here, or <span className="text-[#0288D1] underline">browse files</span>
          </p>
          <p className="text-xs text-[#64748B]">
            Supports PDF, JPG, PNG up to 10MB • Secured with authenticated access
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white text-[#475569] border border-[#BAE6FD]">
            PDF Documents
          </span>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white text-[#475569] border border-[#BAE6FD]">
            Phone Photos / Scans
          </span>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-white text-[#475569] border border-[#BAE6FD]">
            Ultrasound Images
          </span>
        </div>
      </div>

      {/* Trust & Privacy Assurance Banner */}
      <div className="relative z-10 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64748B] border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>Your medical reports are stored in your private, encrypted account. Only you have access.</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenUploadWizard();
          }}
          className="text-xs font-bold text-[#0288D1] hover:text-[#01579B] underline cursor-pointer"
        >
          Open manual report wizard
        </button>
      </div>
    </div>
  );
};
