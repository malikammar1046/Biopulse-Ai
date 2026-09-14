import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Activity,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ROUTES } from '../../constants/routes';
import { SmallBotanicalSprig } from '../../components/brand/BotanicalFoliage';

export const Conditions: React.FC = () => {
  useEffect(() => {
    document.title = 'Conditions We Support | BioPulse AI';
  }, []);

  return (
    <div className="flex flex-col w-full overflow-hidden bg-transparent text-[#162A45] min-h-screen">
      {/* ── 1. Hero Section ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-slate-200/80">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[450px] bg-pink-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[450px] bg-cyan-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />

        {/* Small Botanical Accents */}
        <div className="hidden lg:block absolute top-28 left-8 opacity-65 pointer-events-none -rotate-12">
          <SmallBotanicalSprig variant="pink" className="w-18 h-auto" />
        </div>
        <div className="hidden lg:block absolute top-28 right-8 opacity-65 pointer-events-none rotate-12">
          <SmallBotanicalSprig variant="teal" flip className="w-18 h-auto" />
        </div>

        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider text-[11px] font-bold">
                Supported Health Pathways
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
            >
              Conditions We Currently{' '}
              <span className="text-[#0891B2]">Support</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto"
            >
              BioPulse AI focuses on targeted, explainable screening for two high-impact reproductive-endocrine conditions. Each pathway provides specialized screening models, clinical lab ingestion, and culturally tailored guidance.
            </motion.p>
          </div>
        </Container>
      </section>

      {/* ── 2. The Two Supported Conditions Cards ── */}
      <section className="py-20 sm:py-28 relative">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Condition 1: PCOS */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex"
            >
              <Card
                variant="elevated"
                hoverEffect
                className="w-full p-8 sm:p-10 rounded-3xl bg-white border border-pink-200/80 shadow-lg shadow-pink-100/40 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#E11D48] border border-pink-200/80 flex items-center justify-center">
                      <Heart className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" size="md" className="bg-rose-50 text-[#E11D48] border-pink-200/80 font-mono text-[11px] font-bold">
                      Female Pathway
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#162A45]">
                      Polycystic Ovary Syndrome (PCOS)
                    </h2>
                    <p className="text-xs font-mono font-semibold text-[#0891B2]">
                      Hormonal, metabolic &amp; ovulatory pattern screening
                    </p>
                  </div>

                  {/* Primary Educational Note on PMOS terminology */}
                  <div className="p-4 rounded-2xl bg-[#FFF5F7] border border-pink-200/80 space-y-1 text-left">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#BE123C] font-mono">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Terminology Note:</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      PCOS is also referred to by the updated medical name <strong className="text-[#162A45]">PMOS (Polyendocrine Metabolic Ovarian Syndrome)</strong>, which reflects the condition's multi-system metabolic and hormonal nature beyond ovarian cysts.
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-sans">
                    PCOS affects how reproductive hormones, insulin sensitivity, and ovulatory cycles coordinate. BioPulse AI provides progressive screening evaluating self-reported symptoms, metabolic blood panels, and ultrasound morphology.
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      Screening Signals Evaluated
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-sans">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                        <span>Cycle irregularity &amp; intervals</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                        <span>Androgenic markers (acne, hair)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                        <span>Insulin resistance &amp; glucose</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                        <span>Pelvic ultrasound morphology (PCOM)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <Link to={ROUTES.UNDERSTAND_PCOS_CANONICAL} className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-md rounded-full"
                      iconRight={<ArrowRight className="w-4 h-4" />}
                    >
                      Understand PCOS
                    </Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} className="text-xs font-semibold text-[#0891B2] hover:underline">
                    Start PCOS Screening →
                  </Link>
                </div>
              </Card>
            </motion.div>

            {/* Condition 2: Male Hypogonadism */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex"
            >
              <Card
                variant="elevated"
                hoverEffect
                className="w-full p-8 sm:p-10 rounded-3xl bg-white border border-sky-200/80 shadow-lg shadow-sky-100/40 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0288D1] border border-sky-200/80 flex items-center justify-center">
                      <Activity className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" size="md" className="bg-sky-50 text-[#0288D1] border-sky-200/80 font-mono text-[11px] font-bold">
                      Male Pathway
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#162A45]">
                      Male Hypogonadism
                    </h2>
                    <p className="text-xs font-mono font-semibold text-[#0891B2]">
                      Testosterone signaling &amp; HPT axis risk screening
                    </p>
                  </div>

                  {/* Primary Educational Note on Clinical Focus */}
                  <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-sky-200/80 space-y-1 text-left">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0369A1] font-mono">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Clinical Scope Note:</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      BioPulse AI evaluates endocrine and testosterone signaling patterns. It is <strong className="text-[#162A45]">not</strong> a sperm analysis or fertility clinic platform; it screens for endocrine hypogonadism and systemic vitality signals.
                    </p>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed font-sans">
                    Male hypogonadism occurs when the body produces insufficient testosterone or impaired signaling along the Hypothalamic-Pituitary-Testicular (HPT) axis. BioPulse AI assesses validated ADAM symptom scores and morning lab results.
                  </p>

                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      Screening Signals Evaluated
                    </span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-sans">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" />
                        <span>ADAM vitality &amp; stamina questionnaire</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" />
                        <span>Morning total testosterone draw timing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" />
                        <span>LH, prolactin, and metabolic biomarkers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" />
                        <span>Circadian sleep &amp; physical fatigue cues</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <Link to={ROUTES.UNDERSTAND_MALE_HYPOGONADISM} className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto bg-[#0288D1] hover:bg-[#0369A1] text-white shadow-md rounded-full"
                      iconRight={<ArrowRight className="w-4 h-4" />}
                    >
                      Understand Hypogonadism
                    </Button>
                  </Link>
                  <Link to={ROUTES.REGISTER} className="text-xs font-semibold text-[#0891B2] hover:underline">
                    Start Male Screening →
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── 3. Extensibility & Boundary Note ── */}
          <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Platform Extensibility</span>
            </div>
            <h3 className="text-lg font-bold font-display text-[#162A45]">
              Designed for Focused Depth, Built for Responsible Growth
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              BioPulse AI is engineered with an extensible modular architecture so additional reproductive-endocrine pathways may be added in the future. We currently support <strong>only PCOS and Male Hypogonadism</strong> to maintain rigorous clinical alignment.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Non-Diagnostic Screening &amp; Decision Support Only</span>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Conditions;
