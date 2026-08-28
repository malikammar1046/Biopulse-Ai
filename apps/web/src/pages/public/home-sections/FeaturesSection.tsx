import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Activity,
  FileText,
  BrainCircuit,
  HeartPulse,
  History,
  ChevronRight,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const FeaturesSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      id: 'cycle',
      title: 'Cycle & Ovulation Tracking',
      category: 'Biological Dynamics',
      icon: Calendar,
      summary: 'Follicular & luteal phase progression with cycle regularity indicators.',
      detail: 'Monitors menstrual onset, length variation, and ovulation estimations across consecutive cycles.',
      accent: '#8E3EAF',
    },
    {
      id: 'symptoms',
      title: 'Multivariate Symptom Logger',
      category: 'Endocrine Signals',
      icon: Activity,
      summary: '5-point standardized grading for acne, hirsutism, mood, and sleep.',
      detail: 'Maps symptom flares against menstrual phases to identify individual hormonal patterns.',
      accent: '#E87084',
    },
    {
      id: 'reports',
      title: 'OCR Medical Report Reader',
      category: 'Clinical Verification',
      icon: FileText,
      summary: 'Automated hormone panel and ultrasound document extraction.',
      detail: 'Scans LH, FSH, AMH, Testosterone, and pelvic follicles with human-in-the-loop validation.',
      accent: '#6E2D8B',
    },
    {
      id: 'assessment',
      title: 'AI Pattern Assessment',
      category: 'Machine Learning',
      icon: BrainCircuit,
      summary: 'Multidimensional evaluation using academic ensemble models.',
      detail: 'Calculates health pattern indices without opaque black boxes, fully explained via SHAP.',
      accent: '#4338CA',
    },
    {
      id: 'lifestyle',
      title: 'Localized Lifestyle Support',
      category: 'Empathetic Guidance',
      icon: HeartPulse,
      summary: 'Evidence-informed nutrition and movement adapted to regional diets.',
      detail: 'Nutritional strategies for South Asian meals (roti, daal, chai) and stress reduction habits.',
      accent: '#047857',
    },
    {
      id: 'timeline',
      title: 'Longitudinal Health Timeline',
      category: 'Continuous Tracking',
      icon: History,
      summary: 'Multi-month trend trajectory graphs and clinician summary export.',
      detail: 'Visualizes biomarker changes over 3, 6, and 12 months for collaborative doctor appointments.',
      accent: '#A21CAF',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      {/* Soft Ambient Glows */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[#EDE4F7] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#FFF0F2] rounded-full blur-[120px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Platform Ecosystem
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Six Core Pillars of PMOSense
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            A comprehensive, interconnected ecosystem designed to capture, organize, and interpret polycystic ovarian patterns.
          </p>
        </div>

        {/* Feature Ecosystem Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            const isHovered = activeFeature === idx;
            return (
              <motion.div
                key={feat.id}
                onMouseEnter={() => setActiveFeature(idx)}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`p-8 rounded-3xl transition-all duration-300 border flex flex-col justify-between cursor-pointer ${
                  isHovered
                    ? 'bg-white border-[#8E3EAF] shadow-xl shadow-purple-950/10 ring-1 ring-[#8E3EAF]'
                    : 'bg-white/70 border-[#E7DFEF] hover:bg-white shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-purple-950/10"
                      style={{ backgroundColor: feat.accent }}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D7E9E]">
                      {feat.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-display text-[#1C1326]">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#8E3EAF] font-semibold mt-0.5">
                      {feat.summary}
                    </p>
                  </div>

                  <p className="text-sm text-[#584B68] leading-relaxed">
                    {feat.detail}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-[#E7DFEF] flex items-center justify-between text-xs font-bold text-[#6E2D8B]">
                  <span>Pillar {idx + 1} of 6</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
