import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { hasUserSelectedLocale, changeLocale } from '../../i18n/locale';
import type { SupportedLocale } from '../../i18n/types';

export const LanguageSelectModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show on first visit if user hasn't made a choice yet
    if (!hasUserSelectedLocale()) {
      // Small timeout so initial page layout finishes rendering smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSelect = async (locale: SupportedLocale) => {
    await changeLocale(locale, true);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-modal-title"
        >
          {/* Header Botanical Top Bar */}
          <div className="h-2 w-full bg-linear-to-r from-[#0E9EAA] via-[#6E2D8B] to-[#F43F7D]" />

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-[#0891B2] flex items-center justify-center shrink-0 shadow-xs">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 id="lang-modal-title" className="text-lg sm:text-xl font-bold text-slate-900">
                  Choose Your Language
                </h2>
                <p className="text-xs sm:text-sm font-medium text-slate-500 font-arabic" dir="rtl">
                  اپنی پسندیدہ زبان منتخب کریں
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              BioPulse AI offers a fully tailored bilingual experience. You can switch your preferred language at any time in the navigation bar or settings.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* English Option */}
              <button
                type="button"
                onClick={() => handleSelect('en')}
                className="group relative flex flex-col items-start p-4 rounded-xl border-2 border-slate-200 hover:border-[#0891B2] bg-white hover:bg-cyan-50/40 text-left transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-slate-900 text-base group-hover:text-[#0891B2]">
                    English
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    EN
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Continue in English
                </span>
              </button>

              {/* Urdu Option */}
              <button
                type="button"
                onClick={() => handleSelect('ur')}
                className="group relative flex flex-col items-start p-4 rounded-xl border-2 border-slate-200 hover:border-[#6E2D8B] bg-white hover:bg-purple-50/40 text-right transition-all cursor-pointer shadow-xs"
                dir="rtl"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-slate-900 text-lg font-arabic group-hover:text-[#6E2D8B]">
                    اردو
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    UR
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-arabic">
                  اردو میں جاری رکھیں
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
