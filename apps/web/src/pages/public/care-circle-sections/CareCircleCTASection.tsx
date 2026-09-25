import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';

export const CareCircleCTASection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] overflow-hidden border-t border-slate-200/80">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-100/30 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-14 shadow-xl relative overflow-hidden"
        >
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Step Into The Ecosystem</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
              Build your circle.{' '}
              <span className="text-[#0891B2]">
                Keep your control.
              </span>
            </h2>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-xl mx-auto">
              BioPulse AI brings your health information together while keeping you in complete control of who gets to see it.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.APP.DASHBOARD}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-lg shadow-cyan-600/20 font-bold rounded-full px-8"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore BioPulse AI
                </Button>
              </Link>

              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-full px-8"
                >
                  Learn How It Works
                </Button>
              </Link>
            </div>

            {/* Trust Points */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Patient-Governed Access • HIPAA-Compliant Principles • Zero Ad-Tracking</span>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
};
