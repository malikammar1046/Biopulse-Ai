import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import {
  Activity,
  ShieldAlert,
  Brain,
  Layers,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Zap,
  ChevronDown,
  Stethoscope,
  Info,
  Sun,
  Moon,
  FileText,
  AlertTriangle,
  HeartPulse,
  Scale,
  Smile,
  UserCheck
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Button } from '../../components/ui/Button';
import { ROUTES } from '../../constants/routes';
import { MaleBiologyVisualVessel } from './understand-male-sections/MaleBiologyVisualVessel';

// Chapter Navigation anchors
const MALE_CHAPTERS = [
  { id: 'hero', label: 'Understand Hypogonadism' },
  { id: 'male-biology', label: 'Signaling & Anatomy' },
  { id: 'what-is-hypogonadism', label: 'What is It?' },
  { id: 'symptoms-experiences', label: 'Possible Symptoms' },
  { id: 'hpt-axis-interactive', label: 'Interactive HPT Axis' },
  { id: 'morning-testosterone', label: 'Morning Timing' },
  { id: 'primary-vs-secondary', label: 'Primary vs Secondary' },
  { id: 'talk-to-doctor', label: 'When to Consult' },
  { id: 'unsupervised-warning', label: 'Safety & Steroid Warning' },
  { id: 'male-health-myths', label: 'Myth vs Fact' },
  { id: 'next-steps', label: 'Next Steps' },
];

type HptMode = 'normal' | 'primary' | 'secondary';

