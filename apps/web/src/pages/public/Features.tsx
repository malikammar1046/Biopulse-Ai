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
    <div className="space-y-16 sm:space-y-24 pb-24">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center">
        <Container size="lg">
          <Badge variant="primary" showDot size="md" className="mb-4">
            Platform Capabilities
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1C1326] font-display tracking-tight mb-6">
            Comprehensive Platform Features
          </h1>
          <p className="text-lg sm:text-xl text-[#584B68] max-w-3xl mx-auto leading-relaxed font-sans">
            Every feature in PMOSense is engineered to promote clinical transparency, data accuracy,
            and longitudinal clarity for individuals and their healthcare providers.
          </p>
        </Container>
      </section>

      {/* Human-Centered Period Cramp Experience: "Patterns matter." */}
      <HumanSymptomExperienceSection />

      {/* Feature Capabilities Grid */}
      <section>
        <Container size="xl">
          <div className="max-w-2xl mx-auto text-center mb-12 space-y-3">
            <Badge variant="secondary" size="sm">
              Architecture Overview
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1C1326] font-display">
              The Complete 10-Feature Suite
            </h2>
            <p className="text-sm text-[#584B68]">
              Explore the individual capabilities connecting daily observation to clinical discussion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {platformFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <Card
                  key={feat.id}
                  variant="standard"
                  hoverEffect
                  className="p-8 sm:p-10 space-y-5 border-[#E7DFEF] flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="primary" size="sm">
                        {feat.badge}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold text-[#1C1326] font-display">
                        {feat.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#8E3EAF] mt-0.5">
                        {feat.subtitle}
                      </p>
                    </div>

                    <p className="text-sm text-[#584B68] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E7DFEF] space-y-2">
                    {feat.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2 text-xs text-[#1C1326]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#047857] shrink-0 mt-0.5" />
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
