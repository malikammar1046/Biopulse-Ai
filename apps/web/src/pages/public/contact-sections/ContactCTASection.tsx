import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircleHeart, Sparkles } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';

export const ContactCTASection: React.FC = () => {
  const scrollToForm = () => {
    const element = document.getElementById('contact-form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative py-28 sm:py-36 bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#0A0412] text-white overflow-hidden text-center border-t border-white/10">
      {/* Giant Blurred Orchid & Blush Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-[#6E2D8B]/30 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/22 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Extremely Subtle Biological Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {[
          { top: '25%', left: '15%', size: 'w-3 h-3', color: 'bg-[#FB7185]' },
          { top: '35%', right: '18%', size: 'w-2.5 h-2.5', color: 'bg-[#C084FC]' },
          { bottom: '30%', left: '22%', size: 'w-4 h-4', color: 'bg-[#E879F9]' },
          { bottom: '20%', right: '20%', size: 'w-2 h-2', color: 'bg-[#FDA4AF]' },
        ].map((p, idx) => (
          <motion.div
            key={idx}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 5 + idx,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute ${p.size} rounded-full ${p.color} shadow-lg blur-[0.5px]`}
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
          />
        ))}
      </div>

      {/* Animated Flowing Biological/Data Line SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        viewBox="0 0 1440 400"
        fill="none"
      >
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.8 }}
          viewport={{ once: true }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          d="M -100 200 C 300 50, 700 350, 1100 150 C 1300 50, 1500 250, 1600 200"
          stroke="url(#cta-data-gradient)"
          strokeWidth="2.5"
        />
        <defs>
          <linearGradient id="cta-data-gradient" x1="0" y1="0" x2="1440" y2="0">
            <stop offset="0%" stopColor="#6E2D8B" />
            <stop offset="35%" stopColor="#C084FC" />
            <stop offset="70%" stopColor="#E879F9" />
            <stop offset="100%" stopColor="#FB7185" />
          </linearGradient>
        </defs>
      </svg>

      <Container size="lg" className="relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E879F9]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Shaping the Future Together
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-display leading-[1.1]"
          >
            Your perspective{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              matters.
            </span>
          </motion.h2>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-[#B4A6C7] leading-relaxed max-w-xl mx-auto font-sans font-normal"
          >
            Better health technology starts by understanding the people it is built for.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={scrollToForm}
              className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-2xl shadow-purple-950/60 cursor-pointer px-8 rounded-2xl"
              iconRight={<MessageCircleHeart className="w-5 h-5" />}
            >
              Talk to BIOPulse AI
            </Button>

            <Link to={ROUTES.HOW_IT_WORKS}>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm px-8 rounded-2xl"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Learn How It Works
              </Button>
            </Link>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
