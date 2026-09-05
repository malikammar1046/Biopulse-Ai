import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Activity,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Heart,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface AnatomicalPin {
  id: string;
  name: string;
  category: 'ovary' | 'uterus' | 'tubes' | 'cervix';
  position: { top: string; left: string };
  detail: string;
  clinicalNote: string;
  pmosInsight: string;
  color: string;
}

const ANATOMICAL_PINS: AnatomicalPin[] = [
  {
    id: 'uterus',
    name: 'Uterus & Endometrium',
    category: 'uterus',
    position: { top: '34%', left: '50%' },
    detail: 'Central reproductive muscular organ responsive to cyclic estrogen & progesterone signals.',
    clinicalNote: 'Lining response to hormonal phases and cycle length tracking.',
    pmosInsight: 'In PMOS, prolonged anovulatory intervals can cause irregular lining buildup requiring continuous cycle monitoring.',
    color: '#C084FC',
  },
  {
    id: 'left-ovary',
    name: 'Left Ovary & Follicles',
    category: 'ovary',
    position: { top: '42%', left: '26%' },
    detail: 'Bilateral ovarian stroma housing resting primordial and developing antral follicles.',
    clinicalNote: 'High follicle count (>20 per ovary) aligns with Rotterdam PCOM morphology.',
    pmosInsight: 'Follicular arrest, peripheral distribution, and AMH signaling pause dominant follicle selection, presenting the classic multi-follicular ring pattern.',
    color: '#FB7185',
  },
  {
    id: 'right-ovary',
    name: 'Right Ovary & Follicles',
    category: 'ovary',
    position: { top: '42%', left: '74%' },
    detail: 'Follicular reserve, steroidogenesis site, and central ovarian stroma.',
    clinicalNote: 'Stroma echogenicity and volume changes (>10 cm³) tracking in PMOS via ultrasound integration.',
    pmosInsight: 'LH receptor sensitivity within thecal cells increases androgen production, signaling cycle pauses.',
    color: '#FB7185',
  },
  {
    id: 'fallopian-left',
    name: 'Fallopian Tube',
    category: 'tubes',
    position: { top: '22%', left: '22%' },
    detail: 'Ciliated oviduct conduit facilitating oocyte capture and travel toward the uterine cavity.',
    clinicalNote: 'Oocyte transport pathway relying on balanced cyclic estrogen and progesterone ratios.',
    pmosInsight: 'While tubes remain physiologically healthy in PMOS, ovulation timing irregularity alters cycle length.',
    color: '#E879F9',
  },
  {
    id: 'fallopian-right',
    name: 'Uterine Tube & Fimbriae',
    category: 'tubes',
    position: { top: '22%', left: '78%' },
    detail: 'Fimbriated extremity positioned over the ovarian pole to receive the released ovum.',
    clinicalNote: 'Ovulatory capture mechanism surrounding the ovarian surface during the ovulatory LH surge window.',
    pmosInsight: 'Restoring regular ovulatory waves through metabolic support coordinates timely tubal transit.',
    color: '#E879F9',
  },
  {
    id: 'cervix',
    name: 'Cervix & Vaginal Canal',
    category: 'cervix',
    position: { top: '68%', left: '50%' },
    detail: 'Lower uterine boundary, mucus gland crypts, and lower reproductive passage.',
    clinicalNote: 'Cervical mucus biomarkers aligned with circulating estradiol surges and estrogen fluctuations.',
    pmosInsight: 'Monitoring fertile mucus biomarkers provides real-time clues to estrogenic activity during long cycles.',
    color: '#D8B4FE',
  },
];

