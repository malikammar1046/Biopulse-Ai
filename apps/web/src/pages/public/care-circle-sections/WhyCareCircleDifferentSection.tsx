import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Check } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const WhyCareCircleDifferentSection: React.FC = () => {
  const comparisons = [
    {
      traditional: 'Patient attempts to remember 30 days of fluctuating symptoms during a 15-min visit.',
      biopulse: 'Daily signals automatically organized into a structured longitudinal timeline.',
    },
    {
      traditional: 'Scrambles to find paper lab slips, bloodwork printouts, or screenshot folders.',
      biopulse: 'Digitized biomarker summaries linked directly with symptom trend graphs.',
    },
    {
      traditional: 'All-or-nothing sharing: either hand over your entire phone or share nothing.',
      biopulse: 'Granular permissions: you decide what doctors, family, or partners can see.',
    },
    {
      traditional: 'Forgets important questions discussed during the week when sitting in the clinic.',
      biopulse: 'Prepares an organized question checklist attached directly to the weekly brief.',
    },
    {
      traditional: 'Family members are either completely in the dark or overly intrusive.',
      biopulse: 'Permitted routine updates allow supportive check-ins without invading medical privacy.',
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-white text-[#162A45] relative overflow-hidden border-b border-slate-200/80">
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
            <Sparkles className="w-3.5 h-3.5" />
            <span className="uppercase tracking-[0.18em]">
              The Shift in Healthcare
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-[#162A45] tracking-tight font-display"
          >
            Healthcare shouldn't depend on{' '}
            <span className="text-[#0891B2]">
              fragmented memories.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal"
          >
            By replacing memory burden with patient-governed longitudinal clarity, Care Circle empowers both you and your care team.
          </motion.p>
        </div>

        {/* Factual Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.75 }}
          className="max-w-4xl mx-auto rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden text-left"
        >
          {/* Table Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 bg-slate-50 border-b border-slate-200/80 p-5 font-display font-bold text-xs sm:text-sm">
            <span className="text-slate-500 uppercase tracking-wider">
              Traditional Fragmented Healthcare
            </span>
            <span className="text-[#0891B2] uppercase tracking-wider">
              The BioPulse AI Care Circle Experience
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-2 p-5 text-xs sm:text-sm items-center gap-4 hover:bg-slate-50/60 transition-colors"
              >
                {/* Traditional */}
                <div className="flex items-start gap-3 text-slate-600 pr-2">
                  <div className="w-5 h-5 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>{row.traditional}</span>
                </div>

                {/* BioPulse AI */}
                <div className="flex items-start gap-3 text-[#162A45] font-medium pl-0 sm:pl-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>{row.biopulse}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
