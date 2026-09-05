import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Sparkles, Stethoscope, Users, UserCheck, Cpu, Lock } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';

export const CareCircleHeroSection: React.FC = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-20 sm:pt-36 sm:pb-28 bg-[#10071A] text-white overflow-hidden">
      {/* ── Background Biological Glow Fields ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[550px] sm:h-[700px] bg-[#6E2D8B]/25 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute top-2/3 right-10 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#E87084]/18 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-[#A21CAF]/15 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── Left Column: Headline & Value Proposition ── */}
          <div className="lg:col-span-6 space-y-8 text-left">
            {/* Pill Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
            >
              <ShieldCheck className="w-4 h-4 text-[#FB7185]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6F2FA]">
                Care Circle Ecosystem
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-display leading-[1.1]">
                Your health doesn't have to be{' '}
                <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                  managed alone.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-[#EDE4F7] font-medium leading-snug">
                "Your health. Your people. Your permission."
              </p>
            </motion.div>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-xl font-normal"
            >
              Connect the people you trust to the parts of your health journey you choose to share — from weekly routines and reports to appointments, reminders, and meaningful longitudinal health patterns.
            </motion.p>

            {/* Core Principle Quote Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="p-4 sm:p-5 rounded-2xl bg-[#180A25]/80 border border-white/10 backdrop-blur-md text-sm text-[#F6F2FA] space-y-1.5 shadow-xl shadow-purple-950/30"
            >
              <div className="flex items-center gap-2 text-[#E879F9] font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Core Principle</span>
              </div>
              <p className="italic text-[#EDE4F7] font-sans leading-relaxed text-xs sm:text-sm">
                “VITASense doesn't just help you understand your health. It helps the right people support you — with your explicit permission.”
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={() => scrollToSection('care-circle-network')}
                className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-2xl shadow-purple-950/60 cursor-pointer px-8 rounded-2xl"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Explore Care Circle
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection('care-circle-permissions')}
                className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm px-7 rounded-2xl cursor-pointer"
              >
                See How Sharing Works
              </Button>
            </motion.div>
          </div>

          {/* ── Right Column: Interactive Biological Care Circle Visual ── */}
          <div className="lg:col-span-6 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-[500px] aspect-square flex items-center justify-center select-none"
            >
              {/* Outer Pulsing Aura Rings */}
              <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-[#8E3EAF]/25 pointer-events-none" />
              <div className="absolute inset-16 rounded-full border border-dashed border-[#FB7185]/20 pointer-events-none" />

              {/* Connecting Vector Lines with Organic Pulses */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="lineDoc" x1="200" y1="200" x2="200" y2="45" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#8E3EAF" />
                  </linearGradient>
                  <linearGradient id="lineFam" x1="200" y1="200" x2="45" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#C084FC" />
                  </linearGradient>
                  <linearGradient id="lineTrust" x1="200" y1="200" x2="355" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#E87084" />
                  </linearGradient>
                  <linearGradient id="lineAi" x1="200" y1="200" x2="200" y2="355" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#38BDF8" />
                  </linearGradient>
                </defs>

                {/* Animated Axis Lines */}
                <line x1="200" y1="200" x2="200" y2="55" stroke="url(#lineDoc)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
                <line x1="200" y1="200" x2="55" y2="200" stroke="url(#lineFam)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
                <line x1="200" y1="200" x2="345" y2="200" stroke="url(#lineTrust)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
                <line x1="200" y1="200" x2="200" y2="345" stroke="url(#lineAi)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
              </svg>

              {/* ── CENTER: Patient Glowing Profile Nucleus ── */}
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-20 flex flex-col items-center justify-center p-5 rounded-full bg-gradient-to-br from-[#8E3EAF] via-[#A21CAF] to-[#E87084] shadow-[0_0_50px_rgba(232,112,132,0.5)] border-2 border-white/40 cursor-default"
                style={{ width: 140, height: 140 }}
              >
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-1 shadow-inner">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-extrabold font-display text-white tracking-wide">
                  PATIENT
                </span>
                <span className="text-[10px] uppercase font-bold text-white/90 tracking-wider">
                  You in Control
                </span>
                <div className="absolute -bottom-2 bg-[#10071A] px-2.5 py-0.5 rounded-full border border-[#FB7185]/60 flex items-center gap-1 text-[9px] font-mono text-[#FB7185]">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Secure Hub</span>
                </div>
              </motion.div>

              {/* ── TOP NODE: Doctor ── */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
              >
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#180A25]/95 border border-[#8E3EAF]/60 shadow-xl shadow-purple-950/50 backdrop-blur-xl">
                  <div className="w-8 h-8 rounded-xl bg-[#8E3EAF]/20 border border-[#8E3EAF]/40 flex items-center justify-center text-[#C084FC]">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white font-display">Dr. Ahmed</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
                    </div>
                    <span className="text-[10px] text-[#B4A6C7] block">Clinician • Ob/Gyn</span>
                  </div>
                </div>
                <span className="mt-1 text-[9px] font-mono text-[#C084FC] bg-white/10 px-2 py-0.5 rounded-full">
                  Weekly Brief View
                </span>
              </motion.div>

              {/* ── LEFT NODE: Family ── */}
              <motion.div
                animate={{ x: [-4, 4, -4] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center max-w-[130px]"
              >
                <div className="p-3 rounded-2xl bg-[#180A25]/95 border border-[#C084FC]/50 shadow-xl shadow-purple-950/50 backdrop-blur-xl text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-[#C084FC]/20 border border-[#C084FC]/40 flex items-center justify-center text-[#E879F9]">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white block font-display">Family</span>
                  <span className="text-[9px] text-[#B4A6C7] block">Aisha (Sister)</span>
                  <span className="text-[8.5px] font-mono text-[#34D399] block">Selected Reminders</span>
                </div>
              </motion.div>

              {/* ── RIGHT NODE: Trusted Person ── */}
              <motion.div
                animate={{ x: [4, -4, 4] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center max-w-[130px]"
              >
                <div className="p-3 rounded-2xl bg-[#180A25]/95 border border-[#FB7185]/50 shadow-xl shadow-purple-950/50 backdrop-blur-xl text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-xl bg-[#FB7185]/20 border border-[#FB7185]/40 flex items-center justify-center text-[#FB7185]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white block font-display">Care Partner</span>
                  <span className="text-[9px] text-[#B4A6C7] block">Trusted Support</span>
                  <span className="text-[8.5px] font-mono text-[#FB7185] block">Routine Updates</span>
                </div>
              </motion.div>

              {/* ── BOTTOM NODE: VITASense AI ── */}
              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
              >
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#180A25]/95 border border-[#38BDF8]/50 shadow-xl shadow-purple-950/50 backdrop-blur-xl">
                  <div className="w-8 h-8 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white font-display block">VITASense AI</span>
                    <span className="text-[10px] text-[#B4A6C7] block">Longitudinal Intelligence</span>
                  </div>
                </div>
                <span className="mt-1 text-[9px] font-mono text-[#38BDF8] bg-white/10 px-2 py-0.5 rounded-full">
                  Pattern Engine & Privacy Shield
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
