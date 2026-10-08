import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  Server,
  FileCheck2,
  ArrowRight,
  HeartHandshake,
  KeyRound,
  Database,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Download,
  Trash2,
  Stethoscope,
  Fingerprint,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { SmallBotanicalSprig } from '../../components/brand/BotanicalFoliage';
import { useTranslation } from 'react-i18next';

export const TrustAndPrivacy: React.FC = () => {
  const { t } = useTranslation(['public', 'common']);

  useEffect(() => {
    document.title = t('public:trustPage.title', 'Trust, Ethics & Privacy Architecture | BioPulse AI');
  }, [t]);

  const securityPillars = [
    {
      icon: EyeOff,
      title: 'Zero Data Brokerage',
      tag: 'Strict Non-Commercial Policy',
      description:
        'We believe reproductive health information is among the most sensitive data a human generates. We never sell, monetize, or license personal health records to advertising networks, insurers, or commercial data brokers.',
      accent: '#059669',
      bg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'bg-emerald-100/70 text-emerald-800 border-emerald-200/80',
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      tag: 'Cryptographic Defense',
      description:
        'All communications are secured in transit via modern TLS 1.3 cryptographic suites and encrypted at rest with AES-256 standards, backed by PostgreSQL Row-Level Security barriers.',
      accent: '#0891B2',
      bg: 'bg-cyan-50 text-[#0891B2]',
      badgeBg: 'bg-cyan-100/70 text-cyan-800 border-cyan-200/80',
    },
    {
      icon: UserCheck,
      title: 'Full User Sovereignty',
      tag: 'Complete Ownership',
      description:
        'You have absolute control over your profile. At any moment, you can export your complete clinical trajectory in open structured formats or permanently erase your account and all associated records with immediate effect.',
      accent: '#7C3AED',
      bg: 'bg-purple-50 text-purple-600',
      badgeBg: 'bg-purple-100/70 text-purple-800 border-purple-200/80',
    },
    {
      icon: FileCheck2,
      title: 'Auditable Explainability',
      tag: 'Transparent AI',
      description:
        'Our algorithms reject black-box guessing. Screening outputs are paired with fold-aware SHAP explainability and clinical guideline references so you and your doctor understand the biomarkers that drove each observation.',
      accent: '#2563EB',
      bg: 'bg-blue-50 text-blue-600',
      badgeBg: 'bg-blue-100/70 text-blue-800 border-blue-200/80',
    },
    {
      icon: HeartHandshake,
      title: 'Granular Sharing Controls',
      tag: 'Permissioned Access',
      description:
        'Collaborative features in our Care Circle and Doctor Briefs are 100% opt-in, permissioned, and revocable in one tap. You decide which biomarkers are shared, with whom, and for how long.',
      accent: '#E11D48',
      bg: 'bg-rose-50 text-[#E11D48]',
      badgeBg: 'bg-rose-100/70 text-rose-800 border-rose-200/80',
    },
    {
      icon: Server,
      title: 'Hermetic OCR Pipeline',
      tag: 'Isolated Processing',
      description:
        'Uploaded laboratory scans and ultrasound images are processed in isolated memory environments to normalize clinical units, and are never used to train public generative foundation models.',
      accent: '#D97706',
      bg: 'bg-amber-50 text-amber-600',
      badgeBg: 'bg-amber-100/70 text-amber-800 border-amber-200/80',
    },
  ];

  const technicalLayers = [
    {
      icon: KeyRound,
      title: 'Transport Layer Security (TLS 1.3)',
      desc: 'All network exchanges between clients, API gateways, and cloud inference models enforce forward-secret TLS 1.3 encryption with strict HSTS policies.',
    },
    {
      icon: Database,
      title: 'Row-Level Authorization (RLS)',
      desc: 'Every patient database record is cryptographically bound to an authenticated UUID. Cross-tenant queries are rejected at the database kernel level.',
    },
    {
      icon: Fingerprint,
      title: 'Ephemeral Access Tokens',
      desc: 'Doctor consultation links and Care Circle briefs utilize cryptographically signed, short-lived tokens that can be invalidated immediately by the patient.',
    },
    {
      icon: FileText,
      title: 'Zero Third-Party Ad Trackers',
      desc: 'We do not embed third-party advertising SDKs, Facebook Pixels, or behavior-tracking data brokers anywhere within our health workflows.',
    },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden bg-transparent text-[#162A45] min-h-screen">
      {/* ── 1. Hero Section ── */}
      <section className="relative pt-32 pb-20 sm:pb-28 overflow-hidden border-b border-slate-200/80">
        {/* Soft Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[450px] bg-cyan-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[450px] bg-emerald-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />

        {/* Botanical Accents */}
        <div className="hidden lg:block absolute top-28 left-8 opacity-65 pointer-events-none -rotate-12">
          <SmallBotanicalSprig variant="teal" className="w-18 h-auto" />
        </div>
        <div className="hidden lg:block absolute top-28 right-8 opacity-65 pointer-events-none rotate-12">
          <SmallBotanicalSprig variant="pink" flip className="w-18 h-auto" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Eyebrow Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="uppercase tracking-wider text-[11px] font-bold">
                Trust, Ethics & Data Privacy Architecture
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-[#162A45] leading-[1.15]"
            >
              {t('public:trustPage.title', 'Trust, Privacy & Medical Safety')}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto"
            >
              {t('public:trustPage.subtitle', 'Our commitment to ethical artificial intelligence, patient data security, and non-diagnostic clinical boundaries.')}
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            >
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-lg shadow-cyan-600/20 font-bold rounded-full"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Create Secure Account
                </Button>
              </Link>
              <Link to={ROUTES.CONTACT}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-full"
                >
                  Security Inquiries
                </Button>
              </Link>
            </motion.div>

            {/* Safety & Mission Meta Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 text-[11px] font-bold tracking-wider uppercase text-slate-500 font-mono"
            >
              <span className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-emerald-600" />
                Zero Data Brokerage
              </span>
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                AES-256 & TLS 1.3
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0891B2]" />
                Full User Sovereignty
              </span>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 2. Core Pillars of Trust Grid ── */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-[#FAFCFF] via-[#FFFFFF] to-[#F8FAFC] border-b border-slate-200/80">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider text-[11px] font-bold">
                Ethical Architecture
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-[#162A45] tracking-tight">
              Six Pillars of our Trust Architecture
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-sans">
              We design our security, explainability, and ethics posture before writing a single line of feature code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {securityPillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="p-7 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-4 text-left flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.bg} shadow-xs`}
                      >
                        <Icon className="w-6 h-6" style={{ color: p.accent }} />
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${p.badgeBg}`}>
                        {p.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold font-display text-[#162A45]">
                      {p.title}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                      {p.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 3. Technical Security & Infrastructure ── */}
      <section className="py-20 sm:py-28 bg-[#FFFFFF] border-b border-slate-200/80 relative">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2]">
              <Lock className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider text-[11px] font-bold">
                Security Engineering
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-[#162A45] tracking-tight">
              Cryptographic Safeguards & Defense-in-Depth
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-sans">
              How our data engineering stack protects your information across storage, computation, and transmission.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {technicalLayers.map((layer, idx) => {
              const Icon = layer.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 text-left hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-100/60 text-[#0891B2] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold font-display text-[#162A45]">
                    {layer.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {layer.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 4. Non-Diagnostic Medical Boundary Commitment ── */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#FAFCFF] border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl bg-white border border-slate-200/90 shadow-md p-8 sm:p-12 space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center shrink-0">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#E11D48] block">
                      Clinical Guardrails
                    </span>
                    <h3 className="text-2xl font-extrabold font-display text-[#162A45]">
                      Our Non-Diagnostic Boundary Commitment
                    </h3>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Decision Support Only</span>
                </div>
              </div>

              <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed font-sans">
                <p>
                  Reproductive endocrinology and hormonal health are fundamentally contextual, biological, and nuanced.
                  While machine learning algorithms excel at recognizing subtle multivariate biomarker trajectories across labs and cycle records,
                  a formal medical diagnosis requires a comprehensive physical exam, pelvic ultrasonography, differential clinical reasoning, and licensed human oversight.
                </p>
                <p>
                  BioPulse AI is strictly an <strong className="text-[#162A45] font-semibold">educational screening, health literacy, and longitudinal monitoring platform</strong>.
                  We empower patients to spot hormonal signals early, organize scattered diagnostic paperwork, and walk into clinic consultations informed and prepared.
                  We never prescribe pharmaceuticals, issue definitive medical verdicts, or suggest replacing physician care.
                </p>
              </div>

              {/* Boundary Contrast Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                {/* What We Do */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold font-display text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>What BioPulse AI Provides</span>
                  </div>
                  <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>Multivariate risk pattern detection across lifestyle and lab inputs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>SHAP biomarker weightings showing why an indicator was flagged</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>Structured pre-consultation briefings formatted for physicians</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>Longitudinal progression tracking and symptom diary aggregation</span>
                    </li>
                  </ul>
                </div>

                {/* What We Refuse to Do */}
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold font-display text-sm">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>What BioPulse AI Never Does</span>
                  </div>
                  <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>Never issues definitive or legally binding clinical diagnoses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>Never prescribes, alters, or recommends pharmacotherapy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>Never operates as an emergency or acute crisis triage service</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>Never advises overriding licensed medical provider guidance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 5. User Sovereignty & Rights ── */}
      <section className="py-20 sm:py-24 bg-white border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2]">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wider text-[11px] font-bold">
                  Patient Control
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-[#162A45] tracking-tight">
                Your Inalienable Data Rights
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-sans max-w-xl mx-auto">
                No dark patterns, no hidden retention lock-in. You decide how long your data lives and when it departs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold font-display text-[#162A45]">
                  Instant Full Data Export
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  Export your raw observations, lab metrics, symptom journals, and longitudinal timelines in open JSON or print-ready PDF formats at any time. Take your complete records anywhere you go.
                </p>
              </div>

              <div className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200/80 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#E11D48] flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold font-display text-[#162A45]">
                  Complete Account & Record Deletion
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">
                  Trigger permanent erasure with a single confirmation. All database records, uploaded scans, and clinical states are purged from our servers with zero retained backups or ghost entries.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 6. Final Call to Action ── */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-100/30 rounded-full blur-[160px] pointer-events-none -z-10" />

        <Container size="xl">
          <div className="rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-14 shadow-xl relative overflow-hidden">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Transparent Healthcare AI</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
                Reproductive Health Intelligence You Can{' '}
                <span className="text-[#0891B2]">
                  Truly Trust.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-xl mx-auto">
                Experience non-diagnostic screening designed with clinical rigor, explainable machine learning, and uncompromising respect for patient sovereignty.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link to={ROUTES.REGISTER}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-lg shadow-cyan-600/20 font-bold rounded-full"
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Start Your Screening
                  </Button>
                </Link>

                <Link to={ROUTES.CONDITIONS}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-full"
                  >
                    Explore Conditions
                  </Button>
                </Link>
              </div>

              <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted • Zero Data Brokerage • Patient Sovereignty Guaranteed</span>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default TrustAndPrivacy;
