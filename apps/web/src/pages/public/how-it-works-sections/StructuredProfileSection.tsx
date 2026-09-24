import React from 'react';
import { Layers, ShieldCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const StructuredProfileSection: React.FC = () => {
  const tiers = [
    {
      level: 'TIER 1',
      title: 'Accessible Information',
      subtitle: 'Available immediately without clinic visits',
      items: ['Self-reported symptoms & severities', 'Age, BMI, waist-to-hip ratio', 'Sleep duration & lifestyle routines', 'Personal & family health history'],
      color: '#38BDF8',
      bgBadge: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
    },
    {
      level: 'TIER 2',
      title: 'Routine Health Information',
      subtitle: 'Standard health checks & basic laboratory tests',
      items: ['Complete blood counts (CBC)', 'Fasting glucose & lipid profiles', 'Blood pressure & resting heart rate', 'General metabolic screening metrics'],
      color: '#818CF8',
      bgBadge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    },
    {
      level: 'TIER 3',
      title: 'Pathway-Specific Information',
      subtitle: 'Targeted endocrine & hormonal biomarkers',
      items: ['Total & Free Testosterone (with morning timing)', 'Luteinizing Hormone (LH) & FSH ratios', 'SHBG, Prolactin, Estradiol levels', 'Anti-Müllerian Hormone (AMH) / DHEAS'],
      color: '#E879F9',
      bgBadge: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    },
    {
      level: 'TIER 4',
      title: 'Comprehensive Clinical Information',
      subtitle: 'Verified specialist reports & ultrasound findings',
      items: ['Structured pelvic ultrasound report text (Rotterdam)', 'Endocrinologist examination notes', 'Confirmed specialist diagnoses & follow-ups', 'Specialized endocrine provocations'],
      color: '#FB7185',
      bgBadge: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#180A25] via-[#200D34] to-[#12071F] text-white overflow-hidden border-t border-white/5">
      {/* Background Volumetric Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-[#6E2D8B]/20 rounded-full blur-[170px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Layers className="w-3.5 h-3.5" />
            <span>Research Differentiator — Progressive Health Model</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            The Four-Tier Information Model
          </h2>

          <p className="text-base sm:text-lg text-[#CDBDD8] leading-relaxed font-sans max-w-2xl mx-auto">
            You do not have to provide everything at once. BIOPulse AI is architected to generate meaningful,
            calibrated screening insights at whatever level of information you currently possess.
          </p>
        </div>

        {/* 4 Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-5 hover:border-white/30 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border ${tier.bgBadge}`}>
                    {tier.level}
                  </span>
                  <span className="text-[10px] font-mono text-[#8D7E9E]">Level {idx + 1}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold font-display text-white group-hover:text-[#FDA4AF] transition-colors">
                    {tier.title}
                  </h3>
                  <p className="text-[11px] text-[#A797BD] leading-snug mt-1 font-sans">
                    {tier.subtitle}
                  </p>
                </div>

                <ul className="space-y-2 pt-2 border-t border-white/10">
                  {tier.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-xs text-[#EDE4F7] flex items-start gap-2 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: tier.color }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-[10px] font-mono text-[#8D7E9E] pt-2 border-t border-white/5">
                {idx === 0 && 'Entry assessment available'}
                {idx === 1 && 'Enhances baseline calibration'}
                {idx === 2 && 'Pathway-specific precision'}
                {idx === 3 && 'Comprehensive clinical context'}
              </div>
            </div>
          ))}
        </div>

        {/* Reassurance & Non-Diagnostic Guidance */}
        <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-lg">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
            <p className="text-xs text-[#CDBDD8] leading-relaxed font-sans">
              <strong className="text-white">Continuous Accessibility:</strong> Tier 4 is not required to use the platform, and Tier 4 does not issue an automated clinical diagnosis. As additional verified information becomes available over time, your assessment can simply be revisited.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
