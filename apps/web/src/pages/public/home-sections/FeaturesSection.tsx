import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  BrainCircuit,
  FileText,
  SlidersHorizontal,
  History,
  HeartPulse,
  BookOpen,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const FeaturesSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);

  const features = [
    {
      id: 'assessment',
      title: 'Risk Assessment',
      category: 'Screening Intelligence',
      icon: ShieldCheck,
      summary: 'Pathway-specific screening based on available information.',
      detail: 'Tailored risk evaluation for PCOS, Male Hypogonadism, or general reproductive baseline using progressive tiers.',
      accent: '#6E2D8B',
    },
    {
      id: 'xai',
      title: 'Explainable AI',
      category: 'Transparent Attribution',
      icon: BrainCircuit,
      summary: 'Understand what influenced an assessment.',
      detail: 'Model feature attribution highlights which signals contributed most to your screening context without black boxes.',
      accent: '#4338CA',
    },
    {
      id: 'reports',
      title: 'Health Reports',
      category: 'Clinical Verification',
      icon: FileText,
      summary: 'Upload, extract and verify relevant information.',
      detail: 'Automated OCR extraction for hormonal panels, metabolic labs, and ultrasound reports with human-in-the-loop review.',
      accent: '#0284C7',
    },
    {
      id: 'prioritization',
      title: 'Information Prioritization',
      category: 'Value-of-Information',
      icon: SlidersHorizontal,
      summary: 'Understand what additional information may be useful next.',
      detail: 'Quantifies potential model gain versus estimated laboratory burden so you can have structured discussions with a doctor.',
      accent: '#D97706',
    },
    {
      id: 'tracking',
      title: 'Health Tracking',
      category: 'Continuous Signals',
      icon: History,
      summary: 'Monitor symptoms, measurements and changes.',
      detail: 'Multi-parameter tracking for cycle rhythm, energy, metabolic metrics, sleep quality, and physiological signals over time.',
      accent: '#8E3EAF',
    },
    {
      id: 'lifestyle',
      title: 'Nutrition & Lifestyle',
      category: 'Practical Support',
      icon: HeartPulse,
      summary: 'Receive practical lifestyle support without claiming to cure disease.',
      detail: 'Evidence-informed nutritional patterns, stress mitigation, and physical activity habits tailored to your metabolic profile.',
      accent: '#059669',
    },
    {
      id: 'education',
      title: 'Education',
      category: 'Interactive Literacy',
      icon: BookOpen,
      summary: 'Understand reproductive health in simple language.',
      detail: 'Interactive physiological visualizers covering follicular recruitment, HPT-axis signaling, and hormone interplay.',
      accent: '#E87084',
    },
    {
      id: 'care-circle',
      title: 'Care Circle',
      category: 'Collaborative Sharing',
      icon: Users,
      summary: 'Share appropriate health information with trusted people or healthcare providers.',
      detail: 'Export structured, verifiable clinical summaries formatted specifically for physician consultations and family support.',
      accent: '#4B5563',
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
            Platform Capabilities
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Eight Core Pillars of VITASense AI
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            A unified, non-diagnostic platform engineered to organize, interpret, and track reproductive health signals across diverse physiological journeys.
          </p>
        </div>

        {/* Feature Ecosystem Grid: 4 columns on large screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            const isHovered = activeFeature === idx;
            return (
              <motion.div
                key={feat.id}
                onMouseEnter={() => setActiveFeature(idx)}
                onMouseLeave={() => setActiveFeature(null)}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`p-6 sm:p-7 rounded-3xl transition-all duration-300 border flex flex-col justify-between cursor-pointer ${
                  isHovered
                    ? 'bg-white border-[#6E2D8B] shadow-xl shadow-purple-950/10 ring-1 ring-[#6E2D8B]'
                    : 'bg-white/80 border-[#E7DFEF] hover:bg-white shadow-sm'
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
                    <h3 className="text-lg font-bold font-display text-[#1C1326]">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-[#6E2D8B] font-semibold mt-1">
                      {feat.summary}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
                    {feat.detail}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-[#E7DFEF] flex items-center justify-between text-xs font-bold text-[#6E2D8B]">
                  <span>Pillar 0{idx + 1}</span>
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
