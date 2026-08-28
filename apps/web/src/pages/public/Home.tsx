import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Calendar,
  FileCheck2,
  Sparkles,
  TrendingUp,
  Lock,
  Globe2,
  Users,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Container } from '../../components/ui/Container';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { VitalOrb } from '../../components/3d/VitalOrb';

export const Home: React.FC = () => {
  return (
    <div className="space-y-24 sm:space-y-32 pb-24 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-6 sm:pt-12">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#6E2D8B]/15 via-[#8E3EAF]/10 to-[#E87084]/15 rounded-full blur-3xl -z-10 pointer-events-none" />

        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              <div className="inline-flex items-center gap-2">
                <Badge variant="primary" showDot size="md">
                  Academic Research • Multimodal Health Intelligence
                </Badge>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1C1326] leading-[1.1] font-display">
                Intelligent Reproductive Health Information &{' '}
                <span className="bg-gradient-brand bg-clip-text text-transparent">
                  Longitudinal Monitoring
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-[#584B68] leading-relaxed max-w-2xl font-sans">
                PMOSense combines verified clinical reports, menstrual cycle trends, and symptom tracking
                with explainable machine learning to provide transparent health insights and longitudinal summaries.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to={ROUTES.HOW_IT_WORKS}>
                  <Button
                    variant="primary"
                    size="lg"
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Explore How It Works
                  </Button>
                </Link>

                <Link to={ROUTES.FEATURES}>
                  <Button variant="secondary" size="lg">
                    Platform Features
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-[#584B68] border-t border-[#E7DFEF]/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#047857]" />
                  <span>Non-Diagnostic Clinical Safety</span>
                </div>
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[#6E2D8B]" />
                  <span>Explainable AI (SHAP)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#A21CAF]" />
                  <span>User-Verified OCR</span>
                </div>
              </div>
            </motion.div>

            {/* Right 3D Visual Orb */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative flex items-center justify-center min-h-[380px] sm:min-h-[460px]"
            >
              <div className="w-full h-full relative">
                <VitalOrb className="w-full h-[400px] sm:h-[460px]" />
                
                {/* Floating Metric Badge 1 */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute -bottom-2 left-4 sm:left-6 bg-white/90 backdrop-blur-md border border-[#E7DFEF] rounded-2xl p-3.5 shadow-lg shadow-purple-950/5 max-w-[220px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-[#6E2D8B]" />
                    <span className="text-xs font-bold text-[#1C1326]">Multimodal Fusion</span>
                  </div>
                  <p className="text-[11px] text-[#584B68] leading-tight">
                    Cycle, symptoms & lab metrics unified into one record.
                  </p>
                </motion.div>

                {/* Floating Metric Badge 2 */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute top-4 right-2 sm:right-4 bg-white/90 backdrop-blur-md border border-[#E7DFEF] rounded-2xl p-3.5 shadow-lg shadow-purple-950/5 max-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-[#E87084]" />
                    <span className="text-xs font-bold text-[#1C1326]">Transparent AI</span>
                  </div>
                  <p className="text-[11px] text-[#584B68] leading-tight">
                    SHAP feature transparency for every health pattern.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* 2. THE PROBLEM SPACE */}
      <section className="bg-white py-16 sm:py-24 border-y border-[#E7DFEF]">
        <Container size="xl">
          <SectionHeader
            eyebrow="The Clinical Challenge"
            eyebrowVariant="warning"
            title="Understanding the Gaps in PMOS & PCOS Care"
            subtitle="Polycystic Ovary Syndrome affects millions worldwide, yet fragmented data and generic tools create persistent hurdles."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="subtle" hoverEffect className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="text-xl font-bold text-[#1C1326] font-display">
                Delayed Recognition & Stigma
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Symptoms often manifest gradually across irregular cycles, metabolic shifts, and skin changes,
                frequently misunderstood or dismissed in routine checkups.
              </p>
            </Card>

            <Card variant="subtle" hoverEffect className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="text-xl font-bold text-[#1C1326] font-display">
                Fragmented Medical Records
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Lab reports, ultrasound scans, and daily symptom logs remain isolated across paper slips,
                disparate clinic files, and generic consumer apps.
              </p>
            </Card>

            <Card variant="subtle" hoverEffect className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="text-xl font-bold text-[#1C1326] font-display">
                Opaque AI "Black Boxes"
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Most digital tools offer opaque risk numbers without explaining the contributing physiological
                metrics or giving clinicians structured context to review.
              </p>
            </Card>
          </div>
        </Container>
      </section>

      {/* 3. THE PMOSENSE SOLUTION */}
      <section>
        <Container size="xl">
          <SectionHeader
            eyebrow="The PMOSense Approach"
            eyebrowVariant="primary"
            title="A Unified, Explainable Longitudinal Architecture"
            subtitle="Engineered to bridge personal symptom logging with verified clinical reports and transparent machine learning."
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    title: 'Multimodal Data Integration',
                    desc: 'Synchronizes menstrual cycle history, symptom patterns, hormonal panels, and ovarian ultrasound metrics into a structured longitudinal profile.',
                    icon: Activity,
                  },
                  {
                    title: 'Human-in-the-Loop OCR Verification',
                    desc: 'Scans laboratory test values via Tesseract OCR and presents extracted numbers for mandatory user confirmation prior to any ML calculation.',
                    icon: FileCheck2,
                  },
                  {
                    title: 'Explainable AI & Clinician Summaries',
                    desc: 'Computes SHAP value distributions to explicitly explain which physiological indicators contributed to the assessment pattern.',
                    icon: BrainCircuit,
                  },
                  {
                    title: 'Empathetic, Continuous Monitoring',
                    desc: 'Encourages long-term wellness tracking and generates clean PDF/digital summaries for informed discussions with qualified physicians.',
                    icon: Stethoscope,
                  },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-[#E7DFEF] hover:border-[#8E3EAF] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#1C1326] font-display">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Architecture Preview Card */}
            <Card variant="gradient" className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#047857]" />
                  <span className="text-xs font-bold text-[#1C1326] uppercase tracking-wider">
                    Pipeline Architecture
                  </span>
                </div>
                <Badge variant="primary" size="sm">Non-Diagnostic</Badge>
              </div>

              <div className="space-y-3 font-mono text-xs text-[#1C1326]">
                <div className="p-3 rounded-xl bg-white/80 border border-[#E7DFEF] flex items-center justify-between">
                  <span>1. User Data Intake</span>
                  <span className="text-[#6E2D8B] font-semibold">Cycles + Symptoms</span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 border border-[#E7DFEF] flex items-center justify-between">
                  <span>2. Lab Reports & OCR</span>
                  <span className="text-[#A21CAF] font-semibold">User-Verified Extracted Fields</span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 border border-[#E7DFEF] flex items-center justify-between">
                  <span>3. ML Model Assessment</span>
                  <span className="text-[#4338CA] font-semibold">Validated Classifiers</span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 border border-[#E7DFEF] flex items-center justify-between">
                  <span>4. SHAP Feature Attribution</span>
                  <span className="text-[#047857] font-semibold">Transparent Explanations</span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 border border-[#E7DFEF] flex items-center justify-between">
                  <span>5. Longitudinal Tracking</span>
                  <span className="text-[#B45309] font-semibold">Doctor Discussion Summary</span>
                </div>
              </div>

              <div className="pt-2">
                <Link to={ROUTES.HOW_IT_WORKS} className="text-xs font-bold text-[#6E2D8B] flex items-center gap-1 hover:underline">
                  <span>Inspect full visual workflow</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* 4. KEY PLATFORM FEATURES */}
      <section className="bg-[#F2ECF7]/50 py-16 sm:py-24 border-y border-[#E7DFEF]">
        <Container size="xl">
          <SectionHeader
            eyebrow="Comprehensive Capabilities"
            eyebrowVariant="primary"
            title="Designed for Clarity, Longitudinal Health & Physician Discussion"
            subtitle="Ten purpose-built modules designed to capture, organize, and interpret polycystic ovarian patterns."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Structured Health Profile',
                desc: 'Captures baseline clinical context, demographic data, and historical medical history.',
                icon: Users,
              },
              {
                title: 'Cycle & Ovulation Tracking',
                desc: 'Visualizes follicular and luteal phases with cycle regularity indicators.',
                icon: Calendar,
              },
              {
                title: 'Symptom & Metric Logging',
                desc: 'Daily logging for acne, hirsutism, sleep, mood, and pelvic comfort levels.',
                icon: Activity,
              },
              {
                title: 'Medical Report Reader',
                desc: 'Extracts LH, FSH, AMH, Testosterone, and ultrasound follicles with OCR assistance.',
                icon: FileCheck2,
              },
              {
                title: 'AI Pattern Assessment',
                desc: 'Evaluates multi-parametric indicators using validated academic machine learning models.',
                icon: BrainCircuit,
              },
              {
                title: 'Explainable AI (SHAP)',
                desc: 'Visual breakdown showing the exact influence of each hormonal or symptom indicator.',
                icon: Sparkles,
              },
              {
                title: 'Longitudinal Trend Timeline',
                desc: 'Tracks biomarker and symptom shifts over weeks, months, and post-intervention periods.',
                icon: TrendingUp,
              },
              {
                title: 'Localized Lifestyle Support',
                desc: 'Practical nutritional, physical activity, and stress support tailored to regional habits.',
                icon: Globe2,
              },
              {
                title: 'Clinician Discussion Summary',
                desc: 'Generates structured, clear PDF summaries designed for clinical appointments.',
                icon: Stethoscope,
              },
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} variant="standard" hoverEffect className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-[#1C1326] font-display">
                    {feature.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
                    {feature.desc}
                  </p>
                </Card>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link to={ROUTES.FEATURES}>
              <Button variant="outline" size="md" iconRight={<ArrowRight className="w-4 h-4" />}>
                View All Features in Detail
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* 5. EXPLAINABLE AI & SHAP SECTION */}
      <section>
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <Badge variant="accent" showDot size="md">
                Responsible AI & Transparency
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1326] font-display leading-tight">
                No Black Boxes. Every Insight Fully Explained with SHAP.
              </h2>
              <p className="text-base text-[#584B68] leading-relaxed font-sans">
                PMOSense utilizes Shapley Additive Explanations (SHAP) from cooperative game theory
                to attribute the exact mathematical contribution of each biomarker—such as LH/FSH ratio,
                BMI, follicle count, or cycle length—to the assessment pattern.
              </p>

              <ul className="space-y-3 text-sm text-[#1C1326]">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                  <span>Feature importance bar charts for every user assessment</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                  <span>Positive vs. negative biomarker influence attribution</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                  <span>Empowers users and doctors to pinpoint specific areas of focus</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6">
              <Card variant="elevated" className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7DFEF] pb-3">
                  <span className="text-xs font-bold text-[#1C1326] uppercase">
                    Sample SHAP Feature Contribution Preview
                  </span>
                  <Badge variant="info" size="sm">Explainability Engine</Badge>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { label: 'LH / FSH Ratio (2.4)', value: '+0.38', width: '85%', color: 'bg-[#6E2D8B]', positive: true },
                    { label: 'Ovarian Follicle Count (14/ovary)', value: '+0.29', width: '65%', color: 'bg-[#8E3EAF]', positive: true },
                    { label: 'Cycle Length Variation (42 days)', value: '+0.21', width: '48%', color: 'bg-[#A21CAF]', positive: true },
                    { label: 'Fasting Glucose (Normal)', value: '-0.14', width: '32%', color: 'bg-[#047857]', positive: false },
                  ].map((row, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#1C1326]">{row.label}</span>
                        <span className={row.positive ? 'text-[#6E2D8B]' : 'text-[#047857]'}>
                          {row.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#F2ECF7] overflow-hidden">
                        <div className={`h-full rounded-full ${row.color}`} style={{ width: row.width }} />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[#8D7E9E] italic pt-2">
                  *Illustrative explanation visualization. PMOSense outputs health-information pattern indices, not formal medical diagnoses.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. LOCALIZED HEALTH CONTEXT & TRUST */}
      <section className="bg-white py-16 sm:py-24 border-y border-[#E7DFEF]">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <Card variant="subtle" className="p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#1C1326] font-display">
                Pakistani & South Asian Health Context
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                PCOS prevalence across South Asia is notably high, influenced by distinctive insulin resistance
                patterns and dietary habits. PMOSense incorporates localized lifestyle options, addressing cultural
                stigma while facilitating transparent health record keeping.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6E2D8B]">
                <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                <span>Localized dietary cues, regional lab standard units</span>
              </div>
            </Card>

            <Card variant="subtle" className="p-8 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-[#1C1326] font-display">
                Privacy, Ethics & Data Sovereignty
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Your reproductive health information belongs exclusively to you. PMOSense is built with strict
                data protection principles, encrypted storage, and zero data monetization.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#E87084]">
                <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                <span>No third-party data broker sharing</span>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      {/* 7. CTA BANNER */}
      <section>
        <Container size="xl">
          <div className="rounded-3xl bg-gradient-brand text-white p-8 sm:p-14 text-center space-y-6 shadow-xl shadow-purple-950/10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display max-w-3xl mx-auto leading-tight">
              Empowering Reproductive Health Understanding Through Intelligent Multimodal AI
            </h2>
            <p className="text-base sm:text-lg text-purple-100 max-w-2xl mx-auto font-sans leading-relaxed">
              Explore the PMOSense platform architecture, inspect our explainable machine learning methodology,
              and see how structured longitudinal monitoring supports informed clinician dialogue.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button variant="secondary" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
                  Explore How It Works
                </Button>
              </Link>
              <Link to={ROUTES.ABOUT}>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Read About the Research
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};
