import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle2,
  Calendar,
  FileText,
  ScanLine,
  UserCheck,
  BrainCircuit,
  History,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const HowItWorksSection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Build your health profile',
      subtitle: 'Demographic baseline & endocrine history',
      icon: UserCircle2,
      desc: 'Establish your personalized baseline including age, BMI, family endocrine context, and historical consultations in a private record.',
    },
    {
      num: '02',
      title: 'Record cycle and symptoms',
      subtitle: 'Daily & phase-based tracking',
      icon: Calendar,
      desc: 'Log menstrual phase shifts, flow levels, acne, hirsutism, mood, and sleep fluctuations with standardized severity indicators.',
    },
    {
      num: '03',
      title: 'Upload medical reports',
      subtitle: 'Hormone blood panels & pelvic scans',
      icon: FileText,
      desc: 'Upload laboratory documents and ultrasound reports. Computer vision scans documents and prepares extracted fields.',
    },
    {
      num: '04',
      title: 'Verify extracted information',
      subtitle: 'Mandatory human-in-the-loop validation',
      icon: UserCheck,
      desc: 'Review OCR-extracted biomarkers (LH, FSH, AMH, Testosterone) side-by-side with original scans prior to saving into the record.',
      isVerificationCard: true,
    },
    {
      num: '05',
      title: 'Explore AI-assisted assessment',
      subtitle: 'Explainable machine learning patterns',
      icon: BrainCircuit,
      desc: 'Validated algorithms evaluate multivariate interactions and output transparent SHAP-explained biomarker importance distributions.',
    },
    {
      num: '06',
      title: 'Monitor changes over time',
      subtitle: 'Longitudinal timeline & doctor summaries',
      icon: History,
      desc: 'Track long-term trajectories across consecutive months and generate structured appointment summaries for informed clinician dialogue.',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#EDE4F7] text-[#1C1326] overflow-hidden">
      {/* Soft Ambient Biological Glows */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[#D8B4FE]/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Biological Pathway
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            How OVASense Works
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            A seamless, verified journey from daily symptom tracking to transparent machine learning and longitudinal monitoring.
          </p>
        </div>

        {/* Interactive Step Navigator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Step Selectors (Left 5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = currentStep === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-white text-[#1C1326] border-[#6E2D8B] shadow-xl shadow-purple-950/10 ring-2 ring-[#6E2D8B]'
                      : 'bg-white/70 text-[#584B68] border-[#E7DFEF] hover:bg-white hover:border-[#D8B4FE]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-[#6E2D8B] text-white' : 'bg-[#EDE4F7] text-[#6E2D8B]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${
                          isSelected ? 'text-[#8E3EAF]' : 'text-[#8D7E9E]'
                        }`}
                      >
                        STEP {step.num}
                      </span>
                      <h4 className="text-sm font-bold font-display">{step.title}</h4>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-[#6E2D8B] translate-x-1' : 'text-[#8D7E9E]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Central Interactive Visualization Card (Right 7 cols) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl bg-white text-[#1C1326] p-8 sm:p-10 shadow-2xl border border-[#E7DFEF] space-y-6"
              >
                <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] font-mono font-bold text-sm flex items-center justify-center">
                      {steps[currentStep].num}
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#8E3EAF]">
                        Platform Workflow
                      </span>
                      <h3 className="text-2xl font-bold font-display text-[#1C1326]">
                        {steps[currentStep].title}
                      </h3>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">
                    {steps[currentStep].subtitle}
                  </Badge>
                </div>

                <p className="text-sm sm:text-base text-[#584B68] leading-relaxed">
                  {steps[currentStep].desc}
                </p>

                {/* Specific Animated Medical Document & OCR Verification Preview for Step 4 */}
                {steps[currentStep].isVerificationCard ? (
                  <div className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-4 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-2">
                      <div className="flex items-center gap-2 text-[#1C1326] font-sans font-bold text-xs">
                        <ScanLine className="w-4 h-4 text-[#6E2D8B]" />
                        <span>Tesseract OCR Extraction Output</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#047857] text-[10px] font-bold">
                        Information Extracted
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-sans">
                      <div className="p-3 rounded-xl bg-white border border-[#E7DFEF]">
                        <span className="text-[11px] text-[#8D7E9E] block">Total Testosterone</span>
                        <span className="text-sm font-bold text-[#1C1326]">2.4 nmol/L</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[#E7DFEF]">
                        <span className="text-[11px] text-[#8D7E9E] block">Luteinizing Hormone (LH)</span>
                        <span className="text-sm font-bold text-[#1C1326]">8.2 mIU/mL</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[#E7DFEF]">
                        <span className="text-[11px] text-[#8D7E9E] block">FSH Level</span>
                        <span className="text-sm font-bold text-[#1C1326]">5.1 mIU/mL</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white border border-[#E7DFEF]">
                        <span className="text-[11px] text-[#8D7E9E] block">LH / FSH Ratio</span>
                        <span className="text-sm font-bold text-[#6E2D8B]">1.61 (Calculated)</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#EDE4F7] border border-[#D8B4FE]/60 flex items-center justify-between text-xs text-[#6E2D8B] font-sans">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4" />
                        <span className="font-bold">Human-in-the-loop: Review before saving</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white text-[#6E2D8B] font-semibold text-[10px]">
                        Verified by User
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-xs text-[#584B68] space-y-0.5">
                      <strong className="text-[#1C1326] block">Non-Diagnostic Safety Assurance</strong>
                      Data is processed to highlight longitudinal trends and prepare clinician summaries without issuing prescriptive treatments.
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
};
