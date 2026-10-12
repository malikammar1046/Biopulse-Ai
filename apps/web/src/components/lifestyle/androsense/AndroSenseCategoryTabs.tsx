import React from 'react';
import { useTranslation } from 'react-i18next';

export type AndroSenseTab = 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'hydration';

interface AndroSenseCategoryTabsProps {
  activeTab: AndroSenseTab;
  onTabChange: (tab: AndroSenseTab) => void;
}

export const AndroSenseCategoryTabs: React.FC<AndroSenseCategoryTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const tabs: { id: AndroSenseTab; label: string }[] = [
    { id: 'nutrition', label: t('androsense.tabs.nutrition', 'Nutrition') },
    { id: 'exercise', label: t('androsense.tabs.exercise', 'Exercise') },
    { id: 'sleep', label: t('androsense.tabs.sleep', 'Sleep') },
    { id: 'stress', label: t('androsense.tabs.stress', 'Stress') },
    { id: 'hydration', label: t('androsense.tabs.hydration', 'Hydration') },
  ];

  return (
    <nav
      dir={isUrdu ? 'rtl' : 'ltr'}
      aria-label="Lifestyle Categories"
      role="tablist"
      className="flex items-center gap-6 sm:gap-8 border-b border-sky-100/90 overflow-x-auto no-scrollbar pt-2 px-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`androsense-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`androsense-panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`relative pb-3 text-sm sm:text-base transition-colors cursor-pointer shrink-0 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
              isActive
                ? 'font-bold text-[#0868B9]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {/* Elegant Sky-Blue Active Underline Bar */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0868B9] rounded-full animate-fadeIn" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
