import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  FileSearch,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export interface AnatomicalStructure {
  id: string;
  name: string;
  shortLabel: string;
  pinPosition: { top: string; left: string };
  color: string;
  biologicalRole: {
    title: string;
    description: string;
    pcosMechanism: string;
  };
  appImpact: {
    featureName: string;
    icon: 'brain' | 'ocr' | 'timeline' | 'clinical';
    description: string;
    trackedBiomarkers: string[];
    aiModelUsage: string;
  };
}

export const ANATOMICAL_STRUCTURES: AnatomicalStructure[] = [
  {
    id: 'left-ovary',
    name: 'Left Ovary & Follicular Reserve',
    shortLabel: 'Left Ovary',
    pinPosition: { top: '42%', left: '26%' },
    color: '#FB7185',
    biologicalRole: {
      title: 'Endocrine Regulation & Folliculogenesis',
      description:
        'The ovaries produce estrogen, progesterone, and androgens while nurturing oocytes through developmental stages.',
      pcosMechanism:
        'In PCOS/PMOS, elevated LH and insulin drive thecal hyperplasia and androgen overproduction, causing premature follicular arrest and the accumulation of 20+ immature antral follicles ("string-of-pearls" morphology).',
    },
    appImpact: {
      featureName: 'Ultrasound OCR & Rotterdam Morphology Engine',
      icon: 'ocr',
      description:
        'VITASense parses left ovarian volume (normal <10 cm³) and antral follicle count (AFC) from pelvic ultrasound PDFs and scans.',
      trackedBiomarkers: [
        'Left Ovarian Volume (cm³)',
        'Antral Follicle Count (AFC)',
        'Stromal Echogenicity Ratio',
        'LH / FSH Biomarker Ratio',
      ],
      aiModelUsage:
        'Feeds into the Multi-Criteria Assessment Model to evaluate PCOM (Polycystic Ovarian Morphology) under Rotterdam criteria.',
    },
  },
  {
    id: 'right-ovary',
    name: 'Right Ovary & Bilateral Axis',
    shortLabel: 'Right Ovary',
    pinPosition: { top: '42%', left: '74%' },
    color: '#FB7185',
    biologicalRole: {
      title: 'Bilateral Symmetry & Dynamic Ovulation',
      description:
        'Ovarian activity typically alternates or demonstrates dominant reserve between left and right sides across cycles.',
      pcosMechanism:
        'PCOS often presents with bilateral ovarian enlargement, but cysts, dominant follicle failure, or stromal density can be asymmetric, influencing pain and hormonal spikes.',
    },
    appImpact: {
      featureName: 'Bilateral Comparative Analytics & Pain Lateralization',
      icon: 'timeline',
      description:
        'Compares right vs. left ovary metrics over multi-month ultrasound reports and correlates unilateral pelvic discomfort logged in symptom tracker.',
      trackedBiomarkers: [
        'Right Ovarian Volume (cm³)',
        'Right Follicle Density',
        'Localized Mittelschmerz / Ovulatory Discomfort',
        'Anti-Müllerian Hormone (AMH)',
      ],
      aiModelUsage:
        'Enables longitudinal trend tracking to identify ovarian response to dietary, inositol, or lifestyle interventions.',
    },
  },
  {
    id: 'uterus',
    name: 'Uterus & Endometrial Lining',
    shortLabel: 'Uterus & Endometrium',
    pinPosition: { top: '34%', left: '50%' },
    color: '#C084FC',
    biologicalRole: {
      title: 'Hormone-Responsive Endometrial Architecture',
      description:
        'The endometrium undergoes continuous cyclical proliferation and shedding in response to estrogen and progesterone balance.',
      pcosMechanism:
        'Chronic anovulation leads to continuous unopposed estrogen exposure without balancing luteal progesterone, increasing the risk of endometrial hyperplasia, heavy breakthrough bleeding, or extended amenorrhea.',
    },
    appImpact: {
      featureName: 'Endometrial Health Guard & Amenorrhea Alerts',
      icon: 'clinical',
      description:
        'Monitors cycle interval lengths (35+ days) and tracks ultrasound endometrial thickness (stripe measurement in mm) across cycle phases.',
      trackedBiomarkers: [
        'Endometrial Stripe Thickness (mm)',
        'Cycle Interval Length (Days)',
        'Bleeding Flow Severity & Spotting',
        'Progesterone (PdG) Surges',
      ],
      aiModelUsage:
        'Generates automated clinical alerts when cycle gaps exceed safe thresholds (>90 days without withdrawal bleed) for doctor review.',
    },
  },
  {
    id: 'fallopian-tubes',
    name: 'Fallopian Tubes & Fimbriae',
    shortLabel: 'Fallopian Tubes',
    pinPosition: { top: '22%', left: '22%' },
    color: '#E879F9',
    biologicalRole: {
      title: 'Ovum Capture & Tubal Micro-Environment',
      description:
        'Ciliated epithelial fimbriae sweep over the ovary to capture the released oocyte and provide optimal physiological transit.',
      pcosMechanism:
        'While not primary sites of PCOS androgenesis, inflammatory cytokines and metabolic stress can affect tubal motility and pelvic pain threshold.',
    },
    appImpact: {
      featureName: 'Ovulatory Window Estimation & Symptom Mapping',
      icon: 'brain',
      description:
        'Correlates basal body temperature (BBT) biphasic shifts and LH surge data to evaluate whether successful ovulatory capture is taking place.',
      trackedBiomarkers: [
        'Basal Body Temperature (BBT) Nadir & Shift',
        'Ciliary Transit Timing Estimation',
        'Pelvic Heaviness & Inflammatory Markers (CRP)',
        'Co-occurring Pelvic Pain Patterns',
      ],
      aiModelUsage:
        'SHAP explainability engine highlights whether irregular intervals are due to delayed ovulation vs. complete anovulatory patterns.',
    },
  },
  {
    id: 'cervix',
    name: 'Cervix & Cervical Fluid Axis',
    shortLabel: 'Cervix & Canal',
    pinPosition: { top: '68%', left: '50%' },
    color: '#D8B4FE',
    biologicalRole: {
      title: 'Hormonal Mucus Secretion & Barrier',
      description:
        'Cervical crypt cells produce distinct types of mucus (fertile fluid vs. thick progesterone plug) strictly dictated by circulating estrogen levels.',
      pcosMechanism:
        'Hormonal dysregulation can produce confusing "false-fertile" cervical mucus patches due to fluctuating estrogen without true LH surge and ovulation.',
    },
    appImpact: {
      featureName: 'Daily Cervical Fluid Tracking & True Surge Detection',
      icon: 'timeline',
      description:
        'Enables daily logging of mucus consistency (dry, sticky, creamy, watery, egg-white) to cross-validate against urinary LH test strips.',
      trackedBiomarkers: [
        'Cervical Mucus Score (Peak Day Indicator)',
        'Estradiol (E2) Dynamic Estimation',
        'Urinary LH Rapid Test Strips (mIU/mL)',
        'Vaginal Microbiome / pH Context',
      ],
      aiModelUsage:
        'Filters out false LH surges by correlating mucus texture with multi-day thermal and symptom trajectories.',
    },
  },
];

