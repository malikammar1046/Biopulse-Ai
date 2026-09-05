import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Activity, UserCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Button } from '../../../components/ui/Button';
import { ROUTES } from '../../../constants/routes';

export const WhoIsItForSection: React.FC = () => {
  const journeys = [
    {
      id: 'womens-health',
      badge: "Women's Health",
      title: 'PCOS Risk Assessment & Education',
      description:
        'Explore PCOS-related symptoms, cycle patterns, and endocrine signals in an explainable, non-diagnostic space.',
      cues: [
        'Irregular, delayed, or absent periods',
        'Persistent facial or jawline acne',
        'Unwanted facial or body hair growth',
        'Scalp hair shedding or thinning',
        'Weight-related metabolic changes',
        'Fertility and ovulation timing concerns',
      ],
      ctaText: "Explore Women's Health",
      ctaLink: ROUTES.WOMENS_HEALTH,
      accentColor: '#FB7185',
      gradientBg: 'from-[#270D3E] via-[#1C0A2D] to-[#12071F]',
      borderColor: 'border-[#FB7185]/30',
      icon: Heart,
    },
    {
      id: 'mens-health',
      badge: "Men's Health",
      title: 'Male Hypogonadism & Testosterone',
      description:
        'Understand symptoms and health information associated with male hypogonadism and testosterone signaling.',
      cues: [
        'Persistent daytime fatigue & low energy',
        'Reduced sexual desire or intimacy interest',
        'Erectile quality or frequency concerns',
        'Unexplained changes in muscle strength',
        'Changes in facial or body hair density',
        'Testosterone lab questions & morning timing',
      ],
      ctaText: "Explore Men's Health",
      ctaLink: ROUTES.MENS_HEALTH,
      accentColor: '#38BDF8',
      gradientBg: 'from-[#0C1D3B] via-[#0F172A] to-[#12071F]',
      borderColor: 'border-[#38BDF8]/30',
      icon: Activity,
    },
    {
      id: 'baseline-awareness',
      badge: 'Everyone & Baseline Health',
      title: 'General Awareness & Monitoring',
      description:
        'Build a health baseline, organize health records, and track changes over time—no existing disease concern required.',
      cues: [
        'Establish a personal reproductive baseline',
        'Understand reproductive health signals early',
        'Digitize and verify paper laboratory reports',
        'Track daily sleep, stress, and lifestyle habits',
        'Observe subtle physiological trends over months',
        'Learn when discussing signals with doctors is wise',
      ],
      ctaText: 'Start With Your Baseline',
      ctaLink: ROUTES.REGISTER,
      accentColor: '#C084FC',
      gradientBg: 'from-[#1E1238] via-[#160A26] to-[#10071A]',
      borderColor: 'border-[#C084FC]/30',
      icon: UserCheck,
    },
  ];

  return (
    <section
      id="who-is-it-for"
      className="py-24 sm:py-32 bg-[#12071F] text-white border-t border-white/10 relative overflow-hidden select-none"
      aria-labelledby="who-is-it-for-title"
    >
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-[#6E2D8B]/18 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#38BDF8]/12 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#F6F2FA]">
              Designed For Real People
            </span>
          </div>

          <h2
            id="who-is-it-for-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-white leading-tight"
          >
            One Platform.{' '}
            <span className="bg-gradient-to-r from-[#C084FC] via-[#E879F9] to-[#FB7185] bg-clip-text text-transparent">
              Different Health Journeys.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#CDBDD8] max-w-2xl mx-auto leading-relaxed font-sans">
            You don’t need to have a confirmed condition to use VITASense AI. Whether you have specific
            symptoms, questions about a lab report, or simply want to understand your baseline, we meet you where you are.
          </p>
        </div>

        {/* 3 User Group Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {journeys.map((journey, idx) => {
            const Icon = journey.icon;
            return (
              <motion.div
                key={journey.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className={`p-7 sm:p-8 rounded-[32px] bg-gradient-to-b ${journey.gradientBg} border ${journey.borderColor} shadow-2xl flex flex-col justify-between space-y-6 text-left hover:border-white/30 transition-all`}
              >
                <div className="space-y-4">
                  {/* Badge & Icon Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-full border"
                      style={{
                        backgroundColor: `${journey.accentColor}18`,
                        color: journey.accentColor,
                        borderColor: `${journey.accentColor}35`,
                      }}
                    >
                      {journey.badge}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                      style={{
                        backgroundColor: `${journey.accentColor}20`,
                        color: journey.accentColor,
                        borderColor: `${journey.accentColor}40`,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold font-display text-white">
                    {journey.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#CDBDD8] leading-relaxed font-sans">
                    {journey.description}
                  </p>

                  {/* Common Signals Checklist */}
                  <div className="pt-2 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#A797BD] font-bold block">
                      Common Focus Areas:
                    </span>
                    <ul className="space-y-1.5">
                      {journey.cues.map((cue, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2 text-xs text-[#EDE4F7]">
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0 mt-0.5"
                            style={{ color: journey.accentColor }}
                          />
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-4 border-t border-white/10">
                  <Link to={journey.ctaLink}>
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full justify-between text-white shadow-lg cursor-pointer"
                      style={{
                        background:
                          journey.id === 'womens-health'
                            ? 'linear-gradient(to right, #8E3EAF, #A21CAF, #FB7185)'
                            : journey.id === 'mens-health'
                            ? 'linear-gradient(to right, #0284C7, #6366F1, #8E3EAF)'
                            : 'linear-gradient(to right, #6E2D8B, #8E3EAF, #C084FC)',
                      }}
                      iconRight={<ArrowRight className="w-4 h-4" />}
                    >
                      {journey.ctaText}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
