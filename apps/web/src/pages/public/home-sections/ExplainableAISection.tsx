import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Info } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const ExplainableAISection: React.FC = () => {
  const [selectedFactor, setSelectedFactor] = useState(0);

  const shapFactors = [
    {
      name: 'LH / FSH Ratio (2.35)',
      impact: '+0.36',
      percentage: '84%',
      positive: true,
      color: '#8E3EAF',
      explanation: 'An elevated LH/FSH ratio is a classic biochemical endocrine marker associated with altered follicular development.',
    },
    {
      name: 'Ovarian Follicle Count (>12 / ovary)',
      impact: '+0.28',
      percentage: '68%',
      positive: true,
      color: '#A21CAF',
      explanation: 'Ultrasound follicle count aligns with Rotterdam morphology criteria for polycystic ovarian patterns.',
    },
    {
      name: 'Menstrual Cycle Length (42 days)',
      impact: '+0.22',
      percentage: '54%',
      positive: true,
      color: '#E87084',
      explanation: 'Oligomenorrhea or prolonged cycle intervals indicate irregular follicular maturation cycles.',
    },
    {
      name: 'Fasting Blood Glucose (Normal)',
      impact: '-0.15',
      percentage: '35%',
      positive: false,
      color: '#047857',
      explanation: 'Normal glycemic parameters provide a mitigating metabolic factor in the multi-parametric score.',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden">
      {/* High-Contrast Orchid / Berry Lighting */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Context & Editorial Philosophy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#E879F9]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Algorithmic Transparency</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
              AI shouldn't be a{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                black box.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal">
              PMOSense is designed to help users understand the physiological factors behind an AI-assisted
              assessment rather than simply presenting an opaque risk percentage.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#EDE4F7]">
                  <strong className="text-white block mb-0.5">SHAP Feature Attribution:</strong>
                  Mathematical quantification of each biomarker's contribution to the pattern score.
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#EDE4F7]">
                  <strong className="text-white block mb-0.5">Clinician-Ready Clarity:</strong>
                  Equips users and doctors with specific indicators to prioritize in clinical discussions.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive SHAP Feature Contribution Card */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#C084FC] block">
                    Interactive SHAP Attribution
                  </span>
                  <h3 className="text-lg font-bold font-display text-white">
                    Sample Feature Contribution Breakdown
                  </h3>
                </div>
                <Badge variant="primary" size="sm">
                  Transparency
                </Badge>
              </div>

              {/* Glowing Impact Bars */}
              <div className="space-y-4">
                {shapFactors.map((factor, idx) => {
                  const isSelected = selectedFactor === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedFactor(idx)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/15 border-white/30 shadow-lg ring-1 ring-[#FB7185]'
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs mb-2 font-medium">
                        <span className="text-white font-semibold">{factor.name}</span>
                        <span
                          className={`font-mono font-bold ${
                            factor.positive ? 'text-[#FB7185]' : 'text-[#34D399]'
                          }`}
                        >
                          {factor.impact}
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="h-2.5 rounded-full bg-black/40 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: factor.percentage }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: factor.color }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* "Why This Matters" Context Box */}
              <div className="p-4 rounded-2xl bg-[#6E2D8B]/30 border border-[#8E3EAF]/40 text-xs text-[#EDE4F7] space-y-1">
                <div className="flex items-center gap-1.5 text-[#FB7185] font-bold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Why This Matters:</span>
                </div>
                <p className="leading-relaxed">
                  {shapFactors[selectedFactor].explanation}
                </p>
              </div>

              <p className="text-[10px] text-[#B4A6C7] italic leading-tight text-center">
                *Illustrative explanation. PMOSense outputs health-information pattern indices, not formal medical diagnoses.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
