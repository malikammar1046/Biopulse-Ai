import React from 'react';
import {
  Calendar,
  Activity,
  FileText,
  HeartPulse,
  BrainCircuit,
  Sparkles,
  History,
  ArrowRight,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const IntelligenceLayerSection: React.FC = () => {
  const layerModules = [
    {
      title: 'Cycle Dynamics',
      desc: 'Cycle chronology, length variation, and follicular vs. luteal tracking.',
      icon: Calendar,
      accent: '#8E3EAF',
    },
    {
      title: 'Symptom Logger',
      desc: 'Standardized 5-point grading for acne, hirsutism, mood, and sleep.',
      icon: Activity,
      accent: '#E87084',
    },
    {
      title: 'Medical Reports & OCR',
      desc: 'Hormone panel extraction with mandatory human verification.',
      icon: FileText,
      accent: '#6E2D8B',
    },
    {
      title: 'Lifestyle Context',
      desc: 'Pragmatic nutrition, sleep pacing, and physical activity support.',
      icon: HeartPulse,
      accent: '#047857',
    },
    {
      title: 'ML Pattern Assessment',
      desc: 'Validated academic ensemble models evaluating multivariate parameters.',
      icon: BrainCircuit,
      accent: '#4338CA',
    },
    {
      title: 'SHAP Explainability',
      desc: 'Exact attribution quantifying how each biomarker influenced the pattern score.',
      icon: Sparkles,
      accent: '#A21CAF',
    },
    {
      title: 'Longitudinal Timeline',
      desc: 'Continuous trend monitoring across months for collaborative doctor visits.',
      icon: History,
      accent: '#FB7185',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#241038] via-[#35144F] to-[#4A154B] text-white overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#8E3EAF]/25 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#E879F9]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Vision</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            We are building a{' '}
            <span className="bg-gradient-to-r from-[#E879F9] via-[#FB7185] to-[#FDA4AF] bg-clip-text text-transparent">
              health intelligence layer.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            Transforming isolated health notes into an interconnected, explainable, and longitudinal record
            that bridges personal experience with clinical diagnostics.
          </p>
        </div>

        {/* Visual Transformation Pathway Animation Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl mb-12">
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#FDA4AF] block mb-4 text-center">
            Information Transformation Pipeline
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white">Scattered Data</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="px-3 py-1.5 rounded-xl bg-[#6E2D8B] text-white">PMOSense Core</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-white">Structured Profile</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="px-3 py-1.5 rounded-xl bg-[#8E3EAF] text-white">AI Assessment</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="px-3 py-1.5 rounded-xl bg-[#A21CAF] text-white">SHAP Explanation</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="px-3 py-1.5 rounded-xl bg-[#047857] text-white">Longitudinal View</span>
          </div>
        </div>

        {/* Seven Core Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layerModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg space-y-3 hover:bg-white/15 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: mod.accent }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold font-display text-white">{mod.title}</h3>
                <p className="text-xs sm:text-sm text-[#EDE4F7] leading-relaxed">{mod.desc}</p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
