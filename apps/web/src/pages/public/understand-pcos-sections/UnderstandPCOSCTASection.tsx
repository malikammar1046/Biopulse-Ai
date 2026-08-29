import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Stethoscope,
  Sparkles,
  Heart,
  ShieldCheck,
  X,
  Printer,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';

export const UnderstandPCOSCTASection: React.FC = () => {
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);

  const doctorChecklist = [
    'How do my recent cycle intervals (e.g., >35 days) correlate with my hormonal levels?',
    'Should we evaluate baseline fasting insulin, glucose, or lipid markers?',
    'What does my pelvic ultrasound indicate regarding ovarian volume and follicle count?',
    'Is there any clinical indication to monitor endometrial stripe thickness?',
    'Are there evidence-based lifestyle or inositol supplements that fit my personal profile?',
  ];

  return (
    <section className="relative min-h-screen py-28 sm:py-36 bg-[#08020E] text-white overflow-hidden border-t border-white/10 flex flex-col justify-center select-none">
      {/* ── Volumetric Bioluminescent Glows ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[1000px] h-[700px] sm:h-[1000px] bg-gradient-to-tr from-[#6E2D8B]/30 via-[#8E3EAF]/25 to-[#E87084]/30 rounded-full blur-[200px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full text-center">
        <div className="max-w-4xl mx-auto space-y-10 sm:space-y-12">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xl">
            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#F6F2FA]">
              The Final Resolution
            </span>
          </div>

          {/* Central Luminous Female Silhouette with Understood Glowing Core */}
          <div className="relative w-full max-w-[320px] sm:max-w-[380px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden bg-gradient-to-b from-[#180A26] via-[#10071A] to-[#08020E] border border-white/20 shadow-[0_0_90px_rgba(232,112,132,0.35)] flex items-center justify-center p-3">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle at 50% 60%, rgba(232, 112, 132, 0.4) 0%, rgba(142, 62, 175, 0.3) 40%, transparent 75%)',
              }}
            />

            <img
              src="/translucent-female-biology.jpg"
              alt="Understood Female Biological Anatomy with Illuminated Ovaries"
              className="w-full h-full object-contain select-none filter brightness-110 contrast-105"
              style={{
                maskImage:
                  'radial-gradient(ellipse at 50% 50%, black 75%, rgba(0,0,0,0.85) 88%, transparent 98%)',
                WebkitMaskImage:
                  'radial-gradient(ellipse at 50% 50%, black 75%, rgba(0,0,0,0.85) 88%, transparent 98%)',
              }}
            />

            {/* Glowing Luminous Halo around Pelvic Origin */}
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-[62.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-white/60 bg-[#FB7185]/30 blur-xs pointer-events-none"
            />
            <div className="absolute top-[62.5%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_20px_#FFFFFF] pointer-events-none" />

            {/* Floating Understood Badge */}
            <div className="absolute bottom-4 left-4 right-4 p-2.5 rounded-2xl bg-[#10071A]/90 border border-white/20 shadow-xl backdrop-blur-xl text-center">
              <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
                Signals Understood
              </span>
            </div>
          </div>

          {/* Triple Climax Headline */}
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl md:text-6.5xl font-extrabold tracking-tight text-white leading-[1.12] font-display">
              Know the pattern.
              <br />
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                Understand the signal.
              </span>
              <br />
              Take your health seriously.
            </h2>
            <p className="text-base sm:text-lg text-[#CDBDD8] max-w-xl mx-auto font-sans">
              OvaSense gives you the tools to explore your unique biological trajectory and arrive
              at every doctor visit fully prepared.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link to={ROUTES.APP.DASHBOARD}>
              <Button
                variant="primary"
                size="lg"
                className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-2xl shadow-purple-950/50 px-8 py-4 text-base"
                iconRight={<ArrowRight className="w-5 h-5" />}
              >
                Explore OvaSense
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsDoctorModalOpen(true)}
              className="border-white/30 text-white hover:bg-white/10 backdrop-blur-md px-7 py-4 text-base"
              iconLeft={<Stethoscope className="w-5 h-5 text-[#FB7185]" />}
            >
              Talk to Your Healthcare Professional
            </Button>
          </div>

          {/* Non-Diagnostic Safety Footer Tag */}
          <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-[#A797BD] font-mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#34D399]" />
              Non-Diagnostic Educational Platform
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#FB7185]" />
              Built for Empowered Clinical Partnership
            </span>
          </div>
        </div>
      </Container>

      {/* ── Doctor Preparation Checklist Modal ── */}
      <AnimatePresence>
        {isDoctorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-2xl rounded-[32px] bg-gradient-to-b from-[#1C0D2E] via-[#140822] to-[#0F041B] border border-white/20 p-6 sm:p-8 text-left shadow-2xl space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsDoctorModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6E2D8B] to-[#FB7185] flex items-center justify-center text-white shadow-lg">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display text-white">
                    Clinician Discussion Guide
                  </h3>
                  <span className="text-xs font-mono text-[#B4A6C7]">
                    Key questions to bring to your next appointment
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                  Recommended Discussion Prompts:
                </span>
                <div className="space-y-2.5">
                  {doctorChecklist.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-lg bg-[#8E3EAF]/30 text-[#FDA4AF] text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-[#EDE4F7] font-sans leading-relaxed">
                        {q}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 text-xs text-[#CDBDD8] leading-relaxed flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> You can export your OvaSense 90-day symptom and cycle summary
                  directly to PDF inside the app to hand directly to your clinician.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="border-white/20 text-white hover:bg-white/10"
                  iconLeft={<Printer className="w-4 h-4" />}
                >
                  Print Guide
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white"
                >
                  Got It
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
