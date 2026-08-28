import React from 'react';
import { motion } from 'framer-motion';
import { Link2, Sparkles, History, Users } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const FourPillarsSection: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'Connected Ecosystem',
      desc: 'Cycle dynamics, symptoms, laboratory hormone panels, and lifestyle records operate as a unified, synchronized intelligence profile.',
      icon: Link2,
      accent: '#8E3EAF',
    },
    {
      num: '02',
      title: 'Explainable AI (SHAP)',
      desc: 'Users and clinicians can explicitly inspect which biomarkers contributed to the assessment pattern, eliminating opaque black-box outputs.',
      icon: Sparkles,
      accent: '#A21CAF',
    },
    {
      num: '03',
      title: 'Longitudinal Trajectory',
      desc: 'Focuses on multi-month endocrine progression and symptom shifts over time rather than one-time isolated risk scores.',
      icon: History,
      accent: '#E87084',
    },
    {
      num: '04',
      title: 'Human-Centered Clinical Focus',
      desc: 'Engineered strictly to empower informed dialogue between patients and qualified doctors through structured appointment summaries.',
      icon: Users,
      accent: '#047857',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Soft Ambient Radial Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The PMOSense Difference</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Four Core Distinctions
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            The fundamental architectural pillars separating PMOSense from conventional consumer trackers.
          </p>
        </div>

        {/* Four Large Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.num}
                whileHover={{ y: -5 }}
                className="p-8 sm:p-10 rounded-3xl bg-white/[0.05] border border-white/15 backdrop-blur-xl shadow-xl hover:border-white/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                      style={{ backgroundColor: pillar.accent }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-mono font-bold text-[#FDA4AF] tracking-wider">
                      PILLAR {pillar.num}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold font-display text-white">
                    {pillar.title}
                  </h3>

                  <p className="text-sm sm:text-base text-[#B4A6C7] leading-relaxed">
                    {pillar.desc}
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
