import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  Activity,
  FileSearch,
  HeartPulse,
  Utensils,
  Dumbbell,
  Bot,
  FileText,
  Check,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

const ECOSYSTEM_PILLARS = [
  {
    icon: Calendar,
    title: 'Track Cycle Patterns',
    desc: 'Log interval lengths, follicular delays, and ovulatory biomarkers to uncover personal rhythms.',
    color: '#FB7185',
  },
  {
    icon: Activity,
    title: 'Track Symptoms',
    desc: 'Categorized tracking for skin, energy, pelvic sensation, and mood over longitudinal months.',
    color: '#C084FC',
  },
  {
    icon: FileSearch,
    title: 'Understand Medical Reports',
    desc: 'Automated OCR extraction of ultrasound ovarian volume, follicle counts, and hormonal labs.',
    color: '#E879F9',
  },
  {
    icon: HeartPulse,
    title: 'Monitor Lifestyle Context',
    desc: 'Correlate sleep variability, everyday stress, and lifestyle shifts with cyclical trends.',
    color: '#FDA4AF',
  },
  {
    icon: Utensils,
    title: 'Nutrition Insights',
    desc: 'Evidence-based dietary frameworks supporting glycemic balance and sustained energy.',
    color: '#34D399',
  },
  {
    icon: Dumbbell,
    title: 'Phase-Tailored Exercise',
    desc: 'Movement strategies aligned with energy states to support metabolic health.',
    color: '#F472B6',
  },
  {
    icon: Bot,
    title: 'Digital Twin AI Explorer',
    desc: 'Ask contextual health questions and explore personalized non-diagnostic explanations.',
    color: '#8E3EAF',
  },
  {
    icon: FileText,
    title: 'Doctor Visit Summaries',
    desc: 'Generate structured longitudinal reports ready to share with your gynecologist.',
    color: '#D8B4FE',
  },
];

export const OvaSenseSolutionSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10 select-none">
      {/* Background Volumetric Lighting */}
      <div className="absolute top-1/4 left-1/3 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#8E3EAF]/20 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 07 — The OvaSense Ecosystem
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            Understanding is where{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              OvaSense begins.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            A comprehensive, longitudinal intelligence platform designed to bring fragmented cycle,
            symptom, report, and lifestyle data together into cohesive clarity.
          </p>
        </div>

        {/* ── 8-Pillar Ecosystem Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ECOSYSTEM_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.06 }}
                className="p-5 rounded-3xl bg-gradient-to-b from-[#180A26]/80 via-[#12071F]/80 to-[#0A0313]/90 border border-white/10 hover:border-[#8E3EAF]/50 shadow-xl backdrop-blur-xl space-y-3.5 text-left group transition-all duration-300 hover:scale-[1.02]"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${pillar.color}25`, border: `1px solid ${pillar.color}50` }}
                >
                  <Icon className="w-5 h-5" style={{ color: pillar.color }} />
                </div>

                <h3 className="text-base font-bold font-display text-white">{pillar.title}</h3>

                <p className="text-xs text-[#CDBDD8] font-sans leading-relaxed">{pillar.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Core Anchor Identity Statement ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-14 sm:mt-16 max-w-3xl mx-auto p-6 sm:p-8 rounded-[32px] bg-gradient-to-r from-[#6E2D8B]/30 via-[#1C0D2E]/80 to-[#E87084]/25 border border-white/20 shadow-2xl backdrop-blur-2xl text-center space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm sm:text-base font-bold font-display text-white">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#34D399]" />
              Not a diagnosis.
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#34D399]" />
              Not a replacement for your doctor.
            </span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="flex items-center gap-2 text-[#FB7185]">
              <Sparkles className="w-4 h-4 text-[#FB7185]" />
              A clearer picture of your health.
            </span>
          </div>

          <p className="text-xs text-[#B4A6C7] max-w-xl mx-auto font-sans leading-normal">
            OvaSense provides longitudinal context to empower your clinical consultations and daily
            lifestyle choices.
          </p>
        </motion.div>
      </Container>
    </section>
  );
};
