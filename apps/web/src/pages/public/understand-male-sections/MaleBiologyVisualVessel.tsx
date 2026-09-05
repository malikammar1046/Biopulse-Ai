import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Layers, Activity, Sparkles, ChevronDown, Eye } from 'lucide-react';

interface AnatomicalStructure {
  id: string;
  name: string;
  label: string;
  pin: { top: string; left: string };
  role: string;
  androgenRole: string;
  clinicalSignificance: string;
  color: string;
}

const ANATOMICAL_STRUCTURES: AnatomicalStructure[] = [
  {
    id: 'testes',
    name: 'Testicle (Testis / Leydig Cells)',
    label: 'Testicle',
    pin: { top: '77.5%', left: '54.5%' },
    role: 'Primary male endocrine organ responsible for continuous steroidogenesis and spermatogenesis within the scrotum.',
    androgenRole: 'Synthesizes >95% of circulating testosterone via Leydig cells stimulated by pituitary Luteinizing Hormone (LH).',
    clinicalSignificance: 'Primary hypogonadism originates here when testicular Leydig tissue fails to respond to pituitary stimulation.',
    color: '#38BDF8',
  },
  {
    id: 'epididymis',
    name: 'Epididymis (Sperm Storage & Transit)',
    label: 'Epididymis',
    pin: { top: '83%', left: '51.5%' },
    role: 'Crescent-shaped duct resting along the posterior margin of each testis where immature sperm undergo transit, motility maturation, and storage.',
    androgenRole: 'Epithelial cell integrity, fluid secretion, and sperm membrane maturation strictly require high local androgen concentrations.',
    clinicalSignificance: 'Severe or chronic androgen deficits can impact epididymal microenvironments and motility development.',
    color: '#818CF8',
  },
  {
    id: 'prostate',
    name: 'Prostate Gland',
    label: 'Prostate Gland',
    pin: { top: '64%', left: '47.7%' },
    role: 'Walnut-sized exocrine gland encircling the proximal urethra below the bladder neck that produces protective, alkaline seminal fluid.',
    androgenRole: 'Dependent on dihydrotestosterone (DHT)—the 5α-reductase metabolite of testosterone—for cellular proliferation and secretion.',
    clinicalSignificance: 'Physicians monitor prostate health (including digital exam and PSA levels) when evaluating male endocrine balance.',
    color: '#FB923C',
  },
  {
    id: 'bladder',
    name: 'Urinary Bladder',
    label: 'Urinary Bladder',
    pin: { top: '55%', left: '49%' },
    role: 'Muscular pelvic reservoir storing urine directly superior to the prostate gland and internal reproductive conduits.',
    androgenRole: 'Maintains baseline detrusor muscle tone and pelvic floor stability in coordination with pelvic autonomic plexuses.',
    clinicalSignificance: 'Serves as an essential anatomical landmark for understanding the prostate neck and spermatic cord pathways.',
    color: '#FB7185',
  },
  {
    id: 'vas-deferens',
    name: 'Vas Deferens (Spermatic Cord)',
    label: 'Vas Deferens',
    pin: { top: '43%', left: '51.3%' },
    role: 'Paired thick-walled muscular ducts that convey mature spermatozoa from the epididymis up and over the bladder into the ejaculatory ducts.',
    androgenRole: 'Smooth muscle contractile tone and mucosal lining maintenance require physiological baseline circulating androgens.',
    clinicalSignificance: 'Forms the physical gamete delivery highway connecting testicular production to the central pelvic urethra.',
    color: '#34D399',
  },
  {
    id: 'urethra-erectile',
    name: 'Cavernosal Body & Urethra (Erectile Axis)',
    label: 'Erectile Cavernosa & Penis',
    pin: { top: '68%', left: '60.7%' },
    role: 'Dual urinary and ejaculatory channel surrounded by paired corpora cavernosa erectile tissue that expands during vascular vasodilation.',
    androgenRole: 'Testosterone regulates endothelial nitric oxide synthase (eNOS) and phosphodiesterase-5 (PDE5) expression required for firm morning and sexual erections.',
    clinicalSignificance: 'Changes in spontaneous morning erection quality or firmness are hallmark clinical cues investigated in hypogonadism evaluations.',
    color: '#C084FC',
  },
  {
    id: 'vasculature',
    name: 'Pelvic & Testicular Vasculature',
    label: 'Testicular & Pelvic Vessels',
    pin: { top: '22%', left: '56.7%' },
    role: 'Extensive neurovascular plexus including the internal iliac vessels, testicular arteries, and pampiniform venous cooling plexus.',
    androgenRole: 'Transports newly synthesized testosterone from Leydig capillary beds directly into systemic central circulation.',
    clinicalSignificance: 'Optimal vascular perfusion is essential for both endocrine hormone transport and countercurrent scrotal thermoregulation.',
    color: '#38BDF8',
  },
];

