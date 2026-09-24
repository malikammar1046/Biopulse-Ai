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
      accent: '#E11D48',
    },
    {
      tierNum: 'Tier 2',
      title: 'Routine Health Information',
      badge: 'Common Labs',
      summary: 'Standard laboratory or health information commonly ordered during routine check-ups.',
      examples: ['Fasting blood sugar & lipid panel', 'Complete blood count (CBC)', 'Basic metabolic markers', 'General physical vitals'],
      benefit: 'Enriches your baseline profile with general metabolic health insights.',
      accent: '#7C3AED',
    },
    {
      tierNum: 'Tier 3',
      title: 'Pathway-Specific Hormonal Information',
      badge: 'Targeted Panels',
      summary: 'Specialized hormone panels directly relevant to your selected health pathway.',
      examples: ['LH, FSH & AMH (Women’s pathway)', 'Morning Total Testosterone (Men’s pathway)', 'DHEA-S & Free Androgens', 'Thyroid-Stimulating Hormone (TSH)'],
      benefit: 'Deepens the biological context for endocrine-specific risk evaluation.',
      accent: '#0284C7',
    },
    {
      tierNum: 'Tier 4',
      title: 'Comprehensive Clinical Information',
      badge: 'Clinical Imaging',
      summary: 'Additional clinician-provided or verified diagnostic documents and imaging.',
      examples: ['Pelvic ultrasound scan reports', 'Doppler stromal metrics', 'Endocrinologist specialist notes', 'Follow-up confirmatory morning panels'],
      benefit: 'Offers the highest degree of contextual information to support discussions with your specialist.',
      accent: '#059669',
    },
  ];

  return (
    <section
      id="four-tier-model"
      className="py-24 sm:py-32 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#FAFCFF] text-[#162A45] border-t border-slate-200/80 relative overflow-hidden select-none"
      aria-labelledby="four-tier-title"
    >
      {/* Ambient Lights */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-pink-100/30 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-sky-100/40 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-[#0891B2]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              Progressive Assessment Architecture
            </span>
          </div>

          <h2
            id="four-tier-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
          >
            Start With What You{' '}
            <span className="text-[#0891B2]">
              Already Know.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            You don’t need an exhaustive stack of clinical tests to begin. As more health information
            becomes available, BIOPulse AI can progressively reassess the screening context.
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
                    ? 'bg-white border-[#0891B2] shadow-xl ring-2 ring-cyan-100'
                    : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border shadow-2xs"
                      style={{
                        backgroundColor: `${tier.accent}15`,
                        color: tier.accent,
                        borderColor: `${tier.accent}30`,
                      }}
                    >
                      {tier.tierNum}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold font-display text-[#162A45]">
                      {tier.title}
                    </h3>
                  </div>

                  <span className="text-[11px] font-mono font-semibold text-slate-500 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/60 w-fit">
                    {tier.badge}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans mb-4">
                  {tier.summary}
                </p>

                {/* Examples Chips */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs">
                  {tier.examples.map((ex, exIdx) => (
                    <span
                      key={exIdx}
                      className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 border border-slate-200/60 font-medium"
                    >
                      ✓ {ex}
                    </span>
                  ))}
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/70 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{tier.benefit}</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Safety Note on Tier 4 */}
        <div className="mt-8 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-start gap-3.5 max-w-3xl mx-auto text-left">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            <strong className="text-[#162A45] font-semibold">Safe Progressive Principle:</strong> More information
            allows a more informed screening assessment. Even with Tier 4 information, BIOPulse AI does not
            issue clinical diagnoses. Final medical diagnosis and treatment plans are the exclusive responsibility
            of qualified physicians.
          </p>
        </div>
      </Container>
    </section>
  );
};
