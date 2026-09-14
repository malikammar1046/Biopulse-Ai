import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, FileUp, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const UploadReportsSection: React.FC = () => {
  const [activeReportTab, setActiveReportTab] = useState<'womens' | 'mens'>('womens');

  const steps = [
    { num: '1', title: 'Upload', desc: 'Securely upload laboratory PDFs, photos, or digital scans.' },
    { num: '2', title: 'Extract', desc: 'OCR parsing identifies quantitative analyte names, numbers, and reference units.' },
    { num: '3', title: 'Review', desc: 'Extracted values are presented side-by-side with your original document.' },
    { num: '4', title: 'Verify', desc: 'You inspect, correct any misread numbers, or flag missing metrics.' },
    { num: '5', title: 'Confirm', desc: 'Only verified and approved data enters your longitudinal screening record.' },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Visual: Animated Medical Document OCR Scanner */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[440px]">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl space-y-5 relative overflow-hidden">
              {/* Animated Laser Scanning Beam */}
              <motion.div
                animate={{ y: [0, 240, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E879F9] to-transparent shadow-[0_0_12px_#E879F9] z-20 pointer-events-none"
              />

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#8E3EAF]/30 text-[#C084FC] flex items-center justify-center">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-display text-white">OCR Document Ingestion</h4>
                    <span className="text-[10px] text-[#B4A6C7] font-mono">Format: PDF / Mobile Photo Scan</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setActiveReportTab('womens')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activeReportTab === 'womens' ? 'bg-[#8E3EAF] text-white' : 'text-[#B4A6C7]'
                    }`}
                  >
                    Women
                  </button>
                  <button
                    onClick={() => setActiveReportTab('mens')}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      activeReportTab === 'mens' ? 'bg-[#2563EB] text-white' : 'text-[#B4A6C7]'
                    }`}
                  >
                    Men
                  </button>
                </div>
              </div>

              {/* Document Mock Extracted Rows */}
              {activeReportTab === 'womens' ? (
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                    <span className="text-[#B4A6C7]">Fasting Blood Glucose</span>
                    <span className="text-white font-bold">94 mg/dL</span>
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
              ) : (
                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                    <span className="text-[#B4A6C7]">Total Testosterone (08:30 AM)</span>
                    <span className="text-[#60A5FA] font-bold">8.2 nmol/L</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                    <span className="text-[#B4A6C7]">Luteinizing Hormone (LH)</span>
                    <span className="text-white font-bold">10.2 mIU/mL</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                    <span className="text-[#B4A6C7]">FSH Level</span>
                    <span className="text-white font-bold">9.8 mIU/mL</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between">
                    <span className="text-[#B4A6C7]">Fasting Lipid / Triglycerides</span>
                    <span className="text-white font-bold">168 mg/dL</span>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#6E2D8B]/30 border border-[#8E3EAF]/40 text-center text-xs text-[#EDE4F7]">
                OCR parses clinical analytes into structured fields for your personal review.
              </div>
            </div>
          </div>

          {/* Right Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
              <FileUp className="w-3.5 h-3.5" />
              <span>Step 2 — Structured Document Ingestion</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
              Bring your existing medical reports with you
            </h2>

            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans">
              Whether you have hormone blood tests, metabolic panels, or structured ultrasound report text, BIOPulse AI accepts standard PDFs, JPGs, and mobile scans without tedious manual typing.
            </p>

            {/* 5-Step Flow Explanation */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                The 5-Step Verification Protocol:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
                {steps.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-start space-y-1">
                    <div className="w-6 h-6 rounded-full bg-white/10 text-[#FDA4AF] font-mono font-bold flex items-center justify-center text-xs">
                      {s.num}
                    </div>
                    <span className="font-bold text-white text-[11px]">{s.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-[#B4A6C7]">
              <div className="flex items-center gap-2 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                <span>OCR Output is Never Automatically Saved as Truth</span>
              </div>
              <p className="leading-relaxed">
                Optical character recognition can misread low-contrast printouts or smudged paper. You always inspect and confirm every extracted value before it is admitted into your health record.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
