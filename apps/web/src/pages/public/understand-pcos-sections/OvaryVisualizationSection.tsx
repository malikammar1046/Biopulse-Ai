import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDot, ShieldAlert, Zap, Info } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface OvaryStructureInfo {
  id: string;
  name: string;
  category: string;
  pinPos: { top: string; left: string };
  color: string;
  summary: string;
  scientificDetail: string;
  pcosContext: string;
}

const OVARY_STRUCTURES: OvaryStructureInfo[] = [
  {
    id: 'follicles',
    name: 'Antral & Primordial Follicles',
    category: 'Follicular Reserve',
    pinPos: { top: '38%', left: '42%' },
    color: '#FB7185',
    summary: 'Fluid-filled biological sacs containing developing oocytes.',
    scientificDetail:
      'In typical cycles, several follicles begin maturation each month, with one emerging as dominant. Granulosa cells within the follicle produce estradiol and support oocyte growth.',
    pcosContext:
      'Under altered hormonal signaling (elevated LH & anti-Müllerian hormone), multiple follicles halt maturation before dominant selection, creating a characteristic peripheral ring appearance.',
  },
  {
    id: 'cortex',
    name: 'Ovarian Cortex & Dense Stroma',
    category: 'Structural Matrix',
    pinPos: { top: '24%', left: '60%' },
    color: '#C084FC',
    summary: 'Outer cellular layer housing the ovarian reserve and thecal cells.',
    scientificDetail:
      'The cortex consists of dense collagenous connective tissue and specialized theca cells that synthesize steroid hormone precursors in response to pituitary signaling.',
    pcosContext:
      'In PCOS, the ovarian stroma often becomes hypertrophic (thicker and denser), increasing the overall ovarian volume beyond the normal 10 cm³ threshold.',
  },
  {
    id: 'vascular-medulla',
    name: 'Vascular Medulla & Blood Supply',
    category: 'Micro-Circulation',
    pinPos: { top: '56%', left: '68%' },
    color: '#FDA4AF',
    summary: 'Rich neurovascular core delivering oxygen, nutrients, and endocrine signals.',
    scientificDetail:
      'Spiral ovarian arteries and veins form a dense plexus within the medulla, enabling rapid exchange of circulating hormones between the ovary and systemic circulation.',
    pcosContext:
      'Increased stromal vascularity and altered pulsatility index are frequently observed in polycystic ovarian morphology during Doppler ultrasound evaluation.',
  },
  {
    id: 'hormone-receptors',
    name: 'LH / FSH Endocrine Receptors',
    category: 'Signaling Axis',
    pinPos: { top: '64%', left: '38%' },
    color: '#E879F9',
    summary: 'Biochemical docking sites responsive to luteinizing hormone and FSH.',
    scientificDetail:
      'Luteinizing hormone (LH) binds thecal cell receptors to stimulate androgen production, while follicle-stimulating hormone (FSH) binds granulosa cells to aromatize androgens into estrogen.',
    pcosContext:
      'An elevated LH-to-FSH ratio (often 2:1 or higher) stimulates excessive thecal androgen output without sufficient FSH to mature the follicle to ovulation.',
  },
];

