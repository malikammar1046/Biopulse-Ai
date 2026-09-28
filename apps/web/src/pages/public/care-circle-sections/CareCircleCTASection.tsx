import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';

export const CareCircleCTASection: React.FC = () => {
  return (
    <section className="relative py-28 sm:py-36 bg-gradient-to-b from-[#180A25] via-[#10071A] to-[#0A0412] text-white overflow-hidden text-center border-t border-white/10">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[600px] bg-[#6E2D8B]/30 rounded-full blur-[190px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[450px] sm:w-[650px] h-[450px] bg-[#E87084]/22 rounded-full blur-[170px] pointer-events-none -z-10" />

      {/* Subtle Floating Vitality Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-5">
        {[
          { top: '25%', left: '15%', size: 'w-3 h-3', color: 'bg-[#FB7185]' },
          { top: '35%', right: '18%', size: 'w-2.5 h-2.5', color: 'bg-[#C084FC]' },
          { bottom: '30%', left: '22%', size: 'w-4 h-4', color: 'bg-[#E879F9]' },
          { bottom: '20%', right: '20%', size: 'w-2 h-2', color: 'bg-[#FDA4AF]' },
        ].map((p, idx) => (
          <motion.div
            key={idx}
            animate={{ y: [-10, 10, -10], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 5 + idx, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute ${p.size} rounded-full ${p.color} shadow-lg blur-[0.5px]`}
            style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
          />
        ))}
      </div>

      <Container size="lg">
        <div className="space-y-8 max-w-3xl mx-auto">
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-[#FB7185]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step Into The Ecosystem
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
            Build your circle.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Keep your control.
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
            BIOPulse AI brings your health information together while keeping you in control of who gets to see it.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Link to={ROUTES.APP.DASHBOARD}>
              <Button
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-2xl shadow-purple-950/60 cursor-pointer px-8 rounded-2xl"
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                Explore BIOPulse AI
              </Button>
            </Link>

            <Link to={ROUTES.HOW_IT_WORKS}>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm px-8 rounded-2xl cursor-pointer"
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
