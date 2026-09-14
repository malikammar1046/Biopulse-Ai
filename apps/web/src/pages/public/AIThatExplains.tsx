import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  AlertCircle,
  ArrowRight,
  Eye,
  FileCheck,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Info
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const AIThatExplains: React.FC = () => {
  const [activePathway, setActivePathway] = useState<'womens' | 'mens'>('womens');

  const pillars = [
    {
      icon: Eye,
      title: 'No Black Boxes',
      description:
        'Conventional machine learning outputs a percentage without justification. BIOPulse AI breaks down every assessment into identifiable, clinical features so you know exactly what influenced the result.',
    },
    {
      icon: BarChart3,
      title: 'Transparent Feature Attribution',
      description:
        'Using SHAP (SHapley Additive exPlanations) methodology, users see which specific factors (e.g., cycle irregularities, morning testosterone levels, or metabolic markers) contributed most heavily to the model.',
    },
    {
      icon: AlertCircle,
      title: 'Missing Data Awareness',
      description:
        'A responsible AI must communicate uncertainty. If critical lab tests are absent, BIOPulse AI explicitly states what missing information could make the assessment more informative.',
    },
    {
      icon: FileCheck,
      title: 'Grounded in Clinical Consensus',
      description:
        'All algorithms are built around established clinical guidelines — including the Rotterdam Consensus for PCOS and the Endocrine Society Clinical Practice Guidelines for Male Hypogonadism.',
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#E879F9] backdrop-blur-md">
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Explainable AI (XAI) in Reproductive Health</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15]">
              AI That Explains,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#38BDF8]">
                Not Pretends
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
              In medicine, an unexplained score is dangerous.
              BIOPulse AI makes reproductive health intelligence transparent, auditable, and grounded in clinical science.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-lg font-bold"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  See How It Works
                </Button>
              </Link>
              <Link to={ROUTES.FOR_DOCTORS}>
                <Button
                  variant="outline"
                  size="md"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Clinician Architecture
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Four Pillars of Explainability ── */}
      <section className="py-20 border-b border-white/10">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
              Why Explainability Matters
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed font-sans">
              Every insight must be explainable in plain human language to empower individuals and support collaborative clinician discussions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white font-display">
                    {pillar.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#B4A6C7] leading-relaxed font-sans">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 3. Interactive Example: Feature Attribution in Action ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                How an Insight is Explained
              </h2>
              <p className="text-sm text-[#B4A6C7]">
                Here is a conceptual look at how BIOPulse AI breaks down a screening attribution card across pathways.
              </p>

              {/* Pathway Switcher */}
              <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md pt-1">
                <button
                  onClick={() => setActivePathway('womens')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePathway === 'womens'
                      ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white shadow-lg'
                      : 'text-[#B4A6C7] hover:text-white'
                  }`}
                >
                  Women's Pathway (PCOS Model)
                </button>
                <button
                  onClick={() => setActivePathway('mens')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activePathway === 'mens'
                      ? 'bg-gradient-to-r from-[#2563EB] to-[#7C3AED] text-white shadow-lg'
                      : 'text-[#B4A6C7] hover:text-white'
                  }`}
                >
                  Men's Pathway (Hypogonadism Model)
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#1E0B30] to-[#0E0317] border border-white/15 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-[#E879F9] uppercase tracking-wider block">
                    {activePathway === 'womens' ? 'PCOS Feature Attribution' : 'Hypogonadism Feature Attribution'}
                  </span>
                  <p className="text-xs text-[#EDE4F7] font-medium mt-0.5">
                    These features had the greatest influence on the model's assessment.
                  </p>
                </div>
                <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full font-mono shrink-0">
                  Educational Screening Only
                </span>
              </div>

              {activePathway === 'womens' ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="font-semibold text-white">Cycle Irregularity (Mean 42 Days)</span>
                      <p className="text-[11px] text-[#B4A6C7]">Prolonged intervals contribute heavily to the statistical pattern</p>
                    </div>
                    <span className="font-mono text-[#FB7185] font-bold">+0.34 influence</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="font-semibold text-white">LH / FSH Ratio (1.71)</span>
                      <p className="text-[11px] text-[#B4A6C7]">Elevated LH relative to FSH reflects common endocrine signalling</p>
                    </div>
                    <span className="font-mono text-[#FB7185] font-bold">+0.26 influence</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="font-semibold text-white">Normal Fasting Glucose (88 mg/dL)</span>
                      <p className="text-[11px] text-[#B4A6C7]">Metabolic glycemic marker within typical physiological bounds</p>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">-0.14 influence</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>Missing Information & Prioritization:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed italic">
                      "Based on the evaluated model, this additional information could provide the greatest estimated improvement in screening performance relative to its estimated cost. This information is intended to support discussion with a healthcare professional and does not constitute a medical recommendation."
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="font-semibold text-white">Morning Serum Total Testosterone (8.2 nmol/L)</span>
                      <p className="text-[11px] text-[#B4A6C7]">Recorded between 07:00–10:00 AM; falls below standard clinical threshold</p>
                    </div>
                    <span className="font-mono text-[#60A5FA] font-bold">+0.38 influence</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="font-semibold text-white">Pituitary Gonadotropins (LH 10.2 mIU/mL, FSH 9.8 mIU/mL)</span>
                      <p className="text-[11px] text-[#B4A6C7]">Assists in differentiating primary testicular from secondary pituitary patterns</p>
                    </div>
                    <span className="font-mono text-[#60A5FA] font-bold">+0.24 influence</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <span className="font-semibold text-white">Persistent Fatigue & Vitality Score (AMS Scale)</span>
                      <p className="text-[11px] text-[#B4A6C7]">Validated questionnaire responses reflecting reduced daytime vitality</p>
                    </div>
                    <span className="font-mono text-[#C084FC] font-bold">+0.20 influence</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      <span>Missing Information & Prioritization:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed italic">
                      "Based on the evaluated model, this additional information could provide the greatest estimated improvement in screening performance relative to its estimated cost. This information is intended to support discussion with a healthcare professional and does not constitute a medical recommendation."
                    </p>
                  </div>
                </div>
              )}

              {/* Attribution vs Causality Notice */}
              <div className="pt-2 flex items-start gap-2 text-[11px] text-[#B4A6C7] border-t border-white/10">
                <Info className="w-4 h-4 text-[#FDA4AF] shrink-0 mt-0.5" />
                <p>
                  <strong>Attribution Notice:</strong> Feature influence indicates statistical association within the evaluated model, not biological causality. Having a high influence factor does not mean that factor caused your symptoms.
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-[#34D399] font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Non-Diagnostic Educational Intelligence</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white">
              Experience Explainable Health Intelligence
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] max-w-xl mx-auto leading-relaxed font-sans">
              Explore your health information with transparent feature attribution and clinical guidelines.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-xl font-bold"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Start Your Assessment
                </Button>
              </Link>
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Read How It Works
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
