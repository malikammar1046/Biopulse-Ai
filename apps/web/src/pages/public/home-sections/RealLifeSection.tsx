import React from 'react';
import { HelpCircle, FileSearch, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export const RealLifeSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#FFF0F2] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="accent" showDot size="md">
            Built for Real People
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            You don&apos;t need to know what&apos;s wrong{' '}
            <span className="gradient-text-brand">
              before you start.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Maybe you&apos;re noticing changes. Maybe you have a report you don&apos;t understand. Or maybe you simply want to establish a baseline. VITASense AI helps organize your information and guide you toward the health pathway most relevant to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Noticing Signals */}
          <Card variant="standard" hoverEffect className="p-8 space-y-4 border-[#E7DFEF] bg-white flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Noticing Subtle Shifts?
              </h3>

              <p className="text-sm text-[#584B68] leading-relaxed">
                Whether it&apos;s unexpected fatigue, changes in skin or hair, or irregular cycle timing, you don&apos;t need medical jargon. Just describe what you feel in everyday language.
              </p>
            </div>

            <div className="pt-4 border-t border-[#F0EAF5] flex flex-wrap gap-2 text-xs font-semibold text-[#6E2D8B]">
              <span className="px-2.5 py-1 rounded-lg bg-[#F2ECF7]">Zero Medical Jargon</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#F2ECF7]">Guided Check-In</span>
            </div>
          </Card>

          {/* Card 2: Reports */}
          <Card variant="standard" hoverEffect className="p-8 space-y-4 border-[#E7DFEF] bg-white flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                <FileSearch className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Confused by Lab Reports?
              </h3>

              <p className="text-sm text-[#584B68] leading-relaxed">
                Have a paper report or phone snapshot from a local clinic? Upload it directly. VITASense AI extracts reference values and translates complex lab abbreviations into plain context.
              </p>
            </div>

            <div className="pt-4 border-t border-[#F0EAF5] flex flex-wrap gap-2 text-xs font-semibold text-[#E87084]">
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF0F2]">OCR Phone Scans</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF0F2]">Plain-English Labs</span>
            </div>
          </Card>

          {/* Card 3: Baseline */}
          <Card variant="standard" hoverEffect className="p-8 space-y-4 border-[#E7DFEF] bg-white flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Establishing a Baseline?
              </h3>

              <p className="text-sm text-[#584B68] leading-relaxed">
                You don&apos;t have to be sick or suspect a condition to use VITASense AI. Building a proactive reproductive baseline helps you catch trends early and be prepared for future conversations.
              </p>
            </div>

            <div className="pt-4 border-t border-[#F0EAF5] flex flex-wrap gap-2 text-xs font-semibold text-[#A21CAF]">
              <span className="px-2.5 py-1 rounded-lg bg-[#FDF2F8]">Proactive Literacy</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FDF2F8]">Longitudinal History</span>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
};