export const UnderstandPCOSHeroSection: React.FC = () => {
  const [activePin, setActivePin] = useState<AnatomicalPin | null>(ANATOMICAL_PINS[1]); // Default to Left Ovary
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredPins =
    selectedFilter === 'all'
      ? ANATOMICAL_PINS
      : ANATOMICAL_PINS.filter((p) => p.category === selectedFilter);

  const scrollToNext = () => {
    const nextSection = document.getElementById('what-is-pcos');
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[92vh] bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white pt-28 pb-16 sm:pb-24 overflow-hidden flex flex-col justify-center">
      {/* ── Cinematic Ambient Biological Glows ── */}
      <div className="absolute top-1/4 left-1/4 w-[600px] sm:w-[850px] h-[600px] sm:h-[850px] bg-[#6E2D8B]/25 rounded-full blur-[170px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] sm:w-[750px] h-[500px] sm:h-[750px] bg-[#E87084]/20 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-[#A21CAF]/25 rounded-full blur-[130px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* ── Left Column: Editorial Narrative for PMOS ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 space-y-6 text-left"
          >
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.22em] text-[#F6F2FA]">
                Educational Reproductive Biology • PMOSense
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              Your body speaks in{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                patterns.
              </span>{' '}
              Understanding PMOS starts beneath the surface.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#CDBDD8] leading-relaxed font-sans font-normal">
              Understanding <span className="text-white font-semibold">PMOS</span> (Polycystic Metabolic Ovarian Syndrome / PCOS) begins by uncovering the interconnected biological feedback loops beneath the surface. Interactive anatomical mapping illuminates how cycle irregularity, hormonal signaling (LH/FSH/androgens), and metabolic factors converge.
            </p>

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={scrollToNext}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white font-semibold text-sm hover:brightness-110 shadow-lg shadow-purple-950/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Biological Story</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-xs text-[#B4A6C7] px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <Layers className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>14 Story Chapters</span>
              </div>
            </div>

            {/* Non-Diagnostic Clinical Safety Meta */}
            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 text-[11px] font-bold tracking-wider uppercase text-[#B4A6C7]/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#34D399]" />
                Non-Diagnostic Screening
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FDA4AF]" />
                Rotterdam Aligned
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#60A5FA]" />
                Endocrine & Metabolic Focus
              </span>
            </div>
          </motion.div>

          {/* ── Right Column: Interactive Anatomical Cross-Section Stage ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-7 relative"
          >
            <div className="p-4 sm:p-6 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl shadow-2xl space-y-4">
              {/* Header Bar with Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FB7185] animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Female Reproductive System Cross-Section
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-[#10071A]/70 p-1 rounded-full border border-white/10 text-[11px]">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'ovary', label: 'Ovaries & Follicles' },
                    { key: 'uterus', label: 'Uterus & Lining' },
                    { key: 'tubes', label: 'Fallopian Tubes' },
                    { key: 'cervix', label: 'Cervical Canal' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedFilter(tab.key)}
                      className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer text-xs ${
                        selectedFilter === tab.key
                          ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white font-semibold shadow-xs'
                          : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Main Image Canvas with Edge Fade and Vignette ── */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center bg-[#0C0418] border border-white/10">
                {/* Radial Glow Halo Behind Image */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(circle at 50% 45%, rgba(142, 62, 175, 0.45) 0%, rgba(232, 112, 132, 0.25) 45%, rgba(16, 7, 26, 0.95) 80%, #0C0418 100%)
                    `,
                  }}
                />

                {/* Anatomical Model Image */}
                <img
                  src="/anatomy-hero-model.jpg"
                  alt="PMOSense 3D Female Reproductive System Cross-Section showing Uterus, Ovaries, and Fallopian Tubes"
                  className="w-full h-full object-contain object-center transition-transform duration-500 hover:scale-[1.02] select-none"
                  style={{
                    maskImage:
                      'radial-gradient(ellipse at 50% 50%, black 65%, rgba(0,0,0,0.85) 80%, transparent 98%)',
                    WebkitMaskImage:
                      'radial-gradient(ellipse at 50% 50%, black 65%, rgba(0,0,0,0.85) 80%, transparent 98%)',
                  }}
                />

                {/* Ambient Specular Highlight Orbs */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-[#8E3EAF]/20 blur-2xl pointer-events-none" />
                <div className="absolute top-1/3 right-1/4 w-28 h-28 rounded-full bg-[#E87084]/25 blur-2xl pointer-events-none" />

                {/* ── Interactive Anatomical Hotspot Pins ── */}
                {filteredPins.map((pin) => {
                  const isActive = activePin?.id === pin.id;
                  return (
                    <div
                      key={pin.id}
                      style={{ top: pin.position.top, left: pin.position.left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                      <button
                        type="button"
                        onClick={() => setActivePin(isActive ? null : pin)}
                        onMouseEnter={() => setActivePin(pin)}
                        aria-label={`Explore ${pin.name}`}
                        className={`group relative flex items-center justify-center cursor-pointer transition-all duration-300 ${
                          isActive ? 'scale-125' : 'hover:scale-115'
                        }`}
                      >
                        {/* Pulsing Target Ring */}
                        <span
                          className="absolute w-8 h-8 rounded-full animate-ping opacity-60 pointer-events-none"
                          style={{ backgroundColor: pin.color }}
                        />

                        {/* Outer Glow Halo */}
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
                            isActive
                              ? 'bg-white text-[#1C1326] border-white shadow-[0_0_16px_rgba(255,255,255,0.85)]'
                              : 'bg-[#180A26]/85 text-white border-white/50 group-hover:border-white'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full transition-transform duration-300 group-hover:scale-110"
                            style={{ backgroundColor: pin.color }}
                          />
                        </span>

                        {/* Pin Tag Pill (Visible on md+ screens) */}
                        <span
                          className={`hidden md:block absolute left-7 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md transition-all duration-200 ${
                            isActive
                              ? 'bg-white text-[#10071A] shadow-lg shadow-purple-950/40 border border-white'
                              : 'bg-[#10071A]/85 text-[#EDE4F7] border border-white/20 group-hover:border-[#E87084]'
                          }`}
                        >
                          {pin.name.split('&')[0]}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ── Dynamic Anatomical Detail Info Card ── */}
              <AnimatePresence mode="wait">
                {activePin ? (
                  <motion.div
                    key={activePin.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#12071F]/95 border border-[#8E3EAF]/40 shadow-xl text-left space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: activePin.color }}
                          />
                          <h4 className="text-sm sm:text-base font-bold font-display text-white">
                            {activePin.name}
                          </h4>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
                            {activePin.category}
                          </span>
                        </div>
                        <p className="text-xs text-[#EDE4F7] font-medium leading-relaxed">
                          {activePin.detail}
                        </p>
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#FB7185] shrink-0 font-medium">
                        <Activity className="w-3.5 h-3.5" />
                        <span>PMOS Context</span>
                      </div>
                    </div>

                    {/* PMOS Specific Insight */}
                    <div className="pt-2 border-t border-white/10 text-xs text-[#E9D5FF] leading-relaxed flex items-start gap-2 bg-[#8E3EAF]/10 p-2.5 rounded-xl border border-[#8E3EAF]/20">
                      <Heart className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white font-semibold mr-1.5">In PMOS:</strong>
                        <span>{activePin.pmosInsight}</span>
                      </div>
                    </div>

                    {/* General Clinical Note */}
                    <div className="pt-1 text-[11px] text-[#B4A6C7] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                      <span>{activePin.clinicalNote}</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-3 text-center text-xs text-[#B4A6C7] bg-white/5 rounded-2xl border border-white/10">
                    Hover or click any pulsating pin on the anatomical diagram to explore its role in PMOS.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </Container>

      {/* ── Subtle Bottom Scroll Indicator ── */}
      <div className="mt-8 sm:mt-10 flex justify-center">
        <button
          onClick={scrollToNext}
          className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-[#CDBDD8] hover:text-white transition-all cursor-pointer"
        >
          <span>Scroll to explore Chapter 2: What is PMOS?</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#FB7185] group-hover:translate-y-0.5 transition-transform" />
        </button>
      </div>
    </section>
  );
};