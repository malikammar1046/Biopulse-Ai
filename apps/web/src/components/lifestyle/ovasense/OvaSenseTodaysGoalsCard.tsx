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

interface OvaSenseTodaysGoalsCardProps {
  userId?: string;
  todayWaterGlasses?: number;
  todayFitnessMinutes?: number;
  todayMealsLogged?: number;
  onGoalToggle?: (goalId: string, completed: boolean) => void;
  onViewAll?: () => void;
}

/**
 * OvaSense Daily Goals Tracking Component.
 *
 * STORAGE & SECURITY SPECIFICATION:
 * 1. Storage Isolation: Scoped strictly per-user and per-day via `ovasense_daily_goals_${userId}_${todayStr}`.
 * 2. Privacy & Clinical Safety: Contains ONLY non-clinical boolean habit indicators (`Record<string, boolean>`).
 *    NO patient identifiable information (PII), lab markers, diagnoses, or sensitive metadata are persisted locally.
 * 3. Automatic Synchronization: Habit items auto-check when real fitness minutes, meals, or water glasses are logged.
 */
export const OvaSenseTodaysGoalsCard: React.FC<OvaSenseTodaysGoalsCardProps> = ({
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
  const storageKey = `ovasense_daily_goals_${userId}_${todayStr}`;

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
      icon: <Apple className="w-4 h-4 text-rose-500" />,
      iconBg: 'bg-rose-50',
      title: t('ovasense.goals.goal1Title', 'Eat a balanced meal'),
      subtitle: t('ovasense.goals.goal1Desc', 'Include protein, fiber and healthy fats'),
    },
    {
      id: 'goal_walk',
      icon: <Footprints className="w-4 h-4 text-[#0E9EAA]" />,
      iconBg: 'bg-teal-50',
      title: t('ovasense.goals.goal2Title', 'Walk for 30 minutes'),
      subtitle: t('ovasense.goals.goal2Desc', 'Light exercise helps with insulin sensitivity'),
    },
    {
      id: 'goal_water',
      icon: <Droplets className="w-4 h-4 text-sky-500" />,
      iconBg: 'bg-sky-50',
      title: t('ovasense.goals.goal3Title', 'Drink 8 glasses of water'),
      subtitle: t('ovasense.goals.goal3Desc', 'Stay hydrated for better hormone balance'),
    },
    {
      id: 'goal_sleep',
      icon: <Moon className="w-4 h-4 text-purple-500" />,
      iconBg: 'bg-purple-50',
      title: t('ovasense.goals.goal4Title', 'Get 7–9 hours of sleep'),
      subtitle: t('ovasense.goals.goal4Desc', 'Helps regulate hormones and energy'),
    },
  ];

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`rounded-3xl bg-white border border-[#FCE7F0] p-5 sm:p-6 shadow-sm space-y-4 ${
        isUrdu ? 'text-right' : 'text-left'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#BE185D] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            {t('ovasense.goals.title', "Today's Goals")}
          </h3>
        </div>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-[#BE185D] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>{isUrdu ? 'تمام دیکھیں <' : t('ovasense.goals.viewAll', 'View All >')}</span>
          </button>
        )}
      </div>

      {/* Goal Items */}
      <div className="divide-y divide-pink-50">
        {goals.map((goal) => {
          const isDone = Boolean(completedGoals[goal.id]);

          return (
            <div
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className="flex items-center justify-between gap-3 py-3 hover:bg-pink-50/30 rounded-2xl px-1.5 -mx-1.5 transition-colors cursor-pointer group"
              role="checkbox"
              aria-checked={isDone}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  toggleGoal(goal.id);
                }
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full ${goal.iconBg} flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                >
                  {goal.icon}
                </div>

                <div className="min-w-0">
                  <h4
                    className={`text-xs sm:text-sm font-bold leading-tight transition-colors ${
                      isDone ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    {goal.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {goal.subtitle}
                  </p>
                </div>
              </div>

              {/* Circular Checkbox */}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isDone
                    ? 'border-[#0E9EAA] bg-[#0E9EAA] text-white shadow-2xs'
                    : 'border-slate-300 group-hover:border-[#BE185D] bg-white'
                }`}
              >
                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