export const AnatomyIntelligenceSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(ANATOMICAL_STRUCTURES[0].id);
  const [activeTab, setActiveTab] = useState<'reason' | 'impact'>('reason');

  const selectedStructure =
    ANATOMICAL_STRUCTURES.find((s) => s.id === selectedId) || ANATOMICAL_STRUCTURES[0];

  return (
    <section className="relative py-20 sm:py-28 bg-[#10071A] text-white overflow-hidden border-t border-b border-white/10">
      {/* ── Background Biological Ambient Glows ── */}
      <div className="absolute top-1/3 left-1/5 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute top-2/3 right-1/3 w-[300px] h-[300px] bg-[#A21CAF]/20 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#E87084] shadow-[0_0_8px_#E87084] animate-pulse" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Biological Grounding & AI Correlation
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-[1.15]">
            Why We Map the{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Reproductive Anatomy
            </span>
          </h2>

          <p className="text-sm sm:text-base text-[#B4A6C7] font-sans leading-relaxed">
            VITASense connects complex women's health symptoms to foundational pelvic biology.
            Click each anatomical structure below to see <strong>why it matters</strong> in PCOS and{' '}
            <strong>how our app analyzes its clinical signals</strong>.
          </p>
        </div>

        {/* ── Structure Selection Quick Pill Bar ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {ANATOMICAL_STRUCTURES.map((structure) => {
            const isSelected = structure.id === selectedId;
            return (
              <button
                key={structure.id}
                onClick={() => setSelectedId(structure.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold font-sans transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white shadow-lg shadow-purple-950/40 scale-105 border border-white/20'
                    : 'bg-[#180A26]/80 text-[#B4A6C7] hover:text-white hover:bg-[#241038] border border-white/10'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shadow-xs"
                  style={{ backgroundColor: structure.color }}
                />
                <span>{structure.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main Interactive 2-Column Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* ── Left Column: Beautified Anatomical Model with Active Hotspots ── */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-[4/3] rounded-[28px] overflow-hidden bg-gradient-to-b from-[#1C0D2E]/70 via-[#140822]/85 to-[#0F041B]/95 border border-[#8E3EAF]/30 shadow-2xl shadow-purple-950/60 p-2 sm:p-4 flex items-center justify-center">
              {/* Radial Ambient Glow Behind Image */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `
                    radial-gradient(circle at 50% 45%, rgba(142, 62, 175, 0.4) 0%, rgba(232, 112, 132, 0.22) 40%, rgba(16, 7, 26, 0.95) 75%, #0C0418 100%)
                  `,
                }}
              />

              {/* Anatomical Model Image with Smooth Vignette Edge Mask */}
              <img
                src="/anatomy-hero-model.jpg"
                alt="VITASense Female Reproductive Anatomy Model"
                className="w-full h-full object-contain object-center select-none"
                style={{
                  maskImage:
                    'radial-gradient(ellipse at 50% 50%, black 60%, rgba(0,0,0,0.85) 75%, transparent 95%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse at 50% 50%, black 60%, rgba(0,0,0,0.85) 75%, transparent 95%)',
                }}
              />

              {/* ── Interactive Hotspot Pins ── */}
              {ANATOMICAL_STRUCTURES.map((structure) => {
                const isSelected = structure.id === selectedId;
                return (
                  <div
                    key={structure.id}
                    style={{
                      top: structure.pinPosition.top,
                      left: structure.pinPosition.left,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(structure.id)}
                      aria-label={`Select ${structure.name}`}
                      className={`group relative flex items-center justify-center cursor-pointer transition-all duration-300 ${
                        isSelected ? 'scale-130' : 'hover:scale-115 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* Pulsing Target Ring */}
                      <span
                        className={`absolute w-8 h-8 rounded-full pointer-events-none ${
                          isSelected ? 'animate-ping opacity-75' : 'opacity-30'
                        }`}
                        style={{ backgroundColor: structure.color }}
                      />

                      {/* Outer Halo */}
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md border transition-all duration-300 ${
                          isSelected
                            ? 'bg-white text-[#1C1326] border-white shadow-[0_0_18px_rgba(255,255,255,0.9)]'
                            : 'bg-[#180A26]/80 text-white border-white/40 group-hover:border-white'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: structure.color }}
                        />
                      </span>

                      {/* Pin Label Tag */}
                      <span
                        className={`hidden sm:block absolute left-7 whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md transition-all duration-200 ${
                          isSelected
                            ? 'bg-white text-[#10071A] shadow-lg shadow-purple-950/40 border border-white'
                            : 'bg-[#10071A]/80 text-[#EDE4F7] border border-white/20 group-hover:border-[#E87084]'
                        }`}
                      >
                        {structure.shortLabel}
                      </span>
                    </button>
                  </div>
                );
              })}

              {/* Bottom Interactive Hint */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#10071A]/80 border border-white/10 text-[10px] text-[#B4A6C7] backdrop-blur-md flex items-center gap-1.5 select-none pointer-events-none">
                <Sparkles className="w-3 h-3 text-[#E87084]" />
                <span>Click any anatomical node to inspect its AI impact</span>
              </div>
            </div>
          </div>

          {/* ── Right Column: Dynamic Deep Intelligence Card ── */}
          <div className="lg:col-span-6 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStructure.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="p-6 sm:p-8 rounded-[28px] bg-[#180A26]/85 border border-[#8E3EAF]/35 shadow-2xl shadow-purple-950/50 backdrop-blur-xl relative overflow-hidden text-left"
              >
                {/* Header Badge & Structure Name */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shadow-md"
                      style={{ backgroundColor: selectedStructure.color }}
                    />
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
                        {selectedStructure.name}
                      </h3>
                      <span className="text-[11px] font-mono text-[#D8B4FE] tracking-wide uppercase">
                        Clinical Biological Marker
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-[#EDE4F7]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FB7185]" />
                    <span className="font-semibold">Rotterdam Criterion</span>
                  </div>
                </div>

                {/* Sub-Tab Selector (Reason vs. App Impact) */}
                <div className="flex items-center gap-2 my-5 p-1 rounded-xl bg-[#12071F]/90 border border-white/10">
                  <button
                    onClick={() => setActiveTab('reason')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'reason'
                        ? 'bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white shadow-md'
                        : 'text-[#B4A6C7] hover:text-white'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>1. Why We Consider It (Biology)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('impact')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      activeTab === 'impact'
                        ? 'bg-gradient-to-r from-[#8E3EAF] to-[#A21CAF] text-white shadow-md'
                        : 'text-[#B4A6C7] hover:text-white'
                    }`}
                  >
                    <BrainCircuit className="w-3.5 h-3.5 text-[#FDA4AF]" />
                    <span>2. VITASense App Impact</span>
                  </button>
                </div>

                {/* Content Panel 1: Biological Role & Reason */}
                {activeTab === 'reason' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-xs uppercase font-mono tracking-wider text-[#D8B4FE] font-bold mb-1">
                        Physiological Role
                      </h4>
                      <p className="text-sm text-[#EDE4F7] font-sans leading-relaxed">
                        {selectedStructure.biologicalRole.description}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#12071F]/80 border border-[#E87084]/25 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#FB7185]">
                        <Activity className="w-4 h-4 shrink-0" />
                        <span>PCOS / PMOS Pathophysiology</span>
                      </div>
                      <p className="text-xs text-[#B4A6C7] leading-relaxed">
                        {selectedStructure.biologicalRole.pcosMechanism}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Content Panel 2: VITASense App Impact */}
                {activeTab === 'impact' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="p-3.5 rounded-2xl bg-[#12071F]/80 border border-[#8E3EAF]/30 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#EDE4F7]">
                        <BrainCircuit className="w-4 h-4 text-[#8E3EAF]" />
                        <span>Feature: {selectedStructure.appImpact.featureName}</span>
                      </div>
                      <p className="text-xs text-[#B4A6C7] leading-relaxed">
                        {selectedStructure.appImpact.description}
                      </p>
                    </div>

                    {/* Tracked Biomarkers List */}
                    <div>
                      <h4 className="text-xs uppercase font-mono tracking-wider text-[#D8B4FE] font-bold mb-2">
                        Mapped Ultrasound & Lab Biomarkers:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedStructure.appImpact.trackedBiomarkers.map((bio) => (
                          <div
                            key={bio}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#EDE4F7]"
                          >
                            <ChevronRight className="w-3 h-3 text-[#FB7185] shrink-0" />
                            <span className="truncate">{bio}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Model Attribution */}
                    <div className="p-3 rounded-xl bg-[#220E37]/60 border border-[#A21CAF]/30 text-xs text-[#B4A6C7] flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#D8B4FE] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-medium">Explainable AI Attribution:</strong>
                        <span>{selectedStructure.appImpact.aiModelUsage}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Micro Footer Indicator */}
                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-[#8D7E9E]">
                  <span className="flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5 text-[#8E3EAF]" />
                    Multi-Modal Data Integration
                  </span>
                  <span className="font-mono text-[#D8B4FE]">PCOS Biological Ontology</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
};
