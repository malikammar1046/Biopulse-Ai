import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';
import { ReproductiveSystem3D } from '../../../components/3d/ReproductiveSystem3D';

export const HowItWorksHeroSection: React.FC = () => {
  const [labelsVisible, setLabelsVisible] = useState(false);

  return (
    <section className="relative min-h-[95vh] bg-gradient-to-b from-[#10071A] via-[#1C0B2B] to-[#35144F] text-white pt-28 pb-20 sm:pb-32 overflow-hidden flex items-center">
      {/* Multi-Layer Depth Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/25 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#E87084]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-[#A21CAF]/22 rounded-full blur-[110px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center">
          {/* Left Column: Editorial Headline */}
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
                How PMOSense Works
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              From scattered health information to a{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                clearer picture.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed max-w-xl font-sans font-normal">
              PMOSense connects cycle patterns, symptoms, medical reports, and lifestyle information into a
              structured health journey designed to help users understand patterns over time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a href="#journey-start">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-xl shadow-purple-950/30"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore the Journey
                </Button>
              </a>

              <Link to={ROUTES.ABOUT}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm"
                  iconRight={<BookOpen className="w-4 h-4" />}
                >
                  Learn About PMOSense
                </Button>
              </Link>
            </div>

            {/* Trust Indicator */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-5 text-[11px] font-bold tracking-wider uppercase text-[#B4A6C7]/80">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FB7185]" />
                Biological Signals + Health Data + AI
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Human-in-the-Loop</span>
            </div>
          </motion.div>

          {/* Right Column: Central 3D Female Reproductive System with Complete Anatomical Labels */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative flex items-center justify-center min-h-[480px] sm:min-h-[560px]"
          >
            <div className="w-full h-full relative">
              <ReproductiveSystem3D
                className="w-full h-[480px] sm:h-[560px]"
                onSettle={() => setLabelsVisible(true)}
                showDataNodes={true}
              />

              {/* 1. UTERUS Label (Center Top) */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={labelsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="absolute top-2 left-1/2 -translate-x-1/2 text-center pointer-events-none"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C084FC] shadow-[0_0_8px_#C084FC]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Uterus
                  </span>
                </div>
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#C084FC]/80 to-transparent mx-auto mt-0.5" />
                <span className="text-[9px] text-[#B4A6C7] block">Central Reproductive Core</span>
              </motion.div>

              {/* 2. LEFT OVARY Label (Left) */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={labelsVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="absolute top-1/4 left-0 sm:-left-2 text-left pointer-events-none"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Left Ovary
                  </span>
                </div>
                <div className="w-20 h-[1px] bg-gradient-to-r from-[#FB7185]/80 to-transparent mt-0.5" />
                <span className="text-[9px] text-[#B4A6C7] block">Follicular Reserve</span>
              </motion.div>

              {/* 3. RIGHT OVARY Label (Right) */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={labelsVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute top-1/4 right-0 sm:-right-2 text-right pointer-events-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Right Ovary
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185]" />
                </div>
                <div className="w-20 h-[1px] bg-gradient-to-l from-[#FB7185]/80 to-transparent mt-0.5 ml-auto" />
                <span className="text-[9px] text-[#B4A6C7] block">Bilateral Signaling</span>
              </motion.div>

              {/* 4. FALLOPIAN TUBES Label (Upper Lateral) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={labelsVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="absolute top-12 left-8 text-left pointer-events-none"
              >
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D8B4FE]" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D8B4FE]">
                    Fallopian Tubes
                  </span>
                </div>
              </motion.div>

              {/* 5. CERVIX Label (Mid Bottom) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={labelsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center pointer-events-none"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#EDE4F7]">
                    Cervix
                  </span>
                </div>
                <span className="text-[9px] text-[#B4A6C7] block">Cervical Transition</span>
              </motion.div>

              {/* 6. VAGINA Label (Bottom Center) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={labelsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.85 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E87084]" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FDA4AF]">
                    Vagina
                  </span>
                </div>
                <span className="text-[9px] text-[#B4A6C7] block">Reproductive Pathway</span>
              </motion.div>

              {/* 7. FOLLICLES Label (Bottom Right) */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={labelsVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="absolute bottom-14 right-2 sm:right-4 text-right pointer-events-none"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white">
                    Follicles
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FDA4AF] shadow-[0_0_6px_#FDA4AF]" />
                </div>
                <span className="text-[9px] text-[#B4A6C7] block">Ultrasonic Signal Nodes</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
