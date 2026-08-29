import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ArrowRightLeft, Sparkles, RefreshCw } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface BiologicalSignalNode {
  id: string;
  name: string;
  shortCode: string;
  iconColor: string;
  summary: string;
  mechanism: string;
  crossTalkNodes: string[];
}

const BIOLOGICAL_NODES: BiologicalSignalNode[] = [
  {
    id: 'hormonal-signaling',
    name: 'Hormonal Signaling Axis',
    shortCode: 'LH / FSH / GnRH',
    iconColor: '#FB7185',
    summary: 'Pituitary pulse frequencies and altered feedback loops.',
    mechanism:
      'Increased GnRH pulsatility favors luteinizing hormone (LH) over follicle-stimulating hormone (FSH), prompting the ovary to generate androgen precursors rather than maturing follicles.',
    crossTalkNodes: ['follicular-development', 'androgen-effects', 'metabolic-factors'],
  },
  {
    id: 'follicular-development',
    name: 'Follicular Development',
    shortCode: 'Antral Arrest',
    iconColor: '#C084FC',
    summary: 'Multiple follicles pause their journey before dominant selection.',
    mechanism:
      'Without sustained FSH surges and due to local intra-ovarian androgen excess, multiple small antral follicles halt growth around 2–9 mm, accumulating around the periphery.',
    crossTalkNodes: ['ovulation-patterns', 'hormonal-signaling'],
  },
  {
    id: 'ovulation-patterns',
    name: 'Ovulation Patterns',
    shortCode: 'Anovulation / Oligo-ovulation',
    iconColor: '#E879F9',
    summary: 'Infrequent or unpredictable release of an egg cell.',
    mechanism:
      'Because no single follicle achieves mature dominance, the mid-cycle LH surge is delayed or absent, leading to extended follicular phases or anovulatory cycles.',
    crossTalkNodes: ['cycle-changes', 'follicular-development'],
  },
  {
    id: 'cycle-changes',
    name: 'Menstrual Cycle Rhythm',
    shortCode: 'Oligomenorrhea / Amenorrhea',
    iconColor: '#FDA4AF',
    summary: 'Irregular, prolonged (>35 days), or temporarily absent intervals.',
    mechanism:
      'Without regular ovulation, the corpus luteum does not form, depriving the uterine lining of cyclical progesterone. This leads to unpredictable spotting or prolonged amenorrhea.',
    crossTalkNodes: ['ovulation-patterns', 'androgen-effects'],
  },
  {
    id: 'androgen-effects',
    name: 'Androgen-Related Expressions',
    shortCode: 'Hyperandrogenism',
    iconColor: '#FB923C',
    summary: 'Elevated testosterone, DHEAS, and androgen receptor response.',
    mechanism:
      'Ovarian theca cells and adrenal glands produce higher levels of androgens, which can manifest as hirsutism, cystic acne, or male-pattern hair thinning.',
    crossTalkNodes: ['metabolic-factors', 'hormonal-signaling', 'cycle-changes'],
  },
  {
    id: 'metabolic-factors',
    name: 'Metabolic & Insulin Crosstalk',
    shortCode: 'Insulin Resistance / Glucose',
    iconColor: '#34D399',
    summary: 'Hyperinsulinemia acting directly on ovarian steroidogenesis.',
    mechanism:
      'Elevated circulating insulin synergizes with LH to stimulate ovarian theca cells directly and lowers Sex Hormone-Binding Globulin (SHBG) in the liver, increasing free active testosterone.',
    crossTalkNodes: ['androgen-effects', 'hormonal-signaling'],
  },
];

