import { Sparkles, ArrowDown } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const BiologicalChainSection: React.FC = () => {
  const chainSteps = [
    {
      title: 'Hypothalamic-Pituitary Signalling',
      detail: 'Pulsatile GnRH release from the brain prompts the pituitary gland to secrete LH and FSH, orchestrating reproductive rhythms.',
    },
    {
      title: 'Target Gonadal Hormone Production',
      detail: 'The ovaries (producing estrogen and progesterone) or testes (producing testosterone) respond to pituitary gonadotropin cues.',
    },
    {
      title: 'Endocrine Feedback & Regulation',
      detail: 'Circulating sex hormones provide negative or positive feedback loops back to the brain to maintain physiological equilibrium.',
    },
    {
      title: 'Metabolic & Lifestyle Modulation',
      detail: 'Insulin sensitivity, visceral adiposity, sleep quality, and stress hormones (cortisol) directly influence receptor sensitivity.',
    },
    {
      title: 'Observable Bodily Signals',
      detail: 'Shifts in energy, cycle duration, adult acne, vitality, libido, or body composition reflect underlying endocrine changes.',
    },
    {
      title: 'Longitudinal Trajectory Over Time',
      detail: 'Chronic endocrine systems are dynamic. Structured tracking month-by-month transforms scattered clues into clear health trajectories.',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#180A25] via-[#241038] to-[#35144F] text-white overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biological Interconnectivity</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            A chain of{' '}
            <span className="bg-gradient-to-r from-[#FDA4AF] via-[#FB7185] to-[#E879F9] bg-clip-text text-transparent">
              interconnected systems
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            Reproductive health does not follow one isolated pathway. It represents a dynamic cascade of brain signaling, hormone production, metabolic health, and daily lifestyle factors that interact over time.
          </p>
        </div>

        {/* Vertical Connected Chain Grid */}
        <div className="max-w-4xl mx-auto space-y-4 relative">
          {chainSteps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="p-6 sm:p-7 rounded-2xl bg-white/[0.05] border border-white/15 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.08] transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-9 h-9 rounded-xl bg-gradient-brand text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold font-display text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#B4A6C7] leading-relaxed mt-0.5">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>

              {idx < chainSteps.length - 1 && (
                <div className="flex justify-center my-1.5 text-[#C084FC]/50">
                  <ArrowDown className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};
