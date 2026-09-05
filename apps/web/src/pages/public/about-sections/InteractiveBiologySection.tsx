import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, HeartPulse, Moon, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const InteractiveBiologySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const biologyDomains = [
    {
      id: 'womens-endocrine',
      title: "Women's Endocrine System",
      subtitle: 'Ovarian & Cycle Signaling',
      icon: Sparkles,
      color: '#FB7185',
      desc: 'Ovarian function relies on delicate feedback between the pituitary gland and ovaries. In polycystic patterns (PCOS), altered LH to FSH secretion ratios and elevated androgens can disrupt follicular maturation and cycle regularity.',
      keyPoints: [
        'LH / FSH ratio shifts altering follicular stimulation',
        'Androgen levels influencing sebaceous glands and hair follicles',
        'Anti-Müllerian Hormone (AMH) reflecting antral follicle density',
      ],
    },
    {
      id: 'mens-endocrine',
      title: "Men's Endocrine System",
      subtitle: 'Testicular & Testosterone Signaling',
      icon: Activity,
      color: '#60A5FA',
      desc: 'Testosterone production in testicular Leydig cells is driven by pituitary LH and FSH pulses under hypothalamic control. Male hypogonadism occurs when this signaling or response drops below physiological thresholds.',
      keyPoints: [
        'Morning diurnal peak: serum testosterone highest between 7:00–10:00 AM',
        'Pituitary gonadotropins (LH/FSH) distinguishing primary vs secondary etiologies',
        'Free versus total testosterone modulated by sex hormone-binding globulin (SHBG)',
      ],
    },
    {
      id: 'metabolic',
      title: 'Metabolic Foundations',
      subtitle: 'Insulin & Energy Homeostasis',
      icon: HeartPulse,
      color: '#34D399',
      desc: 'Metabolic health is deeply intertwined with reproductive hormones. Insulin resistance and glycemic swings stimulate excess androgen production in women and suppress gonadotropin release in men.',
      keyPoints: [
        'Compensatory hyperinsulinemia altering sex hormone binding',
        'Visceral adiposity and lipid profile variations across both sexes',
        'Fasting glucose and HbA1c indicators reflecting metabolic resilience',
      ],
    },
    {
      id: 'circadian',
      title: 'Sleep & Circadian Rhythm',
      subtitle: 'Nocturnal Hormone Regulation',
      icon: Moon,
      color: '#818CF8',
      desc: 'Hormones follow strict biological clocks. Disruptions in sleep architecture, high evening cortisol, and shift work interrupt nocturnal LH pulsatility and degrade daytime vitality.',
      keyPoints: [
        'Overnight sleep architecture essential for testosterone and LH peaks',
        'HPA-axis stress modulation balancing adrenal cortisol',
        'Restorative sleep consistency supporting neuroendocrine health',
      ],
    },
    {
      id: 'longitudinal',
      title: 'Longitudinal Patterns',
      subtitle: 'Dynamic Multi-Signal Trajectory',
      icon: RefreshCw,
      color: '#C084FC',
      desc: 'Reproductive health is rarely static. Logging physical signals, repeat blood panels, and lifestyle modifications over 3 to 12 months reveals genuine trends that single-point assessments miss.',
      keyPoints: [
        'Multi-month tracking of cycle intervals, vitality, and symptom severity',
        'Progressive data tiering updating the assessment as new labs arrive',
        'Structured, objective summaries ready for collaborative doctor visits',
      ],
    },
  ];

  const currentDomain = biologyDomains[activeTab];
  const Icon = currentDomain.icon;

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden border-t border-white/10">
      {/* Background Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Interactive Physiology
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
            Explore the core physiological domains
          </h2>

          <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans max-w-2xl mx-auto">
            Click each domain to inspect how hormonal feedback loops, metabolic foundations, and lifestyle factors interact in reproductive health.
          </p>
        </div>

        {/* Tab Stepper Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12 max-w-4xl mx-auto">
          {biologyDomains.map((domain, idx) => {
            const isSelected = activeTab === idx;
            const DomainIcon = domain.icon;
            return (
              <button
                key={domain.id}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold font-sans transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-brand text-white shadow-lg shadow-purple-950/40 ring-2 ring-[#FDA4AF]'
                    : 'bg-white/5 text-[#B4A6C7] hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <DomainIcon className="w-4 h-4" style={{ color: domain.color }} />
                <span>{domain.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Domain Card */}
        <div className="max-w-4xl mx-auto p-8 sm:p-12 rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-xl shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDomain.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                    style={{ backgroundColor: `${currentDomain.color}30`, border: `1px solid ${currentDomain.color}50` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: currentDomain.color }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                      {currentDomain.subtitle}
                    </span>
                    <h3 className="text-2xl font-bold font-display text-white">
                      {currentDomain.title}
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-bold text-[#EDE4F7] self-start sm:self-center">
                  Domain 0{activeTab + 1} of 05
                </span>
              </div>

              <p className="text-sm sm:text-base text-[#EDE4F7] leading-relaxed font-sans">
                {currentDomain.desc}
              </p>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FDA4AF] block">
                  Key Physiological Factors Tracked:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentDomain.keyPoints.map((point, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs text-[#B4A6C7] leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </section>
  );
};