export const OvaryVisualizationSection: React.FC = () => {
  const [selectedStructureId, setSelectedStructureId] = useState<string>(OVARY_STRUCTURES[0].id);

  const activeStructure =
    OVARY_STRUCTURES.find((s) => s.id === selectedStructureId) || OVARY_STRUCTURES[0];

  return (
    <section className="relative min-h-screen py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10 flex items-center select-none">
      {/* Background Volumetric Lighting & Particles */}
      <div className="absolute top-1/4 left-1/3 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#8E3EAF]/22 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <CircleDot className="w-3.5 h-3.5 text-[#FB7185] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 02 — Microscopic Focus
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            The{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Ovary.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            A dynamic, living endocrine organ where microscopic signals dictate cycle rhythm,
            follicle development, and hormonal balance.
          </p>
        </div>

        {/* ── Interactive Central Visual & Structure Explorer ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left / Central Ovary Model Canvas */}
          <div className="lg:col-span-7 relative flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[540px] aspect-square rounded-[36px] overflow-hidden bg-gradient-to-b from-[#180A26] via-[#12071F] to-[#0A0313] border border-white/15 shadow-[0_0_80px_rgba(110,45,139,0.4)] flex items-center justify-center p-4">
              {/* Radial Aura Glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at 50% 50%, rgba(232, 112, 132, 0.3) 0%, rgba(142, 62, 175, 0.25) 45%, transparent 80%)',
                }}
              />

              {/* Floating Cellular Sparkles */}
              {[
                { top: '15%', left: '20%', size: 'w-1.5 h-1.5', color: 'bg-white', dur: 3.2 },
                { top: '75%', left: '18%', size: 'w-2 h-2', color: 'bg-[#FB7185]', dur: 4.5 },
                { top: '25%', right: '22%', size: 'w-2 h-2', color: 'bg-[#C084FC]', dur: 5.0 },
                { bottom: '20%', right: '25%', size: 'w-2.5 h-2.5', color: 'bg-[#FDA4AF]', dur: 4.0 },
              ].map((p, idx) => (
                <motion.div
                  key={idx}
                  animate={{ y: [-8, 8, -8], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut' }}
                  className={`absolute ${p.size} rounded-full ${p.color} shadow-lg pointer-events-none`}
                  style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom }}
                />
              ))}

              {/* Central Ovary Visual with Smooth Breathing Motion */}
              <motion.div
                animate={{
                  scale: [1, 1.025, 1],
                  rotate: [0, 1, -1, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <img
                  src="/translucent-ovary-macro.jpg"
                  alt="Translucent Macro Biological Ovary with Follicles"
                  className="w-full h-full object-contain select-none filter contrast-[1.08]"
                  style={{
                    maskImage:
                      'radial-gradient(circle at 50% 50%, black 72%, rgba(0,0,0,0.85) 85%, transparent 98%)',
                    WebkitMaskImage:
                      'radial-gradient(circle at 50% 50%, black 72%, rgba(0,0,0,0.85) 85%, transparent 98%)',
                  }}
                />

                {/* Interactive Structure Hotspots on Ovary */}
                {OVARY_STRUCTURES.map((struct) => {
                  const isSelected = selectedStructureId === struct.id;
                  return (
                    <div
                      key={struct.id}
                      style={{ top: struct.pinPos.top, left: struct.pinPos.left }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                    >
                      <button
                        onClick={() => setSelectedStructureId(struct.id)}
                        className={`group relative flex items-center justify-center cursor-pointer transition-transform duration-300 ${
                          isSelected ? 'scale-125' : 'hover:scale-115'
                        }`}
                        aria-label={`Explore ${struct.name}`}
                      >
                        {/* Ping Wave */}
                        <span
                          className={`absolute w-9 h-9 rounded-full ${
                            isSelected ? 'animate-ping opacity-75' : 'opacity-0 group-hover:opacity-50'
                          }`}
                          style={{ backgroundColor: struct.color }}
                        />

                        {/* Pin Dot */}
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all ${
                            isSelected
                              ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.9)] text-black'
                              : 'bg-[#180A26]/80 border-white/40 text-white hover:border-white'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: struct.color }}
                          />
                        </span>

                        {/* Label Pill */}
                        <span
                          className={`hidden md:block absolute left-8 whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase transition-all duration-200 ${
                            isSelected
                              ? 'bg-white text-[#10071A] shadow-xl border border-white'
                              : 'bg-[#10071A]/85 text-[#EDE4F7] border border-white/20 group-hover:border-[#FB7185]'
                          }`}
                        >
                          {struct.name.split('&')[0]}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </motion.div>

              {/* Status Header Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-mono text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-ping" />
                <span>ORGANIC ENDOCRINE CORE</span>
              </div>
            </div>
          </div>

          {/* Right / Structure Info & Scientific Context */}
          <div className="lg:col-span-5 space-y-5 text-left">
            {/* Quick Structure Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {OVARY_STRUCTURES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStructureId(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    s.id === selectedStructureId
                      ? 'bg-white text-[#10071A] shadow-md font-bold'
                      : 'bg-white/5 border border-white/10 text-[#B4A6C7] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {s.name.split('&')[0]}
                </button>
              ))}
            </div>

            {/* Detailed Structure Narrative Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStructure.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="p-6 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]"
                      style={{ backgroundColor: activeStructure.color }}
                    />
                    <h3 className="text-xl font-bold font-display text-white">
                      {activeStructure.name}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-[#D8B4FE]">
                    {activeStructure.category}
                  </span>
                </div>

                <p className="text-sm text-white/90 font-medium leading-relaxed">
                  {activeStructure.summary}
                </p>

                {/* Physiology Details */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#FDA4AF] font-bold block flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-[#FB7185]" />
                    Physiological Function
                  </span>
                  <p className="text-xs text-[#C5B5D5] leading-relaxed">
                    {activeStructure.scientificDetail}
                  </p>
                </div>

                {/* PCOS Signal Correlation */}
                <div className="p-4 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/30 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#E879F9] font-bold block flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-[#E879F9]" />
                    Pattern in PCOS
                  </span>
                  <p className="text-xs text-[#EDE4F7] leading-relaxed font-sans">
                    {activeStructure.pcosContext}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Non-Diagnostic Caution Note */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-[#FB7185] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#A797BD] leading-normal font-sans">
                <strong>Educational Visualization:</strong> Simplified anatomical illustration
                designed for conceptual understanding. Ultrasound and laboratory assessments should
                always be interpreted by a qualified medical professional.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
