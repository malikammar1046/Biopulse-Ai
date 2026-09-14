import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldAlert,
  Info,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Thermometer,
  Zap,
  Stethoscope
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const UnderstandMaleFertility: React.FC = () => {
  const [selectedParam, setSelectedParam] = useState<number>(0);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const parameters = [
    {
      title: 'Concentration (Count)',
      clinicalTerm: 'Sperm Concentration / Total Count',
      simplified: 'How many sperm cells are present in each milliliter of semen.',
      referenceRange: '≥ 15 million per mL (or ≥ 39 million per ejaculate)',
      whatItMeans:
        'Concentration provides an estimate of sperm density. While higher numbers statistically provide more opportunities, conception regularly occurs across varied ranges.',
      caution:
        'A single lower count does not mean complete infertility. Daily factors such as recent fever, stress, or days of abstinence can significantly alter numbers.',
    },
    {
      title: 'Motility (Movement)',
      clinicalTerm: 'Total & Progressive Motility',
      simplified: 'How effectively sperm swim forward toward their target.',
      referenceRange: '≥ 40% total motility, or ≥ 32% progressive motility (swimming in straight lines or large circles)',
      whatItMeans:
        'To reach an egg, sperm need forward propulsion. Movement is categorized as progressive (moving forward), non-progressive (moving in place), and immotile.',
      caution:
        'Sperm movement can fluctuate based on sample temperature, collection timing, and metabolic health.',
    },
    {
      title: 'Morphology (Shape)',
      clinicalTerm: 'Kruger Strict Morphology',
      simplified: 'The physical shape, head structure, and proportion of sperm cells.',
      referenceRange: '≥ 4% normal forms (using strict Kruger criteria)',
      whatItMeans:
        'Under high-power microscopy, sperm heads, midpieces, and tails are examined. A normal form allows effective binding and penetration of the egg membrane.',
      caution:
        'Most sperm in any healthy sample have atypical shapes. A reading of 4% to 10% normal forms is considered standard reference, not "failing".',
    },
    {
      title: 'Volume & Vitality',
      clinicalTerm: 'Ejaculate Volume, pH & Vitality',
      simplified: 'The total fluid produced by accessory glands and the percentage of living sperm cells.',
      referenceRange: 'Volume ≥ 1.4 - 1.5 mL; Vitality ≥ 58% live sperm',
      whatItMeans:
        'Seminal fluid nourishes and protects sperm during transit. Proper volume and pH balance are essential for sperm survival in the reproductive tract.',
      caution:
        'Short intervals between ejaculations or incomplete collection frequently cause falsely low volume measurements.',
    },
  ];

  const contributingFactors = [
    {
      icon: Thermometer,
      title: 'Scrotal Temperature & Heat',
      description:
        'Spermatogenesis requires temperatures roughly 2°C to 4°C below core body temperature. Frequent sauna use, hot tubs, tight compression gear, or resting laptops directly on the lap can elevate testicular temperatures temporarily.',
      evidence: 'May be associated with reduced motility and concentration during active heat exposure.',
    },
    {
      icon: Clock,
      title: '70–90 Day Spermatogenesis Cycle',
      description:
        'Sperm development takes between 70 to 90 days from germ cell to mature sperm. A lifestyle intervention, nutritional change, or illness experienced today may not manifest in semen analysis until nearly three months later.',
      evidence: 'Highlights why patience and longitudinal tracking are vital.',
    },
    {
      icon: Zap,
      title: 'Oxidative Stress & Cellular Health',
      description:
        'Reactive oxygen species (ROS) can damage sperm cell membranes and DNA integrity. High stress, smoking, heavy alcohol intake, poor sleep, and ultra-processed diets can increase oxidative markers.',
      evidence: 'Antioxidant-rich nutrition and metabolic improvements can support cellular stability.',
    },
    {
      icon: Stethoscope,
      title: 'Varicocele & Physical Factors',
      description:
        'A varicocele is an enlargement of veins within the scrotum, similar to varicose veins. It can elevate local temperature and alter blood drainage.',
      evidence: 'A common, treatable anatomical consideration evaluated during physical exams by a urologist.',
    },
    {
      icon: Activity,
      title: 'Metabolic & Hormonal Signals',
      description:
        'Testosterone, LH, FSH, thyroid hormones, and insulin resistance play coordinated roles in signaling sperm production in the testes.',
      evidence: 'Hormonal panels help doctors see if the brain-testis signaling axis is communicating smoothly.',
    },
    {
      icon: Layers,
      title: 'Environmental & Chemical Exposure',
      description:
        'Pesticides, heavy metals, endocrine-disrupting chemicals (EDCs like phthalates and BPA), and occupational toxins can impact reproductive endocrine pathways.',
      evidence: 'Minimizing unnecessary plastic heating and toxic exposures may provide protective benefits.',
    },
  ];

  const faqs = [
    {
      q: 'Does oligospermia mean I cannot father a biological child?',
      a: 'No. Oligospermia is defined as a sperm concentration lower than 15 million/mL. It indicates that the statistical odds per natural cycle may be lower, but millions of viable sperm are still present. Many couples conceive spontaneously with mild or moderate oligospermia. It is not equivalent to azoospermia (zero sperm) or absolute sterility.',
    },
    {
      q: 'Why do doctors recommend doing at least two semen analyses weeks apart?',
      a: 'Semen parameters have high natural biological variability. An illness, fever, medication, acute stress, or varying abstinence periods (too short or too long) can cause temporary sharp drops in count or motility. Clinical guidelines typically recommend two or three separate analyses spaced weeks apart before drawing conclusions.',
    },
    {
      q: 'How long before lifestyle or diet changes reflect in a test?',
      a: 'Because the full cycle of sperm creation (spermatogenesis) and maturation in the epididymis takes roughly 70 to 90 days, improvements in nutrition, sleep, exercise, and heat avoidance usually take about 3 months to be observable in a follow-up semen analysis.',
    },
    {
      q: 'What role does BIOPulse AI play in Men’s Health?',
      a: 'BIOPulse AI provides educational health literacy, longitudinal parameter visualization, OCR lab-report digitizing, and clinician summary exports. It does not replace a doctor or give an automated diagnosis. It is designed to help you understand your metrics so you can have structured, productive conversations with your healthcare provider.',
    },
  ];

  return (
    <div className="flex flex-col w-full bg-[#10071A] text-white min-h-screen">
      {/* ── 1. Hero Section ── */}
      <section className="relative pt-32 pb-20 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-br from-[#8E3EAF]/20 via-[#A21CAF]/15 to-[#E87084]/20 rounded-full blur-3xl opacity-70" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#FB7185] backdrop-blur-md">
              <Activity className="w-3.5 h-3.5" />
              <span>Men's Health & Fertility Education</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.15]">
              Understanding Male Fertility{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FB7185] via-[#E879F9] to-[#A855F7]">
                Beyond the Numbers
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
              Clear, patient-friendly guidance on semen analysis parameters, oligospermia,
              the 90-day spermatogenesis timeline, and lifestyle factors that can influence sperm health.
            </p>

            {/* Non-Diagnostic Safety Callout Banner */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/15 text-left flex items-start gap-3.5 shadow-lg backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 text-[#FB7185] shrink-0 mt-0.5" />
              <div className="text-xs text-[#EDE4F7] leading-relaxed">
                <strong className="text-white block font-semibold mb-0.5">
                  Clinical & Educational Notice:
                </strong>
                This page is designed for patient education. Semen analysis values are baseline reference ranges,
                not definitive guarantees or single-point diagnoses. Individual fertility is multi-factorial and
                requires comprehensive evaluation by a qualified urologist or reproductive endocrinologist.
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. The Spermatogenesis Timeline (~70-90 Days) ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#E879F9]">
                <Clock className="w-3.5 h-3.5" />
                <span>Biological Timeline</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-white">
                Sperm Takes ~70 to 90 Days to Form
              </h2>
              <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed font-sans">
                Many people assume semen quality reflects yesterday’s choices. In biological reality,
                sperm creation (spermatogenesis) is a continuous, multi-stage process taking between
                10 to 12 weeks from stem cell genesis in the seminiferous tubules to final maturation in the epididymis.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-[#EDE4F7] leading-relaxed">
                    <strong className="text-white">A fever today</strong> may temporarily affect test results 6 to 8 weeks from now.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-[#EDE4F7] leading-relaxed">
                    <strong className="text-white">Positive lifestyle modifications</strong> (better sleep, heat reduction, balanced micronutrients) require approximately 3 months to be observable in a semen analysis.
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-[#EDE4F7] leading-relaxed">
                    <strong className="text-white">Longitudinal tracking</strong> is crucial because individual tests are mere snapshots of a shifting biological curve.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Timeline Card */}
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#230C38] via-[#1A082B] to-[#12041F] border border-white/15 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-xs font-mono font-bold tracking-wider text-[#FB7185] uppercase">
                  Spermatogenesis Pipeline
                </span>
                <span className="text-xs text-[#B4A6C7] font-mono">Total: ~74–90 Days</span>
              </div>

              <div className="space-y-4">
                <div className="relative pl-6 border-l-2 border-[#E87084]/40 pb-4">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#E87084]" />
                  <div className="text-xs font-bold text-white">Stage 1: Spermatogonia Genesis (Days 1–25)</div>
                  <p className="text-[11px] text-[#B4A6C7] mt-1 leading-relaxed">
                    Stem cells in the testicular seminiferous tubules divide and begin differentiation into primary spermatocytes.
                  </p>
                </div>

                <div className="relative pl-6 border-l-2 border-[#A21CAF]/40 pb-4">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#A21CAF]" />
                  <div className="text-xs font-bold text-white">Stage 2: Meiotic Division (Days 26–55)</div>
                  <p className="text-[11px] text-[#B4A6C7] mt-1 leading-relaxed">
                    Genetic material is recombined and halved into haploid spermatids. Highly sensitive to oxidative stress and testicular heat.
                  </p>
                </div>

                <div className="relative pl-6 border-l-2 border-[#8E3EAF]/40 pb-4">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-[#8E3EAF]" />
                  <div className="text-xs font-bold text-white">Stage 3: Spermiogenesis (Days 56–74)</div>
                  <p className="text-[11px] text-[#B4A6C7] mt-1 leading-relaxed">
                    Round cells compact DNA, discard excess cytoplasm, and develop tails, midpieces, and acrosome caps.
                  </p>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-emerald-400" />
                  <div className="text-xs font-bold text-emerald-400">Stage 4: Epididymal Maturation (Days 75–90)</div>
                  <p className="text-[11px] text-[#B4A6C7] mt-1 leading-relaxed">
                    Sperm travel through the epididymis where they gain forward motility and the biochemical capability to fertilize an oocyte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3. Interactive Semen Analysis Parameters ── */}
      <section className="py-20 border-b border-white/10">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
              Key Semen Analysis Parameters
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed">
              Standard semen analysis examines multiple distinct criteria defined by World Health Organization (WHO) reference manuals. Click each parameter to understand what it means in everyday language.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {parameters.map((param, index) => (
              <button
                key={param.title}
                onClick={() => setSelectedParam(index)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedParam === index
                    ? 'bg-gradient-brand text-white shadow-lg shadow-purple-950/40 scale-105'
                    : 'bg-white/5 border border-white/10 text-[#B4A6C7] hover:bg-white/10 hover:text-white'
                }`}
              >
                {param.title}
              </button>
            ))}
          </div>

          {/* Active Parameter Card */}
          <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#1F0D33] via-[#150724] to-[#0D0317] border border-white/15 shadow-2xl">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white font-display">
                    {parameters[selectedParam].title}
                  </h3>
                  <span className="text-xs text-[#FB7185] font-mono">
                    {parameters[selectedParam].clinicalTerm}
                  </span>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-emerald-400 font-mono">
                  Standard Ref: {parameters[selectedParam].referenceRange}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-[#B4A6C7] uppercase tracking-wider mb-1">
                    Plain Language Explanation
                  </div>
                  <p className="text-sm md:text-base text-[#EDE4F7] leading-relaxed">
                    {parameters[selectedParam].simplified}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-semibold text-[#B4A6C7] uppercase tracking-wider mb-1">
                    Biological Context
                  </div>
                  <p className="text-xs md:text-sm text-[#B4A6C7] leading-relaxed">
                    {parameters[selectedParam].whatItMeans}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200/90 leading-relaxed">
                    <strong className="text-amber-200 font-semibold block mb-0.5">Important Caution:</strong>
                    {parameters[selectedParam].caution}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 4. Demystifying Oligospermia ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#FB7185]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Clinical Clarity</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
              What Oligospermia Is — and What It Isn't
            </h2>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/15 space-y-4 text-sm text-[#B4A6C7] leading-relaxed">
              <p>
                <strong className="text-white">Definition:</strong> Oligospermia simply refers to a sperm concentration below 15 million sperm per milliliter of semen. It is categorized clinically into mild (10–15 million/mL), moderate (5–10 million/mL), and severe (less than 5 million/mL).
              </p>
              <p>
                <strong className="text-white">It is NOT complete infertility:</strong> Having oligospermia does not mean you cannot father a biological child. Conception is a complex biological probability; even with a lower concentration, viable and healthy sperm remain capable of fertilization. Many couples conceive without clinical intervention, while others benefit from intrauterine insemination (IUI) or in vitro fertilization (IVF/ICSI).
              </p>
              <p>
                <strong className="text-white">It is NOT equivalent to Azoospermia:</strong> Azoospermia means zero sperm are detected in the ejaculate. Oligospermia means sperm are present, but at density levels below statistical baseline medians.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  What Oligospermia Means
                </div>
                <ul className="text-xs text-[#B4A6C7] space-y-1.5 list-disc pl-4">
                  <li>Sperm density is lower than the WHO median baseline.</li>
                  <li>May lower the statistical probability of pregnancy per cycle.</li>
                  <li>Serves as a signal to review metabolic, anatomical, and lifestyle factors.</li>
                  <li>Warrants repeat testing across weeks to confirm the pattern.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FB7185]" />
                  What Oligospermia Does NOT Mean
                </div>
                <ul className="text-xs text-[#B4A6C7] space-y-1.5 list-disc pl-4">
                  <li>It does NOT mean total sterility or zero sperm.</li>
                  <li>It does NOT automatically mean assisted reproductive technology is mandatory.</li>
                  <li>It does NOT reflect your masculinity, virility, or general vigor.</li>
                  <li>It does NOT represent a permanent, unchangeable state.</li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 5. Contributing Factors (Multi-Factorial View) ── */}
      <section className="py-20 border-b border-white/10">
        <Container size="xl">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
              Factors That Can Influence Sperm Health
            </h2>
            <p className="text-sm md:text-base text-[#B4A6C7] leading-relaxed">
              Male fertility is influenced by multiple interconnected biological, environmental, and physical factors. Rather than isolated causes, these factors can interact in complex ways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributingFactors.map((factor) => {
              const Icon = factor.icon;
              return (
                <div
                  key={factor.title}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white font-display">
                      {factor.title}
                    </h3>
                    <p className="text-xs text-[#B4A6C7] leading-relaxed">
                      {factor.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-white/10 text-[11px] text-[#FB7185] italic">
                    {factor.evidence}
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 6. FAQ Accordion ── */}
      <section className="py-20 border-b border-white/10 bg-[#160A24]/60">
        <Container size="xl">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-3 mb-8">
              <h2 className="text-3xl md:text-4xl font-bold font-display text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-[#B4A6C7]">
                Clear, evidence-aligned answers to common fertility concerns.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={faq.q}
                  className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 text-sm md:text-base font-semibold text-white hover:text-[#FB7185] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="text-xs text-[#B4A6C7] font-mono shrink-0">
                      {activeFaq === index ? '−' : '+'}
                    </span>
                  </button>
                  {activeFaq === index && (
                    <div className="p-4 md:p-5 pt-0 text-xs md:text-sm text-[#B4A6C7] leading-relaxed border-t border-white/5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7. CTA Section ── */}
      <section className="py-20">
        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#290E42] via-[#1B082D] to-[#10031B] border border-white/20 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto text-white shadow-lg shadow-purple-950/50">
              <Activity className="w-6 h-6" />
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-white">
              Track Your Longitudinal Fertility Health
            </h2>

            <p className="text-sm md:text-base text-[#B4A6C7] max-w-xl mx-auto leading-relaxed">
              Upload semen analysis reports, visualize your 90-day progress, and generate structured clinician-ready summaries for your next doctor's appointment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-xl shadow-purple-950/40"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Create Free Account
                </Button>
              </Link>
              <Link to={ROUTES.MENS_HEALTH}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Explore Men's Health Hub
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
