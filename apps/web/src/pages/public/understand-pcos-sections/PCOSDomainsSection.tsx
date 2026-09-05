import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Flame, Calendar, HeartPulse, UserCheck, Stethoscope } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

interface DomainTabConfig {
  id: string;
  name: string;
  badge: string;
  icon: any;
  accentColor: string;
  headline: string;
  primaryQuote: string;
  detailedInsight: string;
  clinicalBiomarkers: string[];
  visualType: 'hormones' | 'ovulation' | 'cycles' | 'symptoms' | 'metabolic';
}

const DOMAIN_TABS: DomainTabConfig[] = [
  {
    id: 'hormones',
    name: 'Hormones',
    badge: 'Endocrine Signaling',
    icon: Flame,
    accentColor: '#FB7185',
    headline: 'Shifting androgen & luteinizing signals.',
    primaryQuote:
      'Changes in androgen-related signaling can contribute to symptoms such as acne or excess hair growth.',
    detailedInsight:
      'In many individuals with PMOS, the thecal cells of the ovary produce higher baseline androgens (testosterone and androstenedione). When combined with an elevated LH pulse frequency, this signaling environment dampens the normal cyclical rise in progesterone.',
    clinicalBiomarkers: [
      'Total & Free Testosterone',
      'LH / FSH Biomarker Ratio',
      'Sex Hormone-Binding Globulin (SHBG)',
      'DHEA-Sulfate (Adrenal)',
    ],
    visualType: 'hormones',
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    badge: 'Ovarian Cycle',
    icon: Activity,
    accentColor: '#C084FC',
    headline: 'Unpredictable or paused ovulatory release.',
    primaryQuote: 'Ovulation may become irregular or infrequent.',
    detailedInsight:
      'Rather than releasing a mature egg around day 14, ovarian follicles may remain in a prolonged pre-ovulatory state. This delayed or absent ovulation (oligo/anovulation) can extend the follicular phase for weeks or months.',
    clinicalBiomarkers: [
      'Progesterone (PdG) Luteal Peak',
      'Basal Body Temperature (BBT) Nadir & Shift',
      'Urinary LH Surge Dynamics',
      'Anti-Müllerian Hormone (AMH)',
    ],
    visualType: 'ovulation',
  },
  {
    id: 'cycles',
    name: 'Cycles',
    badge: 'Menstrual Rhythm',
    icon: Calendar,
    accentColor: '#E879F9',
    headline: 'Variable intervals & cycle lengths.',
    primaryQuote: 'Periods may become irregular.',
    detailedInsight:
      'Menstrual cycles may stretch beyond the standard 35-day window (oligomenorrhea), occur unpredictably, or be absent for months (amenorrhea). The unpredictability stems directly from when—or if—ovulation takes place.',
    clinicalBiomarkers: [
      'Cycle Interval Length (Days)',
      'Flow Volume & Duration',
      'Luteal Phase Duration',
      'Spotting Frequency',
    ],
    visualType: 'cycles',
  },
  {
    id: 'symptoms',
    name: 'Symptoms',
    badge: 'Individual Expression',
    icon: UserCheck,
    accentColor: '#FDA4AF',
    headline: 'Unique expressions across every individual.',
    primaryQuote: 'Symptoms vary significantly from person to person.',
    detailedInsight:
      'One individual might experience severe cystic acne and hirsutism with regular cycles, while another might face amenorrhea and fatigue without outward hyperandrogenic signs. No two PMOS profiles are identical.',
    clinicalBiomarkers: [
      'Ferriman-Gallwey Score (Hirsutism)',
      'Dermatological Distribution',
      'Energy & Fatigue Trajectory',
      'Pelvic Heaviness & Discomfort',
    ],
    visualType: 'symptoms',
  },
  {
    id: 'metabolic-health',
    name: 'Metabolic Health',
    badge: 'Cellular Energy',
    icon: HeartPulse,
    accentColor: '#34D399',
    headline: 'Insulin sensitivity & glucose utilization.',
    primaryQuote:
      'Some people with PMOS experience insulin resistance or other metabolic concerns.',
    detailedInsight:
      'Insulin resistance is common across both lean and higher-BMI individuals with PMOS. When cells become less responsive to insulin, higher insulin levels circulate, directly stimulating ovarian androgen synthesis and affecting metabolic energy.',
    clinicalBiomarkers: [
      'Fasting Insulin & HOMA-IR',
      'Fasting Blood Glucose / HbA1c',
      'Lipid Profile (HDL/Triglycerides)',
      'Postprandial Energy Stability',
    ],
    visualType: 'metabolic',
  },
];

