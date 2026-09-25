import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Sparkles, Stethoscope, Users, UserCheck, Cpu, Lock } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';
import { SmallBotanicalSprig } from '../../../components/brand/BotanicalFoliage';

export const CareCircleHeroSection: React.FC = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[85vh] bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#F8FAFC] text-[#162A45] pt-32 pb-20 sm:pb-28 overflow-hidden flex items-center border-b border-slate-200/80">
      {/* ── Soft Ambient Glows ── */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* ── Small Botanical Sprigs ── */}
      <div className="hidden lg:block absolute top-28 left-8 opacity-65 pointer-events-none -rotate-12">
        <SmallBotanicalSprig variant="pink" className="w-18 h-auto" />
      </div>
      <div className="hidden lg:block absolute top-28 right-8 opacity-65 pointer-events-none rotate-12">
        <SmallBotanicalSprig variant="teal" flip className="w-18 h-auto" />
      </div>

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ── Left Column: Headline & Value Proposition ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-7 text-left"
          >
            {/* Pill Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#0891B2]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                Care Circle Ecosystem
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#162A45] tracking-tight font-display leading-[1.1]">
              Your health doesn't have to be{' '}
              <span className="text-[#0891B2]">
                managed alone.
              </span>
            </h1>

            {/* Tagline */}
            <p className="text-base sm:text-lg font-semibold text-[#0284C7] font-display">
              "Your health. Your people. Your permission."
            </p>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-sans font-normal">
              Connect the people you trust to the parts of your health journey you choose to share — from weekly routines and lab summaries to appointments, reminders, and longitudinal trends.
            </p>

            {/* Core Principle Quote Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-sm text-slate-700 space-y-1.5">
              <div className="flex items-center gap-2 text-[#0891B2] font-semibold text-xs uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Core Principle</span>
              </div>
              <p className="italic text-slate-600 font-sans leading-relaxed text-xs sm:text-sm">
                “BioPulse AI doesn't just help you understand your health. It helps the right people support you — with your explicit, revocable permission.”
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => scrollToSection('care-circle-network')}
                className="bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-lg shadow-cyan-600/20 font-bold rounded-full px-8 cursor-pointer"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Explore Care Circle
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollToSection('care-circle-permissions')}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-full px-7 cursor-pointer"
              >
                See How Sharing Works
              </Button>
            </div>

            {/* Safety & Control Strip */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-5 text-[11px] font-bold tracking-wider uppercase text-slate-500 font-mono">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero-Compromise Consent
              </span>
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0891B2]" />
                Instant Access Revocation
              </span>
            </div>
          </motion.div>

          {/* ── Right Column: Interactive Care Circle Visual on Clean White Card ── */}
          <div className="lg:col-span-6 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative w-full max-w-[500px] aspect-square rounded-3xl bg-white border border-slate-200/90 shadow-xl flex items-center justify-center p-6 select-none overflow-hidden"
            >
              {/* Outer Pulsing Aura Rings */}
              <div className="absolute inset-4 rounded-full border border-slate-100 pointer-events-none" />
              <div className="absolute inset-12 rounded-full border border-dashed border-cyan-200/80 pointer-events-none" />
              <div className="absolute inset-20 rounded-full border border-sky-100 pointer-events-none" />

              {/* Connecting Vector Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
                <defs>
                  <linearGradient id="lineDoc" x1="200" y1="200" x2="200" y2="45" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0891B2" />
                    <stop offset="100%" stopColor="#0284C7" />
                  </linearGradient>
                  <linearGradient id="lineFam" x1="200" y1="200" x2="45" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0891B2" />
                    <stop offset="100%" stopColor="#E11D48" />
                  </linearGradient>
                  <linearGradient id="lineTrust" x1="200" y1="200" x2="355" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0891B2" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                  <linearGradient id="lineAi" x1="200" y1="200" x2="200" y2="355" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0891B2" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>

                {/* Animated Axis Lines */}
                <line x1="200" y1="200" x2="200" y2="60" stroke="url(#lineDoc)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
                <line x1="200" y1="200" x2="60" y2="200" stroke="url(#lineFam)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
                <line x1="200" y1="200" x2="340" y2="200" stroke="url(#lineTrust)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
                <line x1="200" y1="200" x2="200" y2="340" stroke="url(#lineAi)" strokeWidth="2.5" strokeDasharray="5,4" className="animate-pulse" />
              </svg>

              {/* ── CENTER: Patient Glowing Profile Nucleus ── */}
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-20 flex flex-col items-center justify-center p-4 rounded-full bg-gradient-to-tr from-[#00C4DF] to-[#0284C7] shadow-xl shadow-cyan-900/20 border-4 border-white cursor-default text-white"
                style={{ width: 130, height: 130 }}
              >
                <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-1 shadow-inner">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-extrabold font-display tracking-wider text-white">
                  YOU
                </span>
                <span className="text-[9px] uppercase font-bold text-white/90 tracking-wider">
                  Full Control
                </span>
                <div className="absolute -bottom-2.5 bg-white px-2.5 py-0.5 rounded-full border border-cyan-200 shadow-xs flex items-center gap-1 text-[9px] font-mono font-bold text-[#0891B2]">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Secure Hub</span>
                </div>
              </motion.div>

              {/* ── TOP NODE: Doctor ── */}
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
              >
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-sky-200 shadow-md">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284C7]">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#162A45] font-display">Dr. Ahmed</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Clinician • Ob/Gyn</span>
                  </div>
                </div>
                <span className="mt-1 text-[9px] font-mono font-semibold text-[#0284C7] bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
                  Weekly Brief View
                </span>
              </motion.div>

              {/* ── LEFT NODE: Family ── */}
              <motion.div
                animate={{ x: [-3, 3, -3] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center max-w-[125px]"
              >
                <div className="p-3 rounded-2xl bg-white border border-rose-200 shadow-md text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#E11D48]">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#162A45] block font-display">Family</span>
                  <span className="text-[10px] text-slate-500 block">Aisha (Sister)</span>
                  <span className="text-[9px] font-mono font-bold text-[#059669] block">Selected Reminders</span>
                </div>
              </motion.div>

              {/* ── RIGHT NODE: Trusted Person ── */}
              <motion.div
                animate={{ x: [3, -3, 3] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center max-w-[125px]"
              >
                <div className="p-3 rounded-2xl bg-white border border-purple-200 shadow-md text-center space-y-1">
                  <div className="w-7 h-7 mx-auto rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#7C3AED]">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#162A45] block font-display">Care Partner</span>
                  <span className="text-[10px] text-slate-500 block">Trusted Support</span>
                  <span className="text-[9px] font-mono font-bold text-[#7C3AED] block">Routine Updates</span>
                </div>
              </motion.div>

              {/* ── BOTTOM NODE: BIOPulse AI ── */}
              <motion.div
                animate={{ y: [3, -3, 3] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center"
              >
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-emerald-200 shadow-md">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#162A45] font-display block">BioPulse AI</span>
                    <span className="text-[10px] text-slate-500 block">Longitudinal Intelligence</span>
                  </div>
                </div>
                <span className="mt-1 text-[9px] font-mono font-semibold text-[#059669] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Pattern Engine &amp; Privacy Shield
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
};
