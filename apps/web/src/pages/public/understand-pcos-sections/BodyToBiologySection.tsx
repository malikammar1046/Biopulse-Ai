import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronRight, Activity, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface ZoomStage {
  id: string;
  name: string;
  step: number;
  zoomLevel: string;
  focusTarget: string;
  headline: string;
  description: string;
  structures: Array<{
    name: string;
    role: string;
    color: string;
    pin: { top: string; left: string };
  }>;
}

const ZOOM_STAGES: ZoomStage[] = [
  {
    id: 'full-body',
    name: 'Full Body',
    step: 1,
    zoomLevel: 'scale-100 translate-y-0',
    focusTarget: 'Whole Organism',
    headline: 'PCOS isn’t something you can always see from the outside.',
    description:
      'From the outside, reproductive and metabolic signaling disruptions may remain quiet or masked as everyday fatigue, subtle skin shifts, or variable cycle intervals.',
    structures: [
      { name: 'Vascular Network', role: 'Systemic hormone transport', color: '#FDA4AF', pin: { top: '30%', left: '50%' } },
      { name: 'Endocrine Glands', role: 'Hypothalamic-pituitary axis', color: '#C084FC', pin: { top: '12%', left: '50%' } },
      { name: 'Pelvic Core', role: 'Primary ovarian site', color: '#FB7185', pin: { top: '62%', left: '50%' } },
    ],
  },
  {
    id: 'abdomen',
    name: 'Abdomen',
    step: 2,
    zoomLevel: 'scale-125 -translate-y-12',
    focusTarget: 'Abdominal & Metabolic Axis',
    headline: 'Signals travel through metabolic and vascular pathways.',
    description:
      'Metabolic factors such as insulin signaling cross-talk with the liver, adrenal glands, and abdominal vasculature, subtly tuning how hormones are produced and cleared.',
    structures: [
      { name: 'Adrenal & Hepatic Axis', role: 'Steroidogenesis & clearance', color: '#D8B4FE', pin: { top: '44%', left: '46%' } },
      { name: 'Pancreatic-Insulin Loop', role: 'Glucose metabolism control', color: '#F472B6', pin: { top: '50%', left: '54%' } },
    ],
  },
  {
    id: 'pelvis',
    name: 'Pelvis',
    step: 3,
    zoomLevel: 'scale-150 -translate-y-24',
    focusTarget: 'Pelvic Cavity',
    headline: 'Deeper inside: The protective pelvic cradle.',
    description:
      'Nestled within the pelvis, the female reproductive organs operate in delicate concert, sustained by a dense plexus of nerves, blood vessels, and cyclic chemical messengers.',
    structures: [
      { name: 'Pelvic Splanchnic Nerves', role: 'Autonomic neurovascular tone', color: '#FDE047', pin: { top: '54%', left: '38%' } },
      { name: 'Hypogastric Plexus', role: 'Sensory feedback & signaling', color: '#FDE047', pin: { top: '58%', left: '60%' } },
    ],
  },
  {
    id: 'reproductive-system',
    name: 'Reproductive System',
    step: 4,
    zoomLevel: 'scale-[1.85] -translate-y-36',
    focusTarget: 'Uterus & Bilateral Ovaries',
    headline: 'The reproductive organs respond to continuous molecular dialogue.',
    description:
      'The uterus, fallopian tubes, and ovaries depend on precisely timed pulses of LH, FSH, estrogen, and progesterone to coordinate ovulation and cyclical renewal.',
    structures: [
      { name: 'Uterus', role: 'Endometrial responsiveness', color: '#C084FC', pin: { top: '61%', left: '50%' } },
      { name: 'Fallopian Tube', role: 'Tubal transport pathway', color: '#E879F9', pin: { top: '58%', left: '38%' } },
      { name: 'Ovary', role: 'Follicular reserve & hormones', color: '#FB7185', pin: { top: '63%', left: '34%' } },
    ],
  },
  {
    id: 'ovary',
    name: 'The Ovary',
    step: 5,
    zoomLevel: 'scale-[2.4] -translate-y-44',
    focusTarget: 'Ovarian Cortex & Follicles',
    headline: 'Beneath the surface: Microscopic follicular patterns.',
    description:
      'Inside the ovary, fluid-filled follicles develop under hormonal guidance. In PCOS, altered signaling can cause multiple follicles to pause their maturation together.',
    structures: [
      { name: 'Antral Follicles', role: 'Developing follicular cluster', color: '#FB7185', pin: { top: '62%', left: '32%' } },
      { name: 'Ovarian Stroma', role: 'Thecal androgen production', color: '#E87084', pin: { top: '64%', left: '36%' } },
    ],
  },
];

