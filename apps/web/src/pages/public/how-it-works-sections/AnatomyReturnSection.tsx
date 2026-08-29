import { Sparkles } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { LazyReproductiveSystem3D } from '../../../components/3d/LazyReproductiveSystem3D';

export const AnatomyReturnSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/25 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Narrative */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FB7185]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Ecosystem Convergence</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
              Biology + Data +{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                Understanding.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-xl">
              By connecting your internal biological reality with structured health records, explainable artificial intelligence, and longitudinal tracking, PMOSense turns fragmented health experiences into continuous clarity.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs font-mono font-bold">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-[#FDA4AF] block text-base font-display">01</span>
                <span>BIOLOGY</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-[#E879F9] block text-base font-display">02</span>
                <span>DATA</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-white/15">
                <span className="text-[#34D399] block text-base font-display">03</span>
                <span>CLARITY</span>
              </div>
            </div>
          </div>

          {/* Right 3D Visual with Data Halo */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[420px] sm:min-h-[480px]">
            <LazyReproductiveSystem3D className="w-full h-[420px] sm:h-[480px]" showDataNodes={true} />
          </div>
        </div>
      </Container>
    </section>
  );
};
