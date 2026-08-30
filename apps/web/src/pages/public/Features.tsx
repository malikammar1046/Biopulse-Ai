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
      title: '1. Your Complete Health Record',
      subtitle: 'Keep all your health history in one secure place',
      icon: User,
      desc: 'Stores your basic details, family health background, and past doctor notes so you always have a clear, organized picture of your health.',
      bullets: [
        'Securely record your age, height, weight, and general health background',
        'Set your baseline cycle length and period duration',
        'Keep all personal health details private and organized',
      ],
      badge: 'Foundation',
    },
    {
      id: 'cycle',
      title: '2. Your Period & Cycle Rhythm',
      subtitle: 'Track your period, fertile window, and cycle phases',
      icon: Calendar,
      desc: 'Tracks when your period starts, how long it lasts, and estimates your cycle phases (like when an egg develops and when it is released).',
      bullets: [
        'Calculate your cycle length and period duration automatically',
        'See estimated phases (Menstrual, Follicular, Ovulation, and Luteal)',
        'Track regularity and changes across consecutive months',
      ],
      badge: 'Core Tracking',
    },
    {
      id: 'symptoms',
      title: '3. Daily Symptom & Body Journal',
      subtitle: 'Log how you feel each day with zero guesswork',
      icon: SmilePlus,
      desc: 'Record daily changes in acne, unwanted hair growth, mood, energy, sleep, and pelvic comfort with simple, non-judgmental severity ratings.',
      bullets: [
        'Easy-to-use 5-point rating scale for daily symptoms',
        'See how symptoms connect with different days in your cycle',
        'Notice your personal patterns and lifestyle triggers',
      ],
      badge: 'Core Tracking',
    },
    {
      id: 'reports',
      title: '4. Lab Report Scanner',
      subtitle: 'Read and organize your test results automatically',
      icon: FileText,
      desc: 'Upload laboratory blood tests and ultrasound reports. OvaSense scans key values (like hormone levels and blood sugar) so they are easy to read.',
      bullets: [
        'Safe and private storage for photos and PDF reports',
        'Recognizes reports from major laboratories across Pakistan',
        'Keeps your past medical test documents organized in one place',
      ],
      badge: 'Data Intake',
    },
    {
      id: 'ocr',
      title: '5. You Confirm Every Number',
      subtitle: 'Check and approve every scanned value first',
      icon: ScanLine,
      desc: 'Before any scanned lab value is used for insights, you review and confirm it side-by-side with your original document to ensure 100% accuracy.',
      bullets: [
        'Side-by-side view: original report image next to extracted numbers',
        'Automatic unit conversion so all tests speak the same language',
        'Zero unverified data is ever used in your health assessments',
      ],
      badge: 'Verification',
    },
    {
      id: 'assessment',
      title: '6. AI Health Pattern Insights',
      subtitle: 'Smart pattern recognition based on what you share',
      icon: BrainCircuit,
      desc: 'Evaluates your symptoms, period rhythm, and verified test results to find meaningful patterns, starting with only the information you already have.',
      bullets: [
        'Works with whatever data you have—even if you have no lab tests yet',
        'Identifies hormone-related patterns with progressive data tiers',
        'Strictly informational decision-support—never an automated diagnosis',
      ],
      badge: 'Intelligence',
    },
    {
      id: 'explainable',
      title: '7. AI That Explains the "Why"',
      subtitle: 'Clear explanations for every insight',
      icon: Sparkles,
      desc: 'No mysterious black boxes. OvaSense shows you exactly which of your entries influenced each insight, in plain everyday English.',
      bullets: [
        'Visual charts showing which factors influenced your pattern most',
        'Simple explanations connecting your symptoms to your results',
        'Helps you understand what to discuss with your doctor next',
      ],
      badge: 'Intelligence',
    },
    {
      id: 'lifestyle',
      title: '8. Food & Movement for Real Life',
      subtitle: 'Pakistani meals and realistic home routines',
      icon: HeartHandshake,
      desc: 'Practical portion ideas for everyday foods (like roti, daal, and biryani) and low-equipment movement routines designed for hormone balance.',
      bullets: [
        'Gentle nutrition guidance tailored to everyday Pakistani foods',
        'Walking and home-based movement with no gym required',
        'Encouraging guidance focused on balance—not strict food bans',
      ],
      badge: 'Support',
    },
    {
      id: 'timeline',
      title: '9. See Your Progress Over Time',
      subtitle: 'Track how your health evolves over months',
      icon: History,
      desc: 'Compare changes in your cycle rhythm, symptoms, and lab results over 3, 6, and 12 months to see what habits help you feel your best.',
      bullets: [
        'Visual graphs comparing your baseline to your latest check-ins',
        'Observe how lifestyle improvements support your cycle regularity',
        'Clear longitudinal record showing your true health journey',
      ],
      badge: 'Analytics',
    },
    {
      id: 'summary',
      title: '10. Doctor Visit Summary',
      subtitle: 'A clean summary to share with your doctor',
      icon: FileCheck,
      desc: 'Generate a clean, private summary showing your verified test results, cycle history, and symptom trends to share with your physician.',
      bullets: [
        'Easy-to-read summary organized specifically for your doctor visit',
        'Eliminates forgotten dates and lost paper receipts',
        'Private 7-day share link you can send directly over WhatsApp',
      ],
      badge: 'Collaboration',
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
