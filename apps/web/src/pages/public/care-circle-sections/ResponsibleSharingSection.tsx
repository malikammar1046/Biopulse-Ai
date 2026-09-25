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
      icon: <FileCheck className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Active Control',
      eyebrow: 'PILLAR 02',
      desc: 'Permissions can be modified or revoked with a single tap. If your relationship with a provider or partner changes, their access terminates immediately.',
      icon: <Sliders className="w-5 h-5 text-[#0891B2]" />,
      iconBg: 'bg-cyan-50 border-cyan-100',
    },
    {
      title: 'Radical Transparency',
      eyebrow: 'PILLAR 03',
      desc: 'You can always inspect an exact audit log of what was included in your shared summaries, when it was sent, and who viewed it.',
      icon: <Eye className="w-5 h-5 text-sky-600" />,
      iconBg: 'bg-sky-50 border-sky-100',
    },
    {
      title: 'Guarded Boundaries',
      eyebrow: 'PILLAR 04',
      desc: 'Private AI chat sessions, intimate personal reflections, and unapproved biomarker notes remain strictly quarantined inside your encrypted vault.',
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50 border-indigo-100',
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#F8FAFC] text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-cyan-100/25 rounded-full blur-[180px] pointer-events-none -z-10" />

      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="uppercase tracking-[0.18em]">
              Governance & Safety
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display"
          >
            Four Pillars of{' '}
            <span className="text-[#0891B2]">
              Responsible Sharing.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal"
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
              whileHover={{ y: -4 }}
              className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400">
                    {pillar.eyebrow}
                  </span>
                  <div className={`p-2.5 rounded-2xl border ${pillar.iconBg}`}>
                    {pillar.icon}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[#162A45] font-display">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans mt-2">
                    {pillar.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono text-cyan-700">
                <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
                <span>Zero Commercial Sale</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
