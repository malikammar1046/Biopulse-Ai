import React from 'react';
import {
  User,
  Calendar,
  SmilePlus,
  FileText,
  ScanLine,
  BrainCircuit,
  Sparkles,
  HeartHandshake,
  History,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { HumanSymptomExperienceSection } from './features-sections/HumanSymptomExperienceSection';

export const Features: React.FC = () => {
  const platformFeatures = [
    {
      id: 'profile',
      title: '1. Structured Health Profile',
      subtitle: 'Longitudinal baseline & clinical background',
      icon: User,
      desc: 'Maintains an organized profile of baseline biological metrics, family history of endocrine disorders, and previous clinical consultations.',
      bullets: [
        'Secure capture of age, BMI, and metabolic background',
        'Historical cycle duration baseline initialization',
        'Multi-profile longitudinal data structure',
      ],
      badge: 'Foundation',
    },
    {
      id: 'cycle',
      title: '2. Cycle & Ovulation Tracking',
      subtitle: 'Menstrual calendar and phase visualizer',
      icon: Calendar,
      desc: 'Tracks menstrual onset, duration, variability, and follicular vs. luteal phase progression with intuitive organic visual indicators.',
      bullets: [
        'Cycle length variation calculation',
        'Flow intensity and phase estimation',
        'Historical regularity trends across consecutive months',
      ],
      badge: 'Core Tracking',
    },
    {
      id: 'symptoms',
      title: '3. Multi-Symptom Logger',
      subtitle: 'Endocrine & wellness observation tracking',
      icon: SmilePlus,
      desc: 'Enables daily recording of acne, hirsutism, sleep quality, pelvic comfort, mood, energy levels, and metabolic indicators.',
      bullets: [
        'Standardized 5-point severity grading scale',
        'Symptom clustering alongside cycle phases',
        'Tagging for lifestyle triggers and interventions',
      ],
      badge: 'Core Tracking',
    },
    {
      id: 'reports',
      title: '4. Medical Report Reader',
      subtitle: 'Digitization for laboratory & ultrasound tests',
      icon: FileText,
      desc: 'Upload laboratory documents and imaging reports (LH, FSH, AMH, Free/Total Testosterone, DHEA-S, Prolactin, Fasting Insulin, Pelvic Ultrasound).',
      bullets: [
        'Encrypted image and PDF document repository',
        'Support for multi-page hospital and clinic report formats',
        'Private localized storage architecture',
      ],
      badge: 'Data Intake',
    },
    {
      id: 'ocr',
      title: '5. OCR + User Verification Safeguard',
      subtitle: 'Human-in-the-loop validation interface',
      icon: ScanLine,
      desc: 'Tesseract OCR extracts numerical values and reference units, presenting them in an interactive confirmation screen to eliminate scanning errors.',
      bullets: [
        'Side-by-side original scan vs extracted form',
        'Unit validation (e.g. mIU/mL, pg/mL, nmol/L)',
        'Zero unverified data entry into ML pipeline',
      ],
      badge: 'Verification',
    },
    {
      id: 'assessment',
      title: '6. AI Health Pattern Assessment',
      subtitle: 'Statistical machine learning evaluation',
      icon: BrainCircuit,
      desc: 'Applies validated ensemble classifiers (Random Forest, Gradient Boosting) to compute multidimensional health pattern scores.',
      bullets: [
        'Multivariate analysis of cycle, hormone & morphology data',
        'Probabilistic pattern indexing rather than opaque labels',
        'Benchmarked on standardized academic clinical datasets',
      ],
      badge: 'Intelligence',
    },
    {
      id: 'explainable',
      title: '7. Explainable AI & SHAP Transparency',
      subtitle: 'Feature contribution visualizer',
      icon: Sparkles,
      desc: 'Uses Shapley Additive Explanations (SHAP) to attribute exactly how much each parameter contributed to the pattern assessment.',
      bullets: [
        'Interactive bar charts for positive and negative feature influence',
        'Plain-language medical terminology explanations',
        'Eliminates opaque "black-box" predictions',
      ],
      badge: 'Intelligence',
    },
    {
      id: 'lifestyle',
      title: '8. Localized Lifestyle Support',
      subtitle: 'Evidence-informed nutrition & wellness guidance',
      icon: HeartHandshake,
      desc: 'Provides structured guidance on low-glycemic dietary options, physical activity pacing, sleep hygiene, and stress reduction.',
      bullets: [
        'Nutritional guidance adapted to South Asian & global diets',
        'Physical exercise pacing for insulin sensitivity support',
        'Educational wellness modules without prescriptive medical claims',
      ],
      badge: 'Support',
    },
    {
      id: 'timeline',
      title: '9. Longitudinal Health Timeline',
      subtitle: 'Multi-month trajectory visualization',
      icon: History,
      desc: 'Visualizes historical progression over 3, 6, and 12 months to observe how lifestyle changes or medical interventions affect indicators.',
      bullets: [
        'Interactive charts comparing baseline vs follow-up values',
        'Correlation graphs between cycle regularity and symptom logs',
        'Long-term wellness trajectory analytics',
      ],
      badge: 'Analytics',
    },
    {
      id: 'summary',
      title: '10. Clinician Discussion Summary',
      subtitle: 'Structured report export for doctor visits',
      icon: FileCheck,
      desc: 'Generates clean, professional PDF summaries organizing cycle histories, verified lab values, and symptom trends for clinical consultations.',
      bullets: [
        'One-page clinical summary optimized for physician review',
        'Eliminates lost paper slips and fragmented histories',
        'Facilitates structured, informed collaborative care',
      ],
      badge: 'Clinical Collaboration',
    },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#10071A] text-white">
      {/* 1. Top Cinematic Hero: "IT STARTS WITH SOMETHING YOU FEEL." (5-Stage Living Symptom Journey) */}
      <HumanSymptomExperienceSection />

      {/* 2. Comprehensive 10-Feature Suite Overview */}
      <section className="py-20 sm:py-28 bg-[#180A25] border-t border-white/10 text-white relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/15 rounded-full blur-[160px] pointer-events-none -z-10" />

        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <Badge variant="secondary" size="md" className="bg-white/10 text-[#C084FC] border-white/15">
              Platform Suite
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight">
              The Complete 10-Feature Architecture
            </h2>
            <p className="text-base text-[#B4A6C7] max-w-2xl mx-auto">
              Explore each dedicated capability connecting daily observation, laboratory digitization, explainable AI, and clinician collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {platformFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={feat.id}
                  variant="elevated"
                  hoverEffect
                  className="p-8 sm:p-10 space-y-5 bg-white/[0.04] border-white/15 backdrop-blur-xl flex flex-col justify-between text-white shadow-2xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#FDA4AF] border border-white/15 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#8E3EAF]/30 text-[#FDA4AF] border border-[#8E3EAF]/40 text-[10px] font-mono font-bold uppercase">
                        {feat.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-white font-display">
                        {feat.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#E879F9] mt-0.5 font-mono">
                        {feat.subtitle}
                      </p>
                    </div>

                    <p className="text-sm text-[#EDE4F7] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    {feat.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-xs text-[#EDE4F7]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399] shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>
    </div>
  );
};
