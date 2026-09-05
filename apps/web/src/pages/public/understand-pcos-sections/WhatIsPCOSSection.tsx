import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, HelpCircle, HeartHandshake, Layers, ShieldCheck, Activity } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const WhatIsPCOSSection: React.FC = () => {
  const keyTakeaways = [
    {
      icon: Activity,
      title: 'Hormone & Ovulation Patterns',
      text: 'PMOS is a common health condition involving how the body coordinates reproductive hormone signals, metabolic cues, and ovulatory cycles.',
      accent: '#FB7185',
    },
    {
      icon: Layers,
      title: 'Whole-Body Biological Influences',
      text: 'It can influence menstrual timing, ovulation frequency, skin, hair, energy, and how the body processes metabolic fuels like glucose and insulin.',
      accent: '#C084FC',
    },
    {
      icon: HeartHandshake,
      title: 'Every Individual Is Unique',
      text: 'Symptoms and biological patterns vary widely between people. There is no single universal presentation of PMOS.',
      accent: '#E879F9',
    },
    {
      icon: ShieldCheck,
      title: 'One Symptom Is Not a Diagnosis',
      text: 'Having irregular cycles or acne alone does not automatically mean you have PMOS. Clinical screening looks at the entire multi-system health picture.',
      accent: '#FDA4AF',
    },
  ];

  return (
    <section
      id="what-is-pcos"
      className="relative py-20 sm:py-28 bg-[#10071A] text-white overflow-hidden border-t border-white/10"
      aria-labelledby="what-is-pcos-title"
    >
      {/* Subtle Ambient Volumetric Lighting */}
      <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-[#6E2D8B]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-0 w-[400px] h-[400px] bg-[#FB7185]/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <HelpCircle className="w-3.5 h-3.5 text-[#FB7185]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                The Basics
              </span>
            </div>

            <h2
              id="what-is-pcos-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
            >
              What is{' '}
              <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
                PMOS?
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto font-sans leading-relaxed">
              Polycystic Metabolic Ovarian Syndrome (PMOS / PCOS) is one of the most common endocrine and reproductive
              patterns in the world, yet it is frequently misunderstood. Here is what is happening in simple terms.
            </p>
          </div>

          {/* Core Plain-Language Explanation Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8E3EAF]/30 to-[#FB7185]/30 border border-white/15 flex items-center justify-center shrink-0 text-[#FB7185]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                  A Gentle, Whole-Body Perspective
                </h3>
                <p className="text-sm sm:text-base text-[#EDE4F7] leading-relaxed font-sans">
                  At its core, PMOS is not an infection or a disease isolated to the ovaries. Rather, it represents
                  a <strong className="text-white font-semibold">dynamic pattern of communication</strong> between
                  the brain, the ovaries, and metabolic signals like insulin. When these signals fall out of sync,
                  ovulation may happen less regularly, and the body may produce slightly higher levels of
                  androgens (hormones present in all people, but often higher in PMOS).
                </p>
                <p className="text-sm sm:text-base text-[#EDE4F7] leading-relaxed font-sans">
                  Because hormones circulate throughout the entire bloodstream, PMOS can touch multiple areas
                  of wellness—from skin and hair to energy levels, cycle regularity, and sleep rhythm. Understanding your personal pattern
                  is the first step toward informed self-advocacy.
                </p>
              </div>
            </div>
          </div>

          {/* 4 Key Understanding Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {keyTakeaways.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-colors space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/15 shadow-sm"
                      style={{ backgroundColor: `${item.accent}20`, color: item.accent }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-base font-bold text-white font-display">{item.title}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed font-sans">
                    {item.text}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Non-Diagnostic Safety Callout */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5 text-left">
            <ShieldCheck className="w-5 h-5 text-[#C084FC] shrink-0 mt-0.5" />
            <p className="text-xs text-[#B4A6C7] leading-relaxed font-sans">
              <strong className="text-white font-medium">Educational Clarity:</strong> This information
              is designed to build health literacy and prepare you for fruitful discussions with your doctor.
              Only a qualified healthcare provider can evaluate clinical criteria, interpret laboratory panels, and diagnose PMOS / PCOS.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
