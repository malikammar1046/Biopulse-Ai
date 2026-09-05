import React from 'react';
import { motion } from 'framer-motion';
import { Sliders, ShieldAlert } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const InformationPrioritizationSection: React.FC = () => {
  const comparisonExamples = [
    {
      title: 'High Informative Gain / Accessible Cost',
      metricName: 'Standard Morning Hormone Panel',
      impactLevel: 'High Screening Gain',
      costEstimate: 'Moderate Clinical Cost',
      rationale:
        'A single morning blood draw evaluating LH, FSH, and fasting glucose often clarifies baseline endocrine patterns with high statistical information gain.',
      accent: '#34D399',
    },
    {
      title: 'High Informative Gain / Specialized Procedure',
      metricName: 'Pelvic Ultrasound with Antral Count',
      impactLevel: 'High Morphological Value',
      costEstimate: 'Specialist Imaging',
      rationale:
        'Recommended when hormonal and cycle signals are ambiguous, directly confirming ovarian morphology (PCOM) under clinical criteria.',
      accent: '#818CF8',
    },
    {
      title: 'Low Informative Gain / Premature Expense',
      metricName: 'Exotic Unregulated Biomarker Panels',
      impactLevel: 'Low Incremental Gain',
      costEstimate: 'High Out-of-Pocket Cost',
      rationale:
        'Unvalidated consumer wellness kits often cost hundreds of dollars while contributing minimal additional statistical clarity over standard panels.',
      accent: '#FB7185',
    },
  ];

  return (
    <section
      id="information-prioritization"
      className="py-24 sm:py-32 bg-[#12071F] text-white border-t border-white/10 relative overflow-hidden select-none"
      aria-labelledby="info-prioritization-title"
    >
      {/* Subtle Volumetric Glow */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[#38BDF8]/12 rounded-full blur-[170px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Sliders className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Research-Backed Decision Intelligence
            </span>
          </div>

          <h2
            id="info-prioritization-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight"
          >
            Know What Information{' '}
            <span className="bg-gradient-to-r from-[#FBBF24] via-[#FB7185] to-[#C084FC] bg-clip-text text-transparent">
              Matters Next.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed font-sans">
            Not every medical test offers the same value. VITASense AI helps identify which additional
            information could potentially provide the greatest estimated improvement in screening performance
            relative to estimated cost.
          </p>
        </div>

        {/* Informative Value vs Estimated Cost Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
          {comparisonExamples.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.1 }}
              className="p-6 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/10 flex flex-col justify-between text-left space-y-4 shadow-xl"
            >
              <div className="space-y-3">
                <span
                  className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border inline-block"
                  style={{
                    backgroundColor: `${item.accent}18`,
                    color: item.accent,
                    borderColor: `${item.accent}35`,
                  }}
                >
                  {item.impactLevel}
                </span>

                <h3 className="text-lg font-bold font-display text-white">{item.metricName}</h3>

                <p className="text-xs text-[#CDBDD8] leading-relaxed font-sans">
                  {item.rationale}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#A797BD] flex items-center justify-between">
                <span>Estimated Cost Level:</span>
                <span className="font-mono font-bold text-white/80">{item.costEstimate}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Approved Safety Callout with Exact PRD Language */}
        <div className="p-5 rounded-3xl bg-white/5 border border-white/15 max-w-3xl mx-auto text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FBBF24] uppercase">
            <ShieldAlert className="w-4 h-4" />
            <span>Safety & Clinical Intent Notice</span>
          </div>
          <p className="text-xs text-[#EDE4F7] leading-relaxed font-sans">
            "Based on the evaluated model, this additional information could provide the greatest estimated
            improvement in screening performance relative to its estimated cost. This information is intended
            to support discussion with a healthcare professional and does not constitute a medical recommendation."
          </p>
          <p className="text-[11px] text-[#A797BD] font-sans">
            * Estimated costs are illustrative comparative indicators, not fixed or universal prices. Lab and imaging fees vary by clinic, region, and insurance coverage.
          </p>
        </div>
      </Container>
    </section>
  );
};