export const BodyToBiologySection: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const currentStage = ZOOM_STAGES[activeStageIndex];

  return (
    <section
      id="look-beneath-surface"
      className="relative min-h-screen py-24 sm:py-32 bg-[#0C0418] text-white overflow-hidden border-t border-white/10 flex items-center"
    >
      {/* Ambient Depth Glows */}
      <div className="absolute top-1/3 left-1/4 w-[550px] sm:w-[750px] h-[550px] sm:h-[750px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Layers className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 01 — Visual Descent
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            Look beneath the{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              surface.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            Many of PCOS’s defining patterns happen deep within biological systems—involving
            interconnected hormones, ovulation rhythm, cycle regularity, and cellular metabolism.
          </p>

          {/* Step Progress Pills Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {ZOOM_STAGES.map((stage, idx) => (
              <button
                key={stage.id}
                onClick={() => setActiveStageIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  idx === activeStageIndex
                    ? 'bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white font-bold shadow-lg shadow-purple-950/40 scale-105'
                    : 'bg-white/5 border border-white/10 text-[#B4A6C7] hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">
                  {stage.step}
                </span>
                <span>{stage.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Visual Journey Stage Canvas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left / Narrative Panel */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#E87084]">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Target: {currentStage.focusTarget}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold font-display text-white leading-snug">
                  {currentStage.headline}
                </h3>

                <p className="text-sm sm:text-base text-[#B4A6C7] leading-relaxed font-sans">
                  {currentStage.description}
                </p>

                {/* Visible Anatomical Labels */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#EDE4F7] block">
                    Key Biological Structures
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {currentStage.structures.map((s, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: s.color }}
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">{s.name}</span>
                            <span className="text-[11px] text-[#A797BD]">{s.role}</span>
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-white/30" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Step Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() =>
                      setActiveStageIndex((prev) => (prev + 1) % ZOOM_STAGES.length)
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer group"
                  >
                    <span>
                      {activeStageIndex < ZOOM_STAGES.length - 1
                        ? `Continue Zoom (${ZOOM_STAGES[activeStageIndex + 1].name})`
                        : 'Restart Journey'}
                    </span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right / Dynamic Zoom Anatomical Model */}
          <div className="lg:col-span-7 relative flex items-center justify-center">
            <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-[32px] overflow-hidden bg-gradient-to-b from-[#180A26] via-[#10071A] to-[#08020E] border border-white/15 shadow-[0_0_60px_rgba(142,62,175,0.3)] flex items-center justify-center p-4">
              {/* Radial Focal Glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 60%, rgba(232, 112, 132, 0.25) 0%, rgba(110, 45, 139, 0.2) 45%, transparent 80%)',
                }}
              />

              {/* Dynamic Scaling Artwork Vessel */}
              <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
                <motion.div
                  className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-out origin-center ${currentStage.zoomLevel}`}
                >
                  <img
                    src="/translucent-female-biology.jpg"
                    alt="Female Anatomical Visualization"
                    className="w-full h-full object-contain select-none filter contrast-[1.05]"
                    style={{
                      maskImage:
                        'radial-gradient(ellipse at 50% 50%, black 75%, rgba(0,0,0,0.8) 88%, transparent 98%)',
                      WebkitMaskImage:
                        'radial-gradient(ellipse at 50% 50%, black 75%, rgba(0,0,0,0.8) 88%, transparent 98%)',
                    }}
                  />

                  {/* Dynamic Interactive Hotspot Pins for Current Stage */}
                  {currentStage.structures.map((s, idx) => (
                    <div
                      key={idx}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                      style={{ top: s.pin.top, left: s.pin.left }}
                    >
                      <div className="relative group cursor-pointer flex items-center justify-center">
                        <span
                          className="absolute w-8 h-8 rounded-full animate-ping opacity-60 pointer-events-none"
                          style={{ backgroundColor: s.color }}
                        />
                        <span
                          className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: s.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        </span>

                        {/* Floating Tag Label */}
                        <div className="absolute left-6 whitespace-nowrap px-2.5 py-1 rounded-xl bg-[#10071A]/90 border border-white/20 shadow-xl backdrop-blur-md text-[10px] font-mono font-bold text-white opacity-90 group-hover:opacity-100 transition-opacity">
                          {s.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Viewport Reticle Overlay */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-pulse" />
                <span>MAGNIFICATION: {currentStage.step * 2}X</span>
              </div>
              <div className="absolute bottom-4 right-4 font-mono text-[10px] text-[#B4A6C7]">
                STAGE {currentStage.step} OF {ZOOM_STAGES.length}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
