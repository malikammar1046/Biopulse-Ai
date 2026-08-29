import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, UserPlus } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';
import { BiologicalOrb } from '../../../components/biological/BiologicalOrb';

export const HowItWorksCTASection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#180A25] via-[#10071A] to-[#10071A] text-white overflow-hidden border-t border-white/10">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/25 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#E87084]/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl p-8 sm:p-16 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FB7185]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Experience OVASense</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
                See how your information{' '}
                <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                  comes together.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-xl">
                Begin logging your health patterns, verify extracted lab panels, and generate longitudinal summaries designed to empower you and your healthcare team.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link to={ROUTES.APP.DASHBOARD}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-lg shadow-purple-950/30"
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Explore OVASense
                  </Button>
                </Link>

                <Link to={ROUTES.REGISTER}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/30 text-[#F6F2FA] hover:bg-white/10"
                    iconLeft={<UserPlus className="w-4 h-4" />}
                  >
                    Create an Account
                  </Button>
                </Link>
              </div>

              <div className="pt-4 flex items-center gap-2 text-xs text-[#B4A6C7]">
                <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                <span>AI-Assisted • Longitudinal Monitoring • Non-Diagnostic Healthcare Information</span>
              </div>
            </div>

            {/* Right Lightweight Visual Finale */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[280px] sm:min-h-[340px]">
              <BiologicalOrb size="md" className="w-full h-[280px] sm:h-[340px]" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
