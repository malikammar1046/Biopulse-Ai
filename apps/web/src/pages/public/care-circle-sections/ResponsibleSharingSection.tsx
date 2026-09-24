import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Sliders, Eye, FileCheck, Sparkles } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const ResponsibleSharingSection: React.FC = () => {
  const pillars = [
    {
      title: 'Consent First',
      eyebrow: 'PILLAR 01',
      desc: 'You decide who gets access. Connections must be explicitly initiated and accepted by you before any bytes are transmitted.',
      icon: <FileCheck className="w-6 h-6 text-[#FB7185]" />,
      accent: 'from-[#FB7185] to-[#E87084]',
      glow: 'shadow-[0_0_30px_rgba(251,113,133,0.25)]',
    },
    {
      title: 'Active Control',
      eyebrow: 'PILLAR 02',
      desc: 'Permissions can be modified or revoked with a single tap. If your relationship with a provider or partner changes, their access terminates immediately.',
      icon: <Sliders className="w-6 h-6 text-[#E879F9]" />,
      accent: 'from-[#E879F9] to-[#A21CAF]',
      glow: 'shadow-[0_0_30px_rgba(232,121,249,0.25)]',
    },
    {
      title: 'Radical Transparency',
      eyebrow: 'PILLAR 03',
      desc: 'You can always inspect an exact audit log of what was included in your shared summaries, when it was sent, and who viewed it.',
      icon: <Eye className="w-6 h-6 text-[#38BDF8]" />,
      accent: 'from-[#38BDF8] to-[#0284C7]',
      glow: 'shadow-[0_0_30px_rgba(56,189,248,0.25)]',
    },
    {
      title: 'Guarded Boundaries',
      eyebrow: 'PILLAR 04',
      desc: 'Private AI chat sessions, intimate personal reflections, and unapproved biomarker notes remain strictly quarantined inside your encrypted vault.',
      icon: <Lock className="w-6 h-6 text-[#C084FC]" />,
      accent: 'from-[#C084FC] to-[#8E3EAF]',
      glow: 'shadow-[0_0_30px_rgba(192,132,252,0.25)]',
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#180A25] text-white relative overflow-hidden border-t border-white/10">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />

      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <ShieldCheck className="w-4 h-4 text-[#FB7185]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
              Governance & Safety
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            Four Pillars of{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Responsible Sharing.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
          >
            Healthcare data demands higher ethical boundaries than standard social or productivity apps. Care Circle is architected on four inviolable principles.
          </motion.p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              className={`p-6 sm:p-7 rounded-3xl bg-[#10071A]/90 border border-white/12 flex flex-col justify-between backdrop-blur-xl shadow-xl hover:border-white/25 transition-all text-left ${pillar.glow}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#B4A6C7]">
                    {pillar.eyebrow}
                  </span>
                  <div className={`p-2.5 rounded-2xl bg-gradient-to-br ${pillar.accent} text-white shadow-md`}>
                    {pillar.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed font-sans mt-2">
                    {pillar.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-1.5 text-[11px] font-mono text-[#E879F9]">
                <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
                <span>Zero Commercial Sale</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
