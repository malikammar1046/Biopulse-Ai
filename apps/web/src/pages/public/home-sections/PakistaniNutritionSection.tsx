import React from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  CheckCircle2,
  Droplets,
  Scale,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '../../../components/ui/Container';
import { ROUTES } from '../../../constants/routes';
import { SmallBotanicalSprig } from '../../../components/brand/BotanicalFoliage';

export const PakistaniNutritionSection: React.FC = () => {
  const highlights = [
    {
      title: 'Culturally Verified Recipes',
      desc: 'Authentic Pakistani ingredients and traditional recipes adapted for low glycemic impact and hormonal balance.',
      icon: UtensilsCrossed,
      color: '#059669',
      bg: 'bg-emerald-50',
    },
    {
      title: '4 Daily Meal Structure',
      desc: 'Balanced schedules across Breakfast, Lunch, Dinner, and Afternoon Snack to prevent insulin spikes.',
      icon: Flame,
      color: '#D97706',
      bg: 'bg-amber-50',
    },
    {
      title: 'Verified Portion Sizing',
      desc: 'Explicit portion sizes (gram/katori counts) calibrated for metabolic stability without restrictive starvation.',
      icon: Scale,
      color: '#0891B2',
      bg: 'bg-cyan-50',
    },
    {
      title: 'Hydration & Fiber Tracking',
      desc: 'Continuous daily water intake targets and soluble fiber coverage to optimize gut hormone regulation.',
      icon: Droplets,
      color: '#0284C7',
      bg: 'bg-sky-50',
    },
  ];

  return (
    <section
      id="pakistani-nutrition"
      className="py-24 sm:py-32 bg-gradient-to-b from-transparent via-white/50 to-transparent text-[#162A45] border-t border-slate-200/80 relative overflow-hidden select-none"
      aria-labelledby="nutrition-title"
    >
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[550px] h-[550px] bg-pink-100/30 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Small botanical leaf sprig in corner */}
      <div className="hidden lg:block absolute top-12 right-12 opacity-60 pointer-events-none">
        <SmallBotanicalSprig variant="teal" className="w-16 h-auto" />
      </div>

      <Container size="xl">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#059669] shadow-2xs">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              Culturally Tailored Guidance
            </span>
          </div>

          <h2
            id="nutrition-title"
            className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight"
          >
            Pakistani Nutrition &amp;{' '}
            <span className="text-[#059669]">
              Metabolic Guidance
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-sans">
            Generic Western meal plans often ignore local food cultures. BioPulse AI provides evidence-informed 7-day meal plans designed specifically for Pakistani diets to stabilize endocrine and metabolic health.
          </p>
        </div>

        {/* 4 Pillars of Pakistani Nutrition */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-14">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all text-left space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.bg}`}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-lg font-bold font-display text-[#162A45]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#059669]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Clinically Grounded</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Nutritional Callout / Realistic Context */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-base sm:text-lg font-bold font-display text-[#162A45]">
              Real Food. Real Culture. Measurable Balance.
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 max-w-xl font-sans">
              From dal-chawal portions to whole-wheat roti, seasonal vegetables, and lean protein pairings, our nutrition guidance works within actual homes rather than theoretical diets.
            </p>
          </div>
          <Link
            to={ROUTES.REGISTER}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-white bg-[#059669] hover:bg-[#047857] shadow-md shadow-emerald-700/20 shrink-0 transition-all"
          >
            <span>Explore Nutrition</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default PakistaniNutritionSection;
