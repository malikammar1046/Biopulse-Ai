import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Activity, FileText, HeartPulse, Calendar, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';
import { VitalOrb } from '../../../components/3d/VitalOrb';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white pt-28 pb-20 sm:pb-28 overflow-hidden flex items-center">
      {/* Cinematic Ambient Radial Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#E87084]/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] bg-[#A21CAF]/20 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 space-y-8 text-left"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#FB7185] animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
                Intelligent Women's Health
              </span>
            </div>

            {/* Headline with Editorial Gradient Highlights */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              Your{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                health
              </span>{' '}
              is more than a single symptom.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg lg:text-xl text-[#B4A6C7] leading-relaxed max-w-2xl font-sans font-normal">
              PMOSense brings together cycle patterns, symptoms, medical reports, and lifestyle information
              to help you understand your comprehensive health story over time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={ROUTES.APP.DASHBOARD}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-lg shadow-purple-950/30"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore PMOSense
                </Button>
              </Link>

              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust Meta Indicator */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-[11px] font-bold tracking-wider uppercase text-[#B4A6C7]/80">
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

          {/* Right Column: 3D Biological Ovary Intelligence Object + Floating Labels */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] sm:min-h-[500px]"
          >
            {/* 3D Scene */}
            <div className="w-full h-full relative">
              <VitalOrb className="w-full h-[420px] sm:h-[500px]" />

              {/* Floating Data Tag 1: Cycle Patterns */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="absolute top-6 left-2 sm:-left-4 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl flex items-center gap-2.5 text-xs text-[#F6F2FA]"
              >
                <div className="w-6 h-6 rounded-lg bg-[#8E3EAF]/40 flex items-center justify-center text-[#C084FC]">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold block text-[11px]">Cycle Patterns</span>
                  <span className="text-[10px] text-[#B4A6C7]">Follicular & Luteal</span>
                </div>
              </motion.div>

              {/* Floating Data Tag 2: Symptoms */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.5 }}
                className="absolute top-8 right-2 sm:-right-4 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl flex items-center gap-2.5 text-xs text-[#F6F2FA]"
              >
                <div className="w-6 h-6 rounded-lg bg-[#E87084]/40 flex items-center justify-center text-[#FB7185]">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold block text-[11px]">Symptom Signals</span>
                  <span className="text-[10px] text-[#B4A6C7]">Multivariate Logging</span>
                </div>
              </motion.div>

              {/* Floating Data Tag 3: Verified Reports */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="absolute bottom-6 left-4 sm:left-0 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl flex items-center gap-2.5 text-xs text-[#F6F2FA]"
              >
                <div className="w-6 h-6 rounded-lg bg-[#A21CAF]/40 flex items-center justify-center text-[#E879F9]">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold block text-[11px]">Verified Reports</span>
                  <span className="text-[10px] text-[#B4A6C7]">OCR Lab Panels</span>
                </div>
              </motion.div>

              {/* Floating Data Tag 4: Lifestyle */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.15, duration: 0.5 }}
                className="absolute -bottom-2 right-4 sm:right-2 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-xl flex items-center gap-2.5 text-xs text-[#F6F2FA]"
              >
                <div className="w-6 h-6 rounded-lg bg-[#047857]/40 flex items-center justify-center text-[#34D399]">
                  <HeartPulse className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="font-bold block text-[11px]">Lifestyle Habits</span>
                  <span className="text-[10px] text-[#B4A6C7]">Daily Context</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
