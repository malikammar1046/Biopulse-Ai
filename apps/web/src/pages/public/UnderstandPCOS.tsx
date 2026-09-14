import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  Calendar,
  HeartPulse,
  Scale,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { SmallBotanicalSprig } from '../../components/brand/BotanicalFoliage';

export const UnderstandPCOS: React.FC = () => {
  useEffect(() => {
    document.title = 'Understand PCOS | Clinical Screening Education | BioPulse AI';
  }, []);

  return (
    <div className="relative w-full overflow-hidden bg-transparent text-[#162A45] select-none">
      {/* ── 1. HERO ── */}
      <section className="relative pt-32 pb-20 sm:pb-24 overflow-hidden border-b border-slate-200/80">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[500px] bg-pink-100/50 rounded-full blur-[160px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-100/40 rounded-full blur-[150px] pointer-events-none -z-10" />

        {/* Small Botanical Accents */}
        <div className="hidden lg:block absolute top-28 left-8 opacity-75 pointer-events-none -rotate-12">
          <SmallBotanicalSprig variant="pink" className="w-20 h-auto" />
        </div>
        <div className="hidden lg:block absolute top-28 right-8 opacity-65 pointer-events-none rotate-12">
          <SmallBotanicalSprig variant="dual" flip className="w-18 h-auto" />
        </div>

        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
                Educational Guidance • Female Health Pathway
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-[#162A45] leading-[1.12]">
              Understand{' '}
              <span className="text-[#0891B2]">
                PCOS
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-sans">
              A comprehensive clinical overview of Polycystic Ovary Syndrome, hormonal signaling, follicular development, and how BioPulse AI screens for risk patterns.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0e7490] text-white shadow-lg shadow-cyan-900/10 cursor-pointer"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Start PCOS Screening
                </Button>
              </Link>
              <a href="#name-note">
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

      {/* ── 2. A NOTE ABOUT THE NAME (PCOS → PMOS EDUCATIONAL NOTE) ── */}
      <section id="name-note" className="py-12 bg-cyan-50/60 border-b border-cyan-100">
        <Container size="lg">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-cyan-200/80 shadow-sm flex flex-col md:flex-row items-start gap-5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100/80 text-[#0891B2] flex items-center justify-center shrink-0 mt-1">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0891B2]">
                Terminology & Nomenclature
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-[#162A45]">
                A Note About the Name
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                Polycystic Ovary Syndrome (PCOS) has also been renamed/referred to as <strong>Polyendocrine Metabolic Ovarian Syndrome (PMOS)</strong>. The newer terminology reflects the condition’s broader endocrine, metabolic, and ovarian features rather than implying it is solely an ovarian disease.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed font-sans pt-1">
                Throughout BioPulse AI, we continue using <strong>PCOS</strong> as the primary user-facing term because it remains the most widely recognized and clinically standard name across laboratories and medical guidelines worldwide.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3. WHAT IS PCOS? ── */}
      <section className="py-20 bg-white text-[#162A45] border-b border-slate-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-[#0891B2]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Condition Overview</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              What Is PCOS?
            </h2>
            <p className="text-base text-slate-700 leading-relaxed font-sans">
              Polycystic Ovary Syndrome is a complex endocrine and metabolic condition affecting approximately 8% to 13% of women of reproductive age worldwide. Rather than being an isolated disease of the ovaries, it represents an interconnected disruption in neuroendocrine signaling, androgen metabolism, and insulin regulation.
            </p>
            <p className="text-base text-slate-700 leading-relaxed font-sans">
              In healthy physiology, the brain (pituitary gland) coordinates with the ovaries via luteinizing hormone (LH) and follicle-stimulating hormone (FSH) to mature and release a single egg each menstrual cycle. In PCOS, altered hormone feedback and compensatory hyperinsulinemia prevent follicles from maturing fully, leading to irregular ovulation and elevated androgen levels.
            </p>
          </div>
        </Container>
      </section>

      {/* ── 4. COMMON SIGNS & SYMPTOMS ── */}
      <section className="py-20 bg-slate-50 text-[#162A45] border-b border-slate-200/80">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              Common Signs & Symptoms
            </h2>
            <p className="text-base text-slate-600 font-sans">
              PCOS presents differently across individuals. The most common physical and clinical manifestations include:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Calendar,
                title: 'Ovulatory Irregularity',
                desc: 'Infrequent periods (oligomenorrhea), absent cycles (amenorrhea), or unpredictable cycle lengths exceeding 35 days.',
                accent: '#0891B2',
                bg: 'bg-cyan-50',
              },
              {
                icon: Sparkles,
                title: 'Androgen Excess',
                desc: 'Excess facial or body hair (hirsutism), persistent cystic acne along the jawline, or thinning scalp hair (androgenic alopecia).',
                accent: '#7C3AED',
                bg: 'bg-purple-50',
              },
              {
                icon: Scale,
                title: 'Metabolic Shifts',
                desc: 'Insulin resistance, weight gain or difficulty losing weight, dark velvety skin patches (acanthosis nigricans), and skin tags.',
                accent: '#D97706',
                bg: 'bg-amber-50',
              },
              {
                icon: HeartPulse,
                title: 'Energy & Mood Changes',
                desc: 'Afternoon energy crashes, sleep disturbances, fatigue, and heightened vulnerability to anxiety or mood variations.',
                accent: '#E11D48',
                bg: 'bg-rose-50',
              },
            ].map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-left"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${s.bg}`}>
                    <Icon className="w-5 h-5" style={{ color: s.accent }} />
                  </div>
                  <h3 className="text-lg font-bold font-display text-[#162A45]">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── 5. WHY PCOS CAN BE DIFFICULT TO IDENTIFY ── */}
      <section className="py-20 bg-white text-[#162A45] border-b border-slate-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              Why PCOS Can Be Difficult to Identify
            </h2>
            <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed font-sans">
              <p>
                PCOS is heterogeneous—it does not look the same in every woman. Some women have severe cycle irregularities without excess body hair; others experience severe hirsutism while maintaining regular bleeding intervals. Furthermore, lean individuals can still develop PCOS driven primarily by neuroendocrine or adrenal factors.
              </p>
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs sm:text-sm text-amber-900 space-y-2">
                <strong className="block font-bold">Diagnostic Mimics Must Be Excluded</strong>
                <p>
                  Because conditions like hypothyroidism, hyperprolactinemia, and non-classical congenital adrenal hyperplasia (NCCAH) produce similar symptoms, clinical evaluation requires systematic blood testing to rule out other endocrine causes.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 6. HORMONAL & METABOLIC PATTERNS ── */}
      <section className="py-20 bg-slate-50 text-[#162A45] border-b border-slate-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              Hormonal & Metabolic Patterns
            </h2>
            <p className="text-base text-slate-600 font-sans">
              Underneath physical symptoms lie distinctive biochemical feedback loops:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                <h4 className="text-sm font-bold text-[#162A45]">Elevated LH / FSH Ratio</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Rapid GnRH pulsatility prompts the pituitary to produce higher luteinizing hormone relative to FSH, stimulating ovarian theca cell androgen production.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                <h4 className="text-sm font-bold text-[#162A45]">Circulating Androgen Excess</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Elevated total or free testosterone and DHEA-S contribute to physical signs of hirsutism, acne, and follicular arrest.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                <h4 className="text-sm font-bold text-[#162A45]">Hyperinsulinemia & Resistance</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Insulin resistance causes higher circulating insulin, which directly prompts the ovaries to synthesize more androgens and lowers sex hormone-binding globulin (SHBG).
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                <h4 className="text-sm font-bold text-[#162A45]">Reduced SHBG</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  When SHBG levels are reduced in the liver, a larger percentage of circulating testosterone remains unbound and biologically active.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7. OVARY / PCOM MORPHOLOGY ── */}
      <section className="py-20 bg-white text-[#162A45] border-b border-slate-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              Ovary & PCOM Morphology
            </h2>
            <p className="text-base text-slate-700 leading-relaxed font-sans">
              The term "polycystic" is clinically misleading. The small fluid-filled structures observed on pelvic ultrasound are not true cysts, tumors, or dangerous growths. They are <strong>immature antral follicles</strong> (2–9 mm) that began maturing but paused development due to altered hormonal signals.
            </p>
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3">
              <h4 className="text-base font-bold text-[#162A45]">Polycystic Ovarian Morphology (PCOM) Ultrasound Definition</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                According to international consensus guidelines, PCOM is defined as either:
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 font-sans">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>≥ 20 follicles per ovary in either ovary (using modern high-frequency transducers), or</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>An increased ovarian volume of ≥ 10 mL (in the absence of a dominant follicle or corpus luteum).</span>
                </li>
              </ul>
              <p className="text-xs text-slate-500 font-sans pt-1">
                Note: In adolescents within 8 years of menarche, ultrasound criteria should not be used as a primary diagnostic marker because multicystic ovaries are common during normal pubertal development.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 8. HOW PCOS IS CLINICALLY ASSESSED ── */}
      <section className="py-20 bg-slate-50 text-[#162A45] border-b border-slate-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              How PCOS Is Clinically Assessed
            </h2>
            <p className="text-base text-slate-700 leading-relaxed font-sans">
              Physicians diagnose PCOS using the international <strong>Rotterdam Consensus Criteria</strong>. A diagnosis requires meeting at least <strong>two of the following three features</strong>, provided other exclusionary conditions are ruled out:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-cyan-100 text-[#0891B2] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="text-sm text-[#162A45] block">Ovulatory Dysfunction</strong>
                  <span className="text-xs text-slate-600">Irregular, infrequent (oligomenorrhea), or completely absent (amenorrhea) menstrual bleeding.</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="text-sm text-[#162A45] block">Clinical or Biochemical Hyperandrogenism</strong>
                  <span className="text-xs text-slate-600">Visible physical signs (hirsutism, acne, scalp hair loss) or laboratory blood tests showing elevated androgens.</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="text-sm text-[#162A45] block">Polycystic Ovarian Morphology (PCOM)</strong>
                  <span className="text-xs text-slate-600">Pelvic ultrasound showing ≥ 20 follicles per ovary or ovarian volume ≥ 10 mL.</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 9. HOW BIOPULSE AI SCREENS FOR PCOS ── */}
      <section className="py-20 bg-white text-[#162A45] border-b border-slate-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              How BioPulse AI Screens for PCOS
            </h2>
            <p className="text-base text-slate-700 leading-relaxed font-sans">
              BioPulse AI organizes PCOS screening into an accessible, progressive 3-tier structure so you can start with what you know and add laboratory investigations as available:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-[#0891B2]">Tier 1</span>
                <h4 className="text-sm font-bold text-[#162A45]">Baseline & Symptoms</h4>
                <p className="text-xs text-slate-600">Cycle length, bleeding regularity, observable hirsutism, acne, and metabolic metrics.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Tier 2</span>
                <h4 className="text-sm font-bold text-[#162A45]">Laboratory Biomarkers</h4>
                <p className="text-xs text-slate-600">Total/Free Testosterone, LH, FSH, SHBG, fasting glucose, and lipid panel values.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Tier 3</span>
                <h4 className="text-sm font-bold text-[#162A45]">Ultrasound Imaging</h4>
                <p className="text-xs text-slate-600">Follicle counts per ovary and ovarian volume extracted and verified from pelvic ultrasound reports.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              Screening outputs are powered by explainable AI (XAI) feature attribution, revealing which markers contributed most heavily to the statistical pattern.
            </p>
          </div>
        </Container>
      </section>

      {/* ── 10. WHAT BIOPULSE AI CANNOT DIAGNOSE ── */}
      <section className="py-16 bg-amber-50/70 text-[#162A45] border-b border-amber-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-4 text-left">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4" />
              <span>Safety & Clinical Boundaries</span>
            </div>
            <h3 className="text-2xl font-bold font-display text-amber-950">
              What BioPulse AI Cannot Diagnose
            </h3>
            <p className="text-sm text-amber-900 leading-relaxed font-sans">
              BioPulse AI is strictly an educational screening and clinical decision-support tool. It does <strong>not</strong> provide formal medical diagnoses, conduct transvaginal ultrasound imaging, rule out exclusionary endocrine conditions, or prescribe medical treatments (such as oral contraceptives, Metformin, or Spironolactone).
            </p>
            <p className="text-xs text-amber-800 leading-relaxed font-sans">
              All results should be taken to a qualified healthcare provider (such as a gynecologist or endocrinologist) for clinical interpretation and comprehensive care planning.
            </p>
          </div>
        </Container>
      </section>

      {/* ── 11. WHEN TO SPEAK WITH A CLINICIAN ── */}
      <section className="py-20 bg-white text-[#162A45] border-b border-slate-200/80">
        <Container size="lg">
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-[#162A45]">
              When to Speak With a Clinician
            </h2>
            <p className="text-base text-slate-700 leading-relaxed font-sans">
              Consult a healthcare professional (gynecologist or endocrinologist) promptly if you experience:
            </p>
            <div className="space-y-3 text-sm text-slate-700 font-sans">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Absence of menstrual bleeding for $\ge 3$ consecutive months (unrelated to pregnancy), which requires clinical assessment to protect endometrial health.</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Rapidly developing hirsutism, deepening of the voice, or sudden hair loss, which warrants investigation for rapid-onset androgen sources.</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Severe, acute pelvic pain, which could indicate an acute event such as ovarian torsion or cyst rupture requiring urgent medical evaluation.</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Difficulty conceiving after 6–12 months of regular unprotected intercourse, or planning pregnancy with known irregular menstrual cycles.</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 12. FINAL CTA ── */}
      <section className="py-20 bg-gradient-to-b from-[#F8FAFC] to-white text-[#162A45]">
        <Container size="lg">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-semibold text-[#0891B2]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Begin With Evidence-Based Screening</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45]">
              Ready to Understand Your Health Patterns?
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-sans max-w-xl mx-auto">
              Complete your baseline PCOS screening in under five minutes. Receive explainable feature attribution, cost-aware laboratory guidance, and Pakistani nutrition planning.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-[#0891B2] hover:bg-[#0e7490] text-white shadow-lg shadow-cyan-900/10 cursor-pointer"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Start Free PCOS Screening
                </Button>
              </Link>
              <Link to={ROUTES.CONDITIONS}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-[#162A45] hover:bg-slate-50"
                >
                  View All Supported Conditions
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default UnderstandPCOS;