export const PCOSDomainsSection: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState<string>(DOMAIN_TABS[0].id);
  const activeTab = DOMAIN_TABS.find((t) => t.id === activeTabId) || DOMAIN_TABS[0];

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10 select-none">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-[#8E3EAF]/20 rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] bg-[#E87084]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl" className="relative z-10 w-full">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Step 04 — Interactive Biological Domains
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-display">
            What can{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              change.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] max-w-2xl mx-auto font-sans leading-relaxed">
            Explore how PMOS influences key physiological domains—from hormone signaling and
            ovulation to metabolic health.
          </p>

          {/* Interactive Domain Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
            {DOMAIN_TABS.map((tab) => {
              const isActive = tab.id === activeTabId;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white font-bold shadow-lg shadow-purple-950/40 scale-105'
                      : 'bg-white/5 border border-white/10 text-[#B4A6C7] hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Dynamic Domain Explorer Canvas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left / Narrative & Clinical Biomarkers Panel */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#FDA4AF]">
                  <span
                    className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]"
                    style={{ backgroundColor: activeTab.accentColor }}
                  />
                  <span>{activeTab.badge}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold font-display text-white leading-snug">
                  {activeTab.headline}
                </h3>

                {/* Core Medically Cautious Statement Quote */}
                <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 shadow-md">
                  <p className="text-sm sm:text-base font-medium text-white italic leading-relaxed">
                    "{activeTab.primaryQuote}"
                  </p>
                </div>

                <p className="text-sm text-[#CDBDD8] leading-relaxed font-sans">
                  {activeTab.detailedInsight}
                </p>

                {/* Tracked Biomarkers List */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#EDE4F7] block flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[#FB7185]" />
                    Associated Clinical Biomarkers
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {activeTab.clinicalBiomarkers.map((bm, i) => (
                      <div
                        key={i}
                        className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#EDE4F7] flex items-center gap-2"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: activeTab.accentColor }}
                        />
                        <span>{bm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right / Dynamic Visual Artboard for Domain */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full max-w-[500px] aspect-[4/3] sm:aspect-square rounded-[32px] overflow-hidden bg-gradient-to-b from-[#180A26] via-[#12071F] to-[#0A0313] border border-white/15 shadow-2xl p-6 flex flex-col justify-between">
              {/* Radial Domain Glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${activeTab.accentColor}25 0%, rgba(110,45,139,0.15) 50%, transparent 80%)`,
                }}
              />

              {/* Dynamic Biological Artboard Content according to visualType */}
              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {activeTab.visualType === 'hormones' && (
                    <motion.div
                      key="hormones"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full space-y-4"
                    >
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#FB7185]">Luteinizing Hormone (LH)</span>
                          <span className="text-white">Elevated Baseline Pulses</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#FB7185] to-[#E87084]"
                            initial={{ width: '0%' }}
                            animate={{ width: '78%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#C084FC]">Follicle-Stimulating (FSH)</span>
                          <span className="text-white">Relative Dampening</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#8E3EAF] to-[#C084FC]"
                            initial={{ width: '0%' }}
                            animate={{ width: '38%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#FDA4AF]">Free Androgen Index</span>
                          <span className="text-white">Enhanced Thecal Output</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#FB923C] to-[#FB7185]"
                            initial={{ width: '0%' }}
                            animate={{ width: '70%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab.visualType === 'ovulation' && (
                    <motion.div
                      key="ovulation"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full flex flex-col items-center space-y-5"
                    >
                      <div className="relative w-40 h-40 rounded-full border-2 border-dashed border-[#C084FC]/50 flex items-center justify-center">
                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#6E2D8B]/40 to-[#FB7185]/40 animate-pulse flex items-center justify-center border border-white/20">
                          <span className="text-xs font-mono font-bold text-center text-white">
                            Follicular
                            <br />
                            Pause
                          </span>
                        </div>
                        {/* Arrested follicles on ring */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FB7185] shadow-md" />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#FB7185] shadow-md" />
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#C084FC] shadow-md" />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#C084FC] shadow-md" />
                      </div>
                      <span className="text-xs font-mono text-[#B4A6C7] text-center">
                        Non-dominant multiple follicle persistence
                      </span>
                    </motion.div>
                  )}

                  {activeTab.visualType === 'cycles' && (
                    <motion.div
                      key="cycles"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full space-y-4"
                    >
                      <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-[#B4A6C7]">
                          <span>Standard 28-Day Cycle</span>
                          <span className="text-[#34D399]">Regular Ovulation</span>
                        </div>
                        <div className="flex gap-1 h-3">
                          <div className="w-1/2 bg-[#C084FC]/70 rounded-l" />
                          <div className="w-1/2 bg-[#34D399]/70 rounded-r" />
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#6E2D8B]/20 border border-[#8E3EAF]/40 space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-white">
                          <span>PMOS Variable Cycle (45+ Days)</span>
                          <span className="text-[#FB7185]">Extended Follicular Phase</span>
                        </div>
                        <div className="flex gap-1 h-3">
                          <div className="w-3/4 bg-[#E87084]/80 rounded-l" />
                          <div className="w-1/4 bg-[#FB7185]/40 rounded-r border border-dashed border-white/30" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab.visualType === 'symptoms' && (
                    <motion.div
                      key="symptoms"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full grid grid-cols-2 gap-2.5"
                    >
                      {[
                        { label: 'Skin & Sebaceous Activity', val: 'Cystic Acne / Oil', color: '#FB7185' },
                        { label: 'Hair Density Modulation', val: 'Hirsutism / Shedding', color: '#FDA4AF' },
                        { label: 'Diurnal Energy Levels', val: 'Fluctuating Fatigue', color: '#C084FC' },
                        { label: 'Mood & Neurochemistry', val: 'Cycle-Linked Shifts', color: '#E879F9' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1"
                        >
                          <span className="text-[10px] font-mono text-[#B4A6C7] block">
                            {item.label}
                          </span>
                          <span className="text-xs font-bold text-white block">{item.val}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab.visualType === 'metabolic' && (
                    <motion.div
                      key="metabolic"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full space-y-4"
                    >
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#34D399]">Cellular Insulin Receptor Signaling</span>
                          <span className="text-white">Decreased Uptake</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#34D399] to-[#10B981]"
                            initial={{ width: '0%' }}
                            animate={{ width: '52%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#FB7185]">Circulating Insulin Synergy</span>
                          <span className="text-white">Thecal Stimulation</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-[#FB7185] to-[#E11D48]"
                            initial={{ width: '0%' }}
                            animate={{ width: '84%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Footer Disclaim */}
              <div className="relative z-10 pt-3 border-t border-white/10 text-[11px] font-mono text-[#A797BD] flex items-center justify-between">
                <span>Domain Focus: {activeTab.name}</span>
                <span className="text-white/60">Non-Diagnostic Educational Context</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
