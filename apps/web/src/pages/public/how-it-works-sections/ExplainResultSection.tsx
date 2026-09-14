import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Info, HelpCircle } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface FeatureAttribution {
  name: string;
  value: number;
  impact: string;
  color: string;
  explanation: string;
}

export const ExplainResultSection: React.FC = () => {
  const [activePathway, setActivePathway] = useState<'womens' | 'mens'>('womens');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(0);

  const womensFeatures: FeatureAttribution[] = [
    {
      name: 'Cycle Pattern & Irregularity',
      value: 86,
      impact: 'Strong Influence',
      color: '#FB7185',
      explanation: 'Prolonged cycle length (42 days) and unpredictable intervals had the highest relative weight in this screening model.',
    },
    {
      name: 'LH / FSH Ratio (1.71)',
      value: 68,
      impact: 'Moderate Influence',
      color: '#E879F9',
      explanation: 'Elevated luteinizing hormone relative to follicle-stimulating hormone reflects a common polycystic endocrine signaling pattern.',
    },
    {
      name: 'Androgenic Symptom Score (Ferriman 6)',
      value: 52,
      impact: 'Moderate Influence',
      color: '#C084FC',
      explanation: 'Reported persistent adult acne and mild hirsutism score aligned with clinical androgenic observation markers.',
    },
    {
      name: 'BMI & Metabolic Indicators',
      value: 30,
      impact: 'Mild Influence',
      color: '#34D399',
      explanation: 'Fasting glucose and BMI measurements showed a modest contributing weight within baseline parameters.',
    },
  ];

  const mensFeatures: FeatureAttribution[] = [
    {
      name: 'Morning Total Testosterone (8.2 nmol/L)',
      value: 88,
      impact: 'Strong Influence',
      color: '#60A5FA',
      explanation: 'Morning fasting serum total testosterone falling below standard clinical threshold had the greatest weight in the hypogonadism assessment.',
    },
    {
      name: 'LH & FSH Gonadotropin Levels',
      value: 65,
      impact: 'Moderate Influence',
      color: '#818CF8',
      explanation: 'Pituitary gonadotropin levels assist the model in observing whether the presentation resembles primary or secondary hypogonadal patterns.',
    },
    {
      name: 'Fatigue & Libido Symptom Inventory',
      value: 55,
      impact: 'Moderate Influence',
      color: '#C084FC',
      explanation: 'Validated questionnaire responses reporting persistent low vitality and reduced sexual desire contributed meaningfully to the risk score.',
    },
    {
      name: 'Sleep Architecture & Metabolic Factors',
      value: 34,
      impact: 'Mild Influence',
      color: '#34D399',
      explanation: 'Self-reported sleep fragmentation and waist-to-height ratio provided contextual baseline weighting.',
    },
  ];

  const currentFeatures = activePathway === 'womens' ? womensFeatures : mensFeatures;

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Eye className="w-3.5 h-3.5" />
            <span>Phase 04 — Explainable AI & Feature Attribution</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Don't just see an assessment.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Understand it.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            BIOPulse AI is engineered with mathematical feature-attribution methods so you can clearly see what information influenced your assessment.
          </p>

          {/* Pathway Switcher */}
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md">
            <button
              onClick={() => {
                setActivePathway('womens');
                setHoveredIndex(0);
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePathway === 'womens'
                  ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white shadow-lg shadow-purple-950/40'
                  : 'text-[#B4A6C7] hover:text-white'
              }`}
            >
              Women's Health (PCOS Model)
            </button>
            <button
              onClick={() => {
                setActivePathway('mens');
                setHoveredIndex(0);
              }}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activePathway === 'mens'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg shadow-blue-950/40'
                  : 'text-[#B4A6C7] hover:text-white'
              }`}
            >
              Men's Health (Male Hypogonadism Model)
            </button>
          </div>
        </div>

        {/* Interactive Feature Attribution Panel */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                {activePathway === 'womens' ? 'PCOS Screening Attribution' : 'Hypogonadism Screening Attribution'}
              </span>
              <p className="text-xs text-[#EDE4F7] font-medium mt-0.5">
                These features had the greatest influence on the model's assessment.
              </p>
            </div>
            <span className="text-xs text-[#B4A6C7] shrink-0">Click or hover bar to inspect rationale</span>
          </div>

          {/* Feature Bars */}
          <div className="space-y-6">
            {currentFeatures.map((feat, idx) => (
              <div
                key={`${activePathway}-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => setHoveredIndex(idx)}
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
                    key={`${activePathway}-${idx}-${feat.value}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${feat.value}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.08 }}
                    className="h-full rounded-full shadow-lg"
                    style={{ backgroundColor: feat.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Clinical Rationale Box */}
          {hoveredIndex !== null && currentFeatures[hoveredIndex] && (
            <div className="p-5 rounded-2xl bg-white/10 border border-white/15 space-y-1.5 text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-[#FDA4AF] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Why this factor mattered:
              </span>
              <p className="text-[#EDE4F7] leading-relaxed">
                {currentFeatures[hoveredIndex].explanation}
              </p>
            </div>
          )}

          {/* Clinical Humility Alert */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-xs text-[#B4A6C7]">
            <HelpCircle className="w-4 h-4 text-[#FDA4AF] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Understanding attribution:</strong> Feature influence indicates statistical association within the evaluated model, not biological causality. Having a high influence factor does not mean that factor caused your symptoms; rather, it highlights what contributed most heavily to the algorithmic pattern indication.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
