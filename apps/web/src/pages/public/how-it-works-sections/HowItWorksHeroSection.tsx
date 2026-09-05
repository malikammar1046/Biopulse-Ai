import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Sparkles, Heart, Activity, UserCheck } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../constants/routes';

export const HowItWorksHeroSection: React.FC = () => {
  return (
    <section className="relative min-h-[90vh] bg-gradient-to-b from-[#10071A] via-[#150A24] to-[#1D0D32] text-white pt-32 pb-20 overflow-hidden flex flex-col items-center justify-between select-none">
      {/* 1. Atmospheric Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[550px] bg-gradient-to-tr from-[#6E2D8B]/25 via-[#0284C7]/20 to-[#E87084]/20 rounded-full blur-[170px]" />
        <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-[#A21CAF]/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-[#38BDF8]/15 rounded-full blur-[140px]" />
      </div>

      {/* 2. Central Platform Narrative */}
      <Container size="xl" className="relative z-10 w-full text-center space-y-8 my-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Platform Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl text-xs font-semibold text-[#EDE4F7] shadow-lg shadow-purple-950/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FB7185] animate-pulse" />
            <span className="tracking-wide uppercase text-[11px] font-mono">
              Unified Reproductive Health Screening Ecosystem
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7.5xl font-extrabold font-display tracking-tight text-white leading-[1.08]"
          >
            How VITASense{' '}
            <span className="bg-gradient-to-r from-[#38BDF8] via-[#C084FC] to-[#FB7185] bg-clip-text text-transparent">
              Works.
            </span>
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-xl md:text-2xl text-[#CDBDD8] max-w-3xl mx-auto font-sans leading-relaxed"
          >
            VITASense turns the health information you already have into a clearer picture — helping you{' '}
            <span className="text-white font-medium">understand, assess, prioritize, and track</span> your health over time.
          </motion.p>

          {/* Secondary Messaging */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="text-xs sm:text-sm font-mono text-[#A797BD] tracking-wide"
          >
            Start with what you know • Add information as it becomes available • Understand what changes
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link to={ROUTES.ONBOARDING}>
              <Button
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-xl shadow-purple-950/40 hover:brightness-110 cursor-pointer"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Start Your Assessment
              </Button>
            </Link>

            <a href="#journey-start">
              <Button
                variant="outline"
                size="lg"
                className="border-white/25 text-white hover:bg-white/10 cursor-pointer backdrop-blur-md"
              >
                Explore The Workflow
              </Button>
            </a>
          </motion.div>
        </div>

        {/* 3. Three User Groups Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-12 p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl shadow-2xl"
        >
          <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#B4A6C7] mb-6">
            One Core Intelligence Layer — Three Personalized Health Journeys
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {/* Women's Health */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#FB7185]/40 transition-all space-y-2">
              <div className="flex items-center gap-2 text-[#FB7185]">
                <Heart className="w-4 h-4 fill-current" />
                <span className="text-xs font-mono font-bold uppercase">Women's Health</span>
              </div>
              <h4 className="text-sm font-bold font-display text-white">PCOS Pathway</h4>
              <p className="text-[11px] text-[#CDBDD8] leading-relaxed">
                Cycle patterns, androgen signs, follicular dynamics, and metabolic risk assessments.
              </p>
            </div>

            {/* Men's Health */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#38BDF8]/40 transition-all space-y-2">
              <div className="flex items-center gap-2 text-[#38BDF8]">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase">Men's Health</span>
              </div>
              <h4 className="text-sm font-bold font-display text-white">Male Hypogonadism</h4>
              <p className="text-[11px] text-[#CDBDD8] leading-relaxed">
                HPT signaling axis, morning testosterone timing, vitality symptoms, and gonadotropins.
              </p>
            </div>

            {/* General Baseline */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#C084FC]/40 transition-all space-y-2">
              <div className="flex items-center gap-2 text-[#C084FC]">
                <UserCheck className="w-4 h-4" />
                <span className="text-xs font-mono font-bold uppercase">General Baseline</span>
              </div>
              <h4 className="text-sm font-bold font-display text-white">Reproductive Health Monitoring</h4>
              <p className="text-[11px] text-[#CDBDD8] leading-relaxed">
                Organize medical records, track health baselines, and monitor subtle changes over time.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>

      {/* 4. Subtle Scroll Cue */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10 text-center flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-opacity cursor-pointer pt-6 pb-2"
      >
        <a href="#journey-start" className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase font-mono font-bold tracking-[0.25em] text-[#B4A6C7]">
            Scroll To Explore The Journey
          </span>
          <ChevronDown className="w-4 h-4 text-[#FB7185]" />
        </a>
      </motion.div>
    </section>
  );
};
