import React from 'react';
import { motion } from 'framer-motion';
import { Utensils, Sparkles } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';

export const DietPage: React.FC = () => {
  const { userProfile, snapshotMetrics, nutrition, openAiChatWithPrompt } = useUserHealth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left select-none pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7DFEF]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#EDE4F7] text-[#6E2D8B]">
              <Utensils className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold font-display text-[#1C1326]">
              Food, Meals & Nourishment
            </h1>
          </div>
          <p className="text-xs text-[#584B68] mt-1">
            Practical meal ideas tailored to your {userProfile.lifestyle?.dietaryPreference || 'eating preferences'} and cycle rhythm.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAiChatWithPrompt(`Suggest a hormone-friendly Pakistani meal aligned with ${userProfile.lifestyle?.dietaryPreference || 'my nutrition'}`)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask for Meal Ideas</span>
        </button>
      </div>

      {/* Meals Logged Today */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <h2 className="text-base font-bold font-display text-[#1C1326]">
          Today’s Logged Meals
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nutrition.meals.map((meal, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase font-mono text-[#8E3EAF]">
                  {meal.type}
                </span>
                <span className="text-xs font-mono font-bold text-[#1C1326]">
                  {meal.calories} kcal
                </span>
              </div>
              <p className="text-xs font-semibold text-[#1C1326] leading-snug">{meal.name}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {meal.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#E7DFEF] text-[#584B68]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Hormone Phase Meals */}
      <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-[#E7DFEF] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-[#1C1326]">
            Suggested for {snapshotMetrics.phaseName}
          </h2>
          <span className="text-xs font-mono font-bold text-[#6E2D8B] bg-[#EDE4F7] px-3 py-1 rounded-full">
            {userProfile.lifestyle?.dietaryPreference}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nutrition.suggestedMeals.map((sug, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-[#EDE4F7]/60 to-[#FDF2F8]/60 border border-[#D8B4FE]/50 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-[#6E2D8B]">{sug.name}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-[#6E2D8B]">
                  {sug.culturalTag}
                </span>
              </div>
              <p className="text-xs text-[#584B68]">{sug.desc}</p>
              <p className="text-[11px] text-[#8E3EAF] font-medium pt-1">
                ✨ {sug.benefits}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DietPage;
