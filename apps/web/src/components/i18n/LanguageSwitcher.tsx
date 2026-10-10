import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { changeLocale } from '../../i18n/locale';
import type { SupportedLocale } from '../../i18n/types';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'select' | 'compact';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { i18n } = useTranslation();
  const currentLocale = (i18n.language as SupportedLocale) || 'en';

  const toggleLocale = async () => {
    const nextLocale: SupportedLocale = currentLocale === 'ur' ? 'en' : 'ur';
    await changeLocale(nextLocale, true);
  };

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value as SupportedLocale;
    await changeLocale(nextLocale, true);
  };

  if (variant === 'select') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <Globe className="w-4 h-4 text-slate-500 absolute start-3 pointer-events-none" />
        <select
          value={currentLocale}
          onChange={handleSelect}
          className="appearance-none ps-9 pe-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#0891B2]"
          aria-label="Select Language"
        >
          <option value="en">English (US)</option>
          <option value="ur">اردو (Urdu)</option>
        </select>
      </div>
    );
  }

  // Pill variant: "EN | اردو"
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white/80 hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs hover:shadow-xs transition-all cursor-pointer backdrop-blur-xs select-none ${className}`}
      aria-label={`Switch to ${currentLocale === 'ur' ? 'English' : 'Urdu'}`}
      title={`Switch to ${currentLocale === 'ur' ? 'English' : 'Urdu'}`}
    >
      <Globe className="w-3.5 h-3.5 text-[#0891B2] shrink-0" />
      <span className={currentLocale === 'en' ? 'text-[#0891B2] font-extrabold' : 'text-slate-500'}>
        EN
      </span>
      <span className="text-slate-300">|</span>
      <span className={currentLocale === 'ur' ? 'text-[#6E2D8B] font-extrabold font-arabic' : 'text-slate-500 font-arabic'}>
        اردو
      </span>
    </button>
  );
};
