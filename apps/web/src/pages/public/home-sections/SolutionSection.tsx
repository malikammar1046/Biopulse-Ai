import React from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Activity,
  BrainCircuit,
  Search,
  Sliders,
  History,
  Sparkles
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const SolutionSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Understand',
      subtitle: 'Plain-language health literacy',
      desc: 'Learn what your symptoms, physical patterns, and health information may mean without confusing medical jargon.',
      icon: HelpCircle,
      accent: '#FB7185',
    },
    {
      num: '02',
      title: 'Assess',
      subtitle: 'Pathway-specific screening',
      desc: 'Complete an appropriate, non-diagnostic risk screening based on your symptoms, body metrics, and existing lab reports.',
      icon: Activity,
      accent: '#C084FC',
    },
    {
      num: '03',
      title: 'Explain',
      subtitle: 'Transparent feature attribution',
      desc: 'See exactly which pieces of available information influenced the assessment through clear visual factor breakdowns.',
      icon: BrainCircuit,
      accent: '#E879F9',
    },
    {
      num: '04',
      title: 'Identify Gaps',
      subtitle: 'Information completeness check',
      desc: 'Understand what missing information (e.g. hormone panels, ultrasound scans) could make the screening assessment more informative.',
      icon: Search,
      accent: '#38BDF8',
    },
    {
      num: '05',
      title: 'Prioritize',
      subtitle: 'Estimated value vs. cost',
      desc: 'Understand which additional tests or information may offer the greatest estimated improvement in screening performance relative to estimated cost.',
      icon: Sliders,
      accent: '#FBBF24',
    },
    {
      num: '06',
      title: 'Monitor',
      subtitle: 'Longitudinal health timeline',
      desc: 'Track symptoms, biomarkers, and lifestyle habits across months, generating objective summaries for your next doctor check-up.',
      icon: History,
      accent: '#34D399',
    },
  ];

  return (
    <section
      id="unified-solution"
      className="py-24 sm:py-32 bg-gradient-to-b from-[#180A25] via-[#220D35] to-[#12071F] text-white overflow-hidden border-t border-white/10 select-none"
      aria-labelledby="solution-title"
    >
      {/* Ambient Orchid Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#8E3EAF]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#E879F9] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Unified Platform Journey</span>
          </div>

          <h2
            id="solution-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight"
          >
            What VITASense AI{' '}
            <span className="bg-gradient-to-r from-[#E879F9] via-[#FB7185] to-[#FDA4AF] bg-clip-text text-transparent">
              Actually Does
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            From your very first symptom entry to multi-month clinician consultations, VITASense AI
            guides you through a structured, explainable six-step flow.
          </p>
        </div>

        {/* 6-Step Unified Journey Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="p-7 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/10 hover:border-white/25 transition-all flex flex-col justify-between shadow-xl backdrop-blur-xl text-left space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-full border"
                      style={{
                        backgroundColor: `${step.accent}18`,
                        color: step.accent,
                        borderColor: `${step.accent}35`,
                      }}
                    >
                      Step {step.num}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border group-hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: `${step.accent}20`,
                        color: step.accent,
                        borderColor: `${step.accent}40`,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold font-display text-white">{step.title}</h3>
                  <span className="text-[11px] font-mono text-[#A797BD] block -mt-1">
                    {step.subtitle}
                  </span>

                  <p className="text-xs sm:text-sm text-[#CDBDD8] leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
