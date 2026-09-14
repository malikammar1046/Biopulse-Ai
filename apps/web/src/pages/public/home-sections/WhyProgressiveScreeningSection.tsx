import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Sliders,
  Heart,
  Activity,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const WhyProgressiveScreeningSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'female' | 'male'>('female');

  const femaleTiers = [
    {
      tierNum: 'Tier 1',
      title: 'Baseline Symptoms & History',
      badge: 'Zero Waiting',
      desc: 'Evaluate menstrual cycle interval irregularities, acne, hirsutism, BMI, and family endocrine history.',
      benefit: 'Immediate baseline assessment without requiring lab work or specialist clinic visits.',
      accent: '#E11D48',
      bg: 'bg-rose-50',
    },
    {
      tierNum: 'Tier 2',
      title: 'Hormonal & Metabolic Labs',
      badge: 'Blood Panels',
      desc: 'Ingest fasting blood glucose, lipid profile, LH, FSH, AMH, DHEA-S, and androgen panels via report verification.',
      benefit: 'Enriches initial symptom models with quantitative endocrine and insulin resistance markers.',
      accent: '#7C3AED',
      bg: 'bg-purple-50',
    },
    {
      tierNum: 'Tier 3',
      title: 'Pelvic Ultrasound Imaging',
      badge: 'Morphology',
      desc: 'Integrate transvaginal or transabdominal pelvic ultrasound reports assessing ovarian volume and antral follicle counts.',
      benefit: 'Offers definitive morphological evidence to evaluate polycystic ovarian morphology (PCOM).',
      accent: '#0891B2',
      bg: 'bg-cyan-50',
    },
  ];

  const maleTiers = [
    {
      tierNum: 'Tier 1',
      title: 'ADAM Score & Vitality Signs',
      badge: 'Baseline Assessment',
      desc: 'Complete the validated Androgen Deficiency in the Aging Male (ADAM) questionnaire, sleep logs, and physical stamina metrics.',
      benefit: 'Establishes initial clinical likelihood of androgen deficiency from everyday symptoms.',
      accent: '#0284C7',
      bg: 'bg-sky-50',
    },
    {
      tierNum: 'Tier 2',
      title: 'Confirmatory Morning Labs',
      badge: 'Clinical Biomarkers',
      desc: 'Ingest morning (8 AM – 10 AM) total testosterone, free testosterone, luteinizing hormone (LH), and prolactin panels.',
      benefit: 'Distinguishes primary vs. secondary hypogonadism and provides objective biochemical confirmation.',
      accent: '#059669',
      bg: 'bg-emerald-50',
    },
  ];

  const currentTiers = activeTab === 'female' ? femaleTiers : maleTiers;

  return (
    <section
      id="why-progressive-screening"
      className="py-24 sm:py-32 bg-gradient-to-b from-transparent via-[#F8FAFC]/50 to-transparent text-[#162A45] border-t border-slate-200/80 relative overflow-hidden select-none"
      aria-labelledby="progressive-title"
    >
      {/* Ambient Lights */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-100/35 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[550px] h-[550px] bg-pink-100/35 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              Progressive Assessment
            </span>
          </div>

          <h2
            id="progressive-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
          >
            Why Progressive Screening{' '}
            <span className="text-[#0891B2]">
              Works Better
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            You do not need every lab test on day one. BioPulse AI evaluates your health in progressive stages, starting with what you already know and guiding you to high-value next steps.
          </p>

          {/* Pathway Switcher for Tiers */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveTab('female')}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold font-sans transition-all cursor-pointer ${
                activeTab === 'female'
                  ? 'bg-[#E11D48] text-white shadow-md shadow-pink-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Female Pathway (3 Tiers)</span>
            </button>
            <button
              onClick={() => setActiveTab('male')}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold font-sans transition-all cursor-pointer ${
                activeTab === 'male'
                  ? 'bg-[#0284C7] text-white shadow-md shadow-sky-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Male Pathway (2 Tiers)</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {currentTiers.map((tier, idx) => (
            <motion.div
              key={tier.tierNum}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.1 }}
              className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between text-left space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono font-extrabold px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: tier.accent }}
                  >
                    {tier.tierNum}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 font-mono">
                    {tier.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold font-display text-[#162A45]">
                  {tier.title}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {tier.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 italic">
                {tier.benefit}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cost-Aware Value of Information Callout Banner */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-amber-50/70 border border-amber-200/80 text-left flex flex-col sm:flex-row items-start gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Sliders className="w-6 h-6 text-amber-700" />
          </div>
          <div className="space-y-2">
            <h4 className="text-base sm:text-lg font-bold font-display text-[#162A45]">
              Cost-Aware Next Steps: Value of Information (VOI)
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
              Not every test delivers the same diagnostic value. BioPulse AI computes potential screening performance improvements against estimated clinical cost and invasiveness. This ensures you only pursue tests that offer meaningful statistical clarity for your doctor discussions.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default WhyProgressiveScreeningSection;
