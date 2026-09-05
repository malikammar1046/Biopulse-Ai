import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Layers,
  FileText,
  ScanLine,
  TrendingUp,
  History,
  BookOpen,
  HeartHandshake,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { HumanSymptomExperienceSection } from './features-sections/HumanSymptomExperienceSection';

export const Features: React.FC = () => {
  const platformFeatures = [
    {
      id: 'risk-assessment',
      title: '1. Pathway-Specific Risk Assessment',
      subtitle: 'Multimodal screening adapted to your health journey',
      icon: ShieldCheck,
      desc: 'Evaluates your symptoms, measurements, and verified lab results across dedicated pathways: Women’s Health (PCOS), Men’s Health (Male Hypogonadism), or Baseline Monitoring.',
      bullets: [
        'Dedicated screening algorithms for PCOS and Male Hypogonadism',
        'Baseline monitoring for users without a suspected disease',
        'Strictly educational decision-support — never an automated diagnosis',
      ],
      badge: 'Screening',
    },
    {
      id: 'explainable-ai',
      title: '2. Explainable AI (XAI)',
      subtitle: 'Understand which features influenced your assessment',
      icon: Sparkles,
      desc: 'No black boxes. Using mathematical SHAP feature attribution, VITASense shows which specific biomarkers and reported symptoms had the greatest influence on the model’s evaluation.',
      bullets: [
        'Visual attribution bars showing relative factor influence',
        'Clear explanations connecting your inputs to the pattern score',
        'Clinical humility: identifies statistical association, never causality',
      ],
      badge: 'Intelligence',
    },
    {
      id: 'four-tier-model',
      title: '3. Progressive Four-Tier Model',
      subtitle: 'Start with what you know today; add data over time',
      icon: Layers,
      desc: 'You don’t need an expensive panel of blood tests to get started. Begin at Tier 1 with accessible symptoms, then add Tier 2 routine labs, Tier 3 hormones, and Tier 4 clinical summaries as available.',
      bullets: [
        'Tier 1: Symptoms, body measurements, history, and lifestyle',
        'Tier 2 & 3: Routine metabolic panels and pathway-specific hormones',
        'Tier 4 is never mandatory and does not equate to clinical diagnosis',
      ],
      badge: 'Architecture',
    },
    {
      id: 'reports-ocr',
      title: '4. Reports & Laboratory Ingestion',
      subtitle: 'Standardized OCR parsing from photos and PDFs',
      icon: FileText,
      desc: 'Upload laboratory blood tests and structured report summaries. Optical Character Recognition identifies quantitative analyte names, numbers, and reference units automatically.',
      bullets: [
        'Supports standard laboratory PDFs and mobile camera snapshots',
        'Recognizes formats from major diagnostic centers and local laboratories',
        'Eliminates tedious manual typing of dozens of hormone numbers',
      ],
      badge: 'Data Intake',
    },
    {
      id: 'verification',
      title: '5. Human-in-the-Loop Verification',
      subtitle: 'You inspect and approve every number before saving',
      icon: ScanLine,
      desc: 'OCR output is never automatically saved as truth. You review parsed numbers side-by-side with your paper slip and confirm draw timing (such as morning testosterone windows).',
      bullets: [
        'Side-by-side review: original paper report next to extracted fields',
        'One-tap correction for low-contrast printouts or smudged paper',
        'Zero unverified data is ever admitted into your screening profile',
      ],
      badge: 'Verification',
    },
    {
      id: 'information-prioritization',
      title: '6. Information Prioritization',
      subtitle: 'Targeted clarity: estimated improvement vs estimated cost',
      icon: TrendingUp,
      desc: 'Not all additional tests provide the same clinical value. VITASense highlights which missing markers could provide the greatest estimated performance improvement relative to estimated burden.',
      bullets: [
        'Highlights high-gain vs redundant laboratory investigations',
        'Intended to support informed discussion with your healthcare team',
        'Never prescribes tests or mandates unnecessary medical expenses',
      ],
      badge: 'Research Differentiator',
    },
    {
      id: 'health-tracking',
      title: '7. Longitudinal Health Tracking',
      subtitle: 'Track symptoms, measurements, and habits over time',
      icon: History,
      desc: 'Chronic endocrine conditions are dynamic. Record cycle intervals, vitality scores, fatigue patterns, sleep quality, and lifestyle consistency across consecutive months.',
      bullets: [
        'Symptom journal with 5-point non-judgmental severity ratings',
        'Track cycle regularity (women) or vitality and sleep trends (men)',
        'Observe how daily habits correlate with biological wellbeing',
      ],
      badge: 'Tracking',
    },
    {
      id: 'education',
      title: '8. Supportive Disease Education',
      subtitle: 'Clear, patient-friendly learning for PCOS and Hypogonadism',
      icon: BookOpen,
      desc: 'Demystify reproductive biology without overwhelming medical jargon. Explore ovarian follicular development, the hypothalamic-pituitary-gonadal (HPG) axis, and hormone signaling.',
      bullets: [
        'Patient-friendly interactive anatomical and physiological guides',
        'Bust common misconceptions around reproductive health',
        'Understand what specific lab markers mean in plain everyday language',
      ],
      badge: 'Education',
    },
    {
      id: 'lifestyle-support',
      title: '9. Nutrition & Lifestyle Guidance',
      subtitle: 'Context-aware routines designed for real daily life',
      icon: HeartHandshake,
      desc: 'Practical, evidence-informed dietary pacing and physical movement routines adapted to everyday regional foods. Supportive habit guidance without restrictive diets or curative claims.',
      bullets: [
        'Gentle nutrition sequencing with whole grains, proteins, and lentils',
        'Paced walking and low-equipment resistance movement routines',
        'Sleep and stress modulation supporting circadian endocrine balance',
      ],
      badge: 'Support',
    },
    {
      id: 'care-circle',
      title: '10. Care Circle & Clinician Summaries',
      subtitle: 'Share selectively with trusted partners and doctors',
      icon: Users,
      desc: 'Reproductive health can feel isolating. Choose to share permitted lifestyle updates with loved ones, or export a consolidated, multi-month summary for your next 15-minute doctor visit.',
      bullets: [
        '100% user-controlled, granular, and revocable sharing permissions',
        'Structured clinician briefs summarizing longitudinal trends and labs',
        'No doctor, partner, or contact sees anything without explicit consent',
      ],
      badge: 'Collaboration',
    },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#10071A] text-white">
      {/* 1. Top Cinematic Hero: The Living Symptom Journey */}
      <HumanSymptomExperienceSection />

      {/* 2. Comprehensive 10-Feature Suite Overview */}
      <section className="py-20 sm:py-28 bg-[#180A25] border-t border-white/10 text-white relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#6E2D8B]/15 rounded-full blur-[160px] pointer-events-none -z-10" />

        <Container size="xl">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <Badge variant="secondary" size="md" className="bg-white/10 text-[#C084FC] border-white/15">
              Platform Capabilities
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight">
              The Complete 10-Feature Architecture
            </h2>
            <p className="text-base text-[#B4A6C7] max-w-2xl mx-auto font-sans">
              Explore each dedicated capability connecting daily observation, laboratory digitization, explainable AI, information prioritization, and clinician collaboration.
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
