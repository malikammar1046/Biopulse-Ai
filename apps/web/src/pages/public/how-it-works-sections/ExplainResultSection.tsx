import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const ExplainResultSection: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);

  const features = [
    {
      name: 'Cycle Pattern & Irregularity',
      value: 88,
      impact: 'Strong Positive',
      color: '#FB7185',
      explanation: 'Prolonged cycle length (42 days) contributed most heavily to the algorithmic pattern indication.',
    },
    {
      name: 'LH / FSH Ratio (1.71)',
      value: 68,
      impact: 'Moderate Positive',
      color: '#E879F9',
      explanation: 'Elevated LH relative to FSH reflects typical polycystic endocrine signaling threshold.',
    },
    {
      name: 'Androgenic Symptom Score (Ferriman 6)',
      value: 54,
      impact: 'Moderate Positive',
      color: '#C084FC',
      explanation: 'Self-reported acne and mild hirsutism align with clinical hyperandrogenism markers.',
    },
    {
      name: 'BMI & Metabolic Markers',
      value: 32,
      impact: 'Mild Influence',
      color: '#34D399',
      explanation: 'Baseline BMI and glucose parameters showed mild contribution within typical variance.',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Eye className="w-3.5 h-3.5" />
            <span>Phase 06 — Explainable AI (SHAP)</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            06 — Don't just show a result.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Explain it.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            PMOSense implements SHAP (Shapley Additive exPlanations) game-theoretic mathematics
            to quantify exactly how each biomarker influenced the assessment score.
          </p>
        </div>

        {/* Interactive SHAP Breakdown Panel */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FDA4AF]">
              Feature Attribution Breakdown
            </span>
            <span className="text-xs text-[#B4A6C7]">Hover to inspect clinical rationale</span>
          </div>

          {/* Feature Bars */}
          <div className="space-y-6">
            {features.map((feat, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                className="space-y-2 cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-white group-hover:text-[#E879F9] transition-colors">
                    {feat.name}
                  </span>
                  <span className="font-mono text-xs text-[#B4A6C7]">
                    {feat.impact} ({feat.value}%)
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${feat.value}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="h-full rounded-full shadow-lg"
                    style={{ backgroundColor: feat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Rationale Box */}
          {hoveredIndex !== null && (
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-1 text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                Why this factor mattered:
              </span>
              <p className="text-[#EDE4F7] leading-relaxed">
                {features[hoveredIndex].explanation}
              </p>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
};
