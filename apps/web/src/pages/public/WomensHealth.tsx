import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShieldAlert,
  Calendar,
  Sparkles,
  ArrowRight,
  FileText,
  Activity,
  Lock,
  Stethoscope
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const WomensHealth: React.FC = () => {
  const pathwayFeatures = [
    {
      icon: Sparkles,
      title: 'PCOS / PMOS Multimodal Screening',
      description:
        'Analyzes multi-marker patterns across cycles, symptoms, metabolic labs, and ultrasound findings using explainable AI to highlight signals for your doctor.',
    },
    {
      icon: Calendar,
      title: 'Longitudinal Cycle Intelligence',
      description:
        'Track irregular cycle lengths, luteal phases, and ovulation cues. See long-term rhythm patterns rather than treating each month as an isolated event.',
    },
    {
      icon: Activity,
      title: 'Symptom & Metabolic Logs',
      description:
        'Monitor androgenic markers (hirsutism, acne), energy fluctuations, insulin resistance signals, and emotional wellness in an intuitive daily log.',
    },
    {
      icon: FileText,
      title: 'Ultrasound & Lab Report OCR',
      description:
        'Digitize follicle counts, ovarian volumes, hormonal panels (LH, FSH, testosterone, AMH), and metabolic panels into structured longitudinal charts.',
    },
    {
      icon: Stethoscope,
      title: 'Clinician Consultation Summaries',
      description:
        'Export objective, chronological health profiles to share with your gynecologist or endocrinologist, making every appointment focused and productive.',
    },
    {
      icon: Lock,
      title: 'Private & Secure by Design',
      description:
        'End-to-end encrypted reproductive health records. Your personal cycle and health data belongs entirely to you and is never sold to third parties.',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#10071A] text-white min-h-screen">
      {/* ── 1. Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#6E2D8B]/30 via-[#A21CAF]/25 to-[#FB7185]/20 rounded-full blur-3xl opacity-70" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FB7185] backdrop-blur-md">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Women's Reproductive Health & PCOS Pathway</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15]">
              Reproductive Health Intelligence for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#C084FC]">
                Women & PCOS
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
              A comprehensive health pathway connecting menstrual cycles, metabolic markers, ovarian ultrasound scans,
              and symptom logs into one explainable, longitudinal picture.
            </p>

            {/* Non-diagnostic safety disclaimer */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/15 text-left flex items-start gap-3.5 shadow-lg backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 text-[#FB7185] shrink-0 mt-0.5" />
              <div className="text-xs text-[#EDE4F7] leading-relaxed">
                <strong className="text-white block font-semibold mb-0.5">
                  Educational & Screening Support Notice:
                </strong>
                BIOPulse AI Women's Health provides health information and screening support. It is not a diagnostic tool and does not replace consultation with a qualified gynecologist or endocrinologist.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.UNDERSTAND_PCOS_CANONICAL}>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-lg"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Understand PCOS Biology
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="outline"
                  size="md"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Start Tracking
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Pathway Architecture Grid ── */}
      <section className="py-20 border-b border-white/10">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
              Designed for the Whole Spectrum of Ovarian Health
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed">
              Moving beyond basic period counters. BIOPulse AI integrates clinical research, Rotterdam criteria markers, and metabolic realities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathwayFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-display">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#B4A6C7] leading-relaxed font-sans">
                      {feat.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 3. The 3-Step Women's Journey ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                How Women Use BIOPulse AI
              </h2>
              <p className="text-sm text-[#B4A6C7]">
                A connected, supportive experience for navigating PCOS and reproductive wellness.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#FB7185]">
                  01
                </div>
                <h4 className="text-base font-bold text-white">Log Cycles & Symptoms</h4>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Record cycle dates, ovulation signals, hirsutism patterns, and metabolic symptoms in a simple, non-judgmental interface.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#A21CAF]">
                  02
                </div>
                <h4 className="text-base font-bold text-white">Integrate Medical Labs</h4>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Upload pelvic ultrasound scans and hormone lab reports. The platform organizes key biomarkers alongside your symptom timeline.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#E879F9]">
                  03
                </div>
                <h4 className="text-base font-bold text-white">Collaborate with Clinicians</h4>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Export structured summaries to bring to your doctor, or invite trusted family and care allies through your Care Circle.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 4. CTA ── */}
      <section className="py-20">
        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#290E42] via-[#1B082D] to-[#10031B] border border-white/20 shadow-2xl space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white">
              Understand Your Cycle & Ovarian Health
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] max-w-xl mx-auto leading-relaxed">
              Join thousands of women taking the guesswork out of PCOS and reproductive health tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-xl"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Get Started Free
                </Button>
              </Link>
              <Link to={ROUTES.UNDERSTAND_PCOS_CANONICAL}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Explore PCOS Biology
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
