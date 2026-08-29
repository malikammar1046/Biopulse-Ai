import React from 'react';
import { motion } from 'framer-motion';
import { Microscope, Users, Sparkles, ArrowUpRight } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface ReasonCard {
  tag: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
}

export const ContactReasonsSection: React.FC = () => {
  const cards: ReasonCard[] = [
    {
      tag: 'RESEARCH',
      title: 'Multimodal Health Studies',
      description: 'Help us explore better ways to understand complex women\'s health patterns.',
      icon: <Microscope className="w-6 h-6 text-[#C084FC]" />,
      accentColor: 'from-[#C084FC] to-[#8E3EAF]',
      glowColor: 'shadow-[0_0_25px_rgba(192,132,252,0.3)]',
    },
    {
      tag: 'COLLABORATION',
      title: 'Ecosystem Partnerships',
      description: 'Work with us on technology, healthcare, research or responsible AI.',
      icon: <Users className="w-6 h-6 text-[#FB7185]" />,
      accentColor: 'from-[#FB7185] to-[#E87084]',
      glowColor: 'shadow-[0_0_25px_rgba(251,113,133,0.3)]',
    },
    {
      tag: 'FEEDBACK',
      title: 'Human-Centered Design',
      description: 'Tell us what would make OVASense genuinely useful in everyday life.',
      icon: <Sparkles className="w-6 h-6 text-[#E879F9]" />,
      accentColor: 'from-[#E879F9] to-[#A21CAF]',
      glowColor: 'shadow-[0_0_25px_rgba(232,121,249,0.3)]',
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#180A25] text-white relative overflow-hidden border-t border-white/10">
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[170px] pointer-events-none -z-10" />

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
            <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Purposeful Dialogue
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display"
          >
            More than a message.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal"
          >
            OVASense is being built at the intersection of health, AI, research and human experience.
          </motion.p>
        </div>

        {/* 3 Cards Composition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <motion.div
              key={card.tag}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8 }}
              className="relative group rounded-3xl bg-[#10071A]/90 border border-white/12 p-8 sm:p-9 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-[#200D33]"
            >
              {/* Follicle-style glowing indicator dot */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    {card.icon}
                  </div>
                  <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#E879F9]">
                    {card.tag}
                  </span>
                </div>

                {/* Tiny Glowing Follicle Dot */}
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${card.accentColor} ${card.glowColor} group-hover:scale-125 transition-transform duration-300`} />
              </div>

              {/* Title & Description */}
              <div className="space-y-3 text-left">
                <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display flex items-center justify-between">
                  <span>{card.title}</span>
                  <ArrowUpRight className="w-5 h-5 text-[#8D7E9E] group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200" />
                </h3>
                <p className="text-sm text-[#B4A6C7] leading-relaxed font-sans font-normal">
                  "{card.description}"
                </p>
              </div>

              {/* Subtle Bottom Accent Gradient Line */}
              <div className={`mt-8 h-1 w-full rounded-full bg-gradient-to-r ${card.accentColor} opacity-20 group-hover:opacity-100 transition-opacity duration-300`} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};
