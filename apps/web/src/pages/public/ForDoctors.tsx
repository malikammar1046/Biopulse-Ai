import React from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  FileText,
  Clock,
  ShieldCheck,
  Share2,
  ArrowRight
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const ForDoctors: React.FC = () => {
  const clinicalBenefits = [
    {
      icon: Clock,
      title: 'Save 8–10 Minutes Per Consultation',
      description:
        'Instead of sorting through crumpled lab slips or listening to vague retrospective recall, clinicians receive an organized timeline of cycle lengths, symptom logs, and historical lab panels.',
    },
    {
      icon: FileText,
      title: 'Standardized Biomarker Summaries',
      description:
        'Biomarkers from various hospital laboratories and formats are standardized into canonical reference units (e.g. Total & Free Testosterone in ng/dL, AMH in ng/mL, LH/FSH in mIU/mL, HOMA-IR).',
    },
    {
      icon: ShieldCheck,
      title: 'Non-Prescriptive & Non-Diagnostic',
      description:
        'VITASense does not diagnose, prescribe treatment, or replace clinical judgment. We organize patient-generated health data and verified reports to inform clinical discussion.',
    },
    {
      icon: Share2,
      title: 'Frictionless Care Provider Portal',
      description:
        'Patients generate time-limited, encrypted access tokens. Physicians can review longitudinal records in any browser without registering, installing software, or filling onboarding forms.',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#10071A] text-white min-h-screen">
      {/* ── 1. Hero ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#6E2D8B]/25 via-[#A21CAF]/20 to-[#38BDF8]/20 rounded-full blur-3xl opacity-60" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#38BDF8] backdrop-blur-md">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>For Clinicians & Healthcare Providers</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15]">
              Built to Empower the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#E879F9] to-[#FB7185]">
                15-Minute Consultation
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
              VITASense organizes patient-reported symptoms, hormonal markers, circadian factors, and multi-source lab reports
              into structured, objective summaries that support clinical workflow and clinician judgment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.CONTACT}>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-gradient-to-r from-[#0284C7] via-[#8E3EAF] to-[#E87084] text-white shadow-lg"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Clinical Collaboration Inquiries
                </Button>
              </Link>
              <Link to={ROUTES.TRUST_PRIVACY}>
                <Button
                  variant="outline"
                  size="md"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Privacy & Compliance Specs
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Benefits Grid ── */}
      <section className="py-20 border-b border-white/10">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
              Clinical Workflow Advantages
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed">
              Designed to inform clinical discussions across reproductive endocrinology, gynecology, and urology/andrology.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {clinicalBenefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {b.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#B4A6C7] leading-relaxed font-sans">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 3. What Clinicians Receive ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                The Clinician Summary Report
              </h2>
              <p className="text-sm text-[#B4A6C7]">
                A single structured overview containing objective, patient-verified health information.
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#1E0B30] to-[#0E0317] border border-white/15 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider">
                  VITASense Clinical Summary Card
                </span>
                <span className="text-xs text-[#B4A6C7] font-mono">Patient-Controlled Authorization</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="font-bold text-white block">Women's Health Panel (PCOS Screening)</span>
                  <ul className="space-y-1 text-[#B4A6C7] list-disc pl-4">
                    <li>Mean cycle length & ovulatory variance over 6–12 months</li>
                    <li>Structured pelvic ultrasound findings from verified reports</li>
                    <li>Fasting insulin, HOMA-IR, and lipid profile chronologies</li>
                    <li>Validated symptom severity tracking (hirsutism, acne, fatigue)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <span className="font-bold text-white block">Men's Health Panel (Male Hypogonadism)</span>
                  <ul className="space-y-1 text-[#B4A6C7] list-disc pl-4">
                    <li>Morning total & free testosterone chronologies (7:00–10:00 AM draw times)</li>
                    <li>Pituitary gonadotropins (LH, FSH), prolactin, and SHBG trajectories</li>
                    <li>Longitudinal symptom scores (energy, vitality, physical fatigue)</li>
                    <li>Circadian sleep metrics, body composition & metabolic indicators</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A799B7]">
                <span>Clinical Purpose: Screening support & consultation preparation</span>
                <span className="font-medium text-[#F43F5E]/90">Does not diagnose or replace clinical judgment</span>
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
              Partner With VITASense Research
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] max-w-xl mx-auto leading-relaxed">
              We collaborate with academic medical centers, reproductive specialists, and digital health researchers to validate explainable algorithms and improve patient outcomes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.CONTACT}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#0284C7] via-[#8E3EAF] to-[#E87084] text-white shadow-xl"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Contact Our Medical Team
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
