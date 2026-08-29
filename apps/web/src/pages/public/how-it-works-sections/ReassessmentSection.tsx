import { RefreshCw, ArrowRight } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const ReassessmentSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#180A25] via-[#241038] to-[#180A25] text-white overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FDA4AF]">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Phase 09 — Continuous Learning</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            09 — New information changes the picture
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            When you log a new cycle interval or upload a repeat blood panel after 6 months, OVASense updates your longitudinal record without discarding historical context.
          </p>
        </div>

        {/* Dynamic Integration Flow */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-mono font-bold text-center">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-white">
              Historical Record
            </div>
            <span className="text-[#FDA4AF] text-lg">+</span>
            <div className="p-3.5 rounded-2xl bg-[#6E2D8B] text-white">
              New Verified Entry
            </div>
            <ArrowRight className="w-4 h-4 text-[#FDA4AF]" />
            <div className="p-3.5 rounded-2xl bg-[#8E3EAF] text-white">
              Updated Trajectory Matrix
            </div>
            <ArrowRight className="w-4 h-4 text-[#FDA4AF]" />
            <div className="p-3.5 rounded-2xl bg-[#047857] text-white">
              Updated SHAP Reassessment
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
