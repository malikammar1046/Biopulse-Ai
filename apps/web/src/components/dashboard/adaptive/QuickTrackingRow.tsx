import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ActivityHeart,
  Calendar,
  Scales01,
  Droplets01,
  LineChartUp01,
  MedicalCircle,
  Plus,
} from '@untitledui/icons';
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
      accent: 'text-[#0288D1]',
      border: 'border-[#E2E8F0]',
      hoverBorder: 'hover:border-[#BAE6FD]',
      iconBg: 'bg-[#E0F2FE]',
      cardBg: 'bg-white',
    },
    male: {
      accent: 'text-[#0288D1]',
      border: 'border-[#E2E8F0]',
      hoverBorder: 'hover:border-[#BAE6FD]',
      iconBg: 'bg-[#E0F2FE]',
      cardBg: 'bg-white',
    },
    general: {
      accent: 'text-[#0288D1]',
      border: 'border-[#E2E8F0]',
      hoverBorder: 'hover:border-[#BAE6FD]',
      iconBg: 'bg-[#E0F2FE]',
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
    icon: <ActivityHeart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
    route: ROUTES.APP.SYMPTOMS,
  });

  // 2. Cycle (female only)
  if (pathway === 'female') {
    items.push({
      id: 'cycle',
      label: 'Cycle Tracking',
      metric: snapshotMetrics.cycleDay ? `Day ${snapshotMetrics.cycleDay} • ${snapshotMetrics.phaseName}` : 'Log Period',
      icon: <Calendar className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
      route: ROUTES.APP.CYCLE,
    });
  }

  // 3. Vitality Check (male only)
  if (pathway === 'male') {
    items.push({
      id: 'vitality',
      label: 'Vitality & Energy',
      metric: 'Log daily level',
      icon: <ActivityHeart className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
      route: ROUTES.APP.SYMPTOMS,
    });
  }

  // 4. Nutrition / Meals
  items.push({
    id: 'diet',
    label: 'Nutrition & Food',
    metric: nutrition.caloriesLogged > 0 ? `${nutrition.caloriesLogged} kcal` : 'Log Meals',
    icon: <Scales01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
    route: ROUTES.APP.DIET,
  });

  // 5. Hydration
  items.push({
    id: 'water',
    label: 'Hydration',
    metric: `${nutrition.waterIntakeLiters || 0} / ${nutrition.waterTargetLiters || 2.5} L`,
    icon: <Droplets01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
    route: ROUTES.APP.DIET,
  });

  // 6. Fitness / Activity
  items.push({
    id: 'fitness',
    label: pathway === 'male' ? 'Strength & Activity' : 'Daily Movement',
    metric: `${fitness.activeMinutesToday || 0} min active`,
    icon: <LineChartUp01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
    route: ROUTES.APP.FITNESS,
  });

  // 7. Medications (male & general)
  if (pathway === 'male' || pathway === 'general') {
    items.push({
      id: 'medications',
      label: 'Medications & TRT',
      metric: 'Manage schedule',
      icon: <MedicalCircle className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />,
      route: ROUTES.APP.MEDICATIONS,
    });
  }

  return (
    <div className="space-y-3 text-left" id="quick-tracking-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#64748B] font-bold">
            Daily Log
          </span>
          <span className="text-xs font-bold font-display text-[#0F172A]">
            Quick Tracking Shortcuts
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#64748B]">
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
                <div className="w-6 h-6 rounded-lg bg-[#F8FAFC] text-[#64748B] group-hover:text-[#0288D1] group-hover:bg-[#E0F2FE] flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold font-display text-[#0F172A] block truncate">
                  {item.label}
                </span>
                <span className="text-[11px] font-mono text-[#64748B] truncate block">
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
