import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';
import { BiologicalOrb } from '../../../components/biological/BiologicalOrb';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white pt-28 pb-20 sm:pb-32 overflow-hidden flex items-center">
      {/* Multi-Depth Atmospheric Biological Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/22 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#E87084]/16 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-[#A21CAF]/22 rounded-full blur-[110px] pointer-events-none -z-10" />

      {/* Floating Background Ambient Particles */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/6 w-1.5 h-1.5 rounded-full bg-[#FB7185]/40 shadow-[0_0_8px_#FB7185] animate-pulse" />
        <div className="absolute top-2/3 right-1/5 w-2 h-2 rounded-full bg-[#C084FC]/35 shadow-[0_0_10px_#C084FC] animate-pulse" />
        <div className="absolute top-1/2 left-2/3 w-1 h-1 rounded-full bg-[#FDA4AF]/50" />
      </div>

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-4 items-center">
          {/* Left Column: Asymmetrical Editorial Headline & Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-8 text-left"
          >
            {/* Eyebrow with OVASense Pulse */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                Intelligent Women's Health
              </span>
            </div>

            {/* Headline with Scientific Editorial Hierarchy */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              Your{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                health
              </span>{' '}
              is more than a single symptom.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed max-w-xl font-sans font-normal">
              OVASense brings together cycle patterns, symptoms, medical reports, and lifestyle information
              to help you understand your comprehensive health story over time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={ROUTES.APP.DASHBOARD}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-xl shadow-purple-950/30"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore OVASense
                </Button>
              </Link>

              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm"
                >
                  How It Works
                </Button>
              </Link>
            </div>

            {/* Scientific Trust Meta Indicator */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-5 text-[11px] font-bold tracking-wider uppercase text-[#B4A6C7]/80">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FB7185]" />
                AI-Assisted
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Longitudinal</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Human-Centered</span>
            </div>
          </motion.div>

          {/* Right Column: Lightweight GPU-Accelerated Organic Intelligence Core */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] sm:min-h-[540px]"
          >
            <div className="w-full h-full relative">
              <BiologicalOrb className="w-full h-[460px] sm:h-[540px]" showAnnotations={true} />
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
