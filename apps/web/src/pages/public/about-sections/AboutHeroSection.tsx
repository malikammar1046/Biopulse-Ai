import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ShieldCheck, Heart, Activity, UserCheck, Sparkles } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';

export const AboutHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[88vh] bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white pt-32 pb-20 sm:pb-28 overflow-hidden flex items-center">
      {/* Cinematic Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/25 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#E87084]/20 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-[#A21CAF]/25 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Mission Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-8 text-left"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                About VITASense
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-6.5xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              Reproductive health is{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                complex.
              </span>{' '}
              Understanding it shouldn't be.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed max-w-xl font-sans font-normal">
              VITASense turns fragmented symptoms, scattered laboratory reports, and daily observations into a single, explainable health story. One unified intelligence layer supporting Women's Health (PCOS), Men's Health (Male Hypogonadism), and baseline monitoring for everyone.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-xl shadow-purple-950/30 font-bold"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore How It Works
                </Button>
              </Link>

              <Link to={ROUTES.FEATURES}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm font-semibold"
                  iconRight={<BookOpen className="w-4 h-4" />}
                >
                  Platform Features
                </Button>
              </Link>
            </div>

            {/* Safety & Mission Meta */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-5 text-[11px] font-bold tracking-wider uppercase text-[#B4A6C7]/80">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                Non-Diagnostic Screening
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FDA4AF]" />
                Explainable Feature Attribution
              </span>
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#60A5FA]" />
                Longitudinal Monitoring
              </span>
            </div>
          </motion.div>

          {/* Right Column: Platform Architecture Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-6 relative"
          >
            <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#FDA4AF] block">
                    Unified Platform Architecture
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    One Platform • Three Dedicated Journeys
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#8E3EAF]/30 text-[#C084FC] text-xs font-mono font-bold border border-[#8E3EAF]/40">
                  v2.0 Architecture
                </span>
              </div>

              {/* Pathway 1: Women's Health */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:border-[#FB7185]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FB7185]/20 text-[#FB7185] flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Women's Health Pathway</h4>
                      <span className="text-[11px] text-[#FDA4AF] font-mono">PCOS Risk Assessment & Pattern Screening</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#B4A6C7] font-mono uppercase bg-white/5 px-2 py-0.5 rounded-md">
                    Endocrine & Cycle
                  </span>
                </div>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Cycle regularity intervals, androgen scores (Ferriman-Gallwey), metabolic glucose trends, and structured lab summaries.
                </p>
              </div>

              {/* Pathway 2: Men's Health */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:border-[#60A5FA]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Men's Health Pathway</h4>
                      <span className="text-[11px] text-[#60A5FA] font-mono">Male Hypogonadism Screening & HPT Axis</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#B4A6C7] font-mono uppercase bg-white/5 px-2 py-0.5 rounded-md">
                    Testosterone Rhythm
                  </span>
                </div>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Morning testosterone timing confirmation (7–10 AM), pituitary LH/FSH profiles, vitality symptom tracking, and sleep metrics.
                </p>
              </div>

              {/* Pathway 3: General / Baseline */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 hover:border-[#34D399]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#047857]/20 text-[#34D399] flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Baseline Health Journey</h4>
                      <span className="text-[11px] text-[#34D399] font-mono">Health Monitoring & Report Archival</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#B4A6C7] font-mono uppercase bg-white/5 px-2 py-0.5 rounded-md">
                    Wellness Baseline
                  </span>
                </div>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Establish a reproductive health baseline, organize health records, learn about endocrine health, and track changes over time.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
