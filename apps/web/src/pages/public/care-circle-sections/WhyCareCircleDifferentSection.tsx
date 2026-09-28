import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Check } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const WhyCareCircleDifferentSection: React.FC = () => {
  const comparisons = [
    {
      traditional: 'Patient attempts to remember 30 days of fluctuating symptoms during a 15-min visit.',
      vitasense: 'Daily signals automatically organized into a structured longitudinal timeline.',
    },
    {
      traditional: 'Scrambles to find paper lab slips, bloodwork printouts, or screenshot folders.',
      vitasense: 'Digitized biomarker summaries linked directly with symptom trend graphs.',
    },
    {
      traditional: 'All-or-nothing sharing: either hand over your entire phone or share nothing.',
      vitasense: 'Granular permissions: you decide what doctors, family, or partners can see.',
    },
    {
      traditional: 'Forgets important questions discussed during the week when sitting in the clinic.',
      vitasense: 'Prepares an organized question checklist attached directly to the weekly brief.',
    },
    {
      traditional: 'Family members are either completely in the dark or overly intrusive.',
      vitasense: 'Permitted routine updates allow supportive check-ins without invading medical privacy.',
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] relative overflow-hidden">
      <Container size="xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDE4F7] border border-[#6E2D8B]/20 text-[#6E2D8B]"
          >
            <Sparkles className="w-4 h-4 text-[#8E3EAF]" />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">
              The Shift in Healthcare
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-extrabold text-[#1C1326] tracking-tight font-display"
          >
            Healthcare shouldn't depend on{' '}
            <span className="bg-gradient-to-r from-[#6E2D8B] via-[#A21CAF] to-[#E87084] bg-clip-text text-transparent">
              fragmented memories.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans font-normal"
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
          className="max-w-4xl mx-auto rounded-3xl bg-white border border-[#E7DFEF] shadow-xl overflow-hidden text-left"
        >
          {/* Table Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 bg-[#EDE4F7]/60 border-b border-[#E7DFEF] p-5 font-display font-bold text-xs sm:text-sm">
            <span className="text-[#8D7E9E] uppercase tracking-wider">
              Traditional Fragmented Healthcare
            </span>
            <span className="text-[#6E2D8B] uppercase tracking-wider">
              The BIOPulse AI Care Circle Experience
            </span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#E7DFEF]">
            {comparisons.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-2 p-5 text-xs sm:text-sm items-center gap-4 hover:bg-[#FAF7FD] transition-colors"
              >
                {/* Traditional */}
                <div className="flex items-start gap-3 text-[#584B68] pr-2">
                  <div className="w-5 h-5 rounded-full bg-[#FB7185]/15 text-[#FB7185] flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>{row.traditional}</span>
                </div>

                {/* BIOPulse AI */}
                <div className="flex items-start gap-3 text-[#1C1326] font-medium pl-0 sm:pl-2">
                  <div className="w-5 h-5 rounded-full bg-[#047857]/15 text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span>{row.vitasense}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
