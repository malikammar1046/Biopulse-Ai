import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock,
  Sparkles,
  Scale,
  Smile,
  Baby,
  ChevronDown,
  ShieldAlert,
  Heart
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface SymptomCard {
  id: string;
  icon: any;
  title: string;
  shortSummary: string;
  accentColor: string;
  detailedContext: string;
  whyItHappens: string;
}

const SYMPTOM_CARDS: SymptomCard[] = [
  {
    id: 'irregular-periods',
    icon: CalendarClock,
    title: 'Irregular Periods',
    shortSummary: 'Cycles that stretch beyond 35 days, occur unpredictably, or pause for months.',
    accentColor: '#FB7185',
    detailedContext:
      'Some people with PMOS experience cycles that are longer than usual, unpredictable flow volume, or months where menstruation does not arrive.',
    whyItHappens:
      'When ovulation happens less frequently or pauses, the uterine lining does not receive regular progesterone cues to shed on a typical monthly schedule.',
  },
  {
    id: 'acne',
    icon: Sparkles,
    title: 'Acne & Skin Flare-Ups',
    shortSummary: 'Persistent breakouts, frequently concentrated along the jawline, chin, or back.',
    accentColor: '#C084FC',
    detailedContext:
      'Some people with PMOS experience stubborn breakouts that may not respond easily to conventional over-the-counter washes.',
    whyItHappens:
      'Slightly higher androgen signals can prompt the skin’s sebaceous glands to produce excess sebum, leading to clogged pores and localized inflammation.',
  },
  {
    id: 'facial-body-hair',
    icon: Smile,
    title: 'Increased Facial or Body Hair',
    shortSummary: 'Coarser hair growth on the chin, upper lip, chest, abdomen, or inner thighs.',
    accentColor: '#E879F9',
    detailedContext:
      'Some people with PMOS experience excess hair growth (often clinically noted as hirsutism) in areas where men typically grow hair.',
    whyItHappens:
      'Hair follicles in certain areas are sensitive to circulating androgens, which can transform fine vellus hair into thicker, darker terminal hair.',
  },
  {
    id: 'scalp-hair-thinning',
    icon: Heart,
    title: 'Scalp Hair Thinning',
    shortSummary: 'Gradual hair shedding or thinning along the crown or central parting.',
    accentColor: '#FDA4AF',
    detailedContext:
      'Some people with PMOS experience diffuse thinning across the top of the scalp, even while noticing increased hair on other areas.',
    whyItHappens:
      'Androgen sensitivity can shorten the active growth cycle of scalp hair follicles, leading to smaller, finer hair strands over time.',
  },
  {
    id: 'weight-changes',
    icon: Scale,
    title: 'Weight & Metabolic Shifts',
    shortSummary: 'Challenges managing body weight or noticeable shifts in body composition.',
    accentColor: '#818CF8',
    detailedContext:
      'Some people with PMOS experience weight fluctuations or difficulty losing weight despite consistent diet and exercise habits.',
    whyItHappens:
      'Insulin resistance is common in PMOS. When cells have trouble using insulin efficiently, the body produces more of it, encouraging energy storage rather than rapid burning.',
  },
  {
    id: 'ovulation-fertility',
    icon: Baby,
    title: 'Difficulty with Ovulation / Fertility',
    shortSummary: 'Uncertainty around fertile windows or longer timelines when planning a family.',
    accentColor: '#34D399',
    detailedContext:
      'Some people with PMOS experience difficulty conceiving because ovulation occurs less regularly, making it harder to predict fertile days.',
    whyItHappens:
      'Because pregnancy requires an egg to be released, irregular or delayed ovulatory cycles mean fewer ovulatory opportunities per calendar year.',
  },
];

export const PCOSSymptomsSection: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  return (
    <section
      id="pcos-symptoms"
      className="relative py-20 sm:py-28 bg-[#10071A] text-white overflow-hidden border-t border-white/10 select-none"
      aria-labelledby="pcos-symptoms-title"
    >
      {/* Background Volumetric Highlights */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-[#8E3EAF]/18 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-[#FB7185]/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                Shared Experiences
              </span>
            </div>

            <h2
              id="pcos-symptoms-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
            >
              Symptoms &{' '}
              <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
                Experiences
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto font-sans leading-relaxed">
              Because PMOS affects hormone and metabolic signaling across the body, it can manifest in diverse ways.
              Notice how we frame these: <strong className="text-white">Some people experience them</strong>,
              and having one or more does not define you or confirm a diagnosis.
            </p>
          </div>

          {/* Accessible Symptom Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SYMPTOM_CARDS.map((card) => {
              const Icon = card.icon;
              const isExpanded = expandedId === card.id;

              return (
                <motion.div
                  key={card.id}
                  layout
                  className="rounded-3xl bg-gradient-to-b from-[#1C0D2E]/70 to-[#12071F]/80 border border-white/10 hover:border-white/25 transition-all p-6 flex flex-col justify-between shadow-xl backdrop-blur-md"
                >
                  <div className="space-y-4">
                    {/* Header with Icon & Title */}
                    <div className="flex items-center justify-between">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/15 shadow-md"
                        style={{ backgroundColor: `${card.accentColor}20`, color: card.accentColor }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A797BD] px-2.5 py-1 rounded-full bg-white/5">
                        Possible Pattern
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white font-display">{card.title}</h3>

                    <p className="text-xs sm:text-sm text-[#EDE4F7] leading-relaxed font-sans">
                      {card.shortSummary}
                    </p>

                    {/* Expandable Context Area */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="space-y-3 pt-2 text-left"
                        >
                          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FB7185] block">
                              What it feels like
                            </span>
                            <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                              {card.detailedContext}
                            </p>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C084FC] block">
                              The biology behind it
                            </span>
                            <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                              {card.whyItHappens}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleExpand(card.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Learn more about'} ${card.title}`}
                    className="mt-5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#EDE4F7] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#FB7185] focus-visible:outline-none"
                  >
                    <span>{isExpanded ? 'Show Less' : 'Learn Biological Context'}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>

          {/* Safety Reminder */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5 text-left">
            <ShieldAlert className="w-5 h-5 text-[#FB7185] shrink-0 mt-0.5" />
            <p className="text-xs text-[#B4A6C7] leading-relaxed font-sans">
              <strong className="text-white font-medium">Important Safe Distinction:</strong> Experience of
              one or several of these symptoms indicates a pattern worth discussing with your clinician. It is
              never a definitive diagnosis on its own, as thyroid disorders, high stress, and other factors can cause similar symptoms.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
