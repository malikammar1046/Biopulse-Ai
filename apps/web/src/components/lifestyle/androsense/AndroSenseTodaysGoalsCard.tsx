import React, { useState, useEffect } from 'react';
import { Calendar, Apple, Footprints, Droplets, Moon, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GoalItem {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  autoCompleted?: boolean;
}

interface AndroSenseTodaysGoalsCardProps {
  userId?: string;
  todayWaterGlasses?: number;
  todayFitnessMinutes?: number;
  todayMealsLogged?: number;
  onGoalToggle?: (goalId: string, completed: boolean) => void;
  onViewAll?: () => void;
}

/**
 * AndroSense Daily Goals Tracking Component.
 *
 * STORAGE & SECURITY SPECIFICATION:
 * 1. Storage Isolation: Scoped strictly per-user and per-day via `androsense_daily_goals_${userId}_${todayStr}`.
 * 2. Privacy & Clinical Safety: Contains ONLY non-clinical boolean habit indicators (`Record<string, boolean>`).
 *    NO patient identifiable information (PII), lab markers, diagnoses, or sensitive metadata are persisted locally.
 * 3. Automatic Synchronization: Habit items auto-check when real fitness minutes, meals, or water glasses are logged.
 */
export const AndroSenseTodaysGoalsCard: React.FC<AndroSenseTodaysGoalsCardProps> = ({
  userId = 'default_user',
  todayWaterGlasses = 0,
  todayFitnessMinutes = 0,
  todayMealsLogged = 0,
  onGoalToggle,
  onViewAll,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  const storageKey = `androsense_daily_goals_${userId}_${todayStr}`;

  // Initial local state loaded synchronously from localStorage
  const [completedGoals, setCompletedGoals] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // LocalStorage access may be restricted in sandboxes
    }
    return {};
  });

  // Sync state whenever completedGoals changes
  const toggleGoal = (id: string) => {
    setCompletedGoals((prev) => {
      const nextState = !prev[id];
      const updated = { ...prev, [id]: nextState };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // Fallback gracefully
      }
      onGoalToggle?.(id, nextState);
      return updated;
    });
  };

  // Sync automatic completion based on real user actions if not explicitly toggled
  useEffect(() => {
    setCompletedGoals((prev) => {
      let modified = false;
      const next = { ...prev };

      // Water goal auto-detection
      if (todayWaterGlasses >= 8 && next.goal_water !== true) {
        next.goal_water = true;
        modified = true;
      }

      // Walk goal auto-detection
      if (todayFitnessMinutes >= 30 && next.goal_walk !== true) {
        next.goal_walk = true;
        modified = true;
      }

      // Meal goal auto-detection
      if (todayMealsLogged >= 1 && next.goal_meal !== true) {
        next.goal_meal = true;
        modified = true;
      }

      if (modified) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      }
      return prev;
    });
  }, [todayWaterGlasses, todayFitnessMinutes, todayMealsLogged, storageKey]);

  const goals: GoalItem[] = [
    {
      id: 'goal_meal',
      icon: <Apple className="w-4 h-4 text-[#0868B9]" />,
      iconBg: 'bg-sky-50',
      title: t('androsense.goals.goal1Title', 'Eat a balanced meal'),
      subtitle: t('androsense.goals.goal1Desc', 'Include quality protein, complex carbs, and healthy fats'),
    },
    {
      id: 'goal_walk',
      icon: <Footprints className="w-4 h-4 text-[#0E9EAA]" />,
      iconBg: 'bg-teal-50',
      title: t('androsense.goals.goal2Title', 'Walk or exercise for 30 minutes'),
      subtitle: t('androsense.goals.goal2Desc', 'Moderate activity promotes glucose uptake and cardiovascular health'),
    },
    {
      id: 'goal_water',
      icon: <Droplets className="w-4 h-4 text-[#0284C7]" />,
      iconBg: 'bg-sky-50',
      title: t('androsense.goals.goal3Title', 'Drink 8 glasses of water'),
      subtitle: t('androsense.goals.goal3Desc', 'Maintain proper hydration for cellular function and stamina'),
    },
    {
      id: 'goal_sleep',
      icon: <Moon className="w-4 h-4 text-indigo-500" />,
      iconBg: 'bg-indigo-50',
      title: t('androsense.goals.goal4Title', 'Get 7–9 hours of sleep'),
      subtitle: t('androsense.goals.goal4Desc', 'Restorative sleep supports normal endocrine rhythms'),
    },
  ];

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-sky-100 p-5 sm:p-6 shadow-sm space-y-4 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0868B9] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {t('androsense.goals.title', "Today's Goals")}
          </h2>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-[#0868B9] hover:text-[#07589D] transition-colors cursor-pointer"
          >
            {t('androsense.goals.viewAll', 'View All >')}
          </button>
        )}
      </div>

      {/* 4 Interactive Habit Rows */}
      <div className="space-y-2.5 pt-1">
        {goals.map((g) => {
          const isCompleted = Boolean(completedGoals[g.id]);

          return (
            <div
              key={g.id}
              onClick={() => toggleGoal(g.id)}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none group ${
                isCompleted
                  ? 'bg-sky-50/60 border-sky-200/80 shadow-2xs'
                  : 'bg-white border-slate-100 hover:border-sky-200 hover:bg-slate-50/50'
              }`}
              role="checkbox"
              aria-checked={isCompleted}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleGoal(g.id);
                }
              }}
            >
              {/* Left: Icon & Text */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl ${g.iconBg} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
                >
                  {g.icon}
                </div>
                <div className="min-w-0">
                  <h4
                    className={`text-xs sm:text-[13px] font-bold leading-tight transition-colors ${
                      isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'
                    }`}
                  >
                    {g.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate leading-snug mt-0.5">
                    {g.subtitle}
                  </p>
                </div>
              </div>

              {/* Right: Checkbox */}
              <div
                className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[#0868B9] border-[#0868B9] text-white shadow-2xs'
                    : 'border-slate-300 bg-white group-hover:border-sky-400'
                }`}
              >
                {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
