import React, { useState } from 'react';
import { History } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const LongitudinalStorySection: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(2);

  const timelineMilestones = [
    {
      month: 'JAN',
      title: 'Baseline Intake Logged',
      desc: 'Recorded 42-day cycle duration with elevated acne markers and baseline sleep habits.',
      tag: 'Intake',
      metric: 'Cycle: 42d',
    },
    {
      month: 'FEB',
      title: 'Laboratory OCR Extraction',
      desc: 'Blood report parsed & user-verified: LH 8.4 mIU/mL, FSH 4.9 mIU/mL (LH/FSH ratio 1.71).',
      tag: 'Verified Lab',
      metric: 'LH/FSH 1.71',
    },
    {
      month: 'MAR',
      title: 'Multimodal ML Assessment',
      desc: 'Generated SHAP attribution showing cycle length & hormonal ratios as primary indicators.',
      tag: 'Assessment',
      metric: 'Evaluation #1',
    },
    {
      month: 'APR',
      title: 'Contextual Lifestyle Routine',
      desc: 'Started low-glycemic dietary adjustments and post-meal movement routines.',
      tag: 'Habits',
      metric: 'Nutrition Routine',
    },
    {
      month: 'MAY',
      title: 'Cycle Interval Tracking',
      desc: 'Observed cycle interval shortened to 37 days with improved self-reported energy.',
      tag: 'Trend Progress',
      metric: 'Cycle: 37d',
    },
    {
      month: 'JUN',
      title: 'Physician Consultation Summary',
      desc: 'Exported 6-month consolidated trend summary to discuss at gynaecologist follow-up.',
      tag: 'Clinician Ready',
      metric: 'Export PDF',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <History className="w-3.5 h-3.5" />
            <span>Phase 08 — Longitudinal Trajectory</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            08 — Your health story changes over time
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            Chronic endocrine patterns are never static. PMOSense connects your observations month by month
            into a dynamic trajectory so you and your doctor can observe genuine trends.
          </p>
        </div>

        {/* Interactive Timeline Box */}
        <div className="max-w-5xl mx-auto p-6 sm:p-10 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl">
          {/* Month Steppers */}
          <div className="grid grid-cols-6 gap-2 border-b border-white/10 pb-6 mb-8">
            {timelineMilestones.map((item, idx) => {
              const isSelected = selectedMonth === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={`text-center py-3 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-brand text-white font-bold shadow-lg shadow-purple-950/30 ring-2 ring-[#FDA4AF]'
                      : 'bg-white/5 text-[#B4A6C7] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-mono block">{item.month}</span>
                  <span className="text-[10px] hidden sm:block opacity-80">{item.metric}</span>
                </button>
              );
            })}
          </div>

          {/* Active Month Detail */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl text-left">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#8E3EAF]/30 text-[#C084FC] text-[10px] font-bold uppercase font-mono border border-[#8E3EAF]/40">
                  {timelineMilestones[selectedMonth].tag}
                </span>
                <span className="text-xs text-[#B4A6C7]">
                  Month {selectedMonth + 1} of 6
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                {timelineMilestones[selectedMonth].title}
              </h3>
              <p className="text-sm text-[#B4A6C7] leading-relaxed">
                {timelineMilestones[selectedMonth].desc}
              </p>
            </div>

            <div className="shrink-0 p-4 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[140px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#FDA4AF] block mb-1">
                Recorded Metric
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {timelineMilestones[selectedMonth].metric}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
