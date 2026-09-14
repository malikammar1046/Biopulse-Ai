import React from 'react';
import { Sparkles, Dna, Database, Compass, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const AnatomyReturnSection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'BIOLOGY',
      subtitle: 'Endocrine & Metabolic Reality',
      desc: 'Grounding your assessment in genuine physiological mechanisms — from ovarian follicle signalling and hypothalamic feedback to Leydig cell testosterone rhythms.',
      icon: Dna,
      accent: 'from-[#C084FC] to-[#8E3EAF]',
      border: 'border-[#8E3EAF]/30',
      badgeColor: 'text-[#E879F9] bg-[#8E3EAF]/20',
    },
    {
      num: '02',
      title: 'DATA',
      subtitle: 'Progressive Tiered Structure',
      desc: 'Transforming scattered paper slips, symptom logs, and lab panels into an organized, human-verified health record that tracks changes over time.',
      icon: Database,
      accent: 'from-[#8E3EAF] to-[#2563EB]',
      border: 'border-[#2563EB]/30',
      badgeColor: 'text-[#60A5FA] bg-[#2563EB]/20',
    },
    {
      num: '03',
      title: 'CLARITY',
      subtitle: 'Actionable & Clinician-Ready',
      desc: 'Transparent AI explainability, gap prioritization, and longitudinal summaries that empower you to have collaborative, confident consultations with your doctor.',
      icon: Compass,
      accent: 'from-[#2563EB] to-[#047857]',
      border: 'border-[#047857]/30',
      badgeColor: 'text-[#34D399] bg-[#047857]/20',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FB7185]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Full Ecosystem Convergence</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
            Biology + Data +{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Understanding.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            By connecting biological physiology with structured health records, explainable artificial intelligence, and longitudinal tracking, BIOPulse AI turns fragmented reproductive health experiences into continuous clarity.
          </p>
        </div>

        {/* 3 Pillars Convergence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className={`p-8 rounded-3xl bg-white/[0.04] border ${p.border} backdrop-blur-xl shadow-xl space-y-5 flex flex-col justify-between hover:border-white/40 transition-all`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${p.badgeColor}`}>
                      {p.num}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-display text-white">{p.title}</h3>
                    <span className="text-xs text-[#FDA4AF] font-medium block mt-0.5">{p.subtitle}</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed font-sans">
                    {p.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-[#EDE4F7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  <span>Platform Standard</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Unified Ecosystem Strip */}
        <div className="max-w-4xl mx-auto p-6 rounded-3xl bg-white/[0.03] border border-white/10 text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-[#FDA4AF] block">
            The BIOPulse AI Promise
          </span>
          <p className="text-sm text-[#EDE4F7] font-medium">
            One unified platform. Two specialized reproductive-health pathways. One baseline health monitoring journey. Shared privacy and explainable AI standards.
          </p>
        </div>
      </Container>
    </section>
  );
};
