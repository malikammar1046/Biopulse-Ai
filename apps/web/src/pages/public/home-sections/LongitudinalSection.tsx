import React, { useState } from 'react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const LongitudinalSection: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(2);

  const timelineMilestones = [
    {
      month: 'JAN',
      title: 'Your Starting Baseline',
      desc: 'Initial health record set up. Baseline cycle length recorded at 44 days with notes on daily acne.',
      tag: 'Starting Log',
      metric: 'Cycle: 44d',
    },
    {
      month: 'FEB',
      title: 'Lab Report Scanned',
      desc: 'Blood test report scanned and confirmed: LH and FSH hormone numbers saved safely.',
      tag: 'Verified Lab',
      metric: 'Hormones Logged',
    },
    {
      month: 'MAR',
      title: 'First AI Insights',
      desc: 'First AI health pattern insight generated, explaining in plain English which factors mattered most.',
      tag: 'AI Insight',
      metric: 'Pattern Check #1',
    },
    {
      month: 'APR',
      title: 'Gentle Lifestyle Habits',
      desc: 'Enjoying hormone-friendly Pakistani meals and adding realistic 20-minute daily walks.',
      tag: 'Daily Habits',
      metric: 'Balanced Meals',
    },
    {
      month: 'MAY',
      title: 'Cycle Rhythm Progress',
      desc: 'Observed cycle shortened to 36 days. Noticeable improvement in daily energy and pelvic comfort.',
      tag: 'Your Progress',
      metric: 'Cycle: 36d',
    },
    {
      month: 'JUN',
      title: 'Doctor Visit Summary',
      desc: 'Generated a private 1-page summary to share with your gynecologist during your check-up.',
      tag: 'Doctor Summary',
      metric: 'Ready for Visit',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#EDE4F7] text-[#1C1326] overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#D8B4FE]/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Tracking Over Time
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Health is a journey,{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              not a snapshot.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Observe how biomarker patterns and symptom clusters evolve over months as you record, understand,
            and discuss your health with clinical providers.
          </p>

          {/* Philosophy loop badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-mono font-bold text-[#6E2D8B]">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7DFEF]">Record</span>
            <span className="text-[#8E3EAF]">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7DFEF]">Observe</span>
            <span className="text-[#8E3EAF]">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7DFEF]">Understand</span>
            <span className="text-[#8E3EAF]">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7DFEF]">Monitor</span>
            <span className="text-[#8E3EAF]">→</span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E7DFEF]">Reassess</span>
          </div>
        </div>

        {/* Interactive Timeline Bar */}
        <div className="relative max-w-5xl mx-auto p-6 sm:p-10 rounded-3xl bg-white border border-[#E7DFEF] shadow-xl">
          {/* Month Stepper Header */}
          <div className="grid grid-cols-6 gap-2 border-b border-[#E7DFEF] pb-6 mb-8">
            {timelineMilestones.map((item, idx) => {
              const isSelected = selectedMonth === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={`text-center py-3 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#6E2D8B] text-white font-bold shadow-lg shadow-purple-950/20 ring-2 ring-[#8E3EAF]'
                      : 'bg-[#F8F5FA] text-[#584B68] hover:bg-[#EDE4F7] hover:text-[#1C1326]'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-mono block">{item.month}</span>
                  <span className="text-[10px] hidden sm:block opacity-80">{item.metric}</span>
                </button>
              );
            })}
          </div>

          {/* Milestone Detail Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#EDE4F7] text-[#6E2D8B] text-[10px] font-bold uppercase font-mono border border-[#D8B4FE]/50">
                  {timelineMilestones[selectedMonth].tag}
                </span>
                <span className="text-xs text-[#8D7E9E]">
                  Month {selectedMonth + 1} of 6
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#1C1326]">
                {timelineMilestones[selectedMonth].title}
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                {timelineMilestones[selectedMonth].desc}
              </p>
            </div>

            <div className="shrink-0 p-4 rounded-2xl bg-white border border-[#E7DFEF] text-center min-w-[140px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#8E3EAF] block mb-1">
                Recorded Metric
              </span>
              <span className="text-lg font-bold font-mono text-[#1C1326]">
                {timelineMilestones[selectedMonth].metric}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
