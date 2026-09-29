import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Server,
  FileCheck2,
  ArrowRight,
  HeartHandshake
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const TrustAndPrivacy: React.FC = () => {
  const securityPillars = [
    {
      icon: EyeOff,
      title: 'Zero Data Brokerage',
      description:
        'We believe reproductive health information is among the most sensitive data a human generates. We never sell, monetize, or license personal health records to advertising networks or data brokers.',
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description:
        'All data is encrypted in transit via modern TLS 1.3 cryptographic suites and secured at rest using AES-256 standards with strict row-level authorization barriers.',
    },
    {
      icon: UserCheck,
      title: 'Full User Data Sovereignty',
      description:
        'You have absolute control over your profile. At any time, you can export your complete history in open formats or permanently delete your account and all associated records with immediate effect.',
    },
    {
      icon: FileCheck2,
      title: 'Auditable Explainability',
      description:
        'Our algorithms adhere to strict transparency standards. Insights clearly show the clinical biomarkers, cycle calculations, and references that informed them.',
    },
    {
      icon: HeartHandshake,
      title: 'Granular Sharing Controls',
      description:
        'Sharing features in our Care Circle and Care Provider Portal are opt-in, permissioned, and revocable in one tap. You decide who sees what, and for how long.',
    },
    {
      icon: Server,
      title: 'Isolated OCR Pipeline',
      description:
        'Uploaded laboratory scans and ultrasound images are processed securely to extract parameters and are not used for public model training.',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#10071A] text-white min-h-screen">
      {/* ── 1. Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#6E2D8B]/25 via-[#A21CAF]/20 to-[#10B981]/20 rounded-full blur-3xl opacity-60" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-400 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Trust, Ethics & Data Privacy Architecture</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15]">
              Your Health Data Belongs{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#E879F9] to-[#FB7185]">
                To You Alone
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
              Reproductive health is deeply personal. Explore how BIOPulse AI protects privacy,
              enforces strict encryption, and adheres to responsible AI principles.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-gradient-to-r from-[#10B981] via-[#8E3EAF] to-[#E87084] text-white shadow-lg"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Create Secure Account
                </Button>
              </Link>
              <Link to={ROUTES.CONTACT}>
                <Button
                  variant="outline"
                  size="md"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Security Inquiries
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Pillars Grid ── */}
      <section className="py-20 border-b border-white/10">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
              Core Principles of our Trust Architecture
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed">
              We design our security and ethics posture before writing a single line of feature code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityPillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {p.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#B4A6C7] leading-relaxed font-sans">
                    {p.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 3. Non-Diagnostic Medical Boundary Commitment ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                Our Non-Diagnostic Boundary
              </h2>
              <p className="text-sm text-[#B4A6C7]">
                Why we will never claim our AI is a replacement for your doctor.
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/15 space-y-4 text-xs md:text-sm text-[#B4A6C7] leading-relaxed font-sans">
              <p>
                Medicine is fundamentally contextual, clinical, and human. While statistical algorithms can identify patterns across complex biomarkers, a true diagnosis requires physical examination, patient medical history, differential clinical reasoning, and licensed human accountability.
              </p>
              <p>
                BIOPulse AI is strictly an <strong className="text-white">educational screening and longitudinal monitoring platform</strong>. We highlight signals, organize scattered lab reports, and prepare patients for consultations. We do not issue formal clinical diagnoses, prescribe pharmacotherapy, or advise ignoring licensed medical directives.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 4. CTA ── */}
      <section className="py-20">
        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#290E42] via-[#1B082D] to-[#10031B] border border-white/20 shadow-2xl space-y-6">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white">
              Reproductive Health Intelligence You Can Trust
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] max-w-xl mx-auto leading-relaxed">
              Explore BIOPulse AI today with full confidence in your data privacy and ethical standards.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#10B981] via-[#8E3EAF] to-[#E87084] text-white shadow-xl"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Create Your Account
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
