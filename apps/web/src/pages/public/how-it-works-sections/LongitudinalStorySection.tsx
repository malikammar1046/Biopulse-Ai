import React, { useState } from 'react';
import { History } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface Milestone {
  month: string;
  title: string;
  desc: string;
  tag: string;
  metric: string;
}

export const LongitudinalStorySection: React.FC = () => {
  const [activePathway, setActivePathway] = useState<'womens' | 'mens' | 'baseline'>('womens');
  const [selectedMonth, setSelectedMonth] = useState(2);

  const womensMilestones: Milestone[] = [
    {
      month: 'M1',
      title: 'Baseline Intake Logged',
      desc: 'Recorded 42-day cycle duration with persistent cystic acne and initial symptom inventory.',
      tag: 'Tier 1 Intake',
      metric: 'Cycle: 42d',
    },
    {
      month: 'M2',
      title: 'Routine Metabolic Panel',
      desc: 'Blood report parsed & verified: Fasting Glucose 94 mg/dL and baseline lipid ratio.',
      tag: 'Tier 2 Lab',
      metric: 'Glucose: 94 mg/dL',
    },
    {
      month: 'M3',
      title: 'Targeted Hormonal Panel',
      desc: 'Serum LH & FSH verified (LH/FSH ratio 1.71). Initial dual-tier pattern reassessment generated.',
      tag: 'Tier 3 Hormone',
      metric: 'LH/FSH: 1.71',
    },
    {
      month: 'M4',
      title: 'Contextual Lifestyle Habits',
      desc: 'Adopted low-glycemic dietary sequencing and 20-minute post-meal walking routines.',
      tag: 'Habit Support',
      metric: 'Paced Movement',
    },
    {
      month: 'M5',
      title: 'Cycle Interval Tracking',
      desc: 'Logged next cycle interval at 36 days with reduced self-reported energy fluctuations.',
      tag: 'Trend Progress',
      metric: 'Cycle: 36d',
    },
    {
      month: 'M6',
      title: 'Physician Summary Export',
      desc: 'Generated a longitudinal clinical brief to support structured discussion with gynaecologist.',
      tag: 'Clinician Ready',
      metric: 'Export PDF',
    },
  ];

  const mensMilestones: Milestone[] = [
    {
      month: 'M1',
      title: 'Symptom & Vitality Intake',
      desc: 'Logged persistent afternoon fatigue, reduced sexual drive, and poor sleep quality scores.',
      tag: 'Tier 1 Intake',
      metric: 'Vitality Score: 4/10',
    },
    {
      month: 'M2',
      title: 'Metabolic Baseline Checked',
      desc: 'Uploaded and verified routine fasting lipids, HbA1c, and visceral measurements.',
      tag: 'Tier 2 Lab',
      metric: 'HbA1c: 5.6%',
    },
    {
      month: 'M3',
      title: 'Morning Testosterone Draw',
      desc: 'Verified 08:30 AM serum total testosterone at 8.2 nmol/L with normal pituitary LH/FSH.',
      tag: 'Tier 3 Hormone',
      metric: 'Total T: 8.2 nmol/L',
    },
    {
      month: 'M4',
      title: 'Sleep & Resistance Routine',
      desc: 'Instituted 7.5-hour sleep consistency protocol and progressive bodyweight resistance training.',
      tag: 'Habit Support',
      metric: 'Sleep: 7.5h avg',
    },
    {
      month: 'M5',
      title: 'Confirmatory Morning Draw',
      desc: 'Verified second morning blood draw (8.6 nmol/L). Reassessment reflects stabilized pattern.',
      tag: 'Tier 3 Reassessment',
      metric: 'Total T: 8.6 nmol/L',
    },
    {
      month: 'M6',
      title: 'Specialist Consultation Brief',
      desc: 'Exported trajectory summary for informed evaluation with urologist or endocrinologist.',
      tag: 'Clinician Ready',
      metric: 'Export PDF',
    },
  ];

  const baselineMilestones: Milestone[] = [
    {
      month: 'M1',
      title: 'Baseline Health Profile',
      desc: 'Recorded resting vitals, body measurements, sleep habits, and general wellness goals.',
      tag: 'Tier 1 Baseline',
      metric: 'Vitals Logged',
    },
    {
      month: 'M2',
      title: 'Routine Annual Labs Ingested',
      desc: 'Added routine complete blood count and standard lipid panel for secure archival.',
      tag: 'Tier 2 Routine',
      metric: 'CBC & Lipids',
    },
    {
      month: 'M3',
      title: 'Longitudinal Wellness Tracking',
      desc: 'Logged monthly physical activity, energy patterns, and lifestyle consistency score.',
      tag: 'Monthly Log',
      metric: 'Activity: 160m/wk',
    },
    {
      month: 'M4',
      title: 'Nutritional Consistency',
      desc: 'Sustained whole-food Mediterranean-adapted dietary habits with steady energy levels.',
      tag: 'Lifestyle Track',
      metric: 'Diet Balance',
    },
    {
      month: 'M5',
      title: 'Multi-Month Stability Check',
      desc: 'Reviewed 5-month longitudinal trend confirming stable baselines without emergent anomalies.',
      tag: 'Baseline Check',
      metric: 'Markers Stable',
    },
    {
      month: 'M6',
      title: 'Annual Review Summary',
      desc: 'Consolidated full 6-month wellness trajectory ready for annual primary care checkup.',
      tag: 'Checkup Ready',
      metric: 'Annual Summary',
    },
  ];

  const currentMilestones =
    activePathway === 'womens'
      ? womensMilestones
      : activePathway === 'mens'
      ? mensMilestones
      : baselineMilestones;

  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <History className="w-3.5 h-3.5" />
            <span>Phase 07 — Longitudinal Trajectory</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Your health story changes over time
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            Reproductive health is never a static snapshot. BIOPulse AI organizes your symptoms, lab reports, and habits into a continuous longitudinal trajectory: <span className="text-white font-semibold">Assess → Track → Add Information → Reassess</span>.
          </p>

          {/* Pathway Switcher */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md">
            <button
              onClick={() => {
                setActivePathway('womens');
                setSelectedMonth(2);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePathway === 'womens'
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white shadow-lg'
                  : 'text-[#B4A6C7] hover:text-white'
              }`}
            >
              Women's Trajectory (PCOS)
            </button>
            <button
              onClick={() => {
                setActivePathway('mens');
                setSelectedMonth(2);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePathway === 'mens'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg'
                  : 'text-[#B4A6C7] hover:text-white'
              }`}
            >
              Men's Trajectory (Hypogonadism)
            </button>
            <button
              onClick={() => {
                setActivePathway('baseline');
                setSelectedMonth(2);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePathway === 'baseline'
                  ? 'bg-[#047857] text-white shadow-lg'
                  : 'text-[#B4A6C7] hover:text-white'
              }`}
            >
              Baseline Monitoring
            </button>
          </div>
        </div>

        {/* Interactive Timeline Box */}
        <div className="max-w-5xl mx-auto p-4 sm:p-10 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl">
          {/* Month Steppers */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 border-b border-white/10 pb-6 mb-8">
            {currentMilestones.map((item, idx) => {
              const isSelected = selectedMonth === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedMonth(idx)}
                  className={`text-center py-2.5 sm:py-3 px-1 rounded-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white font-bold shadow-lg ring-2 ring-[#FDA4AF]'
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
          <div className="p-4 sm:p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl text-left">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#8E3EAF]/30 text-[#C084FC] text-[10px] font-bold uppercase font-mono border border-[#8E3EAF]/40">
                  {currentMilestones[selectedMonth].tag}
                </span>
                <span className="text-xs text-[#B4A6C7]">
                  Month {selectedMonth + 1} of 6
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                {currentMilestones[selectedMonth].title}
              </h3>
              <p className="text-sm text-[#B4A6C7] leading-relaxed">
                {currentMilestones[selectedMonth].desc}
              </p>
            </div>

            <div className="shrink-0 p-4 rounded-2xl bg-white/10 border border-white/15 text-center min-w-[150px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-[#FDA4AF] block mb-1">
                Recorded Metric
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-white">
                {currentMilestones[selectedMonth].metric}
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
