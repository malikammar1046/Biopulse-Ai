import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldAlert,
  Sparkles,
  Layers,
  BrainCircuit,
  Stethoscope,
  ArrowRight,
  Info,
  Sun,
  Zap,
  HeartPulse,
  Scale,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';

export const UnderstandMaleHypogonadism: React.FC = () => {
  const { t } = useTranslation(['public', 'common']);

  useEffect(() => {
    document.title = t('public:hypogonadismPage.title', 'Understand Male Hypogonadism | Clinical Screening Education | BioPulse AI');
  }, [t]);

  return (
    <div className="relative w-full overflow-hidden bg-transparent text-[#162A45] select-none">
      {/* ── 1. HERO ── */}
      <section className="relative pt-32 pb-20 sm:pb-24 overflow-hidden border-b border-slate-200/80 bg-transparent">

        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
                Educational Guidance • Male Health Pathway
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-[#162A45] leading-[1.12]">
              {t('public:hypogonadismPage.title', 'Understand Male Hypogonadism')}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-sans">
              {t('public:hypogonadismPage.subtitle', 'A comprehensive clinical overview of testosterone signaling, the HPT axis, morning diurnal rhythms, and how BioPulse AI screens for risk patterns.')}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0e7490] text-white shadow-lg shadow-cyan-900/10 cursor-pointer"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  {t('public:finalCta.button', 'Start Male Screening')}
                </Button>
              </Link>
              <a href="#what-is-hypogonadism">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-[#162A45] hover:bg-slate-50"
                >
                  Explore The Guide
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. WHAT IS MALE HYPOGONADISM? ── */}
      <section id="what-is-hypogonadism" className="py-20 border-b border-slate-200/80">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
                01 • Pathophysiology
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
                What Is Male Hypogonadism?
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-sans">
                Male hypogonadism is an endocrine disorder characterized by the inability of the testes to produce physiological levels of testosterone, normal sperm concentrations, or both, due to disruption anywhere along the hypothalamic-pituitary-testicular (HPT) axis.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Testosterone is essential for maintaining musculoskeletal mass, bone mineral density, erythropoiesis, metabolic homeostasis, cognitive clarity, and sexual function. When biological production falls below physiological requirements, systemic metabolic and endocrine consequences develop.
              </p>

              <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#0891B2] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong>Clinical Scope Note:</strong> BioPulse AI specifically screens for reproductive-endocrine hypogonadism patterns and risk indicators. We do not provide fertility treatments, IVF/ICSI clinic operations, or testosterone prescriptions.
                </p>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 text-left">
                <h3 className="text-lg font-bold font-display text-[#162A45]">
                  Key Physiological Roles of Testosterone
                </h3>
                <div className="space-y-4">
                  {[
                    { title: 'Endocrine & Metabolic Homeostasis', desc: 'Regulates body composition, visceral fat distribution, and peripheral insulin sensitivity.' },
                    { title: 'Musculoskeletal Integrity', desc: 'Maintains lean muscle protein synthesis and osteoblast-mediated bone mineral density.' },
                    { title: 'Neurological & Cognitive Energy', desc: 'Modulates mood stability, executive focus, sleep quality, and daily subjective vitality.' },
                    { title: 'Erythropoiesis Regulation', desc: 'Stimulates renal erythropoietin secretion to support healthy red blood cell production.' },
                  ].map((role, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-cyan-100/70 text-[#0891B2] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#162A45]">{role.title}</h4>
                        <p className="text-xs text-slate-500">{role.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3. COMMON SIGNS & SYMPTOMS ── */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
              02 • Symptom Profile
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              Common Signs & Clinical Presentation
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Hypogonadism presents with both specific endocrine markers and non-specific systemic symptoms that require careful clinical correlation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              {
                icon: HeartPulse,
                title: 'Sexual Health',
                items: ['Reduced libido / sexual desire', 'Decreased frequency of spontaneous erections', 'Erectile dysfunction resistant to basic therapy'],
              },
              {
                icon: Zap,
                title: 'Energy & Musculoskeletal',
                items: ['Unexplained chronic daytime fatigue', 'Loss of lean muscle mass & strength', 'Increased visceral adiposity (abdominal fat)'],
              },
              {
                icon: Brain,
                title: 'Neurobehavioral',
                items: ['Impaired concentration and brain fog', 'Depressive mood, irritability, or low motivation', 'Sleep disturbances and nocturnal waking'],
              },
              {
                icon: Scale,
                title: 'Metabolic & Physical',
                items: ['Decreased bone mineral density (osteopenia)', 'Mild normocytic normochromic anemia', 'Gynecomastia (breast tissue tenderness)'],
              },
            ].map((group, idx) => {
              const Icon = group.icon;
              return (
                <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#162A45] font-display">{group.title}</h3>
                  <ul className="space-y-2">
                    {group.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs text-slate-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0891B2] shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 4. HPT AXIS OVERVIEW ── */}
      <section className="py-20 border-b border-slate-200/80">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
                03 • Endocrine Physiology
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
                The Hypothalamic-Pituitary-Testicular (HPT) Axis
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                Testosterone synthesis is tightly regulated by a closed feedback loop:
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
                  <h4 className="text-sm font-bold text-[#162A45]">1. Hypothalamus (GnRH)</h4>
                  <p className="text-xs text-slate-600">Releases gonadotropin-releasing hormone (GnRH) in pulsatile bursts into the hypophyseal portal circulation.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
                  <h4 className="text-sm font-bold text-[#162A45]">2. Anterior Pituitary (LH & FSH)</h4>
                  <p className="text-xs text-slate-600">Luteinizing hormone (LH) stimulates Leydig cells to synthesize testosterone; Follicle-stimulating hormone (FSH) supports testicular tubules.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-1">
                  <h4 className="text-sm font-bold text-[#162A45]">3. Negative Feedback Loop</h4>
                  <p className="text-xs text-slate-600">Circulating testosterone and estradiol feed back to suppress hypothalamic GnRH and pituitary LH, keeping endocrine balance steady.</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-slate-900 text-white space-y-6 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Feedback Mechanics
                </span>
                <h3 className="text-xl font-bold font-display">
                  Why Feedback Loop Disruption Matters
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  When testicular output drops, a healthy pituitary responds by surging LH secretion (Primary Hypogonadism). Conversely, if the pituitary or hypothalamus fails to send signals despite low testosterone, LH remains inappropriately low or normal (Secondary Hypogonadism).
                </p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-200">
                  Measuring LH alongside total testosterone allows doctors to locate where the signaling bottleneck exists.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 5. WHY SYMPTOMS ALONE ARE NOT DIAGNOSTIC ── */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
              04 • Differential Screening
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              Why Symptoms Alone Are Not Diagnostic
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Fatigue, reduced motivation, and low libido overlap with numerous non-endocrine conditions. Clinical guidelines require both persistent symptoms and confirmed biochemical testing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {[
              {
                title: 'Obstructive Sleep Apnea (OSA)',
                desc: 'Severe hypoxia and fragmented REM sleep suppress nocturnal LH pulses and testosterone synthesis, presenting identically to endocrine hypogonadism.',
              },
              {
                title: 'Depression & Chronic Stress',
                desc: 'Elevated glucocorticoids (cortisol) can centrally suppress GnRH secretion while mimicking androgen deficiency symptoms like lethargy and anhedonia.',
              },
              {
                title: 'Metabolic Syndrome & Adiposity',
                desc: 'Visceral fat aromatizes testosterone into estradiol and suppresses sex hormone-binding globulin (SHBG), skewing standard total measurements.',
              },
            ].map((card, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold font-mono">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-[#162A45] font-display">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{card.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 6. MORNING TESTOSTERONE CONTEXT ── */}
      <section className="py-20 border-b border-slate-200/80">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
                05 • Diurnal Rhythms
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
                The Crucial Role of Morning Testosterone
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
                In healthy men, testosterone secretion follows a pronounced circadian rhythm, reaching peak circulating levels between 7:00 AM and 10:00 AM, before declining up to 25–35% by late afternoon.
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 text-xs text-slate-700 leading-relaxed">
                  <strong>Why Morning Testing Is Non-Negotiable:</strong> A blood draw taken at 3:00 PM will frequently fall below reference ranges even in a completely healthy male, causing a false positive indication of hypogonadism.
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <strong>Confirmation Rule:</strong> International endocrine consensus (Endocrine Society, AUA) mandates at least two separate morning fasting serum total testosterone measurements before considering a clinical diagnosis.
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-display text-[#162A45]">
                    Circadian Serum Curve (24 Hours)
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Sun className="w-4 h-4 text-amber-500" /> Morning Peak
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
                      <span>7:00 AM – 10:00 AM</span>
                      <span className="font-mono">Peak (100%)</span>
                    </div>
                    <p className="text-xs text-amber-800">
                      Standardized diagnostic window for serum testosterone blood draws.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>2:00 PM – 6:00 PM</span>
                      <span className="font-mono text-slate-500">Trough (65–75%)</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Circulating values drop significantly. Testing at this time invalidates reference comparisons.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>11:00 PM – 4:00 AM</span>
                      <span className="font-mono text-slate-500">Sleep Elevation</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Pulsatile nocturnal secretion replenishes circulating levels during undisturbed slow-wave and REM sleep.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7. PRIMARY VS SECONDARY HYPOGONADISM ── */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
              06 • Classification
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              Primary vs. Secondary Hypogonadism
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Understanding where the failure occurs in the endocrine chain dictates the clinical management pathway.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="inline-flex px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
                Hypergonadotropic
              </div>
              <h3 className="text-xl font-bold font-display text-[#162A45]">Primary Hypogonadism</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                The primary pathology resides within the testes themselves. Leydig cells are incapable of producing adequate testosterone despite excessive pituitary stimulation.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Total Testosterone:</span>
                  <span className="font-bold text-red-600">LOW</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">LH / FSH:</span>
                  <span className="font-bold text-cyan-700">ELEVATED (High)</span>
                </div>
                <div className="text-slate-500 pt-1">
                  Causes: Klinefelter syndrome (47,XXY), prior cryptorchidism, mumps orchitis, chemotherapy, or physical trauma.
                </div>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="inline-flex px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-xs font-semibold text-[#8E3EAF]">
                Hypogonadotropic
              </div>
              <h3 className="text-xl font-bold font-display text-[#162A45]">Secondary Hypogonadism</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                The pathology resides centrally in the pituitary gland or hypothalamus. Testes are physiologically normal, but receive insufficient gonadotropin stimulation.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">Total Testosterone:</span>
                  <span className="font-bold text-red-600">LOW</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-500">LH / FSH:</span>
                  <span className="font-bold text-amber-600">LOW or INAPPROPRIATELY NORMAL</span>
                </div>
                <div className="text-slate-500 pt-1">
                  Causes: Kallmann syndrome, hyperprolactinemia, pituitary adenomas, extreme obesity, type 2 diabetes, or chronic opioid use.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 8. HOW CLINICAL EVALUATION WORKS ── */}
      <section className="py-20 border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
              07 • Medical Standard
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              How Doctors Clinically Evaluate Hypogonadism
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              A legitimate medical evaluation follows a rigorous multi-step protocol before any clinical diagnosis or intervention is considered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {[
              {
                step: '01',
                title: 'Structured Symptoms',
                desc: 'Validated questionnaires (such as the ADAM questionnaire) evaluate sexual, metabolic, and affective changes over time.',
              },
              {
                step: '02',
                title: 'Two Morning Fasting Labs',
                desc: 'Two independent blood draws between 7:00 AM and 10:00 AM evaluating total testosterone, free testosterone, and SHBG.',
              },
              {
                step: '03',
                title: 'Pituitary Hormones',
                desc: 'Serum LH, FSH, and Prolactin testing to localize whether the issue is testicular (primary) or central (secondary).',
              },
              {
                step: '04',
                title: 'Differential Workup',
                desc: 'Screening for sleep apnea, thyroid function (TSH), iron overload (ferritin), and metabolic insulin resistance.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
                <span className="text-xs font-mono font-bold text-[#0891B2]">{item.step}</span>
                <h3 className="text-base font-bold text-[#162A45] font-display">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 9. HOW BIOPULSE AI SCREENS FOR RISK ── */}
      <section className="py-20 bg-cyan-50/30 border-b border-cyan-100">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
              08 • Our Technology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              How BioPulse AI Screens for Male Hypogonadism Risk
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              We apply an intelligent, explainable 2-tier screening architecture tailored strictly for male reproductive-endocrine evaluation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-xs font-semibold text-[#0891B2]">
                <Layers className="w-3.5 h-3.5" />
                <span>Tier 1 • Baseline & Symptoms</span>
              </div>
              <h3 className="text-xl font-bold font-display text-[#162A45]">
                ADAM Questionnaire & Phenotypic Intake
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Evaluates validated ADAM criteria (libido decline, erection strength, endurance, mood, post-prandial sleepiness) alongside age, body mass index, and lifestyle risk factors. Zero lab blood draws required.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-xs font-semibold text-[#0891B2]">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Tier 2 • Endocrine Biomarkers</span>
              </div>
              <h3 className="text-xl font-bold font-display text-[#162A45]">
                Morning Serum & Metabolic Lab Integration
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Integrates verified lab values including morning total testosterone, free testosterone, SHBG, LH, and fasting glucose via direct entry or OCR medical report upload to refine risk estimates.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 10. WHAT BIOPULSE AI CANNOT DIAGNOSE ── */}
      <section className="py-20 border-b border-slate-200/80">
        <Container size="xl">
          <div className="p-8 sm:p-10 rounded-3xl bg-rose-50/60 border border-rose-200/80 text-left space-y-6">
            <div className="flex items-center gap-3 text-rose-700">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-xl sm:text-2xl font-bold font-display">
                What BioPulse AI Cannot Diagnose
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-sans">
              BioPulse AI is an informational risk screening and clinical preparation tool, <strong>not a medical diagnostic device</strong>. The platform cannot and does not:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-rose-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-rose-800 block">No Formal Diagnosis</span>
                Diagnosis requires clinical physical examination (e.g. testicular volume assessment) and confirmed laboratory tests by an MD.
              </div>
              <div className="p-4 rounded-2xl bg-white border border-rose-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-rose-800 block">No Medication Prescriptions</span>
                BioPulse AI never prescribes, sells, or recommends testosterone replacement therapy (TRT), SERMs, or medications.
              </div>
              <div className="p-4 rounded-2xl bg-white border border-rose-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-rose-800 block">No Fertility Treatments</span>
                We do not perform semen analysis, sperm count evaluations, IVF, or ICSI clinic services.
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 11. WHEN TO SPEAK WITH A CLINICIAN ── */}
      <section className="py-20 bg-slate-50/50 border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
              09 • Clinical Guidance
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              When to Speak With an Endocrinologist or Urologist
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Schedule a clinical consultation if you experience persistent symptoms or encounter any of the following clinical indicators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {[
              {
                title: 'Persistent Libido & Erection Loss',
                desc: 'Marked, chronic decrease in morning erections and sexual drive that persists across multiple weeks without obvious acute lifestyle cause.',
              },
              {
                title: 'Progressive Unexplained Fatigue',
                desc: 'Profound daytime exhaustion and lack of physical recovery despite adequate sleep hygiene and appropriate calorie intake.',
              },
              {
                title: 'Gynecomastia or Testicular Atrophy',
                desc: 'Noticeable tender swelling in male breast tissue or physical reduction in testicular size requires immediate specialist evaluation.',
              },
              {
                title: 'Unexplained Osteopenia / Fractures',
                desc: 'Early loss of bone mineral density or low-trauma bone fractures in men, which frequently signals chronic androgen deficiency.',
              },
              {
                title: 'Severe Cognitive Slump',
                desc: 'Marked loss of executive concentration, persistent brain fog, or depressive mood changes in conjunction with metabolic weight gain.',
              },
              {
                title: 'Subnormal Morning Lab Values',
                desc: 'Any confirmed fasting morning serum total testosterone test resulting below 300 ng/dL warrants clinical endocrine investigation.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-[#0891B2] text-xs font-bold font-mono">
                  <Stethoscope className="w-4 h-4" />
                  <span>Clinical Indication</span>
                </div>
                <h3 className="text-base font-bold text-[#162A45] font-display">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 12. CTA ── */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-[#FFFFFF] to-[#F1F8FB] text-center">
        <Container size="md">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
              <ShieldCheck className="w-4 h-4" />
              <span>Evidence-Based Reproductive-Endocrine Screening</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45]">
              Start Your Confidential Male Health Screening
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto font-sans leading-relaxed">
              Take the first step toward understanding your endocrine health with progressive, explainable AI screening tailored to your symptoms.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0e7490] text-white shadow-lg shadow-cyan-900/10 cursor-pointer"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Begin Screening
                </Button>
              </Link>
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-[#162A45] hover:bg-slate-50"
                >
                  How Screening Works
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default UnderstandMaleHypogonadism;
