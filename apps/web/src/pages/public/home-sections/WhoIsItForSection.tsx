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
      accentColor: '#E11D48',
      cardBg: 'from-[#FFF0F5] via-[#FFF6FA] to-[#FFE8F0]',
      borderColor: 'border-pink-200/90',
      shadowColor: 'shadow-pink-100/70',
      btnGradient: 'bg-gradient-to-r from-[#F43F5E] via-[#EC4899] to-[#E11D48]',
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
      accentColor: '#0284C7',
      cardBg: 'from-[#F0F9FF] via-[#F8FCFF] to-[#E0F2FE]',
      borderColor: 'border-sky-200/90',
      shadowColor: 'shadow-sky-100/70',
      btnGradient: 'bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#2563EB]',
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
      accentColor: '#059669',
      cardBg: 'from-[#F0FDF4] via-[#F8FCF9] to-[#E6F4EA]',
      borderColor: 'border-emerald-200/90',
      shadowColor: 'shadow-emerald-100/70',
      btnGradient: 'bg-gradient-to-r from-[#0D9488] via-[#059669] to-[#047857]',
      icon: UserCheck,
    },
  ];

  return (
    <section
      id="who-is-it-for"
      className="py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] border-t border-slate-200/80 relative overflow-hidden select-none"
      aria-labelledby="who-is-it-for-title"
    >
      {/* Ambient Lighting */}
      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-pink-100/40 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-sky-100/50 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#0891B2] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              Designed For Real People
            </span>
          </div>

          <h2
            id="who-is-it-for-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
          >
            One Platform.{' '}
            <span className="text-[#0891B2]">
              Different Health Journeys.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            You don’t need to have a confirmed condition to use BIOPulse AI. Whether you have specific
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
                className={`p-7 sm:p-8 rounded-[32px] bg-gradient-to-b ${journey.cardBg} border ${journey.borderColor} shadow-xl ${journey.shadowColor} flex flex-col justify-between space-y-6 text-left hover:-translate-y-1 transition-all group`}
              >
                <div className="space-y-4">
                  {/* Badge & Icon Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border bg-white shadow-2xs"
                      style={{
                        color: journey.accentColor,
                        borderColor: `${journey.accentColor}40`,
                      }}
                    >
                      {journey.badge}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border bg-white shadow-2xs group-hover:scale-105 transition-transform"
                      style={{
                        color: journey.accentColor,
                        borderColor: `${journey.accentColor}30`,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-extrabold font-display text-[#162A45]">
                    {journey.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {journey.description}
                  </p>

                  {/* Common Signals Checklist */}
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                      Common Focus Areas:
                    </span>
                    <ul className="space-y-2">
                      {journey.cues.map((cue, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                          <CheckCircle2
                            className="w-4 h-4 shrink-0 mt-0.5"
                            style={{ color: journey.accentColor }}
                          />
                          <span>{cue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="pt-4 border-t border-black/5">
                  <Link to={journey.ctaLink}>
                    <Button
                      variant="primary"
                      size="md"
                      className={`w-full justify-between text-white shadow-md rounded-full cursor-pointer hover:brightness-105 ${journey.btnGradient}`}
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
