import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle2,
  Calendar,
  FileText,
  ScanLine,
  UserCheck,
  Database,
  BrainCircuit,
  Sparkles,
  HeartPulse,
  History,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'Health Information Intake',
      subtitle: 'Capturing baseline physiological context',
      icon: UserCircle2,
      desc: 'Users register their basic profile, age, BMI, family endocrine history, and relevant historical diagnoses.',
      details: [
        'Secure demographic & clinical background capture',
        'Baseline hormonal & metabolic context',
        'Encrypted local profile establishment',
      ],
      badgeColor: 'primary' as const,
    },
    {
      step: '02',
      title: 'Cycle & Symptom Tracking',
      subtitle: 'Ongoing daily and phase-based observations',
      icon: Calendar,
      desc: 'Continuous logging of menstrual cycle length, bleeding flow, ovulation signs, acne, hirsutism, sleep, and mood fluctuations.',
      details: [
        'Follicular & luteal phase progression',
        'Multi-symptom severity scale logging',
        'Daily pattern timeline integration',
      ],
      badgeColor: 'secondary' as const,
    },
    {
      step: '03',
      title: 'Medical Report Upload',
      subtitle: 'Digitizing laboratory and ultrasound documents',
      icon: FileText,
      desc: 'Users upload photos or PDF scans of blood hormone panels (LH, FSH, AMH, Testosterone) and pelvic ultrasound reports.',
      details: [
        'Supports standard lab formats and camera uploads',
        'Ultrasound follicle count & ovarian volume scans',
        'Encrypted, private document staging',
      ],
      badgeColor: 'info' as const,
    },
    {
      step: '04',
      title: 'Automated OCR Extraction',
      subtitle: 'Document parsing with Tesseract OCR',
      icon: ScanLine,
      desc: 'Computer vision algorithms scan the document text, identify biomarker labels, numerical values, and reference unit ranges.',
      details: [
        'Automated detection of hormone test names',
        'Numeric value and unit resolution',
        'Noise reduction and document preprocessing',
      ],
      badgeColor: 'accent' as const,
    },
    {
      step: '05',
      title: 'Mandatory User Verification',
      subtitle: 'Human-in-the-loop validation safeguard',
      icon: UserCheck,
      desc: 'Users review the extracted values side-by-side with the original scan. Any misread number can be corrected before saving.',
      details: [
        'Side-by-side original image preview',
        'Inline editable form for all extracted values',
        'Guarantees clean, validated data enters the record',
      ],
      badgeColor: 'warning' as const,
    },
    {
      step: '06',
      title: 'Structured Health Record',
      subtitle: 'Centralized multimodal repository',
      icon: Database,
      desc: 'All validated laboratory metrics, cycle chronologies, and symptom histories are unified into a normalized data representation.',
      details: [
        'Harmonized unit conversion (e.g. mIU/mL, ng/dL)',
        'Unified chronological indexing',
        'Privacy-preserving structured schema',
      ],
      badgeColor: 'neutral' as const,
    },
    {
      step: '07',
      title: 'ML Pattern Assessment',
      subtitle: 'Statistical machine learning evaluation',
      icon: BrainCircuit,
      desc: 'Validated algorithms evaluate multivariate interactions between cycle irregularity, androgens, and ovarian morphology.',
      details: [
        'Academic benchmarked ensemble models',
        'Evaluates complex non-linear biomarker interactions',
        'Generates probabilistic health pattern index',
      ],
      badgeColor: 'primary' as const,
    },
    {
      step: '08',
      title: 'Explainable AI & SHAP Insights',
      subtitle: 'Transparent feature contribution analysis',
      icon: Sparkles,
      desc: 'Computes Shapley additive values to clearly visualize which specific indicators drove the pattern assessment.',
      details: [
        'Positive and negative feature impact bars',
        'Clear, plain-language metric explanations',
        'Zero black-box obscurity',
      ],
      badgeColor: 'accent' as const,
    },
    {
      step: '09',
      title: 'Empathetic Lifestyle Support',
      subtitle: 'Evidence-informed supportive guidance',
      icon: HeartPulse,
      desc: 'Provides practical lifestyle, sleep, exercise, and nutritional guidance tailored to individual symptom priorities.',
      details: [
        'Culturally nuanced dietary suggestions',
        'Stress reduction and sleep hygiene guidance',
        'Evidence-backed lifestyle habits',
      ],
      badgeColor: 'success' as const,
    },
    {
      step: '10',
      title: 'Longitudinal Monitoring & Trends',
      subtitle: 'Multi-month trend analysis and physician summaries',
      icon: History,
      desc: 'Tracks biomarker shifts over time, showing how symptom patterns respond across consecutive cycles and lifestyle adjustments.',
      details: [
        'Longitudinal trend lines and graphs',
        'Clinician-ready appointment summary export',
        'Tracks long-term endocrine trajectory',
      ],
      badgeColor: 'info' as const,
    },
    {
      step: '11',
      title: 'Periodic Reassessment Cycle',
      subtitle: 'Dynamic longitudinal loop',
      icon: RefreshCw,
      desc: 'As new lab reports or cycle months are logged, the platform dynamically updates the longitudinal profile.',
      details: [
        'Continuous calibration with fresh data',
        'Long-term historical comparison',
        'Non-diagnostic continuous support',
      ],
      badgeColor: 'primary' as const,
    },
  ];

  return (
    <div className="space-y-20 sm:space-y-28 pb-24">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center">
        <Container size="lg">
          <Badge variant="primary" showDot size="md" className="mb-4">
            Workflow Architecture
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1C1326] font-display tracking-tight mb-6">
            The PMOSense Multimodal Pipeline
          </h1>
          <p className="text-lg sm:text-xl text-[#584B68] max-w-3xl mx-auto leading-relaxed font-sans">
            From initial symptom logging and OCR lab verification to explainable machine learning and longitudinal tracking—explore
            every stage of our 11-step health-information architecture.
          </p>
        </Container>
      </section>

      {/* Interactive Step Navigator */}
      <section>
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step List (Left Column) */}
            <div className="lg:col-span-5 space-y-2 max-h-[700px] overflow-y-auto pr-2">
              {workflowSteps.map((step, idx) => {
                const Icon = step.icon;
                const isSelected = activeStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#6E2D8B] shadow-md shadow-purple-950/5 ring-1 ring-[#6E2D8B]'
                        : 'bg-white/60 border-[#E7DFEF] hover:bg-white hover:border-[#D8B4FE]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-[#6E2D8B] text-white'
                            : 'bg-[#F2ECF7] text-[#584B68]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#8D7E9E] font-mono">
                            STEP {step.step}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1C1326] font-display">
                          {step.title}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-[#6E2D8B]' : 'text-[#8D7E9E]'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Inspect'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step Detail Card (Right Column) */}
            <div className="lg:col-span-7 lg:sticky lg:top-28">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card variant="elevated" className="p-8 sm:p-10 space-y-6">
                    <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] font-mono font-bold text-sm flex items-center justify-center">
                          {workflowSteps[activeStep].step}
                        </span>
                        <div>
                          <Badge variant={workflowSteps[activeStep].badgeColor} size="sm">
                            Phase {Math.floor(activeStep / 3) + 1}
                          </Badge>
                          <h3 className="text-2xl font-bold text-[#1C1326] font-display mt-0.5">
                            {workflowSteps[activeStep].title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-base text-[#584B68] leading-relaxed">
                      {workflowSteps[activeStep].desc}
                    </p>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-[#1C1326]">
                        Technical Specifications & Safeguards:
                      </h4>
                      <ul className="space-y-2 text-sm text-[#584B68]">
                        {workflowSteps[activeStep].details.map((detail, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step Navigation Controls */}
                    <div className="pt-6 border-t border-[#E7DFEF] flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activeStep === 0}
                        onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
                      >
                        Previous Step
                      </Button>

                      <span className="text-xs text-[#8D7E9E] font-medium">
                        {activeStep + 1} of {workflowSteps.length}
                      </span>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={activeStep === workflowSteps.length - 1}
                        onClick={() =>
                          setActiveStep((p) => Math.min(workflowSteps.length - 1, p + 1))
                        }
                      >
                        Next Step
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
