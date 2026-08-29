import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Calendar, FileCheck2, HeartPulse, Sparkles, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const SolutionSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#241038] via-[#35144F] to-[#4A154B] text-white overflow-hidden">
      {/* Rich Orchid Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#8E3EAF]/25 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#E879F9] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Unified OVASense Ecosystem</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            We{' '}
            <span className="bg-gradient-to-r from-[#E879F9] via-[#FB7185] to-[#FDA4AF] bg-clip-text text-transparent">
              connect the pieces.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#EDE4F7] leading-relaxed font-sans max-w-2xl mx-auto">
            OVASense turns scattered health information into a structured, understandable picture that can be
            monitored longitudinally and reviewed with healthcare professionals.
          </p>
        </div>

        {/* Central Convergence Architecture Diagram */}
        <div className="relative max-w-4xl mx-auto p-8 sm:p-14 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Animated Connecting Particle Rays */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full border border-dashed border-[#C084FC]/30 animate-[spin_40s_linear_infinite]" />
            <div className="absolute w-56 h-56 rounded-full border border-[#FB7185]/20 animate-[spin_25s_linear_infinite_reverse]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
            {/* Left Stream Node (Cycle + Symptoms) */}
            <div className="space-y-6">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#8E3EAF] text-white flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Cycle Dynamics</h4>
                    <span className="text-[10px] text-[#C084FC] uppercase font-semibold">Continuous Record</span>
                  </div>
                </div>
                <p className="text-xs text-[#EDE4F7] leading-relaxed">
                  Tracks follicular and luteal timing alongside cycle irregularity metrics.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#A21CAF] text-white flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Symptom Observation</h4>
                    <span className="text-[10px] text-[#FDA4AF] uppercase font-semibold">Multivariate Logging</span>
                  </div>
                </div>
                <p className="text-xs text-[#EDE4F7] leading-relaxed">
                  Daily tracking for acne, hirsutism, mood, sleep, and pelvic comfort.
                </p>
              </motion.div>
            </div>

            {/* Central OVASense Fusion Hub */}
            <div className="text-center my-6 md:my-0 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#8E3EAF] to-[#E87084] blur-xl opacity-60 animate-pulse" />
                
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-[#8E3EAF] via-[#A21CAF] to-[#E87084] p-1 shadow-2xl flex flex-col items-center justify-center text-white border border-white/25">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold tracking-wider font-display">
                    OVASENSE
                  </span>
                  <span className="text-[9px] uppercase tracking-widest text-purple-100 font-semibold">
                    Core Fusion
                  </span>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-semibold text-[#EDE4F7] border border-white/15">
                <CheckCircle2 className="w-3 h-3 text-[#34D399]" />
                <span>Multimodal Health Record</span>
              </div>
            </div>

            {/* Right Stream Node (Verified Reports + Lifestyle) */}
            <div className="space-y-6">
              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#6E2D8B] text-white flex items-center justify-center">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Verified Lab Reports</h4>
                    <span className="text-[10px] text-[#C084FC] uppercase font-semibold">OCR Verification</span>
                  </div>
                </div>
                <p className="text-xs text-[#EDE4F7] leading-relaxed">
                  User-confirmed hormone panels (LH, FSH, AMH) and pelvic ultrasound metrics.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                className="p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-[#047857] text-white flex items-center justify-center">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Lifestyle Context</h4>
                    <span className="text-[10px] text-[#34D399] uppercase font-semibold">Supportive Guidance</span>
                  </div>
                </div>
                <p className="text-xs text-[#EDE4F7] leading-relaxed">
                  Nutrition, sleep pacing, and physical activity linked to health trajectories.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
