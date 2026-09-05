import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const FourTierModelSection: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<number>(0);

  const tiers = [
    {
      tierNum: 'Tier 1',
      title: 'Accessible Information',
      badge: 'Zero Barriers',
      summary: 'Symptoms, body measurements, everyday lifestyle habits, and personal health history.',
      examples: ['Cycle logs or energy notes', 'BMI & waist measurements', 'Daily sleep & stress logs', 'Family endocrine history'],
      benefit: 'Establishes your initial baseline without waiting for a doctor appointment or laboratory visit.',
      accent: '#FB7185',
    },
    {
      tierNum: 'Tier 2',
      title: 'Routine Health Information',
      badge: 'Common Labs',
      summary: 'Standard laboratory or health information commonly ordered during routine check-ups.',
      examples: ['Fasting blood sugar & lipid panel', 'Complete blood count (CBC)', 'Basic metabolic markers', 'General physical vitals'],
      benefit: 'Enriches your baseline profile with general metabolic health insights.',
      accent: '#C084FC',
    },
    {
      tierNum: 'Tier 3',
      title: 'Pathway-Specific Hormonal Information',
      badge: 'Targeted Panels',
      summary: 'Specialized hormone panels directly relevant to your selected health pathway.',
      examples: ['LH, FSH & AMH (Women’s pathway)', 'Morning Total Testosterone (Men’s pathway)', 'DHEA-S & Free Androgens', 'Thyroid-Stimulating Hormone (TSH)'],
      benefit: 'Deepens the biological context for endocrine-specific risk evaluation.',
      accent: '#818CF8',
    },
    {
      tierNum: 'Tier 4',
      title: 'Comprehensive Clinical Information',
      badge: 'Clinical Imaging',
      summary: 'Additional clinician-provided or verified diagnostic documents and imaging.',
      examples: ['Pelvic ultrasound scan reports', 'Doppler stromal metrics', 'Endocrinologist specialist notes', 'Follow-up confirmatory morning panels'],
      benefit: 'Offers the highest degree of contextual information to support discussions with your specialist.',
      accent: '#34D399',
    },
  ];

  return (
    <section
      id="four-tier-model"
      className="py-24 sm:py-32 bg-[#10071A] text-white border-t border-white/10 relative overflow-hidden select-none"
      aria-labelledby="four-tier-title"
    >
      {/* Ambient Radial Lights */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-[#0284C7]/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Progressive Assessment Architecture
            </span>
          </div>

          <h2
            id="four-tier-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight"
          >
            Start With What You{' '}
            <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
              Already Know.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed font-sans">
            You don’t need an exhaustive stack of clinical tests to begin. As more health information
            becomes available, VITASense AI can progressively reassess the screening context.
          </p>
        </div>

        {/* 4 Tiers Progression Visual Stack */}
        <div className="max-w-4xl mx-auto space-y-4">
          {tiers.map((tier, idx) => {
            const isSelected = selectedTier === idx;
            return (
              <motion.div
                key={tier.tierNum}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                onClick={() => setSelectedTier(idx)}
                className={`p-6 sm:p-7 rounded-3xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1C0D2E] via-[#160A26] to-[#12071F] border-white/30 shadow-2xl ring-1 ring-white/20'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border shadow-sm"
                      style={{
                        backgroundColor: `${tier.accent}20`,
                        color: tier.accent,
                        borderColor: `${tier.accent}40`,
                      }}
                    >
                      {tier.tierNum}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                      {tier.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-mono text-[#A797BD] px-2.5 py-0.5 rounded-full bg-white/5 w-fit">
                    {tier.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#EDE4F7] leading-relaxed font-sans mb-4">
                  {tier.summary}
                </p>

                {/* Examples Chips */}
                <div className="pt-3 border-t border-white/5 flex flex-wrap gap-2 text-xs">
                  {tier.examples.map((ex, exIdx) => (
                    <span
                      key={exIdx}
                      className="px-2.5 py-1 rounded-xl bg-white/5 text-[#CDBDD8] border border-white/5"
                    >
                      ✓ {ex}
                    </span>
                  ))}
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-white/10 text-xs text-[#34D399] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{tier.benefit}</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Safety Note on Tier 4 */}
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5 max-w-3xl mx-auto text-left">
          <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
          <p className="text-xs text-[#B4A6C7] leading-relaxed font-sans">
            <strong className="text-white font-medium">Safe Progressive Principle:</strong> More information
            allows a more informed screening assessment. Even with Tier 4 information, VITASense AI does not
            issue clinical diagnoses. Final medical diagnosis and treatment plans are the exclusive responsibility
            of qualified physicians.
          </p>
        </div>
      </Container>
    </section>
  );
};
