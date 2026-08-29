import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, MessageCircleHeart } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';

export const ContactHeroSection: React.FC = () => {
  const scrollToForm = () => {
    const element = document.getElementById('contact-form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-[88vh] bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white pt-32 pb-24 sm:pb-32 overflow-hidden flex items-center">
      {/* Cinematic Ambient Biological Glows */}
      <div className="absolute top-1/4 left-1/5 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] bg-[#6E2D8B]/25 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/5 w-[500px] sm:w-[650px] h-[500px] sm:h-[650px] bg-[#E87084]/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#A21CAF]/20 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Floating Translucent Organic Particles & Follicle Spheres */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {[
          { top: '18%', left: '12%', size: 'w-3 h-3', color: 'bg-[#FB7185]', duration: 6, delay: 0 },
          { top: '28%', right: '15%', size: 'w-4 h-4', color: 'bg-[#C084FC]', duration: 7, delay: 1 },
          { bottom: '22%', left: '18%', size: 'w-2.5 h-2.5', color: 'bg-[#FDA4AF]', duration: 5, delay: 2 },
          { bottom: '30%', right: '22%', size: 'w-5 h-5', color: 'bg-[#E879F9]', duration: 8, delay: 0.5 },
          { top: '45%', left: '8%', size: 'w-2 h-2', color: 'bg-white', duration: 4.5, delay: 1.5 },
          { top: '60%', right: '10%', size: 'w-3.5 h-3.5', color: 'bg-[#8E3EAF]', duration: 6.5, delay: 2.5 },
          { bottom: '15%', left: '42%', size: 'w-3 h-3', color: 'bg-[#E87084]', duration: 5.5, delay: 1.2 },
        ].map((particle, idx) => (
          <motion.div
            key={idx}
            animate={{
              y: [-12, 12, -12],
              x: [-6, 6, -6],
              opacity: [0.35, 0.85, 0.35],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute ${particle.size} rounded-full ${particle.color} shadow-[0_0_12px_rgba(232,112,132,0.5)] blur-[0.5px]`}
            style={{
              top: particle.top,
              left: particle.left,
              right: particle.right,
              bottom: particle.bottom,
            }}
          />
        ))}
      </div>

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Content */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Eyebrow Pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_10px_#FB7185] animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                Connect with OVASense
              </span>
              <Sparkles className="w-3.5 h-3.5 text-[#E879F9]" />
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] font-display"
            >
              Let's build a better{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                understanding
              </span>{' '}
              of women's health.
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg sm:text-xl text-[#B4A6C7] leading-relaxed max-w-2xl font-sans font-normal"
            >
              Whether you're exploring OVASense, interested in research, or want to collaborate with us, we'd love to hear from you.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={scrollToForm}
                className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-xl shadow-purple-950/40 cursor-pointer"
                iconRight={<MessageCircleHeart className="w-5 h-5" />}
              >
                Start a Conversation
              </Button>

              <Link to={ROUTES.FEATURES}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore OVASense
                </Button>
              </Link>
            </motion.div>

            {/* Micro Badge Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-[#B4A6C7]"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#34D399]" />
                <span className="font-semibold text-white/90">Responsibly Designed</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Multi-disciplinary Collaboration</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Privacy & Research First</span>
            </motion.div>
          </div>

          {/* Right Column: Abstract Biological Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center min-h-[380px] sm:min-h-[440px]"
          >
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
              {/* Outer Glowing Breathing Ring */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                  rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
                }}
                className="absolute inset-0 rounded-full border border-dashed border-[#C084FC]/30 bg-gradient-to-tr from-[#6E2D8B]/10 via-transparent to-[#E87084]/15 blur-xs"
              />

              {/* Follicle-inspired Glowing Spheres with Orbiting Animation */}
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-4 rounded-full pointer-events-none"
              >
                {/* Follicle 1 */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-br from-[#FB7185] to-[#A21CAF] p-0.5 shadow-[0_0_20px_#FB7185]">
                  <div className="w-full h-full rounded-full bg-[#180A25]/80 backdrop-blur-xs flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-[#FB7185] animate-ping" />
                  </div>
                </div>

                {/* Follicle 2 */}
                <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-gradient-to-br from-[#C084FC] to-[#6E2D8B] p-0.5 shadow-[0_0_16px_#C084FC]">
                  <div className="w-full h-full rounded-full bg-[#10071A]/80 backdrop-blur-xs flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#C084FC]" />
                  </div>
                </div>

                {/* Follicle 3 */}
                <div className="absolute bottom-10 left-6 w-9 h-9 rounded-full bg-gradient-to-br from-[#E879F9] to-[#E87084] p-0.5 shadow-[0_0_18px_#E879F9]">
                  <div className="w-full h-full rounded-full bg-[#180A25]/80 backdrop-blur-xs flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E879F9]" />
                  </div>
                </div>
              </motion.div>

              {/* Central Translucent Biological Core */}
              <motion.div
                animate={{
                  y: [-8, 8, -8],
                  scale: [1, 1.03, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-gradient-to-b from-[#2A1040]/80 via-[#180A25]/90 to-[#10071A] border border-white/15 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
              >
                {/* Thin flowing biological/data SVG curves */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
                  viewBox="0 0 200 200"
                  fill="none"
                >
                  <path
                    d="M20 100 C 60 20, 140 180, 180 100"
                    stroke="url(#core-grad1)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M30 140 C 70 60, 130 40, 170 160"
                    stroke="url(#core-grad2)"
                    strokeWidth="1"
                  />
                  <defs>
                    <linearGradient id="core-grad1" x1="0" y1="0" x2="200" y2="200">
                      <stop offset="0%" stopColor="#C084FC" />
                      <stop offset="100%" stopColor="#FB7185" />
                    </linearGradient>
                    <linearGradient id="core-grad2" x1="200" y1="0" x2="0" y2="200">
                      <stop offset="0%" stopColor="#8E3EAF" />
                      <stop offset="100%" stopColor="#E87084" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Inner Glowing Orb */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8E3EAF] via-[#A21CAF] to-[#E87084] flex items-center justify-center shadow-[0_0_30px_rgba(232,112,132,0.6)] mb-3 group">
                  <MessageCircleHeart className="w-8 h-8 text-white animate-pulse" />
                </div>
                <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#E879F9]">
                  OVASense Ecosystem
                </span>
                <p className="text-xs text-[#B4A6C7] mt-1 font-sans">
                  Open for Research & Partnerships
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
