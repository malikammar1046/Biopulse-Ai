import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, MessageCircleHeart, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';
import { SmallBotanicalSprig } from '../../../components/brand/BotanicalFoliage';

export const ContactHeroSection: React.FC = () => {
  const scrollToForm = () => {
    const element = document.getElementById('contact-form-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="relative min-h-[75vh] bg-transparent text-[#162A45] pt-32 pb-20 sm:pb-24 overflow-hidden flex items-center">
      {/* Ambient Radial Highlights */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[500px] bg-pink-100/40 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[500px] bg-cyan-100/45 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Small Botanical Accents */}
      <div className="hidden lg:block absolute top-28 left-8 opacity-65 pointer-events-none -rotate-12">
        <SmallBotanicalSprig variant="pink" className="w-18 h-auto" />
      </div>
      <div className="hidden lg:block absolute top-28 right-8 opacity-65 pointer-events-none rotate-12">
        <SmallBotanicalSprig variant="teal" flip className="w-18 h-auto" />
      </div>

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Eyebrow Pill */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0891B2]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
                Connect with BioPulse AI
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#162A45] leading-[1.12] font-display"
            >
              Let's build a better{' '}
              <span className="text-[#0891B2]">
                understanding
              </span>{' '}
              of endocrine health.
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-600 leading-relaxed max-w-2xl font-sans"
            >
              Whether you are exploring BioPulse AI for PCOS or Male Hypogonadism screening, evaluating research opportunities, or seeking partnership discussions, our team is here to help.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Button
                variant="primary"
                size="lg"
                onClick={scrollToForm}
                className="bg-[#0891B2] hover:bg-[#0e7490] text-white shadow-lg shadow-cyan-900/10 cursor-pointer"
                iconRight={<MessageCircleHeart className="w-5 h-5" />}
              >
                Start a Conversation
              </Button>

              <Link to={ROUTES.FEATURES}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-[#162A45] hover:bg-slate-50"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Features
                </Button>
              </Link>
            </motion.div>

            {/* Micro Badge Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-500"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Responsibly Engineered AI</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Evidence-Aligned Screening</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>Privacy & Research First</span>
            </motion.div>
          </div>

          {/* Right Column: Clean Informational Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5"
          >
            <div className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center text-[#0891B2]">
                  <MessageCircleHeart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#162A45]">BioPulse AI Communication</h3>
                  <p className="text-xs text-slate-500">Research, Screening, & Partnerships</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-slate-600">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <span className="font-semibold text-slate-800">Direct Inquiries</span>
                  <p>Inquiries are reviewed by our team and routed to clinical research, technical development, or general support.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <span className="font-semibold text-slate-800">Academic & Clinical Research</span>
                  <p>Open for collaborative research on explainable AI feature attribution and culturally contextualized nutrition.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-cyan-50/50 border border-cyan-100 space-y-1">
                  <span className="font-semibold text-[#0891B2]">Emergency Disclaimer</span>
                  <p className="text-slate-600">BioPulse AI is a screening decision-support platform, not an emergency medical service.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};

export default ContactHeroSection;