export const UnderstandMaleHypogonadism: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    document.title =
      'Understand Male Hypogonadism | HPT Axis & Testosterone Education | VITASense';
  }, []);

  // Interactive HPT Axis state
  const [hptMode, setHptMode] = useState<HptMode>('normal');
  const [selectedHptNode, setSelectedHptNode] = useState<
    'hypothalamus' | 'pituitary' | 'testes' | null
  >('testes');
  const [showHptTranscript, setShowHptTranscript] = useState<boolean>(false);

  // Myth accordion state
  const [openMythId, setOpenMythId] = useState<string | null>('masturbation');

  const scrollToChapter = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#10071A] text-white select-none">
      {/* ── Top Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0284C7] via-[#818CF8] to-[#FB7185] origin-left z-50 shadow-[0_0_12px_#38BDF8]"
        style={{ scaleX }}
      />

      {/* ── Floating Chapter Navigation (Desktop) ── */}
      <div className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-2 p-2 rounded-full bg-[#180A26]/70 border border-white/10 backdrop-blur-xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {MALE_CHAPTERS.map((chap, idx) => (
          <button
            key={chap.id}
            onClick={() => scrollToChapter(chap.id)}
            className="group relative flex items-center justify-end p-1 cursor-pointer"
            aria-label={`Jump to ${chap.label}`}
          >
            <span className="absolute right-7 whitespace-nowrap px-2.5 py-1 rounded-xl bg-[#10071A]/90 border border-white/15 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
              {idx + 1}. {chap.label}
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-white/25 group-hover:bg-[#38BDF8] group-hover:scale-125 transition-all" />
          </button>
        ))}
      </div>

      {/* ── 1. HERO SECTION ── */}
      <section
        id="hero"
        className="relative pt-32 pb-20 sm:pb-28 overflow-hidden border-b border-white/10"
        aria-labelledby="hero-title"
      >
        {/* Ambient Backlighting */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#0284C7]/20 via-[#6366F1]/20 to-[#A21CAF]/15 rounded-full blur-[160px] opacity-75" />
          <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#FB7185]/12 rounded-full blur-[140px]" />
        </div>

        <Container size="xl" className="relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#38BDF8] backdrop-blur-md">
              <Activity className="w-3.5 h-3.5" />
              <span>Men's Health Education & Signaling Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-title"
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-display leading-[1.08]"
            >
              Understand Male{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#E879F9]">
                Hypogonadism.
              </span>
            </h1>

            {/* Patient-friendly Subtitle */}
            <p className="text-base sm:text-xl text-[#CDBDD8] max-w-3xl mx-auto font-sans leading-relaxed">
              Learn how testosterone, the brain, and the testes work together in a continuous feedback
              dialogue—and what your health information and lab patterns may tell you.
            </p>

            {/* Core Product Language Tag */}
            <div className="inline-flex items-center gap-3 text-xs font-mono text-[#A797BD] tracking-wider uppercase">
              <span>Understand</span>
              <span className="text-white/40">•</span>
              <span>Assess</span>
              <span className="text-white/40">•</span>
              <span>Prioritize</span>
              <span className="text-white/40">•</span>
              <span>Improve</span>
            </div>

            {/* Safety & Non-Diagnostic Notice */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/15 text-left flex items-start gap-3.5 shadow-xl backdrop-blur-md max-w-2xl mx-auto">
              <ShieldAlert className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
              <div className="text-xs text-[#EDE4F7] leading-relaxed font-sans">
                <strong className="text-white block font-semibold mb-0.5">
                  Clinical Screening & Education Disclaimer:
                </strong>
                This platform is for screening and educational purposes only. It does not diagnose,
                prescribe treatment, or replace a healthcare professional.
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => scrollToChapter('male-biology')}
                className="bg-gradient-to-r from-[#0284C7] via-[#6366F1] to-[#8E3EAF] text-white shadow-lg cursor-pointer"
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                Explore Biology & Signaling
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => scrollToChapter('morning-testosterone')}
                className="border-white/20 text-white hover:bg-white/10 cursor-pointer"
              >
                Why Morning Timing Matters
              </Button>
            </div>
          </div>
        </Container>

        {/* ── 1.5 Visual Biological Showcase: Dual-Mode Vessel (HPT Axis & Pelvic Anatomy) ── */}
        <div id="male-biology" className="relative z-10 w-full">
          <MaleBiologyVisualVessel />
        </div>
      </section>

      {/* ── 2. WHAT IS MALE HYPOGONADISM? ── */}
      <section
        id="what-is-hypogonadism"
        className="py-20 sm:py-28 border-b border-white/10"
        aria-labelledby="what-is-title"
      >
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                  The Condition in Plain Language
                </span>
              </div>

              <h2
                id="what-is-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
              >
                What is{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] bg-clip-text text-transparent">
                  Male Hypogonadism?
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed">
                A simple guide to the body’s testosterone production and signaling systems.
              </p>
            </div>

            {/* Core Explanation Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-[#180A26] to-[#10071A] border border-white/15 shadow-2xl space-y-6 text-left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0284C7]/30 to-[#6366F1]/30 border border-white/15 flex items-center justify-center shrink-0 text-[#38BDF8]">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                    A Signaling and Production Condition
                  </h3>
                  <p className="text-sm sm:text-base text-[#EDE4F7] leading-relaxed font-sans">
                    <strong className="text-white">Male hypogonadism</strong> is a health condition
                    where the body may not produce enough testosterone, or may have difficulty with the
                    hormone signals that instruct the testes to make testosterone.
                  </p>
                  <p className="text-sm sm:text-base text-[#EDE4F7] leading-relaxed font-sans">
                    Testosterone is not just about muscle or reproduction; it is an essential hormone that
                    regulates daily physical energy, mood, bone density, red blood cell production, and
                    overall metabolic balance. When testosterone levels or signaling pathways drop, the body
                    can experience subtle or noticeable shifts.
                  </p>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                    <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                      <strong className="text-white">Important Distinction:</strong> Male hypogonadism is
                      not purely an "infertility" condition, and should not be framed solely around sperm count.
                      It is an endocrine and signaling condition that affects total well-being.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3. SYMPTOMS & EXPERIENCES ── */}
      <section
        id="symptoms-experiences"
        className="py-20 sm:py-28 border-b border-white/10"
        aria-labelledby="symptoms-title"
      >
        <Container size="xl">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                  What People May Experience
                </span>
              </div>

              <h2
                id="symptoms-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
              >
                Symptoms &{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#E879F9] bg-clip-text text-transparent">
                  Everyday Changes
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed">
                Symptoms can develop gradually and vary between individuals. Remember:{' '}
                <strong className="text-white">these symptoms can have many possible causes</strong>,
                ranging from poor sleep and high stress to metabolic or thyroid variations.
              </p>
            </div>

            {/* Symptom Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: 'Low Energy & Fatigue',
                  summary: 'Persistent fatigue, reduced physical stamina, or sluggishness throughout the workday.',
                  detail: 'Testosterone influences mitochondrial energy production and red blood cell counts, supporting cellular oxygenation.',
                  accent: '#38BDF8',
                },
                {
                  icon: HeartPulse,
                  title: 'Reduced Sexual Desire',
                  summary: 'A noticeable or gradual reduction in spontaneous libido or intimate interest.',
                  detail: 'Testosterone receptors in the brain coordinate natural sexual drive and responsive sexual arousal.',
                  accent: '#FB7185',
                },
                {
                  icon: Activity,
                  title: 'Erectile Concerns',
                  summary: 'Changes in the quality, frequency, or firmness of spontaneous morning or sexual erections.',
                  detail: 'Erectile function involves a delicate interplay of vascular blood flow, neural tone, and androgen signals.',
                  accent: '#818CF8',
                },
                {
                  icon: Scale,
                  title: 'Reduced Muscle Strength',
                  summary: 'Unexplained loss of muscle mass, decreased grip strength, or difficulty building strength.',
                  detail: 'Androgens stimulate protein synthesis in skeletal muscle fibers, supporting lean body composition.',
                  accent: '#34D399',
                },
                {
                  icon: Smile,
                  title: 'Changes in Body Hair',
                  summary: 'Slowed facial hair growth, reduced frequency of shaving, or thinning body hair.',
                  detail: 'Testosterone and dihydrotestosterone (DHT) sustain terminal hair follicle growth across masculine patterns.',
                  accent: '#FBBF24',
                },
                {
                  icon: Brain,
                  title: 'Mood & Focus Shifts',
                  summary: 'Occasional brain fog, irritability, lower motivation, or mild depressive feelings.',
                  detail: 'Central nervous system androgen receptors modulate dopamine and serotonin neurochemistry.',
                  accent: '#C084FC',
                },
              ].map((symptom, idx) => {
                const Icon = symptom.icon;
                return (
                  <motion.div
                    key={symptom.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.35, delay: idx * 0.08 }}
                    className="p-6 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/70 to-[#12071F]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-xl backdrop-blur-md space-y-4"
                  >
                    <div className="space-y-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center border border-white/15 shadow-md"
                        style={{ backgroundColor: `${symptom.accent}20`, color: symptom.accent }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white font-display">{symptom.title}</h3>
                      <p className="text-xs sm:text-sm text-[#EDE4F7] leading-relaxed font-sans">
                        {symptom.summary}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-[#A797BD] leading-relaxed">
                      <strong className="text-white block font-semibold mb-0.5">Biological Cue:</strong>
                      {symptom.detail}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Non-Diagnostic Safety Callout */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5 text-left">
              <ShieldAlert className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
              <p className="text-xs text-[#B4A6C7] leading-relaxed font-sans">
                <strong className="text-white font-medium">Safe Context:</strong> Having one or more of
                these symptoms does not automatically mean you have hypogonadism. Because life stress, poor sleep,
                excess alcohol, and nutritional gaps create identical feelings, a formal evaluation by a physician
                is essential.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 4. INTERACTIVE HPT AXIS VISUALIZATION (CORE FEATURE) ── */}
      <section
        id="hpt-axis-interactive"
        className="py-24 sm:py-32 border-b border-white/10 relative overflow-hidden"
        aria-labelledby="hpt-axis-title"
      >
        {/* Glows */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[#0284C7]/15 rounded-full blur-[180px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#8E3EAF]/18 rounded-full blur-[160px] pointer-events-none -z-10" />

        <Container size="xl">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Zap className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                  Interactive Signaling Model
                </span>
              </div>

              <h2
                id="hpt-axis-title"
                className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display"
              >
                The Hypothalamic-Pituitary-Testicular{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#E879F9] bg-clip-text text-transparent">
                  (HPT) Axis
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#CDBDD8] max-w-3xl mx-auto leading-relaxed">
                Testosterone production is managed through a continuous molecular feedback loop between
                the brain and the testes. Select a signaling mode to see how the pathway communicates.
              </p>
            </div>

            {/* Mode Selector Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-3xl mx-auto">
              <button
                onClick={() => setHptMode('normal')}
                aria-pressed={hptMode === 'normal'}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  hptMode === 'normal'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-lg shadow-emerald-950/40'
                    : 'bg-white/5 text-[#B4A6C7] border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Normal Signaling</span>
              </button>

              <button
                onClick={() => setHptMode('primary')}
                aria-pressed={hptMode === 'primary'}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  hptMode === 'primary'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-lg shadow-amber-950/40'
                    : 'bg-white/5 text-[#B4A6C7] border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Primary Pattern (Testicular Origin)</span>
              </button>

              <button
                onClick={() => setHptMode('secondary')}
                aria-pressed={hptMode === 'secondary'}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  hptMode === 'secondary'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-lg shadow-purple-950/40'
                    : 'bg-white/5 text-[#B4A6C7] border border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Secondary Pattern (Brain/Pituitary Origin)</span>
              </button>
            </div>

            {/* Interactive Axis Visual Canvas & Narrative Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Interactive Node Diagram */}
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-[36px] bg-gradient-to-b from-[#180A26] to-[#0D0417] border border-white/15 shadow-2xl space-y-6 flex flex-col items-center">
                {/* Mode Indicator Badge */}
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        hptMode === 'normal'
                          ? '#34D399'
                          : hptMode === 'primary'
                          ? '#F59E0B'
                          : '#C084FC',
                    }}
                  />
                  <span className="uppercase font-bold tracking-wider">
                    {hptMode === 'normal'
                      ? 'Balanced Communication Axis'
                      : hptMode === 'primary'
                      ? 'Primary Pattern: Testes Disruption'
                      : 'Secondary Pattern: Upstream Signal Reduction'}
                  </span>
                </div>

                {/* 1. Hypothalamus Node */}
                <div
                  onClick={() => setSelectedHptNode('hypothalamus')}
                  className={`w-full max-w-sm p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedHptNode === 'hypothalamus'
                      ? 'bg-white/15 border-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] flex items-center justify-center">
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white font-display">Hypothalamus</h4>
                      <span className="text-[10px] font-mono text-[#A797BD]">Brain Center</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
                    Releases GnRH
                  </span>
                </div>

                {/* Downward Pulse Arrow: GnRH */}
                <div className="flex flex-col items-center justify-center my-[-8px]">
                  <span className="text-[10px] font-mono font-bold text-[#818CF8] bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                    ↓ GnRH (Pulsatile)
                  </span>
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#38BDF8] to-[#818CF8]" />
                </div>

                {/* 2. Pituitary Gland Node */}
                <div
                  onClick={() => setSelectedHptNode('pituitary')}
                  className={`w-full max-w-sm p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedHptNode === 'pituitary'
                      ? 'bg-white/15 border-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#818CF8]/20 text-[#818CF8] flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white font-display">Pituitary Gland</h4>
                      <span className="text-[10px] font-mono text-[#A797BD]">Master Endocrine Hub</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        hptMode === 'primary'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400'
                          : hptMode === 'secondary'
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-400'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      {hptMode === 'primary'
                        ? '↑ Elevated LH / FSH'
                        : hptMode === 'secondary'
                        ? '↓ Low / Normal LH / FSH'
                        : 'Balanced LH / FSH'}
                    </span>
                  </div>
                </div>

                {/* Downward Pulse Arrow: LH & FSH */}
                <div className="flex flex-col items-center justify-center my-[-8px]">
                  <span className="text-[10px] font-mono font-bold text-[#E879F9] bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                    ↓ LH (Signals Testosterone) & FSH (Signals Spermatogenesis)
                  </span>
                  <div className="w-0.5 h-6 bg-gradient-to-b from-[#818CF8] to-[#FB7185]" />
                </div>

                {/* 3. Testes Node */}
                <div
                  onClick={() => setSelectedHptNode('testes')}
                  className={`w-full max-w-sm p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedHptNode === 'testes'
                      ? 'bg-white/15 border-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FB7185]/20 text-[#FB7185] flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white font-display">Testes (Leydig Cells)</h4>
                      <span className="text-[10px] font-mono text-[#A797BD]">Target Organ</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        hptMode === 'normal'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                          : 'bg-[#FB7185]/30 text-[#FB7185] border border-[#FB7185]'
                      }`}
                    >
                      {hptMode === 'normal' ? 'Testosterone + Sperm' : '↓ Lower Testosterone'}
                    </span>
                  </div>
                </div>

                {/* Upward Negative Feedback Arrow */}
                <div className="w-full max-w-sm p-3 rounded-2xl bg-white/[0.03] border border-dashed border-white/15 flex items-center justify-between text-[11px] text-[#C5B5D5]">
                  <span>Circulating Feedback Loop:</span>
                  <span className="font-mono text-white/80">Testosterone signals back to brain</span>
                </div>
              </div>

              {/* Right: Detailed Educational Narrative */}
              <div className="lg:col-span-5 space-y-5 text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hptMode}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase px-3 py-1 rounded-full bg-white/10 text-[#D8B4FE]">
                        {hptMode === 'normal'
                          ? 'Normal Communication'
                          : hptMode === 'primary'
                          ? 'Primary Pattern Context'
                          : 'Secondary Pattern Context'}
                      </span>
                      <span
                        className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded-full ${
                          hptMode === 'normal'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : hptMode === 'primary'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {hptMode === 'normal'
                          ? 'Balanced Feedback'
                          : hptMode === 'primary'
                          ? 'Testes Signal Struggle'
                          : 'Reduced Brain Signals'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                      {hptMode === 'normal' && 'Normal Signaling Flow'}
                      {hptMode === 'primary' && 'Primary Pattern May Be Suggested'}
                      {hptMode === 'secondary' && 'Secondary Pattern May Be Suggested'}
                    </h3>

                    <p className="text-sm text-[#EDE4F7] leading-relaxed font-sans">
                      {hptMode === 'normal' &&
                        'In a healthy HPT axis, the hypothalamus sends pulses of GnRH to the pituitary gland. The pituitary responds by producing LH (which tells the testes to make testosterone) and FSH (which supports sperm development). As testosterone enters circulation, it gently tells the brain that enough hormone is present, keeping the system in balance.'}
                      {hptMode === 'primary' &&
                        'Sometimes laboratory patterns suggest that the testes themselves may have difficulty producing enough testosterone, despite receiving strong signals from the brain. Because testosterone in circulation is lower, the pituitary attempts to compensate by releasing higher levels of LH and FSH (like turning up the volume on a speaker when the sound is quiet).'}
                      {hptMode === 'secondary' &&
                        'Sometimes the pattern suggests that the signals controlling testosterone production may be reduced upstream in the brain or pituitary gland. In this pattern, LH and FSH levels remain inappropriately normal or low despite lower circulating testosterone, meaning the testes never receive an energetic signal to produce more.'}
                    </p>

                    <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#38BDF8] font-bold block flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Clinical Discussion Cue
                      </span>
                      <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                        {hptMode === 'normal' &&
                          'A normal axis demonstrates intact communication. Occasional mild fatigue is more commonly driven by acute stress or sleep deficits rather than endocrine disruption.'}
                        {hptMode === 'primary' &&
                          'This pattern can be associated with a problem involving the testes (such as prior injury, infection, genetic conditions, or age-related cellular changes). Clinicians evaluate LH and FSH alongside repeated morning testosterone.'}
                        {hptMode === 'secondary' &&
                          'This pattern can be associated with factors affecting the brain or pituitary (such as severe sleep apnea, acute illness, metabolic syndrome, high stress, significant obesity, or medication use).'}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Non-Diagnostic Safety Callout */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3 text-left">
                  <ShieldAlert className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#A797BD] leading-relaxed font-sans">
                    <strong>Educational Model:</strong> This simulation illustrates biological signaling
                    pathways. It does not diagnose primary or secondary hypogonadism in any individual.
                    Evaluation requires comprehensive laboratory panels and clinical examination.
                  </p>
                </div>
              </div>
            </div>

            {/* Accessible Transcript Toggle */}
            <div className="max-w-4xl mx-auto pt-2">
              <button
                onClick={() => setShowHptTranscript((c) => !c)}
                aria-expanded={showHptTranscript}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-semibold text-[#EDE4F7] hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-[#38BDF8]" />
                  <span>View Complete Accessible Text Explanation of HPT Axis Signaling</span>
                </div>
                <span className="text-[11px] text-[#A797BD]">
                  {showHptTranscript ? 'Hide' : 'Show Details'}
                </span>
              </button>

              {showHptTranscript && (
                <div className="mt-3 p-6 rounded-3xl bg-[#180A26]/90 border border-white/10 text-xs sm:text-sm text-[#CDBDD8] space-y-4 font-sans text-left">
                  <h4 className="text-base font-bold text-white font-display">
                    Educational Summary of the HPT Signaling Axis
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <strong className="text-white">1. Normal Signaling:</strong> Hypothalamus →
                      GnRH → Pituitary → LH / FSH → Testes → Testosterone + sperm production. Intact
                      negative feedback loop maintains biological equilibrium.
                    </li>
                    <li>
                      <strong className="text-amber-300">2. Primary Pattern:</strong> Lower testosterone
                      accompanied by elevated LH and FSH. Suggests the testes themselves are not responding
                      robustly to high pituitary stimulation.
                    </li>
                    <li>
                      <strong className="text-purple-300">3. Secondary Pattern:</strong> Lower testosterone
                      accompanied by inappropriately normal or low LH and FSH. Suggests the pituitary or
                      hypothalamic signals controlling testosterone are subdued.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 5. MORNING TESTOSTERONE & CIRCADIAN RHYTHM (WHY TIMING MATTERS) ── */}
      <section
        id="morning-testosterone"
        className="py-20 sm:py-28 border-b border-white/10"
        aria-labelledby="morning-t-title"
      >
        <Container size="xl">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                  Biological Clock & Lab Science
                </span>
              </div>

              <h2
                id="morning-t-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
              >
                Why Testosterone Testing Is Done in the{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#E879F9] bg-clip-text text-transparent">
                  Morning
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#CDBDD8] max-w-3xl mx-auto leading-relaxed">
                Testosterone levels are not static numbers; they follow a natural daily 24-hour cycle
                (circadian rhythm). Understanding this rhythm protects you from false alarms.
              </p>
            </div>

            {/* Visual Diurnal Rhythm Curve Card */}
            <div className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-b from-[#180A26] to-[#0D0417] border border-white/15 shadow-2xl space-y-8">
              {/* Graphical Diurnal Curve Simulation */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#A797BD]">
                  <span className="flex items-center gap-1.5 text-[#FBBF24]">
                    <Sun className="w-4 h-4" /> 7:00 AM – 10:00 AM Peak Window
                  </span>
                  <span className="flex items-center gap-1.5 text-[#818CF8]">
                    <Moon className="w-4 h-4" /> Late Afternoon & Evening Dip
                  </span>
                </div>

                {/* SVG Curve Display */}
                <div className="relative w-full h-44 sm:h-52 bg-black/40 rounded-2xl border border-white/10 p-4 flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 600 160"
                    className="w-full h-full preserve-3d"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Background Grid Lines */}
                    <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

                    {/* Peak Window Highlight Area */}
                    <rect x="75" y="10" width="130" height="140" fill="rgba(56, 189, 248, 0.08)" rx="8" />
                    <text x="140" y="28" fill="#38BDF8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      RECOMMENDED DRAW
                    </text>

                    {/* The Diurnal Rhythm Wave Path */}
                    <path
                      d="M 20 70 C 60 40, 100 25, 140 30 C 200 40, 280 110, 380 120 C 460 128, 520 100, 580 75"
                      stroke="url(#tGradient)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="tGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="25%" stopColor="#34D399" />
                        <stop offset="65%" stopColor="#818CF8" />
                        <stop offset="100%" stopColor="#E879F9" />
                      </linearGradient>
                    </defs>

                    {/* Marker Points */}
                    <circle cx="140" cy="30" r="5" fill="#38BDF8" />
                    <circle cx="380" cy="120" r="4" fill="#818CF8" />
                  </svg>

                  {/* Visual Labels */}
                  <div className="absolute bottom-2 left-6 text-[10px] font-mono text-[#A797BD]">
                    6:00 AM
                  </div>
                  <div className="absolute bottom-2 left-1/4 text-[10px] font-mono text-[#38BDF8] font-bold">
                    8:00 AM (Peak)
                  </div>
                  <div className="absolute bottom-2 left-2/3 text-[10px] font-mono text-[#818CF8]">
                    4:00 PM (Trough)
                  </div>
                  <div className="absolute bottom-2 right-6 text-[10px] font-mono text-[#A797BD]">
                    10:00 PM
                  </div>
                </div>
              </div>

              {/* 3 Core Rules of Testosterone Testing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-[#38BDF8] text-xs font-mono font-bold uppercase">
                    <Sun className="w-4 h-4" />
                    <span>Rule 1: Morning Timing</span>
                  </div>
                  <h4 className="text-base font-bold text-white font-display">
                    Between 7:00 AM and 10:00 AM
                  </h4>
                  <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                    Blood tests drawn in the late afternoon can be 20% to 35% lower than morning values purely
                    from the diurnal rhythm, falsely giving the impression of low testosterone.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-[#FBBF24] text-xs font-mono font-bold uppercase">
                    <Clock className="w-4 h-4" />
                    <span>Rule 2: Repeat Testing</span>
                  </div>
                  <h4 className="text-base font-bold text-white font-display">
                    Never Diagnose on a Single Test
                  </h4>
                  <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                    Testosterone fluctuates from day to day based on sleep, recent illness, or alcohol.
                    Clinical guidelines commonly recommend confirming any abnormal result with a second morning test.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-[#FB7185] text-xs font-mono font-bold uppercase">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Rule 3: No Arbitrary Cutoffs</span>
                  </div>
                  <h4 className="text-base font-bold text-white font-display">
                    Beyond the "300" Number
                  </h4>
                  <p className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                    VITASense never displays "Below 300 = hypogonadism." Clinicians interpret blood numbers
                    only in conjunction with consistent physical symptoms and overall health history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 6. PRIMARY VS SECONDARY COMPARISON COMPONENT ── */}
      <section
        id="primary-vs-secondary"
        className="py-20 sm:py-28 border-b border-white/10"
        aria-labelledby="comparison-title"
      >
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                  Pattern Breakdown
                </span>
              </div>

              <h2
                id="comparison-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
              >
                Primary vs. Secondary{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#E879F9] bg-clip-text text-transparent">
                  Patterns
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed">
                When physicians investigate low testosterone, they look at where the signal disruption originated.
              </p>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Primary Pattern Card */}
              <div className="p-7 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-amber-500/30 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-amber-300 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30">
                    Primary Pattern
                  </span>
                  <span className="text-[10px] font-mono text-[#A797BD]">Testicular Origin</span>
                </div>

                <h3 className="text-xl font-bold font-display text-white">
                  The Testes Have Difficulty Producing Testosterone
                </h3>

                <p className="text-sm text-[#EDE4F7] leading-relaxed font-sans">
                  In a primary pattern, the disruption lies in the testes themselves. Because testosterone output
                  is low, the pituitary gland tries to stimulate the testes by releasing significantly more LH and FSH.
                </p>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#A797BD]">LH & FSH Hormones:</span>
                    <span className="font-bold text-amber-300">Elevated (High)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#A797BD]">Total Testosterone:</span>
                    <span className="font-bold text-[#FB7185]">Lower Range</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[#A797BD]">Origin of Issue:</span>
                    <span className="font-bold text-white">Testicular tissue</span>
                  </div>
                </div>
              </div>

              {/* Secondary Pattern Card */}
              <div className="p-7 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-purple-500/30 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-purple-300 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30">
                    Secondary Pattern
                  </span>
                  <span className="text-[10px] font-mono text-[#A797BD]">Brain / Pituitary Origin</span>
                </div>

                <h3 className="text-xl font-bold font-display text-white">
                  The Brain & Pituitary Signaling Is Reduced
                </h3>

                <p className="text-sm text-[#EDE4F7] leading-relaxed font-sans">
                  In a secondary pattern, the testes are capable of producing testosterone, but the upstream
                  signals (LH and FSH) from the hypothalamus or pituitary are insufficient or muted.
                </p>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#A797BD]">LH & FSH Hormones:</span>
                    <span className="font-bold text-purple-300">Inappropriately Normal / Low</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-[#A797BD]">Total Testosterone:</span>
                    <span className="font-bold text-[#FB7185]">Lower Range</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[#A797BD]">Origin of Issue:</span>
                    <span className="font-bold text-white">Hypothalamus / Pituitary</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Primary vs Secondary Visual Reference Plate */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0D152A]/90 border border-white/15 shadow-2xl flex flex-col md:flex-row items-center gap-6 text-left">
              <div className="w-full md:w-1/2 max-w-sm rounded-2xl overflow-hidden bg-[#0A1020] border border-white/10 p-2 shrink-0">
                <picture>
                  <source srcSet="/hpt-axis-seminiferous-tubule-dark.webp" type="image/webp" />
                  <img
                    src="/hpt-axis-seminiferous-tubule-dark.png"
                    alt="Side-by-side signaling flow comparison of Hypothalamic-Pituitary-Gonadal Axis and seminiferous tubule spermatogenesis"
                    className="w-full h-auto object-contain rounded-xl"
                    loading="lazy"
                  />
                </picture>
              </div>
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase font-bold text-[#38BDF8] tracking-wider block">
                  Diagnostic Logic at a Glance
                </span>
                <h4 className="text-lg font-bold font-display text-white">
                  Why Doctors Measure LH and FSH Alongside Testosterone
                </h4>
                <p className="text-xs sm:text-sm text-[#CDBDD8] leading-relaxed font-sans">
                  Testing testosterone alone indicates <span className="text-white font-medium">how much</span> hormone is in circulation, but measuring pituitary gonadotropins (LH & FSH) reveals <span className="text-white font-medium">why</span> the level is low. High LH/FSH signals testicular resistance (Primary), while low/normal LH/FSH indicates muted central brain signaling (Secondary).
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrollToChapter('male-biology')}
                    className="text-xs border-white/20 text-[#EDE4F7] hover:bg-white/10 cursor-pointer"
                  >
                    View Interactive Biology Vessel Above ↑
                  </Button>
                </div>
              </div>
            </div>

            {/* Reassurance Disclaimer */}
            <p className="text-xs text-[#A797BD] text-center max-w-xl mx-auto font-sans">
              * Distinguishing between primary and secondary patterns is a standard clinical procedure.
              It allows doctors to focus on the root physiological cause rather than guessing.
            </p>
          </div>
        </Container>
      </section>

      {/* ── 7. WHEN TO TALK TO A PROFESSIONAL ── */}
      <section
        id="talk-to-doctor"
        className="py-20 sm:py-28 border-b border-white/10"
        aria-labelledby="talk-to-doctor-title"
      >
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <Stethoscope className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                  Clinical Consultation Timing
                </span>
              </div>

              <h2
                id="talk-to-doctor-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
              >
                When to Discuss Concerns with a{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] to-[#818CF8] bg-clip-text text-transparent">
                  Healthcare Professional
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed">
                If you recognize consistent patterns, seeking professional guidance provides clarity and peace of mind.
              </p>
            </div>

            {/* Consultation Reasons Checklist */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#180A26]/80 border border-white/15 shadow-2xl space-y-6 text-left">
              <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                Consider discussing your health information if you experience:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#EDE4F7]">
                {[
                  'Persistent low energy or fatigue that does not improve after sleep',
                  'Persistent reduction in sexual desire or intimacy interest',
                  'Ongoing erectile concerns or difficulty sustaining erections',
                  'Unexplained loss of muscle strength or physical endurance',
                  'Questions or concerns about prior testosterone or hormone lab tests',
                  'Repeated abnormal morning blood measurements',
                  'Family planning or fertility concerns alongside other physical symptoms',
                  'Significant mood changes, irritability, or loss of motivation',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <CheckCircle2 className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Specialist Guidance */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5 mt-6">
                <Info className="w-5 h-5 text-[#818CF8] shrink-0 mt-0.5" />
                <div className="text-xs text-[#C5B5D5] leading-relaxed font-sans">
                  <strong className="text-white block font-semibold mb-0.5">Which Specialists to See:</strong>
                  Your primary care physician can order initial morning laboratory panels. If patterns persist,
                  a referral to an <strong className="text-white">Endocrinologist</strong> (hormone specialist)
                  or an <strong className="text-white">Urologist</strong> (male reproductive and urinary specialist)
                  is the standard, recommended care pathway.
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 8. HARMFUL / UNSUPERVISED TESTOSTERONE WARNING ── */}
      <section
        id="unsupervised-warning"
        className="py-20 sm:py-24 border-b border-white/10 bg-gradient-to-b from-[#180A26] to-[#10071A]"
        aria-labelledby="warning-title"
      >
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="p-8 sm:p-10 rounded-[36px] bg-red-950/25 border border-red-500/30 shadow-2xl space-y-6 text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-red-300 font-bold block">
                    Important Health Warning
                  </span>
                  <h3 id="warning-title" className="text-xl sm:text-2xl font-bold font-display text-white">
                    Unsupervised Testosterone & Anabolic Steroid Use
                  </h3>
                </div>
              </div>

              <div className="space-y-4 text-sm text-[#EDE4F7] leading-relaxed font-sans">
                <p className="p-4 rounded-2xl bg-red-900/30 border border-red-500/30 text-white font-medium">
                  "Using anabolic steroids or testosterone without medical supervision can affect the body's
                  natural hormone signaling and may create additional health problems."
                </p>
                <p>
                  When testosterone is introduced from outside the body (exogenous testosterone), the brain's
                  hypothalamus and pituitary detect high circulating hormone and shut off natural GnRH, LH,
                  and FSH signals. Over time, this causes the testes to stop manufacturing testosterone and sperm
                  naturally, potentially leading to testicular shrinkage, impaired fertility, and cardiovascular strain.
                </p>
                <p className="text-xs text-[#CDBDD8]">
                  VITASense does not provide instructions for procuring or taking unprescribed hormones,
                  nor do we endorse self-medication. Any hormonal therapy should only occur under the direct
                  monitoring and supervision of a licensed physician.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 9. MALE HEALTH MYTH BUSTING ── */}
      <section
        id="male-health-myths"
        className="py-20 sm:py-28 border-b border-white/10"
        aria-labelledby="male-myths-title"
      >
        <Container size="xl">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
                <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                  Evidence vs Misconception
                </span>
              </div>

              <h2
                id="male-myths-title"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display"
              >
                Male Health{' '}
                <span className="bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#FB7185] bg-clip-text text-transparent">
                  Myth vs. Fact
                </span>
              </h2>

              <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed">
                Separating clinical evidence from common gym lore and internet myths.
              </p>
            </div>

            {/* Myth Accordion Items */}
            <div className="space-y-4">
              {[
                {
                  id: 'masturbation',
                  myth: 'Masturbation causes permanently low testosterone.',
                  fact: 'There is no good evidence that normal masturbation causes chronic low testosterone.',
                  explanation:
                    'Ejaculation causes short-term hormonal fluctuations that return to baseline within minutes to hours. There is zero scientific evidence that masturbation reduces baseline testosterone or causes hypogonadism.',
                },
                {
                  id: 'age-only',
                  myth: 'Low testosterone only affects older men.',
                  fact: 'Hypogonadism or signaling disruption can occur in adult men of any age.',
                  explanation:
                    'While testosterone naturally decreases around 1% per year after age 30, true hypogonadism can stem from genetic factors, pituitary issues, testicular trauma, severe sleep apnea, or metabolic concerns in younger men as well.',
                },
                {
                  id: 'single-test',
                  myth: 'A single low testosterone reading is all you need to diagnose hypogonadism.',
                  fact: 'A single test is never enough to confirm hypogonadism.',
                  explanation:
                    'Levels fluctuate widely based on recent sleep, physical stress, food intake, and time of day. Clinical practice guidelines require repeat morning measurements alongside persistent physical symptoms.',
                },
                {
                  id: 'otc-boosters',
                  myth: 'Over-the-counter booster supplements or buying online hormones is safe.',
                  fact: 'Unsupervised hormonal supplements can carry hidden risks and suppress natural feedback.',
                  explanation:
                    'Many unregulated "testosterone boosters" either have zero proven efficacy or are adulterated with undeclared steroid compounds that can suppress your natural HPT axis.',
                },
              ].map((item) => {
                const isOpen = openMythId === item.id;
                return (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-gradient-to-b from-[#1C0D2E]/70 to-[#12071F]/80 border border-white/10 hover:border-white/20 transition-colors overflow-hidden shadow-xl"
                  >
                    <button
                      onClick={() => setOpenMythId(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      aria-label={`Toggle myth: ${item.myth}`}
                      className="w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#38BDF8] focus-visible:outline-none"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#FB7185]">
                          <span className="uppercase tracking-wider font-mono">Myth:</span>
                          <span className="text-white/80 line-through decoration-[#FB7185]/60 font-sans">
                            "{item.myth}"
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-white">
                          <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                          <span className="uppercase tracking-wider font-mono text-xs text-[#34D399]">
                            Fact:
                          </span>
                          <span className="font-display">{item.fact}</span>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="px-6 sm:px-7 pb-6 sm:pb-7 space-y-3 border-t border-white/5 pt-4 text-left"
                        >
                          <p className="text-sm text-[#EDE4F7] leading-relaxed font-sans">
                            {item.explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 10. CLINICIAN PREPARATION & NEXT STEPS ── */}
      <section id="next-steps" className="py-20 sm:py-28 relative overflow-hidden">
        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <UserCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                Structured Clinician Partnership
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white">
              Turn Knowledge Into Clear Doctor Conversations
            </h2>

            <p className="text-base sm:text-lg text-[#CDBDD8] leading-relaxed font-sans">
              VITASense helps you organize your symptoms, timeline, and lab results into an objective,
              structured summary you can hand to your doctor. Make every consultation count.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to={ROUTES.MENS_HEALTH}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#0284C7] via-[#6366F1] to-[#8E3EAF] text-white shadow-xl"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Men's Health Pathway
                </Button>
              </Link>
              <Link to={ROUTES.REGISTER}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Create Free Account
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
