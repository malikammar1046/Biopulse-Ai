import React from 'react';
import { useTranslation } from 'react-i18next';

export type OvaSenseTab = 'nutrition' | 'exercise' | 'sleep' | 'stress' | 'hydration';

interface OvaSenseCategoryTabsProps {
  activeTab: OvaSenseTab;
  onTabChange: (tab: OvaSenseTab) => void;
}

export const OvaSenseCategoryTabs: React.FC<OvaSenseCategoryTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t, i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';

  const tabs: { id: OvaSenseTab; label: string }[] = [
    { id: 'nutrition', label: t('ovasense.tabs.nutrition', 'Nutrition') },
    { id: 'exercise', label: t('ovasense.tabs.exercise', 'Exercise') },
    { id: 'sleep', label: t('ovasense.tabs.sleep', 'Sleep') },
    { id: 'stress', label: t('ovasense.tabs.stress', 'Stress') },
    { id: 'hydration', label: t('ovasense.tabs.hydration', 'Hydration') },
  ];

  return (
    <nav
      dir={isUrdu ? 'rtl' : 'ltr'}
      aria-label="Lifestyle Categories"
      role="tablist"
      className="flex items-center gap-6 sm:gap-8 border-b border-pink-100/80 overflow-x-auto no-scrollbar pt-2 px-1"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`relative pb-3 text-sm sm:text-base transition-colors cursor-pointer shrink-0 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
              isActive
                ? 'font-bold text-[#BE185D]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {/* Elegant Pink Active Underline Bar */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#BE185D] rounded-full animate-fadeIn" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
