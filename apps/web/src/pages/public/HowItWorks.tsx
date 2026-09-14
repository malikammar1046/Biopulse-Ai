import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserCircle,
  GitFork,
  ClipboardCheck,
  FileUp,
  BrainCircuit,
  UtensilsCrossed,
  LineChart,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { SmallBotanicalSprig } from '../../components/brand/BotanicalFoliage';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Create your health profile',
      subtitle: 'Basic health context and demographics',
      icon: UserCircle,
      accent: '#0891B2',
      bg: 'bg-cyan-50',
      desc: 'Set up your secure BioPulse AI account with your essential information, including date of birth (ages 12+), basic biometric indicators, and current health background.',
      highlights: [
        'Quick 2-minute registration without unnecessary medical jargon',
        'Strict privacy protection and encrypted data storage',
        'No sensitive health history required to create your profile',
      ],
    },
    {
      num: '02',
      title: 'Select your pathway',
      subtitle: 'Dedicated female or male endocrine evaluation',
      icon: GitFork,
      accent: '#7C3AED',
      bg: 'bg-purple-50',
      desc: 'Choose the dedicated health journey that matches your biological needs: Female PCOS screening or Male Hypogonadism screening. Your pathway customizes every screening form, lab range, and tracking tool.',
      highlights: [
        'Female Pathway: PCOS risk screening, cycle patterns, and ovarian health',
        'Male Pathway: Male Hypogonadism screening, morning testosterone, and vitality',
        'Completely separated clinical criteria — no irrelevant questions',
      ],
    },
    {
      num: '03',
      title: 'Complete initial screening',
      subtitle: 'Start with symptoms and daily observations',
      icon: ClipboardCheck,
      accent: '#059669',
      bg: 'bg-emerald-50',
      desc: 'You do not need expensive laboratory tests to begin. Answer intuitive questions about physical symptoms, menstrual cycle regularity (women), or ADAM vitality indicators and fatigue (men).',
      highlights: [
        'Tier 1 baseline screening powered by observable physical symptoms',
        'Takes under 5 minutes with clear, non-judgmental severity rating scales',
        'Produces an immediate preliminary screening evaluation',
      ],
    },
    {
      num: '04',
      title: 'Add lab / report information when available',
      subtitle: 'OCR parsing with human-in-the-loop verification',
      icon: FileUp,
      accent: '#2563EB',
      bg: 'bg-blue-50',
      desc: 'When you have blood test reports or ultrasound slips, snap a photo or upload a PDF. Our optical character recognition extracts hormone numbers automatically, which you inspect and confirm before saving.',
      highlights: [
        'Supports standard Pakistani and international laboratory formats',
        'Side-by-side inspection ensures you approve every parsed number',
        'Enriches your assessment from baseline into Tier 2 (labs) and Tier 3 (imaging)',
      ],
    },
    {
      num: '05',
      title: 'Receive updated screening result & explanations',
      subtitle: 'Transparent factor attribution and cost-aware guidance',
      icon: BrainCircuit,
      accent: '#D97706',
      bg: 'bg-amber-50',
      desc: 'See updated screening risk levels alongside SHAP factor influence explanations. Understand exactly which symptoms and biomarkers contributed to the result, plus cost-aware guidance on which further investigations offer the highest clinical value.',
      highlights: [
        'Visual factor influence bars show positive and negative contributors',
        'Value-of-Information guidance helps prevent wasteful lab spending',
        'Clear clinical rationales structured for your next doctor consultation',
      ],
    },
    {
      num: '06',
      title: 'Follow nutrition and guidance',
      subtitle: 'Evidence-aligned 7-day Pakistani meal plan',
      icon: UtensilsCrossed,
      accent: '#E11D48',
      bg: 'bg-rose-50',
      desc: 'Access your 7-day nutritional plan built around authentic Pakistani foods (daal, roti, sabzi, seasonal produce) with balanced glycemic load and verified portion sizes to support hormonal stability.',
      highlights: [
        'Structured daily schedule: breakfast, lunch, dinner, and snack targets',
        'Daily hydration and food logging separated into "Your Plan" vs "What You Ate"',
        'Gentle lifestyle pacing without restrictive fads or curative claims',
      ],
    },
    {
      num: '07',
      title: 'Track changes over time',
      subtitle: 'Longitudinal health summary and consultation preparation',
      icon: LineChart,
      accent: '#0891B2',
      bg: 'bg-cyan-50',
      desc: 'Record symptoms, energy, and medication consistency week by week. Export structured doctor briefs to make 15-minute clinical visits with gynecologists, endocrinologists, or urologists focused and evidence-based.',
      highlights: [
        'Pathway-aware daily tracking: female cycle chronologies or male vitality logs',
        'Longitudinal trend summaries tracking progress over consecutive months',
        'Exportable pre-consultation briefs summarizing your history for clinicians',
      ],
    },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden bg-transparent text-[#162A45]">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 sm:pb-24 overflow-hidden border-b border-slate-200/80">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[500px] bg-pink-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[500px] bg-cyan-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />

        {/* Small Botanical Accents */}
        <div className="hidden lg:block absolute top-28 left-8 opacity-65 pointer-events-none -rotate-12">
          <SmallBotanicalSprig variant="pink" className="w-18 h-auto" />
        </div>
        <div className="hidden lg:block absolute top-28 right-8 opacity-65 pointer-events-none rotate-12">
          <SmallBotanicalSprig variant="teal" flip className="w-18 h-auto" />
        </div>

        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
                Simple 7-Step Journey
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-[#162A45] leading-[1.12]">
              How BioPulse AI{' '}
              <span className="text-[#0891B2]">
                Works
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-sans">
              From everyday symptoms to verified lab reports and Pakistani nutrition, BioPulse AI guides you through seven clear, practical steps without overwhelming complexity.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0e7490] text-white shadow-lg shadow-cyan-900/10 cursor-pointer"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Start Your Assessment
                </Button>
              </Link>
              <a href="#step-01">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-[#162A45] hover:bg-slate-50"
                >
                  Explore The Steps
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. THE 7 CLEAR USER STEPS */}
      <section id="step-01" className="py-20 sm:py-28 bg-white text-[#162A45] relative">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#162A45] font-display tracking-tight">
              A Clear, Progressive Health Journey
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto font-sans">
              Start with what you know today. Add clinical reports as you receive them. Track what changes over time.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 md:gap-8 items-start hover:bg-white"
                >
                  {/* Step Number & Icon Badge */}
                  <div className="shrink-0 flex flex-row md:flex-col items-center gap-3">
                    <span
                      className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white"
                      style={{ backgroundColor: step.accent }}
                    >
                      Step {step.num}
                    </span>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.bg}`}>
                      <Icon className="w-7 h-7" style={{ color: step.accent }} />
                    </div>
                  </div>

                  {/* Step Details */}
                  <div className="space-y-4 text-left flex-1">
                    <div>
                      <h3 className="text-2xl font-bold font-display text-[#162A45]">
                        {step.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5 font-mono">
                        {step.subtitle}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                      {step.desc}
                    </p>

                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      {step.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. SAFETY & RESPONSIBLE AI REASSURANCE */}
      <section className="py-16 bg-[#F8FAFC] border-t border-slate-200">
        <Container size="lg">
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Screening Support • Not Medical Diagnosis</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#162A45] font-display">
                Designed to Empower Consultations, Never Replace Physicians
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                BioPulse AI screening results are statistical risk estimations designed to help you and your healthcare provider make well-informed clinical decisions together. We never provide automated diagnoses or prescribe pharmaceutical regimens.
              </p>
            </div>
            <Link to={ROUTES.REGISTER} className="shrink-0">
              <Button variant="primary" size="lg" className="bg-[#0891B2] hover:bg-[#0e7490] text-white">
                Begin Step 01
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default HowItWorks;

