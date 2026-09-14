import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';

export const AboutCTASection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] overflow-hidden border-t border-slate-200/80">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-100/30 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-14 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Take the Next Step</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
              Understand the patterns.{' '}
              <span className="text-[#0891B2]">
                Understand the bigger picture.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-xl mx-auto">
              BioPulse AI turns scattered health data into clear, explainable screening guidance and doctor-ready summaries. Start your assessment today.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-lg shadow-cyan-600/20 font-bold rounded-full"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Start Your Screening
                </Button>
              </Link>

              <Link to={ROUTES.CONDITIONS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-full"
                >
                  Explore Conditions
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>AI-Assisted • Longitudinal Tracking • Non-Diagnostic Screening</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutCTASection;
