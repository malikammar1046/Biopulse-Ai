import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine, FileUp } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const UploadReportsSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Visual: Animated Medical Document OCR Scanner */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[420px]">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl space-y-5 relative overflow-hidden">
              {/* Animated Purple Laser Scanning Beam */}
              <motion.div
                animate={{ y: [0, 220, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E879F9] to-transparent shadow-[0_0_12px_#E879F9] z-20 pointer-events-none"
              />

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#8E3EAF]/30 text-[#C084FC] flex items-center justify-center">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-display text-white">OCR Document Scanner</h4>
                    <span className="text-[10px] text-[#B4A6C7] font-mono">Format: PDF / Photo Upload</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] text-[10px] font-bold">
                  Extracting
                </span>
              </div>

              {/* Document Mock Extracted Rows */}
              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                  <span className="text-[#B4A6C7]">Total Testosterone</span>
                  <span className="text-white font-bold">2.8 nmol/L</span>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                  <span className="text-[#B4A6C7]">Luteinizing Hormone (LH)</span>
                  <span className="text-white font-bold">8.4 mIU/mL</span>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                  <span className="text-[#B4A6C7]">FSH Level</span>
                  <span className="text-white font-bold">4.9 mIU/mL</span>
                </div>
                <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                  <span className="text-[#B4A6C7]">LH / FSH Ratio</span>
                  <span className="text-[#FDA4AF] font-bold">1.71</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#6E2D8B]/30 border border-[#8E3EAF]/40 text-center text-xs text-[#EDE4F7]">
                Tesseract OCR engine parses laboratory values into structured fields.
              </div>
            </div>
          </div>

          {/* Right Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
              <FileUp className="w-3.5 h-3.5" />
              <span>Phase 02 — Report Ingestion</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
              02 — Bring your medical reports with you
            </h2>

            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans">
              Upload hormone blood test reports and pelvic ultrasound summaries directly from your phone or computer.
              PMOSense accepts standard PDFs, JPGs, and PNG document scans.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <h4 className="text-sm font-bold font-display text-white">Automated OCR Field Parsing</h4>
                <p className="text-xs text-[#B4A6C7]">
                  Extracts quantitative values for LH, FSH, AMH, Testosterone, DHEAS, and Fasting Glucose without manual typing.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <h4 className="text-sm font-bold font-display text-white">Format Resilience</h4>
                <p className="text-xs text-[#B4A6C7]">
                  Designed to parse documents from major diagnostic centers and local laboratories across Pakistan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
