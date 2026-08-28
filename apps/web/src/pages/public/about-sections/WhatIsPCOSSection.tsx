import { Sparkles, HeartPulse, RefreshCw, Layers } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const WhatIsPCOSSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#180A25] text-white overflow-hidden border-t border-white/5">
      {/* Soft Ambient Radial Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#6E2D8B]/20 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#FB7185]">
            <Layers className="w-3.5 h-3.5" />
            <span>Understanding PMOS & PCOS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            One condition.{' '}
            <span className="bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC] bg-clip-text text-transparent">
              Many interconnected signals.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            Polycystic Ovary Syndrome (PCOS) is a complex endocrine and metabolic profile rather than an isolated symptom.
            Because every individual experiences a unique combination of hormonal, cycle, and metabolic signals, understanding it requires looking at the interconnected whole.
          </p>
        </div>

        {/* 3 Interconnected Branches Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branch 1: Hormonal Dynamics */}
          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#8E3EAF]/30 border border-[#8E3EAF]/40 text-[#C084FC] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Hormonal Dynamics
              </h3>
              <p className="text-sm text-[#B4A6C7] leading-relaxed">
                Shifts in luteinizing hormone (LH), follicle-stimulating hormone (FSH), androgens, or anti-Müllerian hormone (AMH) influence ovarian follicular maturation.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <span className="text-[11px] font-mono font-semibold text-[#E879F9] uppercase tracking-wider block mb-1">
                Reflected In:
              </span>
              <span className="text-xs text-[#EDE4F7]">
                Acne, hirsutism, sleep variations, and skin health.
              </span>
            </div>
          </div>

          {/* Branch 2: Reproductive Patterns */}
          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FB7185]/30 border border-[#FB7185]/40 text-[#FDA4AF] flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Reproductive Patterns
              </h3>
              <p className="text-sm text-[#B4A6C7] leading-relaxed">
                Altered ovarian signaling can lead to prolonged follicular phases, irregular cycle lengths, delayed ovulation, or ultrasonic multi-follicular morphology.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <span className="text-[11px] font-mono font-semibold text-[#FDA4AF] uppercase tracking-wider block mb-1">
                Reflected In:
              </span>
              <span className="text-xs text-[#EDE4F7]">
                Cycle variability, flow intensity, and ovulation timing.
              </span>
            </div>
          </div>

          {/* Branch 3: Metabolic Factors */}
          <div className="p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#047857]/30 border border-[#047857]/40 text-[#34D399] flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Metabolic Factors
              </h3>
              <p className="text-sm text-[#B4A6C7] leading-relaxed">
                Insulin regulation, carbohydrate metabolism, stress, and sleep pacing can dynamically modulate endocrine signaling and energy levels.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <span className="text-[11px] font-mono font-semibold text-[#34D399] uppercase tracking-wider block mb-1">
                Reflected In:
              </span>
              <span className="text-xs text-[#EDE4F7]">
                Energy fluctuations, metabolic markers, and lifestyle response.
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
