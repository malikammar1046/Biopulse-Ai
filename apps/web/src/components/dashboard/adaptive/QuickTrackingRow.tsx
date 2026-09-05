import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Calendar,
  Utensils,
  Droplets,
  Activity,
  Pill,
  Plus,
  Zap,
} from 'lucide-react';
import type { HealthPathway } from '../../../types/onboarding';
import type { NutritionData, FitnessData, HealthSnapshotMetrics } from '../../../types/dashboard';
import { ROUTES } from '../../../constants/routes';

interface QuickTrackingRowProps {
  pathway: HealthPathway;
  nutrition: NutritionData;
  fitness: FitnessData;
  snapshotMetrics: HealthSnapshotMetrics;
}

export const QuickTrackingRow: React.FC<QuickTrackingRowProps> = ({
  pathway,
  nutrition,
  fitness,
  snapshotMetrics,
}) => {
  // Theme colors per pathway
  const theme = {
    female: {
      accent: 'text-[#6E2D8B]',
      border: 'border-[#E7DFEF]',
      hoverBorder: 'hover:border-[#CBB2DF]',
      iconBg: 'bg-[#EDE4F7]',
      cardBg: 'bg-white',
    },
    male: {
      accent: 'text-sky-700',
      border: 'border-sky-100',
      hoverBorder: 'hover:border-sky-300',
      iconBg: 'bg-sky-50',
      cardBg: 'bg-white',
    },
    general: {
      accent: 'text-violet-700',
      border: 'border-violet-100',
      hoverBorder: 'hover:border-violet-300',
      iconBg: 'bg-violet-50',
      cardBg: 'bg-white',
    },
  }[pathway];

  // Define tracking actions based on pathway
  interface QuickItem {
    id: string;
    label: string;
    metric: string;
    icon: React.ReactNode;
    route: string;
  }

  const items: QuickItem[] = [];

  // 1. Symptoms (all pathways)
  items.push({
    id: 'symptoms',
    label: 'Log Symptoms',
    metric: `${snapshotMetrics.symptomsCountToday || 0} logged`,
    icon: <HeartPulse className="w-4 h-4 text-rose-600" />,
    route: ROUTES.APP.SYMPTOMS,
  });

  // 2. Cycle (female only)
  if (pathway === 'female') {
    items.push({
      id: 'cycle',
      label: 'Cycle Tracking',
      metric: snapshotMetrics.cycleDay ? `Day ${snapshotMetrics.cycleDay} • ${snapshotMetrics.phaseName}` : 'Log Period',
      icon: <Calendar className="w-4 h-4 text-[#8E3EAF]" />,
      route: ROUTES.APP.CYCLE,
    });
  }

  // 3. Vitality Check (male only)
  if (pathway === 'male') {
    items.push({
      id: 'vitality',
      label: 'Vitality & Energy',
      metric: 'Log daily level',
      icon: <Zap className="w-4 h-4 text-amber-600" />,
      route: ROUTES.APP.SYMPTOMS,
    });
  }

  // 4. Nutrition / Meals
  items.push({
    id: 'diet',
    label: 'Nutrition & Food',
    metric: nutrition.caloriesLogged > 0 ? `${nutrition.caloriesLogged} kcal` : 'Log Meals',
    icon: <Utensils className="w-4 h-4 text-emerald-600" />,
    route: ROUTES.APP.DIET,
  });

  // 5. Hydration
  items.push({
    id: 'water',
    label: 'Hydration',
    metric: `${nutrition.waterIntakeLiters || 0} / ${nutrition.waterTargetLiters || 2.5} L`,
    icon: <Droplets className="w-4 h-4 text-sky-600" />,
    route: ROUTES.APP.DIET,
  });

  // 6. Fitness / Activity
  items.push({
    id: 'fitness',
    label: pathway === 'male' ? 'Strength & Activity' : 'Daily Movement',
    metric: `${fitness.activeMinutesToday || 0} min active`,
    icon: <Activity className="w-4 h-4 text-orange-600" />,
    route: ROUTES.APP.FITNESS,
  });

  // 7. Medications (male & general)
  if (pathway === 'male' || pathway === 'general') {
    items.push({
      id: 'medications',
      label: 'Medications & TRT',
      metric: 'Manage schedule',
      icon: <Pill className="w-4 h-4 text-indigo-600" />,
      route: ROUTES.APP.MEDICATIONS,
    });
  }

  return (
    <div className="space-y-3 text-left" id="quick-tracking-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#8A7A99] font-bold">
            Daily Log
          </span>
          <span className="text-xs font-bold font-display text-[#1C1326]">
            Quick Tracking Shortcuts
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#8A7A99]">
          Fast 1-Tap Entry
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
          >
            <Link
              to={item.route}
              className={`p-3.5 rounded-2xl ${theme.cardBg} border ${theme.border} ${theme.hoverBorder} shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer h-full min-h-[92px]`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
                  {item.icon}
                </div>
                <div className="w-6 h-6 rounded-lg bg-[#FAF7FD] text-[#8A7A99] group-hover:text-[#6E2D8B] group-hover:bg-[#EDE4F7] flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold font-display text-[#1C1326] block truncate">
                  {item.label}
                </span>
                <span className="text-[11px] font-mono text-[#7A6B88] truncate block">
                  {item.metric}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
