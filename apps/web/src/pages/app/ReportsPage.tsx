import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const ReportsPage: React.FC = () => {
  const { reports, openAiChatWithPrompt } = useUserHealth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFEF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Medical & Ultrasound Reports
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            OCR biometric extraction from hormone panels, glucose tests, and pelvic sonography.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt('I want to upload and analyze a new ultrasound report')}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Lab or Scan</span>
        </button>
      </div>

      {/* Reports Repository List */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <h2 className="text-base font-bold font-display text-[#1C1326]">
          Longitudinal Diagnostic Documents
        </h2>

        <div className="space-y-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1C1326]">{rep.title}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857]">
                    {rep.status}
                  </span>
                </div>
                <p className="text-xs text-[#584B68]">{rep.summary}</p>
                <span className="text-[10px] font-mono text-[#8E3EAF] font-bold block pt-0.5">
                  Biomarkers: {rep.keyBiomarker}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openAiChatWithPrompt(`Explain my ${rep.title} in simple terms`)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E7DFEF] text-xs font-bold text-[#6E2D8B] hover:bg-[#EDE4F7] transition-colors cursor-pointer"
                >
                  Explain with AI
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ReportsPage;
