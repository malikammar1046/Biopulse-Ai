import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, HeartPulse, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const InteractiveBiologySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const biologyDomains = [
    {
      id: 'hormonal',
      title: 'Hormonal Signals',
      subtitle: 'Endocrine Feedback Loop',
      icon: Sparkles,
      color: '#8E3EAF',
      desc: 'Hormonal balance involves delicate feedback between the pituitary gland and ovaries. In polycystic patterns, elevated luteinizing hormone (LH) relative to FSH and increased androgen levels can disrupt the standard follicular timeline.',
      keyPoints: [
        'LH / FSH ratio shifts altering follicular stimulation',
        'Androgen elevation influencing oil glands and hair follicles',
        'Anti-Müllerian Hormone (AMH) reflecting follicular reserve density',
      ],
    },
    {
      id: 'ovarian',
      title: 'Ovarian Function',
      subtitle: 'Follicular Maturation',
      icon: Layers,
      color: '#A21CAF',
      desc: 'Rather than a single dominant follicle maturing each month, multiple smaller follicles may arrest during development, creating the ultrasonic multi-follicular appearance described in the Rotterdam consensus.',
      keyPoints: [
        'Arrested follicular development at 2–9 mm size',
        'Characteristic peripheral "string of pearls" ultrasound appearance',
        'Altered estrogen and progesterone production timing',
      ],
    },
    {
      id: 'cycle',
      title: 'Cycle Patterns',
      subtitle: 'Menstrual Rhythm',
      icon: RefreshCw,
      color: '#FB7185',
      desc: 'Because ovulation timing can be irregular or delayed, menstrual intervals frequently vary between 35 and 90+ days. Tracking phase variations over multiple cycles provides essential longitudinal visibility.',
      keyPoints: [
        'Oligomenorrhea (cycles > 35 days) or anovulation',
        'Prolonged follicular phase duration',
        'Intermittent flow intensity and unpredictable onset',
      ],
    },
    {
      id: 'metabolic',
      title: 'Metabolic Health',
      subtitle: 'Insulin & Energy Dynamics',
      icon: HeartPulse,
      color: '#047857',
      desc: 'Insulin resistance is a frequent metabolic companion to PCOS, prompting compensatory insulin production which can further stimulate ovarian androgen output.',
      keyPoints: [
        'Compensatory hyperinsulinemia impacting ovarian receptors',
        'Carbohydrate sensitivity and energy fluctuations',
        'Response to low-glycemic dietary adjustments and physical activity',
      ],
    },
    {
      id: 'symptoms',
      title: 'Observable Symptoms',
      subtitle: 'Physical Expression',
      icon: Activity,
      color: '#E87084',
      desc: 'Physical signals are the outward manifestations of internal endocrine patterns. Logging acne flare-ups, hirsutism progression, sleep quality, and mood changes creates a coherent multi-signal picture.',
      keyPoints: [
        'Androgen-sensitive acne and skin texture shifts',
        'Hirsutism (excess facial or body hair growth)',
        'Sleep disruptions, fatigue, and mood variability',
      ],
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Interactive Exploration
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Explore the Five Core Biological Domains
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Click each domain to inspect how specific physiological pathways contribute to the overall PMOS/PCOS profile.
          </p>
        </div>

        {/* Interactive Domain Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
          {biologyDomains.map((domain, idx) => {
            const Icon = domain.icon;
            const isSelected = activeTab === idx;
            return (
              <button
                key={domain.id}
                onClick={() => setActiveTab(idx)}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#6E2D8B] shadow-lg shadow-purple-950/10 ring-2 ring-[#6E2D8B]'
                    : 'bg-white/60 border-[#E7DFEF] hover:bg-white hover:border-[#D8B4FE]'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 shadow-sm"
                  style={{ backgroundColor: domain.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8D7E9E] block font-mono">
                    Domain 0{idx + 1}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold font-display text-[#1C1326] mt-0.5">
                    {domain.title}
                  </h4>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Domain Detail Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E7DFEF] shadow-xl space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E7DFEF] pb-4 gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E3EAF] block">
                  {biologyDomains[activeTab].subtitle}
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-[#1C1326]">
                  {biologyDomains[activeTab].title}
                </h3>
              </div>
              <Badge variant="primary" size="sm">
                Domain 0{activeTab + 1}
              </Badge>
            </div>

            <p className="text-sm sm:text-base text-[#584B68] leading-relaxed">
              {biologyDomains[activeTab].desc}
            </p>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1326]">
                Key Biological Considerations:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {biologyDomains[activeTab].keyPoints.map((point, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3.5 rounded-xl bg-[#F8F5FA] border border-[#E7DFEF] text-xs font-medium text-[#1C1326] flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
};
