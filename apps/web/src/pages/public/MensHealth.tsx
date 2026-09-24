import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldAlert,
  FileText,
  Clock,
  ArrowRight,
  Stethoscope,
  Cpu,
  Lock
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const MensHealth: React.FC = () => {
  const pathwayFeatures = [
    {
      icon: Clock,
      title: '90-Day Longitudinal Tracking',
      description:
        'Spermatogenesis operates on a roughly 10-to-12 week cycle. BIOPulse AI tracks your metrics across biological cycles so you can observe genuine trends rather than single isolated fluctuations.',
    },
    {
      icon: FileText,
      title: 'Semen Analysis OCR Reader',
      description:
        'Scan laboratory semen reports with precision. BIOPulse AI organizes volume, motility, morphology, and concentration into patient-friendly charts with reference bounds.',
    },
    {
      icon: Activity,
      title: 'Multimodal Contributing Signals',
      description:
        'Log lifestyle variables—including heat exposure (saunas, hot tubs, desk work), sleep patterns, exercise, and nutritional markers—to identify personalized patterns.',
    },
    {
      icon: Stethoscope,
      title: 'Clinician-Ready Summaries',
      description:
        'Export structured, objective chronological summaries before visiting a urologist or reproductive specialist. Maximize the value of your 15-minute consultation.',
    },
    {
      icon: Cpu,
      title: 'Explainable AI Insights',
      description:
        'No black-box guesses. Any health insight explains which biological parameters are contributing and what additional tests your doctor might evaluate.',
    },
    {
      icon: Lock,
      title: 'Privacy by Architecture',
      description:
        'Men’s reproductive data is deeply sensitive. Your data is encrypted, strictly owned by you, and never sold to third-party ad networks.',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#10071A] text-white min-h-screen">
      {/* ── 1. Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#0284C7]/20 via-[#A21CAF]/20 to-[#E87084]/20 rounded-full blur-3xl opacity-70" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#38BDF8] backdrop-blur-md">
              <Activity className="w-3.5 h-3.5" />
              <span>Men's Health & Hypogonadism Pathway</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15]">
              Health Intelligence for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#E879F9]">
                Male Hypogonadism
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
              Empowering men with patient-friendly testosterone signaling education, HPT axis insights,
              morning timing awareness, and doctor-ready clinical summaries.
            </p>

            {/* Non-diagnostic notice */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/15 text-left flex items-start gap-3.5 shadow-lg backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
              <div className="text-xs text-[#EDE4F7] leading-relaxed">
                <strong className="text-white block font-semibold mb-0.5">
                  Educational & Screening Support Notice:
                </strong>
                This platform is for screening and educational purposes only. It does not diagnose, prescribe treatment, or replace a healthcare professional.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.UNDERSTAND_MALE_HYPOGONADISM}>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-gradient-to-r from-[#0284C7] via-[#6366F1] to-[#A21CAF] text-white shadow-lg"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Understand Male Hypogonadism
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
              Features Built for Men's Reproductive Realities
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed">
              Designed around the biological principles of sperm formation, laboratory reference parameters, and doctor-patient collaboration.
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
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0284C7]/30 to-[#6366F1]/30 border border-white/10 flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform">
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

      {/* ── 3. The 3-Step Men's Journey ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                How Men Use BIOPulse AI
              </h2>
              <p className="text-sm text-[#B4A6C7]">
                A discreet, longitudinal, and scientifically grounded pathway.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#38BDF8]">
                  01
                </div>
                <h4 className="text-base font-bold text-white">Log Baseline & Reports</h4>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Upload existing semen analysis PDFs or images. The OCR engine extracts parameters and plots them against standard WHO reference limits.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#818CF8]">
                  02
                </div>
                <h4 className="text-base font-bold text-white">Track Over 90 Days</h4>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Log lifestyle events—exercise, sleep, temperature exposures, and supplements. Watch how interventions map to follow-up test results over the 70–90 day cycle.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#E879F9]">
                  03
                </div>
                <h4 className="text-base font-bold text-white">Share with Specialist</h4>
                <p className="text-xs text-[#B4A6C7] leading-relaxed">
                  Generate a clean, one-page Clinician Summary export before your appointment, presenting structured trends rather than scattered paper sheets.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 4. CTA ── */}
      <section className="py-20">
        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#0c2447] via-[#1B082D] to-[#10031B] border border-white/20 shadow-2xl space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white">
              Take Control of Your Reproductive Health
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] max-w-xl mx-auto leading-relaxed">
              Explore your metrics with clarity and confidence. Free account creation, zero advertising trackers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#0284C7] via-[#6366F1] to-[#A21CAF] text-white shadow-xl"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Create Your Account
                </Button>
              </Link>
              <Link to={ROUTES.UNDERSTAND_MALE_HYPOGONADISM}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Understand Hypogonadism Guide
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
