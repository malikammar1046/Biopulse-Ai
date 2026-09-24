import React from 'react';
import { HelpCircle, FileSearch, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const RealLifeSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] border-t border-slate-200/80 overflow-hidden select-none">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <span>Built for Real People</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            You don&apos;t need to know what&apos;s wrong{' '}
            <span className="text-[#0891B2]">
              before you start.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Maybe you&apos;re noticing changes. Maybe you have a report you don&apos;t understand. Or maybe you simply want to establish a baseline. BIOPulse AI helps organize your information and guide you toward the health pathway most relevant to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Noticing Signals */}
          <div className="p-8 rounded-3xl border border-pink-200/90 bg-gradient-to-b from-[#FFF0F5] to-[#FFFFFF] shadow-lg shadow-pink-100/50 flex flex-col justify-between hover:-translate-y-1 transition-all text-left">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 text-[#E11D48] flex items-center justify-center shadow-2xs">
                <HelpCircle className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-display text-[#162A45]">
                Noticing Subtle Shifts?
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                Whether it&apos;s unexpected fatigue, changes in skin or hair, or irregular cycle timing, you don&apos;t need medical jargon. Just describe what you feel in everyday language.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-pink-100 flex flex-wrap gap-2 text-xs font-semibold text-[#E11D48]">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-pink-200/60 shadow-2xs">Zero Medical Jargon</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-pink-200/60 shadow-2xs">Guided Check-In</span>
            </div>
          </div>

          {/* Card 2: Reports */}
          <div className="p-8 rounded-3xl border border-sky-200/90 bg-gradient-to-b from-[#F0F9FF] to-[#FFFFFF] shadow-lg shadow-sky-100/50 flex flex-col justify-between hover:-translate-y-1 transition-all text-left">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 text-[#0284C7] flex items-center justify-center shadow-2xs">
                <FileSearch className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-display text-[#162A45]">
                Confused by Lab Reports?
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                Have a paper report or phone snapshot from a local clinic? Upload it directly. BIOPulse AI extracts reference values and translates complex lab abbreviations into plain context.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-sky-100 flex flex-wrap gap-2 text-xs font-semibold text-[#0284C7]">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200/60 shadow-2xs">OCR Phone Scans</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200/60 shadow-2xs">Plain-English Labs</span>
            </div>
          </div>

          {/* Card 3: Baseline */}
          <div className="p-8 rounded-3xl border border-emerald-200/90 bg-gradient-to-b from-[#F0FDF4] to-[#FFFFFF] shadow-lg shadow-emerald-100/50 flex flex-col justify-between hover:-translate-y-1 transition-all text-left">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-display text-[#162A45]">
                Establishing a Baseline?
              </h3>

              <p className="text-sm text-slate-600 leading-relaxed">
                You don&apos;t have to be sick or suspect a condition to use BIOPulse AI. Building a proactive reproductive baseline helps you catch trends early and be prepared for future conversations.
              </p>
            </div>

            <div className="pt-4 mt-6 border-t border-emerald-100 flex flex-wrap gap-2 text-xs font-semibold text-[#059669]">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200/60 shadow-2xs">Proactive Literacy</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200/60 shadow-2xs">Longitudinal History</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
