import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, ShieldCheck, Sparkles, Activity } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/ui/Button';
import { Container } from '../../../components/ui/Container';

interface AnatomicalPin {
  id: string;
  name: string;
  category: 'ovary' | 'uterus' | 'tubes' | 'cervix';
  position: { top: string; left: string };
  detail: string;
  clinicalNote: string;
  color: string;
}

const ANATOMICAL_PINS: AnatomicalPin[] = [
  {
    id: 'uterus',
    name: 'Uterus & Endometrium',
    category: 'uterus',
    position: { top: '34%', left: '50%' },
    detail: 'Central muscular organ & hormonal responsive lining',
    clinicalNote: 'Endometrial thickness & vascularity fluctuate across the longitudinal cycle.',
    color: '#C084FC',
  },
  {
    id: 'left-ovary',
    name: 'Left Ovary & Follicles',
    category: 'ovary',
    position: { top: '42%', left: '26%' },
    detail: 'Bilateral ovarian reserve & developing follicles',
    clinicalNote: 'High follicle count (>20 per ovary) aligns with Rotterdam PCOM morphology.',
    color: '#FB7185',
  },
  {
    id: 'right-ovary',
    name: 'Right Ovary & Follicles',
    category: 'ovary',
    position: { top: '42%', left: '74%' },
    detail: 'Follicular development & ovarian stroma',
    clinicalNote: 'Stromal echogenicity & ovarian volume tracking via ultrasound integration.',
    color: '#FB7185',
  },
  {
    id: 'fallopian-left',
    name: 'Fallopian Tube',
    category: 'tubes',
    position: { top: '22%', left: '22%' },
    detail: 'Tubal transport pathway & fimbriated end',
    clinicalNote: 'Captures and facilitates ovum transport towards the uterine cavity.',
    color: '#E879F9',
  },
  {
    id: 'fallopian-right',
    name: 'Uterine Tube & Fimbriae',
    category: 'tubes',
    position: { top: '22%', left: '78%' },
    detail: 'Lateral oviduct structure & fimbriae',
    clinicalNote: 'Surrounds the ovarian pole for ovulatory physiological capture.',
    color: '#E879F9',
  },
  {
    id: 'cervix',
    name: 'Cervix & Vaginal Canal',
    category: 'cervix',
    position: { top: '68%', left: '50%' },
    detail: 'Lower uterine segment & cervical canal',
    clinicalNote: 'Mucus biomarker monitoring correlates with hormonal estrogen phases.',
    color: '#D8B4FE',
  },
];

