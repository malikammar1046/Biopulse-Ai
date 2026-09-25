import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  BrainCircuit,
  SlidersHorizontal,
  FileText,
  UtensilsCrossed,
  CalendarCheck,
  Activity,
  Bot,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { SmallBotanicalSprig } from '../../components/brand/BotanicalFoliage';

export const Features: React.FC = () => {
  const pillars = [
    {
      id: 'progressive-screening',
      num: '01',
      title: 'Progressive Screening',
      subtitle: 'Dynamic multi-tier evaluation adapted to your pathway',
      icon: Layers,
      accent: '#0891B2',
      bg: 'bg-cyan-50',
      tag: 'Screening Engine',
      desc: 'Start with what you know today. Begin with everyday symptoms and health background, then enrich the assessment as blood panels or clinical imaging become available. Female pathway screens across 3 tiers (symptoms, labs, ultrasound); male pathway screens across 2 tiers (ADAM symptoms, labs).',
      bullets: [
        'Dedicated screening algorithms for PCOS and Male Hypogonadism',
        'Non-diagnostic risk estimation adapted to available data tiers',
        'Never requires costly or invasive tests before providing initial guidance',
      ],
    },
    {
      id: 'explainable-ai',
      num: '02',
      title: 'Explainable AI (XAI)',
      subtitle: 'SHAP factor influence without black boxes',
      icon: BrainCircuit,
      accent: '#7C3AED',
      bg: 'bg-purple-50',
      tag: 'Interpretability',
      desc: 'Black-box algorithms breed anxiety. BioPulse AI exposes model feature attributions, showing you precisely which reported symptoms, metabolic metrics, and hormonal markers drove the screening result.',
      bullets: [
        'Visual factor influence bars showing relative weight of each marker',
        'Clear clinical rationales explaining biological connections in plain language',
        'Transparent statistical association rather than misleading certainty',
      ],
    },
    {
      id: 'cost-aware',
      num: '03',
      title: 'Cost-Aware Next Steps',
      subtitle: 'Value-of-Information decision support',
      icon: SlidersHorizontal,
      accent: '#D97706',
      bg: 'bg-amber-50',
      tag: 'Economic Support',
      desc: 'Healthcare costs matter. Our Value-of-Information guidance highlights which missing lab tests offer high statistical clarity versus financial burden before you spend money out of pocket.',
      bullets: [
        'Identifies high-gain versus redundant laboratory tests',
        'Helps you prepare informed questions for your next doctor consultation',
        'Prevents unnecessary out-of-pocket medical expenditures',
      ],
    },
    {
      id: 'medical-reports',
      num: '04',
      title: 'Medical Report Support',
      subtitle: 'OCR digitization with human-in-the-loop verification',
      icon: FileText,
      accent: '#2563EB',
      bg: 'bg-blue-50',
      tag: 'Data Ingestion',
      desc: 'Upload laboratory report photos or PDF summaries. Our optical character recognition extracts quantitative analytes, hormone levels, and units directly into structured fields, which you inspect and confirm before saving.',
      bullets: [
        'Recognizes formats from major regional and international diagnostic labs',
        'Side-by-side inspection: review original paper slips against extracted values',
        'Zero unverified data enters your screening profile without your approval',
      ],
    },
    {
      id: 'pakistani-nutrition',
      num: '05',
      title: 'Pakistani Nutrition Planning',
      subtitle: 'Culturally verified 7-day meal plans & portion sizes',
      icon: UtensilsCrossed,
      accent: '#059669',
      bg: 'bg-emerald-50',
      tag: 'Dietary Guidance',
      desc: 'Practical, evidence-informed dietary guidance grounded in authentic Pakistani foods (daal, roti, sabzi, seasonal produce) rather than imported western diets. Features verified portions, glycemic load balance, and micronutrient coverage.',
      bullets: [
        'Structured 7-day Pakistani meal plan with breakfast, lunch, dinner, and snack',
        'Portion sizing and daily hydration tracking tailored to endocrine balance',
        'Clear separation between your prescribed plan and what you actually ate',
      ],
    },
    {
      id: 'consultation-prep',
      num: '06',
      title: 'Appointments & Consultation Preparation',
      subtitle: 'Structured doctor visit briefs and visit logs',
      icon: CalendarCheck,
      accent: '#E11D48',
      bg: 'bg-rose-50',
      tag: 'Clinical Preparation',
      desc: 'Make short doctor consultations more productive. Log appointments with gynecologists, endocrinologists, or urologists, organize questions in advance, and generate structured health briefs summarizing your screening history.',
      bullets: [
        'Pathway-aware doctor reminders (Gynecologist for PCOS; Endocrinologist/Urologist for Hypogonadism)',
        'Pre-consultation question builder to ensure no symptom is forgotten',
        'Structured briefs summarizing longitudinal trends and verified lab history',
      ],
    },
    {
      id: 'daily-tracking',
      num: '07',
      title: 'Daily Health Tracking',
      subtitle: 'Pathway-tailored symptom, nutrition, and vitality logs',
      icon: Activity,
      accent: '#0891B2',
      bg: 'bg-cyan-50',
      tag: 'Daily Observations',
      desc: 'Log daily symptoms, energy levels, sleep quality, and lifestyle consistency. Women track menstrual cycles, ovulation patterns, and symptom phases; men track vitality, morning energy, and strength without female-only cycle prompts.',
      bullets: [
        'Pathway-specific daily tracking fields strictly relevant to your biology',
        '5-point severity logging for non-judgmental tracking over time',
        'Integrated food, movement, and medication consistency records',
      ],
    },
    {
      id: 'ai-assistant',
      num: '08',
      title: 'AI Health Assistant',
      subtitle: 'Contextual guidance, explanation, and terminology support',
      icon: Bot,
      accent: '#7C3AED',
      bg: 'bg-purple-50',
      tag: 'Interactive Support',
      desc: 'An interactive conversational assistant grounded in your active health profile. Ask questions about your screening result, factor attributions, upcoming lab investigations, or Pakistani nutritional alternatives in clear, reassuring language.',
      bullets: [
        'Pathway-tailored suggested questions for PCOS and Male Hypogonadism',
        'Demystifies clinical terminology and laboratory reference ranges',
        'Strict non-diagnostic guardrails — never prescribes treatments or alters medications',
      ],
    },
    {
      id: 'care-circle',
      num: '09',
      title: 'Care Circle Ecosystem',
      subtitle: 'Zero-compromise consent & clinician-family sharing',
      icon: Users,
      accent: '#0284C7',
      bg: 'bg-sky-50',
      tag: 'Care Network',
      desc: 'Health journeys shouldn’t be walked alone. Securely invite your treating physician, reproductive endocrinologist, or trusted loved ones to view your longitudinal summaries on your exact terms, with granular permissions and instant access revocation.',
      bullets: [
        'Weekly doctor brief synthesis tailored for rapid clinical consultations',
        'Custom view permissions: separate clinical data from sensitive personal logs',
        'Instant one-click revocation: you always retain 100% patient ownership',
      ],
      link: ROUTES.CARE_CIRCLE,
      linkLabel: 'Explore Care Circle Platform',
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
                Core Platform Architecture
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-[#162A45] leading-[1.12]">
              Built Around Exactly{' '}
              <span className="text-[#0891B2]">
                8 Core Pillars
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-sans">
              BioPulse AI delivers evidence-aligned screening, transparent feature explanations, cost-conscious test progression, and regionally adapted Pakistani nutrition for PCOS and Male Hypogonadism.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0e7490] text-white shadow-lg shadow-cyan-900/10 cursor-pointer"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Start Free Screening
                </Button>
              </Link>
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-[#162A45] hover:bg-slate-50"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. THE 8 REAL PILLARS GRID */}
      <section className="py-20 sm:py-28 bg-white text-[#162A45] relative">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#162A45] font-display tracking-tight">
              Real Capabilities. Zero Exaggerated Claims.
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto font-sans">
              Every feature below is implemented in BioPulse AI to support your endocrine health journey responsibly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="p-8 sm:p-10 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between text-left space-y-6 hover:bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${pillar.bg}`}
                        >
                          <Icon className="w-6 h-6" style={{ color: pillar.accent }} />
                        </div>
                        <span
                          className="text-xs font-mono font-bold px-3 py-1 rounded-full text-white"
                          style={{ backgroundColor: pillar.accent }}
                        >
                          Pillar {pillar.num}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-600">
                        {pillar.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold font-display text-[#162A45]">
                        {pillar.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5 font-mono">
                        {pillar.subtitle}
                      </p>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed font-sans">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                    {pillar.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </div>
                    ))}

                    {pillar.link && (
                      <div className="pt-2">
                        <Link
                          to={pillar.link}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284C7] hover:text-[#0369A1] transition-colors"
                        >
                          <span>{pillar.linkLabel || 'Learn more'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. RESPONSIBLE REASSURANCE BANNER */}
      <section className="py-16 bg-[#F8FAFC] border-t border-slate-200">
        <Container size="lg">
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Strict Non-Diagnostic Standard</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#162A45] font-display">
                Engineered to Assist Doctors, Never to Replace Them
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                BioPulse AI does not diagnose, prescribe treatments, or sell pharmaceuticals. Our objective is to structure your biological information so you and your doctor can make confident, evidence-informed decisions together.
              </p>
            </div>
            <Link to={ROUTES.ABOUT} className="shrink-0">
              <Button variant="outline" size="md" className="border-slate-300 text-[#162A45]">
                Read Our Mission
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Features;

