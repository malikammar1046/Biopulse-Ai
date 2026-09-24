import React from 'react';
import { Check, X } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const WhyDifferentSection: React.FC = () => {
  const comparisonData = [
    {
      conventional: 'Single-purpose trackers with siloed data',
      biopulse: 'Connected multimodal screening for Women, Men & Baseline users',
    },
    {
      conventional: 'Data remains fragmented across paper slips & memos',
      biopulse: 'Unified, structured 4-tier longitudinal record',
    },
    {
      conventional: 'One-time isolated snapshot prediction',
      biopulse: 'Multi-month trend monitoring & progressive reassessment',
    },
    {
      conventional: 'Opaque black-box AI risk percentages',
      biopulse: 'Transparent SHAP feature attribution explaining model weights',
    },
    {
      conventional: 'Indiscriminate batteries of expensive tests',
      biopulse: 'Value-driven information prioritization (cost vs estimated gain)',
    },
    {
      conventional: 'Generic, one-size-fits-all health advice',
      biopulse: 'Context-aware, non-curative supportive lifestyle guidance',
    },
    {
      conventional: 'Automated AI claims attempting to replace doctors',
      biopulse: 'Human-supervised summaries designed for collaborative doctor visits',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Design Philosophy
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Not another generic tracker.{' '}
            <span className="gradient-text-brand">
              Not another black-box AI.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            A deliberate architectural shift from isolated symptom logging toward explainable clinical intelligence and longitudinal clarity.
          </p>
        </div>

        {/* Factual Comparison Table */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-[#E7DFEF] shadow-xl overflow-hidden">
          <div className="hidden sm:grid sm:grid-cols-2 bg-[#EDE4F7]/60 border-b border-[#E7DFEF] p-5 font-display font-bold text-xs sm:text-sm">
            <span className="text-[#8D7E9E] uppercase tracking-wider">Conventional Health Trackers</span>
            <span className="text-[#6E2D8B] uppercase tracking-wider">The BIOPulse AI Platform</span>
          </div>

          <div className="divide-y divide-[#E7DFEF]">
            {comparisonData.map((row, idx) => (
              <div key={idx} className="flex flex-col sm:grid sm:grid-cols-2 p-4 sm:p-5 text-xs sm:text-sm gap-2.5 sm:gap-0 sm:items-center hover:bg-[#FAF7FD] transition-colors">
                <div className="flex items-start sm:items-center gap-2.5 text-[#584B68] sm:pr-4">
                  <X className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5 sm:mt-0" />
                  <span>{row.conventional}</span>
                </div>
                <div className="flex items-start sm:items-center gap-2.5 text-[#1C1326] font-semibold sm:pl-2 bg-purple-50/50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                  <Check className="w-4 h-4 text-[#047857] shrink-0 mt-0.5 sm:mt-0" />
                  <span>{row.biopulse}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