export const AboutHeroSection: React.FC = () => {
  const [activePin, setActivePin] = useState<AnatomicalPin | null>(ANATOMICAL_PINS[0]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const filteredPins = selectedFilter === 'all'
    ? ANATOMICAL_PINS
    : ANATOMICAL_PINS.filter((p) => p.category === selectedFilter);

  return (
    <section className="relative min-h-[92vh] bg-gradient-to-b from-[#10071A] via-[#180A25] to-[#241038] text-white pt-28 pb-20 sm:pb-32 overflow-hidden flex items-center">
      {/* ── Cinematic Ambient Biological Glows ── */}
      <div className="absolute top-1/4 left-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/25 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#E87084]/20 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-[#A21CAF]/25 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ── Left Column: Editorial Narrative ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 space-y-8 text-left"
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
                About PMOSense
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-6.5xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
              Women's health is{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                complex.
              </span>{' '}
              Understanding it shouldn't be.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed max-w-xl font-sans font-normal">
              PMOSense brings cycle patterns, symptoms, medical reports, and lifestyle information together
              to help women understand their reproductive health patterns over time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-xl shadow-purple-950/30"
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Explore How It Works
                </Button>
              </Link>

              <Link to={ROUTES.FEATURES}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-[#F6F2FA] hover:bg-white/10 backdrop-blur-sm"
                  iconRight={<BookOpen className="w-4 h-4" />}
                >
                  Platform Features
                </Button>
              </Link>
            </div>

            {/* Non-Diagnostic Safety Meta */}
            <div className="pt-6 border-t border-white/10 flex flex-wrap items-center gap-5 text-[11px] font-bold tracking-wider uppercase text-[#B4A6C7]/80">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FB7185]" />
                Non-Diagnostic Health Intelligence
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Rotterdam Criteria Aligned</span>
            </div>
          </motion.div>

          {/* ── Right Column: Beautified Anatomical Visualization Emerged into Background ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 relative flex flex-col items-center justify-center"
          >
            {/* Outer Glow Container */}
            <div className="relative w-full max-w-2xl rounded-[32px] overflow-hidden p-2 sm:p-4 bg-gradient-to-b from-[#1C0D2E]/60 via-[#140822]/80 to-[#0F041B]/90 border border-[#8E3EAF]/30 shadow-2xl shadow-purple-950/60 backdrop-blur-xl">
              {/* Header Micro Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E87084] shadow-[0_0_8px_#E87084] animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-[#EDE4F7] uppercase">
                    Reproductive System Cross-Section
                  </span>
                </div>

                {/* Filter Tabs */}
                <div className="hidden sm:flex items-center gap-1 bg-[#10071A]/70 p-1 rounded-full border border-white/10 text-[11px]">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'ovary', label: 'Ovaries' },
                    { key: 'uterus', label: 'Uterus' },
                    { key: 'tubes', label: 'Tubes' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedFilter(tab.key)}
                      className={`px-2.5 py-0.5 rounded-full transition-all duration-200 cursor-pointer ${
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

              {/* ── Main Image Canvas Emerged Into Background ── */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden flex items-center justify-center bg-[#0C0418]">
                {/* Radial Glow Halo Behind Image */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      radial-gradient(circle at 50% 45%, rgba(142, 62, 175, 0.4) 0%, rgba(232, 112, 132, 0.25) 40%, rgba(16, 7, 26, 0.95) 75%, #0C0418 100%)
                    `,
                  }}
                />

                {/* Anatomical Model Image with Smooth Vignette Edge Mask */}
                <img
                  src="/anatomy-hero-model.jpg"
                  alt="PMOSense 3D Female Reproductive System Cross-Section"
                  className="w-full h-full object-contain object-center transition-transform duration-500 hover:scale-[1.02]"
                  style={{
                    maskImage: 'radial-gradient(ellipse at 50% 50%, black 60%, rgba(0,0,0,0.85) 75%, transparent 95%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 60%, rgba(0,0,0,0.85) 75%, transparent 95%)',
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
                              ? 'bg-white text-[#1C1326] border-white shadow-[0_0_16px_rgba(255,255,255,0.8)]'
                              : 'bg-[#180A26]/80 text-white border-white/40 group-hover:border-white'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full transition-transform duration-300 group-hover:scale-110"
                            style={{ backgroundColor: pin.color }}
                          />
                        </span>

                        {/* Pin Tag Pill (Desktop always visible) */}
                        <span
                          className={`hidden md:block absolute left-7 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md transition-all duration-200 ${
                            isActive
                              ? 'bg-white text-[#10071A] shadow-lg shadow-purple-950/40 border border-white'
                              : 'bg-[#10071A]/80 text-[#EDE4F7] border border-white/20 group-hover:border-[#E87084]'
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
                {activePin && (
                  <motion.div
                    key={activePin.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.25 }}
                    className="mt-3 p-3 sm:p-4 rounded-2xl bg-[#12071F]/90 border border-[#8E3EAF]/30 shadow-lg text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-sm"
                            style={{ backgroundColor: activePin.color }}
                          />
                          <h4 className="text-sm font-bold font-display text-white">
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

                      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#E87084] shrink-0">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Clinical Context</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-[#B4A6C7] leading-normal flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FB7185] shrink-0 mt-0.5" />
                      <span>{activePin.clinicalNote}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
};