export const HowPCOSPatternsSection: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(BIOLOGICAL_NODES[0].id);

  const activeNode =
    BIOLOGICAL_NODES.find((n) => n.id === selectedNodeId) || BIOLOGICAL_NODES[0];

  return (
    <section className="relative py-24 sm:py-32 bg-[#0C0418] text-white overflow-hidden border-t border-white/10 select-none">
      {/* Background Volumetric Lighting */}
      <div className="absolute top-1/3 right-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#6E2D8B]/20 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 left-1/4 w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-[#FB7185]/15 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Network className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 03 — Multi-System Signaling
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            PCOS is a pattern of{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              interconnected signals.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            Rather than a single linear switch, PCOS functions as a dynamic feedback network where
            endocrine, metabolic, and ovarian signals continuously influence one another.
          </p>

          {/* Critical Individuality Note */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#6E2D8B]/20 border border-[#8E3EAF]/40 text-xs text-[#EDE4F7]">
            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="font-semibold">PCOS does not look exactly the same in every woman.</span>
          </div>
        </div>

        {/* ── Interactive Signaling Network Matrix ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left / Interconnected Biological Signaling Web Visual */}
          <div className="lg:col-span-7 relative p-4 sm:p-6 rounded-[36px] bg-gradient-to-b from-[#180A26]/90 via-[#12071F]/90 to-[#0A0313]/90 border border-white/15 shadow-2xl backdrop-blur-xl">
            {/* SVG Signaling Network with Connecting Stream Lines & Particle Flows */}
            <div className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center">
              <svg viewBox="0 0 400 400" className="w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="networkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FB7185" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#C084FC" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {/* Central Radial Mesh Ring */}
                <circle
                  cx="200"
                  cy="200"
                  r="130"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="85"
                  fill="none"
                  stroke="rgba(142,62,175,0.15)"
                  strokeWidth="1"
                />

                {/* Dynamic Connecting Lines between Center and Nodes */}
                {[
                  { x1: 200, y1: 70, x2: 310, y2: 135 },
                  { x1: 310, y1: 135, x2: 310, y2: 265 },
                  { x1: 310, y1: 265, x2: 200, y2: 330 },
                  { x1: 200, y1: 330, x2: 90, y2: 265 },
                  { x1: 90, y1: 265, x2: 90, y2: 135 },
                  { x1: 90, y1: 135, x2: 200, y2: 70 },
                  // Cross-talk lines
                  { x1: 200, y1: 70, x2: 200, y2: 330 },
                  { x1: 90, y1: 135, x2: 310, y2: 265 },
                  { x1: 90, y1: 265, x2: 310, y2: 135 },
                ].map((line, idx) => (
                  <line
                    key={idx}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="url(#networkGrad)"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    className="opacity-40 animate-pulse"
                  />
                ))}

                {/* Central Luminous Hub */}
                <circle cx="200" cy="200" r="28" fill="#6E2D8B" opacity="0.4" />
                <circle cx="200" cy="200" r="14" fill="#E87084" opacity="0.8" />
                <circle cx="200" cy="200" r="4" fill="#FFFFFF" />
              </svg>

              {/* Node Hotspots Overlay (6 circular positioned coordinates) */}
              {[
                { id: 'hormonal-signaling', x: '50%', y: '16%' },
                { id: 'follicular-development', x: '78%', y: '34%' },
                { id: 'ovulation-patterns', x: '78%', y: '68%' },
                { id: 'cycle-changes', x: '50%', y: '84%' },
                { id: 'androgen-effects', x: '22%', y: '68%' },
                { id: 'metabolic-factors', x: '22%', y: '34%' },
              ].map((pos) => {
                const nodeData = BIOLOGICAL_NODES.find((n) => n.id === pos.id)!;
                const isSelected = selectedNodeId === pos.id;
                const isConnected = activeNode.crossTalkNodes.includes(pos.id);

                return (
                  <div
                    key={pos.id}
                    style={{ top: pos.y, left: pos.x }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto"
                  >
                    <button
                      onClick={() => setSelectedNodeId(pos.id)}
                      className={`group relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                        isSelected ? 'scale-120' : 'hover:scale-110'
                      }`}
                    >
                      {/* Pulse Ring */}
                      <span
                        className={`absolute w-12 h-12 rounded-full ${
                          isSelected
                            ? 'animate-ping opacity-80'
                            : isConnected
                            ? 'animate-pulse opacity-40'
                            : 'opacity-0 group-hover:opacity-40'
                        }`}
                        style={{ backgroundColor: nodeData.iconColor }}
                      />

                      {/* Main Node Bubble */}
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border-2 backdrop-blur-md transition-all shadow-lg ${
                          isSelected
                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                            : isConnected
                            ? 'bg-[#1C0D2E] text-white border-[#FB7185]'
                            : 'bg-[#10071A]/90 text-white border-white/20 hover:border-white'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: nodeData.iconColor }}
                        />
                      </div>

                      {/* Short Tag Pill */}
                      <span
                        className={`mt-1.5 whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase transition-all ${
                          isSelected
                            ? 'bg-white text-black font-extrabold shadow-md'
                            : 'bg-[#10071A]/80 text-[#B4A6C7] border border-white/10'
                        }`}
                      >
                        {nodeData.name.split(' ')[0]}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Micro Indicator Bar */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#B4A6C7]">
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#FB7185]" />
                Interactive Feedback Loops
              </span>
              <span className="text-white/60">Click nodes to trace cross-talk</span>
            </div>
          </div>

          {/* Right / Dynamic Node Detail Narrative */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeNode.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.35 }}
                className="p-6 rounded-3xl bg-gradient-to-b from-[#1C0D2E]/80 to-[#12071F]/90 border border-white/15 shadow-2xl backdrop-blur-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: activeNode.iconColor }}
                    />
                    <h3 className="text-xl font-bold font-display text-white">{activeNode.name}</h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/10 text-[#FDA4AF]">
                    {activeNode.shortCode}
                  </span>
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed">
                  {activeNode.summary}
                </p>

                {/* Biological Mechanism Box */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#FB7185] font-bold block">
                    Biological Mechanism
                  </span>
                  <p className="text-xs text-[#CDBDD8] leading-relaxed font-sans">
                    {activeNode.mechanism}
                  </p>
                </div>

                {/* Connected Cross-Talk Signals */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDE4F7] block">
                    Direct Cross-Talk Connections:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {activeNode.crossTalkNodes.map((targetId) => {
                      const targetNode = BIOLOGICAL_NODES.find((n) => n.id === targetId);
                      if (!targetNode) return null;
                      return (
                        <button
                          key={targetId}
                          onClick={() => setSelectedNodeId(targetId)}
                          className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 text-xs text-white transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: targetNode.iconColor }}
                          />
                          <span>{targetNode.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Non-Linear Takeaway Banner */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <RefreshCw className="w-4 h-4 text-[#C084FC] shrink-0 mt-0.5" />
              <p className="text-xs text-[#A797BD] leading-relaxed">
                <strong>Non-Linear Biology:</strong> Addressing one area (such as metabolic insulin
                sensitivity) can create positive ripple effects across ovulation and androgen
                signaling.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
