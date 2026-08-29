import { Check, X } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const WhyDifferentSection: React.FC = () => {
  const comparisonData = [
    {
      conventional: 'Single-purpose cycle tracking',
      ovasense: 'Connected multimodal health information',
    },
    {
      conventional: 'Data remains fragmented across slips & apps',
      ovasense: 'Unified, structured longitudinal record',
    },
    {
      conventional: 'One-time isolated snapshot prediction',
      ovasense: 'Multi-month longitudinal trend monitoring',
    },
    {
      conventional: 'Opaque black-box AI risk percentages',
      ovasense: 'Transparent SHAP feature attribution',
    },
    {
      conventional: 'Generic western lifestyle advice',
      ovasense: 'Context-aware localized lifestyle guidance',
    },
    {
      conventional: 'Unfiltered technical information overload',
      ovasense: 'Clear, patient-friendly biomarker context',
    },
    {
      conventional: 'Automated AI claims replacing doctors',
      ovasense: 'Human-supervised physician discussion summaries',
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
            Not another period tracker.{' '}
            <span className="bg-gradient-brand bg-clip-text text-transparent">
              Not another chatbot.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            A deliberate architectural shift from isolated tracking toward multimodal clinical intelligence and longitudinal clarity.
          </p>
        </div>

        {/* Factual Comparison Table */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-[#E7DFEF] shadow-xl overflow-hidden">
          <div className="grid grid-cols-2 bg-[#EDE4F7]/60 border-b border-[#E7DFEF] p-5 font-display font-bold text-xs sm:text-sm">
            <span className="text-[#8D7E9E] uppercase tracking-wider">Conventional Digital Trackers</span>
            <span className="text-[#6E2D8B] uppercase tracking-wider">The OVASense Platform</span>
          </div>

          <div className="divide-y divide-[#E7DFEF]">
            {comparisonData.map((row, idx) => (
              <div key={idx} className="grid grid-cols-2 p-4 sm:p-5 text-xs sm:text-sm items-center hover:bg-[#FAF7FD] transition-colors">
                <div className="flex items-center gap-2.5 text-[#584B68] pr-4">
                  <X className="w-4 h-4 text-[#FB7185] shrink-0" />
                  <span>{row.conventional}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#1C1326] font-semibold pl-2">
                  <Check className="w-4 h-4 text-[#047857] shrink-0" />
                  <span>{row.ovasense}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
