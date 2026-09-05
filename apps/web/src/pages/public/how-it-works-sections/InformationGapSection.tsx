import React, { useState } from 'react';
import { Target, Layers, TrendingUp, AlertTriangle } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface PrioritizationItem {
  name: string;
  category: string;
  estimatedGain: string;
  relativeBurden: string;
  gainValue: number;
  reason: string;
}

export const InformationGapSection: React.FC = () => {
  const [activePathway, setActivePathway] = useState<'womens' | 'mens'>('womens');

  const womensGaps: PrioritizationItem[] = [
    {
      name: 'Serum LH & FSH Ratio (Day 3)',
      category: 'Tier 3 Hormone Profile',
      estimatedGain: 'High Estimated Improvement',
      relativeBurden: 'Standard Lab Blood Draw',
      gainValue: 82,
      reason: 'Helps clarify whether cycle irregularity is driven by hypothalamic or polycystic ovarian feedback signalling.',
    },
    {
      name: 'Fasting Glucose & Fasting Insulin',
      category: 'Tier 2 Routine Metabolic',
      estimatedGain: 'Moderate Estimated Improvement',
      relativeBurden: 'Routine Morning Blood Draw',
      gainValue: 64,
      reason: 'Assists in identifying metabolic and insulin resistance patterns associated with hyperandrogenism.',
    },
    {
      name: 'Total & Free Testosterone / DHEAS',
      category: 'Tier 3 Androgen Profile',
      estimatedGain: 'Moderate Estimated Improvement',
      relativeBurden: 'Targeted Lab Test',
      gainValue: 58,
      reason: 'Quantifies circulating biochemical androgens alongside self-reported hirsutism or acne.',
    },
    {
      name: 'Ultrasound Report Metrics',
      category: 'Tier 4 Structured Imaging Report',
      estimatedGain: 'Specific Contextual Improvement',
      relativeBurden: 'Clinical Ultrasound Appointment',
      gainValue: 46,
      reason: 'Structured follicle count from an existing radiologist report (VITASense reads text reports, not raw images).',
    },
  ];

  const mensGaps: PrioritizationItem[] = [
    {
      name: 'Repeat Morning Total Testosterone (7–10 AM)',
      category: 'Tier 3 Confirmatory Window',
      estimatedGain: 'Highest Estimated Improvement',
      relativeBurden: 'Timed Morning Blood Draw',
      gainValue: 88,
      reason: 'Endocrine Society guidelines advise two morning serum draws because testosterone undergoes strong diurnal circadian peaks.',
    },
    {
      name: 'Serum LH & FSH Levels',
      category: 'Tier 3 Pituitary Gonadotropins',
      estimatedGain: 'High Estimated Improvement',
      relativeBurden: 'Standard Lab Blood Draw',
      gainValue: 76,
      reason: 'Essential to distinguish primary testicular etiology (elevated LH/FSH) from secondary pituitary/hypothalamic suppression (low/normal LH/FSH).',
    },
    {
      name: 'Serum Prolactin & Free Testosterone / SHBG',
      category: 'Tier 3 Pathway Markers',
      estimatedGain: 'Moderate Estimated Improvement',
      relativeBurden: 'Targeted Lab Panel',
      gainValue: 62,
      reason: 'Evaluates hyperprolactinemia or altered binding protein levels in cases of borderline total testosterone.',
    },
    {
      name: 'Fasting Lipid & HbA1c Panel',
      category: 'Tier 2 Metabolic Baseline',
      estimatedGain: 'Contextual Improvement',
      relativeBurden: 'Routine Lab Panel',
      gainValue: 48,
      reason: 'Identifies metabolic co-factors such as metabolic syndrome, insulin resistance, or visceral adiposity.',
    },
  ];

  const currentGaps = activePathway === 'womens' ? womensGaps : mensGaps;

  return (
    <section className="relative py-24 sm:py-32 bg-[#140822] text-white overflow-hidden border-t border-white/10">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[600px] bg-[#8E3EAF]/15 rounded-full blur-[180px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Target className="w-3.5 h-3.5" />
            <span>Phase 05 — Gap Analysis & Information Prioritization</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            See what is missing.{' '}
            <span className="bg-gradient-to-r from-[#FDA4AF] via-[#FB7185] to-[#C084FC] bg-clip-text text-transparent">
              Prioritize what matters.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            Not all additional information has the same clinical value. VITASense compares your current information with higher tiers to identify what could most effectively clarify your assessment without unnecessary testing.
          </p>

          {/* Pathway Selector */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md">
            <button
              onClick={() => setActivePathway('womens')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePathway === 'womens'
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white shadow-lg shadow-purple-950/40'
                  : 'text-[#B4A6C7] hover:text-white'
              }`}
            >
              Women's Pathway (PCOS Gaps)
            </button>
            <button
              onClick={() => setActivePathway('mens')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePathway === 'mens'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-950/40'
                  : 'text-[#B4A6C7] hover:text-white'
              }`}
            >
              Men's Pathway (Hypogonadism Gaps)
            </button>
          </div>
        </div>

        {/* Narrative Concept Flow */}
        <div className="max-w-4xl mx-auto mb-12 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#6E2D8B]/30 text-[#C084FC] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold font-display text-white">Progressive Gap Detection</h4>
                <p className="text-xs text-[#B4A6C7]">
                  Current Information → Screening Pattern → Missing Information → Prioritized Next Step
                </p>
              </div>
            </div>
            <span className="text-xs text-[#FDA4AF] bg-white/5 border border-white/10 px-3 py-1 rounded-full font-mono">
              Missing ≠ Mandated Testing
            </span>
          </div>
        </div>

        {/* Prioritization Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-10">
          {currentGaps.map((item, idx) => (
            <div
              key={`${activePathway}-${idx}`}
              className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl space-y-4 hover:border-white/30 transition-all shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#C084FC] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-[#34D399] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {item.gainValue}% gain score
                  </span>
                </div>

                <h3 className="text-lg font-bold font-display text-white">{item.name}</h3>

                <p className="text-xs text-[#B4A6C7] leading-relaxed">{item.reason}</p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#FDA4AF] font-medium">{item.estimatedGain}</span>
                <span className="text-[#8D7E9E] font-mono">{item.relativeBurden}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Approved Core Research Statement Callout */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#6E2D8B]/30 via-[#241038]/60 to-[#180A25] border border-[#FDA4AF]/30 shadow-2xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#FDA4AF]/20 text-[#FDA4AF] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold font-display uppercase tracking-wider text-[#FDA4AF]">
                Value-Driven Information Prioritization
              </h4>
              <p className="text-xs sm:text-sm text-[#EDE4F7] leading-relaxed font-sans italic">
                "Based on the evaluated model, this additional information could provide the greatest estimated improvement in screening performance relative to its estimated cost. This information is intended to support discussion with a healthcare professional and does not constitute a medical recommendation."
              </p>
              <p className="text-[11px] text-[#B4A6C7] pt-1">
                VITASense never prescribes lab investigations or medical procedures. You and your clinician decide which steps are clinically and financially appropriate for your personal circumstances.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
