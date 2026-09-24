import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  BrainCircuit,
  SlidersHorizontal,
  FileCheck2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const OurApproachSection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Progressive Information',
      desc: 'You do not need an exhaustive stack of clinical tests to begin. Start with your everyday symptoms and lifestyle logs, then enrich the assessment as blood panels or ultrasound imaging become available.',
      icon: Layers,
      accent: '#0891B2',
      bg: 'bg-cyan-50',
    },
    {
      num: '02',
      title: 'Transparent Attribution (XAI)',
      desc: 'Black-box health algorithms breed anxiety. BioPulse AI utilizes SHAP factor influence modeling so you can see exactly which symptoms and lab markers contributed most to your screening pattern.',
      icon: BrainCircuit,
      accent: '#7C3AED',
      bg: 'bg-purple-50',
    },
    {
      num: '03',
      title: 'Cost-Aware Decision Support',
      desc: 'Healthcare costs matter. Our Value-of-Information guidance helps you understand which additional laboratory tests offer high statistical clarity versus clinical burden before spending money out of pocket.',
      icon: SlidersHorizontal,
      accent: '#D97706',
      bg: 'bg-amber-50',
    },
    {
      num: '04',
      title: 'Doctor-Ready Collaboration',
      desc: 'We never pretend to replace physicians. BioPulse AI organizes multi-month symptom chronologies and verified lab extractions into structured briefs to make your clinical visits focused and effective.',
      icon: FileCheck2,
      accent: '#059669',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <section
      id="our-approach"
      className="py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] border-t border-slate-200/80 relative overflow-hidden select-none"
    >
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-cyan-50/60 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              Our Core Principles
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            Our Approach to{' '}
            <span className="text-[#0891B2]">
              Reproductive AI
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            We built BioPulse AI on four fundamental engineering and clinical distinctions that prioritize transparency, practicality, and physician collaboration over hype.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.num}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: pillar.accent }}
                    >
                      Pillar {pillar.num}
                    </span>
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${pillar.bg}`}
                    >
                      <Icon className="w-5 h-5" style={{ color: pillar.accent }} />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-display text-[#162A45]">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {pillar.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Evidence-Aligned Standard</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default OurApproachSection;
