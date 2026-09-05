import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const ExplainableAISection: React.FC = () => {
  const [activePathway, setActivePathway] = useState<'women' | 'men'>('women');
  const [selectedFactor, setSelectedFactor] = useState(0);

  const pathwaysData = {
    women: {
      pathwayName: "Women's Health (PCOS Screening)",
      factors: [
        {
          name: 'LH / FSH Hormone Ratio (2.35)',
          impact: '+0.36',
          percentage: '84%',
          positive: true,
          color: '#8E3EAF',
          explanation: 'Relative elevation of LH compared to FSH is a recognized hormonal signal frequently observed in cycle irregularities.',
        },
        {
          name: 'Cycle Irregularity (>38 days)',
          impact: '+0.28',
          percentage: '68%',
          positive: true,
          color: '#E87084',
          explanation: 'Extended inter-menstrual intervals suggest delayed or infrequent ovulatory rhythm.',
        },
        {
          name: 'Reported Androgenic Symptoms (Acne/Hirsutism)',
          impact: '+0.21',
          percentage: '52%',
          positive: true,
          color: '#C084FC',
          explanation: 'Standardized self-reported cutaneous markers contribute contextual weight to the screening pattern.',
        },
        {
          name: 'Normal Fasting Glucose & BMI (21.8)',
          impact: '-0.16',
          percentage: '38%',
          positive: false,
          color: '#34D399',
          explanation: 'Preserved metabolic parameters provide protective balancing influence in the multi-variable model.',
        },
      ],
    },
    men: {
      pathwayName: "Men's Health (Male Hypogonadism Screening)",
      factors: [
        {
          name: 'Morning Serum Total Testosterone (240 ng/dL)',
          impact: '+0.39',
          percentage: '88%',
          positive: true,
          color: '#0284C7',
          explanation: 'Standardized morning test result falls below typical physiological baseline for adult males.',
        },
        {
          name: 'Persistent Unexplained Daytime Fatigue',
          impact: '+0.24',
          percentage: '60%',
          positive: true,
          color: '#38BDF8',
          explanation: 'Validated self-reported vitality decrease correlates with endocrine assessment models.',
        },
        {
          name: 'Reported Changes in Libido / Sexual Function',
          impact: '+0.22',
          percentage: '55%',
          positive: true,
          color: '#818CF8',
          explanation: 'Key subjective symptom that holds substantial weight in validated hypogonadism screening tools (ADAM/AMS).',
        },
        {
          name: 'Normal Serum Prolactin & Thyroid Panel',
          impact: '-0.14',
          percentage: '34%',
          positive: false,
          color: '#34D399',
          explanation: 'Euthyroid status and normal prolactin reduce probability of secondary pituitary adenoma confounding.',
        },
      ],
    },
  };

  const currentData = pathwaysData[activePathway];
  const factors = currentData.factors;

  return (
    <section className="relative py-24 sm:py-32 bg-[#10071A] text-white overflow-hidden">
      {/* High-Contrast Orchid / Berry Lighting */}
      <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-[#6E2D8B]/20 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Context & Philosophy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#E879F9]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI That Explains</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight">
              AI shouldn't be a{' '}
              <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
                black box.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#B4A6C7] leading-relaxed font-sans font-normal">
              VITASense AI is engineered to help you understand what information contributed to an assessment, which signals appear more influential, and what data gaps exist.
            </p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-[#E2D8EB] leading-relaxed">
              <strong className="text-white block mb-1 text-sm">Approved Interpretative Standard:</strong>
              &ldquo;These features had the greatest influence on the model&apos;s assessment.&rdquo; We never claim that AI identified what caused your condition or delivers a clinical diagnosis.
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#EDE4F7]">
                  <strong className="text-white block mb-0.5">Transparent Signal Attribution:</strong>
                  See visual impact scores showing how each lab value or symptom contributed to your risk pattern.
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-[#34D399] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-[#EDE4F7]">
                  <strong className="text-white block mb-0.5">Doctor-Ready Discussions:</strong>
                  Provides objective, structured talking points to review collaboratively with your physician.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive SHAP Feature Contribution Card */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl space-y-6">
              {/* Pathway Switcher */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#C084FC] block">
                    Feature Influence Model
                  </span>
                  <h3 className="text-lg font-bold font-display text-white">
                    Sample Attribution Breakdown
                  </h3>
                </div>
                <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setActivePathway('women');
                      setSelectedFactor(0);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activePathway === 'women'
                        ? 'bg-[#8E3EAF] text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Women
                  </button>
                  <button
                    onClick={() => {
                      setActivePathway('men');
                      setSelectedFactor(0);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activePathway === 'men'
                        ? 'bg-[#0284C7] text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Men
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#B4A6C7] flex items-center justify-between">
                <span>Pathway: <strong className="text-white">{currentData.pathwayName}</strong></span>
                <Badge variant="primary" size="sm">
                  Transparency
                </Badge>
              </div>

              {/* Glowing Impact Bars */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePathway}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  {factors.map((factor, idx) => {
                    const isSelected = selectedFactor === idx;
                    return (
                      <button
                        key={factor.name}
                        onClick={() => setSelectedFactor(idx)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/15 border-white/30 shadow-lg ring-1 ring-white/40'
                            : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs mb-2 font-medium">
                          <span className="text-white font-semibold">{factor.name}</span>
                          <span
                            className={`font-mono font-bold ${
                              factor.positive ? 'text-[#FB7185]' : 'text-[#34D399]'
                            }`}
                          >
                            {factor.impact}
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: factor.percentage }}
                            transition={{ duration: 0.6, delay: idx * 0.08 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: factor.color }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </AnimatePresence>

              {/* "Why This Matters" Context Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#EDE4F7] space-y-1">
                <div className="flex items-center gap-1.5 text-[#E879F9] font-bold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Influence Explanation:</span>
                </div>
                <p className="leading-relaxed text-[#D1C5DE]">
                  {factors[selectedFactor]?.explanation}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A798BC]">
                <span>These features had the greatest influence on the model&apos;s assessment.</span>
                <span className="inline-flex items-center gap-1 text-[#E879F9] font-semibold">
                  Non-diagnostic <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
