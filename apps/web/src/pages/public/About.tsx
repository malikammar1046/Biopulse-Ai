import React from 'react';
import {
  HeartHandshake,
  Target,
  Microscope,
  ShieldCheck,
  BrainCircuit,
  BookOpen,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const About: React.FC = () => {
  return (
    <div className="space-y-20 sm:space-y-28 pb-24">
      {/* Hero Header */}
      <section className="pt-6 sm:pt-12 text-center">
        <Container size="lg">
          <Badge variant="primary" showDot size="md" className="mb-4">
            About PMOSense
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1C1326] font-display tracking-tight mb-6">
            Advancing Women's Health Through Multimodal AI & Clinical Transparency
          </h1>
          <p className="text-lg sm:text-xl text-[#584B68] max-w-3xl mx-auto leading-relaxed font-sans">
            PMOSense is an academic research initiative and digital health platform designed to transform
            how individuals with Polycystic Ovary Syndrome monitor longitudinal health trends and communicate with healthcare providers.
          </p>
        </Container>
      </section>

      {/* Mission & Problem Statement */}
      <section>
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card variant="gradient" className="p-8 sm:p-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1C1326] font-display">
                Our Core Mission
              </h2>
              <p className="text-sm sm:text-base text-[#584B68] leading-relaxed">
                To eliminate the fragmentation and opacity in chronic endocrine and reproductive health monitoring
                by giving individuals a centralized, intelligent, and explainable health record that bridges personal logs with clinical diagnostics.
              </p>
            </Card>

            <Card variant="gradient" className="p-8 sm:p-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-[#1C1326] font-display">
                Why PMOS & PCOS?
              </h2>
              <p className="text-sm sm:text-base text-[#584B68] leading-relaxed">
                PCOS is one of the most widespread hormonal disorders, affecting 8–13% of women of reproductive age,
                with up to 70% remaining undiagnosed globally. Because symptoms span cycles, hormones, and metabolic indicators,
                effective monitoring requires multimodal intelligence rather than isolated trackers.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Research & Technology Foundation */}
      <section className="bg-white py-16 sm:py-24 border-y border-[#E7DFEF]">
        <Container size="xl">
          <SectionHeader
            eyebrow="Scientific Rigor"
            eyebrowVariant="primary"
            title="Our Research & Methodological Foundation"
            subtitle="Built on peer-reviewed diagnostic criteria, rigorous feature engineering, and state-of-the-art explainability algorithms."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="subtle" className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <Microscope className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1326] font-display">
                Rotterdam Criteria Alignment
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Incorporates standard international Rotterdam consensus markers: oligo/anovulation, clinical/biochemical
                hyperandrogenism, and polycystic ovarian morphology metrics.
              </p>
            </Card>

            <Card variant="subtle" className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1326] font-display">
                Transparent Machine Learning
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Utilizes validated machine learning architectures (Random Forests, Gradient Boosting, Support Vector Machines)
                evaluated on structured benchmark datasets with cross-validation.
              </p>
            </Card>

            <Card variant="subtle" className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1326] font-display">
                Human-in-the-Loop OCR
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Integrates Optical Character Recognition with strict human verification steps, preventing noisy or
                misread lab numbers from entering the health record unverified.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* Responsible AI & Non-Diagnostic Positioning */}
      <section>
        <Container size="lg">
          <Card variant="elevated" className="p-8 sm:p-12 space-y-6 border-l-4 border-l-[#6E2D8B]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#047857]" />
              <h3 className="text-2xl font-bold text-[#1C1326] font-display">
                Our Responsible AI Commitment
              </h3>
            </div>

            <p className="text-sm sm:text-base text-[#584B68] leading-relaxed font-sans">
              Artificial intelligence in healthcare must be deployed with absolute ethical discipline.
              PMOSense is architected strictly as an <strong>educational health-information and longitudinal monitoring assistant</strong>.
              It does not replace clinical judgment, does not issue prescriptive medical treatments, and does not provide formal medical diagnoses.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs text-[#1C1326] font-semibold">
              <div className="p-3.5 rounded-xl bg-[#F2ECF7] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#6E2D8B]" />
                <span>Empowering patients with structured data</span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F2ECF7] flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#6E2D8B]" />
                <span>Facilitating informed physician dialogue</span>
              </div>
            </div>
          </Card>
        </Container>
      </section>
    </div>
  );
};
