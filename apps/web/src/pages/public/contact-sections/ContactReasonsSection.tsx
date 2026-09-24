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
  bg: string;
}

export const ContactReasonsSection: React.FC = () => {
  const cards: ReasonCard[] = [
    {
      tag: 'RESEARCH',
      title: 'Endocrine Health Studies',
      description: 'Collaborate with us to advance explainable AI screening for PCOS and Male Hypogonadism.',
      icon: <Microscope className="w-6 h-6 text-[#0891B2]" />,
      accentColor: '#0891B2',
      bg: 'bg-cyan-50',
    },
    {
      tag: 'COLLABORATION',
      title: 'Ecosystem Partnerships',
      description: 'Work with us on clinical laboratory integration, nutrition science, or responsible AI validation.',
      icon: <Users className="w-6 h-6 text-purple-600" />,
      accentColor: '#7C3AED',
      bg: 'bg-purple-50',
    },
    {
      tag: 'FEEDBACK',
      title: 'Human-Centered Design',
      description: 'Tell us what features and guidance would make BioPulse AI genuinely helpful in everyday life.',
      icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
      accentColor: '#059669',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-white text-[#162A45] relative overflow-hidden border-t border-slate-200">
      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-[#0891B2]">
            <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
              Purposeful Dialogue
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#162A45] tracking-tight font-display">
            More than a message
          </h2>

          <p className="text-base text-slate-600 leading-relaxed font-sans max-w-xl mx-auto">
            BioPulse AI is engineered at the intersection of endocrine health, explainable machine learning, and human-centered design.
          </p>
        </div>

        {/* 3 Cards Composition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <motion.div
              key={card.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-3xl bg-slate-50 border border-slate-200/90 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-200 hover:bg-white"
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <span
                  className="text-xs font-mono font-bold tracking-[0.15em] px-2.5 py-1 rounded-full text-white"
                  style={{ backgroundColor: card.accentColor }}
                >
                  {card.tag}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2.5 text-left">
                <h3 className="text-xl font-bold text-[#162A45] font-display flex items-center justify-between">
                  <span>{card.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400" />
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  {card.description}
                </p>
              </div>

              <div
                className="mt-6 h-1 w-full rounded-full opacity-30"
                style={{ backgroundColor: card.accentColor }}
              />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ContactReasonsSection;
