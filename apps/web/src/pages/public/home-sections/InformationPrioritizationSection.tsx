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
      accent: '#059669',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
    },
    {
      title: 'High Informative Gain / Specialized Procedure',
      metricName: 'Pelvic Ultrasound with Antral Count',
      impactLevel: 'High Morphological Value',
      costEstimate: 'Specialist Imaging',
      rationale:
        'Recommended when hormonal and cycle signals are ambiguous, directly confirming ovarian morphology (PCOM) under clinical criteria.',
      accent: '#0284C7',
      badgeBg: 'bg-sky-50',
      badgeBorder: 'border-sky-200',
    },
    {
      title: 'Low Informative Gain / Premature Expense',
      metricName: 'Exotic Unregulated Biomarker Panels',
      impactLevel: 'Low Incremental Gain',
      costEstimate: 'High Out-of-Pocket Cost',
      rationale:
        'Unvalidated consumer wellness kits often cost hundreds of dollars while contributing minimal additional statistical clarity over standard panels.',
      accent: '#E11D48',
      badgeBg: 'bg-rose-50',
      badgeBorder: 'border-rose-200',
    },
  ];

  return (
    <section
      id="information-prioritization"
      className="py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#F7F9FD] text-[#162A45] border-t border-slate-200/80 relative overflow-hidden select-none"
      aria-labelledby="info-prioritization-title"
    >
      {/* Subtle Volumetric Glow */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-cyan-50/50 rounded-full blur-[170px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <Sliders className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              Research-Backed Decision Intelligence
            </span>
          </div>

          <h2
            id="info-prioritization-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
          >
            Know What Information{' '}
            <span className="text-[#0891B2]">
              Matters Next.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            Not every medical test offers the same value. BIOPulse AI helps identify which additional
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
              className="p-6 rounded-3xl bg-white border border-slate-200/80 flex flex-col justify-between text-left space-y-4 shadow-md hover:shadow-xl transition-all"
            >
              <div className="space-y-3">
                <span
                  className={`text-[11px] font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-full border inline-block ${item.badgeBg} ${item.badgeBorder}`}
                  style={{ color: item.accent }}
                >
                  {item.impactLevel}
                </span>

                <h3 className="text-lg font-bold font-display text-[#162A45]">{item.metricName}</h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  {item.rationale}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between font-medium">
                <span>Estimated Cost Level:</span>
                <span className="font-mono font-bold text-[#162A45]">{item.costEstimate}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Approved Safety Callout with Exact PRD Language */}
        <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200 max-w-3xl mx-auto text-left space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-800 uppercase">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Safety &amp; Clinical Intent Notice</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            "Based on the evaluated model, this additional information could provide the greatest estimated
            improvement in screening performance relative to its estimated cost. This information is intended
            to support discussion with a healthcare professional and does not constitute a medical recommendation."
          </p>
          <p className="text-[11px] text-slate-500 font-sans">
            * Estimated costs are illustrative comparative indicators, not fixed or universal prices. Lab and imaging fees vary by clinic, region, and insurance coverage.
          </p>
        </div>
      </Container>
    </section>
  );
};