type BiologicalViewMode = 'pelvic-anatomy' | 'hpt-axis';
type AnatomyDisplayMode = 'labeled' | 'interactive';
type SignalingFocus = 'all' | 'primary' | 'secondary';

export const MaleBiologyVisualVessel: React.FC = () => {
  const [viewMode, setViewMode] = useState<BiologicalViewMode>('pelvic-anatomy');
  const [anatomyDisplayMode, setAnatomyDisplayMode] = useState<AnatomyDisplayMode>('labeled');
  const [signalingFocus, setSignalingFocus] = useState<SignalingFocus>('all');
  const [selectedOrganId, setSelectedOrganId] = useState<string>('testes');

  const selectedStructure =
    ANATOMICAL_STRUCTURES.find((s) => s.id === selectedOrganId) || ANATOMICAL_STRUCTURES[0];

  const scrollToNext = () => {
    const el = document.getElementById('what-is-hypogonadism');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto my-8 sm:my-12 px-4 flex flex-col items-center justify-center select-none">
      {/* ── 1. Primary Dual-Mode Switcher Pill ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-6 sm:mb-8 z-30 inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#180A26]/85 border border-white/15 backdrop-blur-xl shadow-2xl"
      >
        <button
          onClick={() => setViewMode('pelvic-anatomy')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
            viewMode === 'pelvic-anatomy'
              ? 'bg-gradient-to-r from-[#0284C7] via-[#6366F1] to-[#818CF8] text-white shadow-lg shadow-sky-950/50'
              : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-300" />
          <span>Translucent Male Anatomy (Pelvic & Endocrine)</span>
        </button>

        <button
          onClick={() => setViewMode('hpt-axis')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
            viewMode === 'hpt-axis'
              ? 'bg-gradient-to-r from-[#0284C7] via-[#6366F1] to-[#818CF8] text-white shadow-lg shadow-sky-950/50'
              : 'text-[#B4A6C7] hover:text-white hover:bg-white/5'
          }`}
        >
          <Zap className="w-4 h-4 text-sky-300" />
          <span>HPT Signaling Axis (Primary vs Secondary)</span>
        </button>
      </motion.div>

      {/* ── 2. Central Visual Vessel ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full rounded-[36px] overflow-hidden border border-white/15 bg-gradient-to-b from-[#140C24] via-[#0C1428] to-[#070A14] shadow-[0_0_90px_rgba(2,132,199,0.30)] p-4 sm:p-8 flex flex-col items-center"
      >
        {/* Subtle Ambient Radial Volumetric Halo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 45%, rgba(2, 132, 199, 0.22) 0%, rgba(99, 102, 241, 0.18) 35%, rgba(142, 62, 175, 0.12) 60%, transparent 80%)',
          }}
        />

        <AnimatePresence mode="wait">
          {/* ──────── VIEW 1: TRANSLUCENT MALE ANATOMY (PRIMARY DEFAULT) ──────── */}
          {viewMode === 'pelvic-anatomy' && (
            <motion.div
              key="pelvic-anatomy"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center space-y-6 relative z-10"
            >
              {/* Display Sub-Mode Switcher: Labeled Plate vs Interactive Hotspots */}
              <div className="flex flex-wrap items-center justify-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setAnatomyDisplayMode('labeled')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                    anatomyDisplayMode === 'labeled'
                      ? 'bg-gradient-to-r from-[#0284C7] to-[#6366F1] text-white font-bold shadow-md'
                      : 'text-[#A797BD] hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>High-Definition Labeled Plate</span>
                </button>
                <button
                  onClick={() => setAnatomyDisplayMode('interactive')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                    anatomyDisplayMode === 'interactive'
                      ? 'bg-gradient-to-r from-[#0284C7] to-[#6366F1] text-white font-bold shadow-md'
                      : 'text-[#A797BD] hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Interactive Hotspot Reticles</span>
                </button>
              </div>

              {/* Main Visual & Anatomical Inspector Grid */}
              <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Visual Canvas (7 cols) */}
                <div className="lg:col-span-7 flex justify-center">
                  <div className="relative w-full max-w-xl aspect-[1500/1000] rounded-3xl overflow-hidden bg-gradient-to-b from-[#180A28]/90 via-[#0B152A] to-[#060913] border border-white/20 p-2 shadow-2xl flex items-center justify-center group">
                    {/* Radial edge blend */}
                    <div
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 50%, transparent 72%, rgba(6, 9, 19, 0.4) 88%, rgba(6, 9, 19, 0.95) 100%)',
                      }}
                    />

                    {/* Mode A: High-Definition Labeled Medical Plate */}
                    {anatomyDisplayMode === 'labeled' ? (
                      <picture className="w-full h-full">
                        <source srcSet="/male-pelvic-translucent-labeled.webp" type="image/webp" />
                        <img
                          src="/male-pelvic-translucent-labeled.png"
                          alt="Translucent 3D Male Pelvic Anatomy with High-Definition Pointer Labels for Bladder, Prostate, Vas Deferens, Testicle, Epididymis, Cavernosal Body, and Vasculature"
                          className="w-full h-full object-contain select-none"
                          loading="eager"
                        />
                      </picture>
                    ) : (
                      /* Mode B: Clean 3D Image with Interactive Pulsing Reticles */
                      <>
                        <picture className="w-full h-full">
                          <source srcSet="/male-pelvic-translucent-anatomy.webp" type="image/webp" />
                          <img
                            src="/male-pelvic-translucent-anatomy.png"
                            alt="Translucent 3D Male Pelvic Anatomy Model"
                            className="w-full h-full object-contain select-none"
                            loading="eager"
                          />
                        </picture>

                        {/* Interactive Hotspot Pins */}
                        {ANATOMICAL_STRUCTURES.map((struct) => {
                          const isSelected = struct.id === selectedOrganId;
                          return (
                            <button
                              key={struct.id}
                              onClick={() => setSelectedOrganId(struct.id)}
                              style={{ top: struct.pin.top, left: struct.pin.left }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin cursor-pointer p-2 focus:outline-none"
                              aria-label={`Select ${struct.name}`}
                            >
                              {/* Pulsing ring */}
                              <span
                                className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                                  isSelected ? 'opacity-90 scale-150' : 'opacity-40 group-hover/pin:opacity-80'
                                }`}
                                style={{ backgroundColor: struct.color }}
                              />
                              {/* Central Dot */}
                              <span
                                className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-white shadow-[0_0_12px_currentColor] transition-transform duration-300 ${
                                  isSelected ? 'scale-125 ring-4 ring-white/40' : 'group-hover/pin:scale-110'
                                }`}
                                style={{ backgroundColor: struct.color, color: struct.color }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              </span>

                              {/* Hover Tooltip Preview */}
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/pin:flex whitespace-nowrap px-2 py-0.5 rounded-md bg-[#10071A]/95 border border-white/20 text-[10px] font-mono text-white pointer-events-none shadow-lg z-30">
                                {struct.label}
                              </span>
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>

                {/* Right Column: Physiological Inspector Card (5 cols) */}
                <div className="lg:col-span-5 w-full space-y-4 text-left">
                  {/* Quick Organ Selector Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {ANATOMICAL_STRUCTURES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedOrganId(s.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-mono transition-all cursor-pointer ${
                          s.id === selectedOrganId
                            ? 'bg-white/20 text-white font-bold border border-white/30 shadow-sm'
                            : 'bg-white/5 text-[#A797BD] hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Organ Details Card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedStructure.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="p-5 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-xl space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                            style={{ backgroundColor: selectedStructure.color, color: selectedStructure.color }}
                          />
                          <h4 className="text-base font-bold font-display text-white">
                            {selectedStructure.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#C5B5D5]">
                          Target Structure
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs font-sans text-[#EDE4F7]">
                        <div>
                          <strong className="text-white block font-semibold mb-0.5">
                            Primary Physiological Function:
                          </strong>
                          <p className="leading-relaxed text-[#CDBDD8]">{selectedStructure.role}</p>
                        </div>

                        <div>
                          <strong className="text-sky-300 block font-semibold mb-0.5">
                            Androgen Responsiveness:
                          </strong>
                          <p className="leading-relaxed text-[#CDBDD8]">{selectedStructure.androgenRole}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                          <strong className="text-amber-300 block font-mono text-[10px] uppercase tracking-wider mb-0.5">
                            Relevance to Hypogonadism Screening:
                          </strong>
                          <p className="leading-relaxed text-[#C5B5D5] text-[11px]">
                            {selectedStructure.clinicalSignificance}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Floating Anatomical Badge */}
              <div className="w-full max-w-2xl p-3 rounded-2xl bg-[#10071A]/90 border border-white/15 backdrop-blur-xl shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse" />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#38BDF8] font-bold block">
                      Target Core
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Translucent Male Biology: Testicular Steroidogenesis & Pelvic Organs
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-[#EDE4F7] hidden sm:inline-block">
                  High-Definition 3D Model
                </span>
              </div>
            </motion.div>
          )}

          {/* ──────── VIEW 2: HPT AXIS SIGNALING (PRIMARY VS SECONDARY FLOW) ──────── */}
          {viewMode === 'hpt-axis' && (
            <motion.div
              key="hpt-axis"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center space-y-6 relative z-10"
            >
              {/* Secondary Sub-Selector Pill: Focus Pathway */}
              <div className="flex flex-wrap items-center justify-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setSignalingFocus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                    signalingFocus === 'all'
                      ? 'bg-white/20 text-white font-bold shadow-sm'
                      : 'text-[#A797BD] hover:text-white'
                  }`}
                >
                  Complete Feedback Axis
                </button>
                <button
                  onClick={() => setSignalingFocus('primary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    signalingFocus === 'primary'
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 font-bold shadow-sm'
                      : 'text-[#A797BD] hover:text-amber-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Testis & Seminiferous Tubule (Primary)
                </button>
                <button
                  onClick={() => setSignalingFocus('secondary')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    signalingFocus === 'secondary'
                      ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40 font-bold shadow-sm'
                      : 'text-[#A797BD] hover:text-sky-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  Brain & Pituitary (Secondary)
                </button>
              </div>

              {/* High-Definition Diagram Display Container */}
              <div className="relative w-full max-w-xl aspect-[1491/1251] rounded-3xl overflow-hidden bg-[#0A1020]/95 border border-white/15 p-3 shadow-2xl flex items-center justify-center group">
                <picture className="w-full h-full">
                  <source srcSet="/hpt-axis-seminiferous-tubule-dark.webp" type="image/webp" />
                  <img
                    src="/hpt-axis-seminiferous-tubule-dark.png"
                    alt="High-Definition Hypothalamic-Pituitary-Gonadal Axis Diagram showing Brain, Pituitary Gland, Testicle, Epididymis, Ductus Vas Deferens, Negative Feedback, and Seminiferous Tubule Cross-Section"
                    className="w-full h-full object-contain select-none"
                    loading="eager"
                  />
                </picture>

                {/* Primary / Gonadal Focus Highlight Overlay */}
                {signalingFocus === 'primary' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-x-4 bottom-3 top-[46%] rounded-2xl border-2 border-amber-400/70 bg-amber-400/[0.05] pointer-events-none shadow-[0_0_30px_rgba(251,191,36,0.35)]"
                  >
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-white font-mono text-[10px] font-bold shadow-lg">
                      Focus: Testis, Leydig & Sertoli Tubules (Primary)
                    </div>
                  </motion.div>
                )}

                {/* Secondary / Brain & Pituitary Focus Highlight Overlay */}
                {signalingFocus === 'secondary' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-x-4 top-3 bottom-[54%] rounded-2xl border-2 border-sky-400/70 bg-sky-400/[0.05] pointer-events-none shadow-[0_0_30px_rgba(56,189,248,0.35)]"
                  >
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-sky-500/90 text-white font-mono text-[10px] font-bold shadow-lg">
                      Focus: Hypothalamus & Pituitary Gland (Secondary)
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Mechanism Breakdown Callout */}
              <div className="w-full max-w-2xl p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#38BDF8] font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
                    {signalingFocus === 'all' && 'Endocrine Signaling & Cellular Architecture'}
                    {signalingFocus === 'primary' && 'Primary Hypogonadism: Testicular & Tubule Disruption'}
                    {signalingFocus === 'secondary' && 'Secondary Hypogonadism: Central Signaling Reduction'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#C5B5D5]">
                    Endocrine Society Aligned
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#EDE4F7] leading-relaxed font-sans">
                  {signalingFocus === 'all' && (
                    <>
                      In a healthy system, the <strong className="text-white">Hypothalamus</strong> releases GnRH pulses, prompting the{' '}
                      <strong className="text-white">Pituitary Gland</strong> to secrete LH (which signals Leydig cells to produce testosterone) and FSH (which stimulates Sertoli cells within the cross section of the seminiferous tubule to support sperm development). Circulating testosterone feeds back upstream via the <strong className="text-pink-300">Negative Feedback loop</strong> to prevent hormonal excess.
                    </>
                  )}
                  {signalingFocus === 'primary' && (
                    <>
                      <strong className="text-amber-300">Testicular Origin:</strong> When Leydig cells or seminiferous tubules fail to synthesize sufficient testosterone (e.g. from prior orchitis, trauma, genetic variations like Klinefelter syndrome, or cellular changes), the negative feedback signal disappears. The brain removes its brake, causing the pituitary to pump out <strong className="text-white">elevated LH and FSH</strong> in a compensatory attempt to stimulate production.
                    </>
                  )}
                  {signalingFocus === 'secondary' && (
                    <>
                      <strong className="text-sky-300">Central Brain / Pituitary Origin:</strong> When the hypothalamus fails to pulse GnRH or the pituitary gland subdues LH and FSH release (e.g. from severe sleep apnea, acute illness, metabolic syndrome, high stress, or steroid suppression), the testes remain dormant despite healthy testicular tissue. Both testosterone and LH/FSH remain <strong className="text-white">inappropriately low or normal</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* Floating Anatomical Badge */}
              <div className="w-full max-w-2xl p-3 rounded-2xl bg-[#10071A]/90 border border-white/15 backdrop-blur-xl shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-ping" />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#38BDF8] font-bold block">
                      Signaling Cascade
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Hypothalamus (GnRH) → Pituitary (LH/FSH) → Leydig & Sertoli Tubules
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-[#EDE4F7] hidden sm:inline-block">
                  High-Definition Architecture
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── 3. Bottom Scroll Down Action ── */}
      <motion.button
        onClick={scrollToNext}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group inline-flex flex-col items-center gap-2 mt-8 text-white/80 hover:text-white cursor-pointer transition-colors"
      >
        <span className="text-xs sm:text-sm font-semibold tracking-wider font-sans uppercase text-[#38BDF8] group-hover:text-white transition-colors flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
          Explore what male hypogonadism is
        </span>
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-[#0284C7]/40 group-hover:border-white/40 transition-all duration-300 shadow-lg">
          <ChevronDown className="w-5 h-5 text-white animate-bounce" />
        </div>
      </motion.button>
    </div>
  );
};
