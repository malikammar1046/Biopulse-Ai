import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Heart, Activity, Sparkles, Layers } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';

export const AboutHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[85vh] bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#F8FAFC] text-[#162A45] pt-32 pb-20 sm:pb-28 overflow-hidden flex items-center border-b border-slate-200/80">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Mission Narrative */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-7 text-left"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Our Purpose
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#162A45] leading-[1.1] font-display">
              Reproductive health is{' '}
              <span className="text-[#0891B2]">
                complex.
              </span>{' '}
              Understanding it shouldn't be.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-sans font-normal">
              BioPulse AI turns fragmented symptoms, scattered laboratory reports, and everyday health observations into explainable, non-diagnostic screening support. With dedicated pathways for PCOS and Male Hypogonadism, we provide accessible health literacy and doctor-ready summaries.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-lg shadow-cyan-600/20 font-bold rounded-full"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore How It Works
                </Button>
              </Link>

              <Link to={ROUTES.CONDITIONS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-full"
                >
                  Supported Conditions
                </Button>
              </Link>
            </div>

            {/* Safety & Mission Meta */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-5 text-[11px] font-bold tracking-wider uppercase text-slate-500 font-mono">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Non-Diagnostic Screening
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0891B2]" />
                Explainable Feature Attribution
              </span>
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0284C7]" />
                Longitudinal Tracking
              </span>
            </div>
          </motion.div>

          {/* Right Column: Platform Architecture Visual Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5 relative"
          >
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#0891B2] block">
                    BioPulse AI Mission
                  </span>
                  <h3 className="text-xl font-bold font-display text-[#162A45]">
                    Closing Diagnostic Gaps
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Women with PCOS frequently face a 2 to 5 year delay before clinical identification. Men with hypogonadism often live with debilitating fatigue for years without testing morning testosterone.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-pink-200/80 flex items-center gap-3 text-xs text-slate-700">
                  <Heart className="w-4 h-4 text-[#E11D48] shrink-0" />
                  <span><strong>PCOS Pathway:</strong> Ovulatory, androgenic &amp; metabolic tracking</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-center gap-3 text-xs text-slate-700">
                  <Activity className="w-4 h-4 text-[#0284C7] shrink-0" />
                  <span><strong>Male Pathway:</strong> Testosterone signaling &amp; vitality screening</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default AboutHeroSection;
