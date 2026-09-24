import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

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
          color: '#E11D48',
          explanation: 'Relative elevation of LH compared to FSH is a recognized hormonal signal frequently observed in cycle irregularities.',
        },
        {
          name: 'Cycle Irregularity (>38 days)',
          impact: '+0.28',
          percentage: '68%',
          positive: true,
          color: '#F43F5E',
          explanation: 'Extended inter-menstrual intervals suggest delayed or infrequent ovulatory rhythm.',
        },
        {
          name: 'Reported Androgenic Symptoms (Acne/Hirsutism)',
          impact: '+0.21',
          percentage: '52%',
          positive: true,
          color: '#0891B2',
          explanation: 'Standardized self-reported cutaneous markers contribute contextual weight to the screening pattern.',
        },
        {
          name: 'Normal Fasting Glucose & BMI (21.8)',
          impact: '-0.16',
          percentage: '38%',
          positive: false,
          color: '#059669',
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
          color: '#0EA5E9',
          explanation: 'Validated self-reported vitality decrease correlates with endocrine assessment models.',
        },
        {
          name: 'Reported Changes in Libido / Sexual Function',
          impact: '+0.22',
          percentage: '55%',
          positive: true,
          color: '#0891B2',
          explanation: 'Key subjective symptom that holds substantial weight in validated hypogonadism screening tools (ADAM/AMS).',
        },
        {
          name: 'Normal Serum Prolactin & Thyroid Panel',
          impact: '-0.14',
          percentage: '34%',
          positive: false,
          color: '#059669',
          explanation: 'Euthyroid status and normal prolactin reduce probability of secondary pituitary adenoma confounding.',
        },
      ],
    },
  };

  const currentData = pathwaysData[activePathway];
  const factors = currentData.factors;

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-transparent via-white/50 to-transparent text-[#162A45] border-t border-slate-200/80 overflow-hidden select-none">
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-pink-100/35 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-cyan-100/35 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Editorial Context & Philosophy */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI That Explains</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
              AI shouldn't be a{' '}
              <span className="text-[#0891B2]">
                black box.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans font-normal">
              BioPulse AI is engineered to help you understand what information contributed to an assessment, which signals appear more influential, and what data gaps exist.
            </p>

            <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-[#162A45] block mb-1 text-sm">Approved Interpretative Standard:</strong>
              &ldquo;These features had the greatest influence on the model&apos;s assessment.&rdquo; We never claim that AI identified what caused your condition or delivers a clinical diagnosis.
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-[#162A45] block mb-0.5">Transparent Signal Attribution:</strong>
                  See visual impact scores showing how each lab value or symptom contributed to your risk pattern.
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-[#162A45] block mb-0.5">Doctor-Ready Discussions:</strong>
                  Provides objective, structured talking points to review collaboratively with your physician.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive SHAP Feature Contribution Card */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-6 text-left">
              {/* Pathway Switcher */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#0891B2] block">
                    Feature Influence Model
                  </span>
                  <h3 className="text-lg font-bold font-display text-[#162A45]">
                    Sample Attribution Breakdown
                  </h3>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    onClick={() => {
                      setActivePathway('women');
                      setSelectedFactor(0);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activePathway === 'women'
                        ? 'bg-[#E11D48] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                        ? 'bg-[#0284C7] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Men
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Pathway: <strong className="text-[#162A45]">{currentData.pathwayName}</strong></span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-[#0891B2]">
                  Transparency
                </span>
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
                            ? 'bg-slate-50 border-[#0891B2] shadow-sm ring-1 ring-cyan-100'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs mb-2 font-medium">
                          <span className="text-[#162A45] font-semibold">{factor.name}</span>
                          <span
                            className={`font-mono font-bold ${
                              factor.positive ? 'text-[#E11D48]' : 'text-emerald-600'
                            }`}
                          >
                            {factor.impact}
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
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
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 text-[#0891B2] font-bold">
                  <Info className="w-3.5 h-3.5" />
                  <span>Influence Explanation:</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  {factors[selectedFactor]?.explanation}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>These features had the greatest influence on the model&apos;s assessment.</span>
                <span className="inline-flex items-center gap-1 text-[#0891B2] font-semibold">
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
