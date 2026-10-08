import React from 'react';
import { ActivityHeart, Plus, MessageChatCircle, Calendar } from '@untitledui/icons';
import type { UserProfile } from '../../types/onboarding';

interface PersonalizedFitnessHeaderProps {
  userProfile: UserProfile;
  cycleDay: number;
  cyclePhaseName: string;
  todayMinutes: number;
  weeklyTotalMinutes: number;
  onOpenLogModal: () => void;
  onAskAi: () => void;
}

export const PersonalizedFitnessHeader: React.FC<PersonalizedFitnessHeaderProps> = ({
  userProfile,
  cycleDay,
  cyclePhaseName,
  todayMinutes,
  weeklyTotalMinutes,
  onOpenLogModal,
  onAskAi,
}) => {
  const isMale = userProfile.pathway === 'male' || userProfile.gender === 'male';
  const movementPreferences =
    userProfile.lifestyle?.exercisePreferences?.join(', ') || 'Walking, Yoga & Gentle Movement';

  const accentColor = !isMale ? '#F43F7D' : '#0288D1';
  const accentHover = !isMale ? '#DC326C' : '#0277BD';

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-white text-[#111318] shadow-xs relative overflow-hidden select-none border border-[#EAECF0] text-left">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Context Badges, Tags & Summary */}
        <div className="space-y-3.5 max-w-2xl flex-1">
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold ${
                !isMale
                  ? 'bg-[#FDE6EF] text-[#DC326C] border border-[rgba(244,63,125,0.2)]'
                  : 'bg-[#F0F9FF] text-[#0288D1] border border-[#BAE6FD]'
              }`}
            >
              <ActivityHeart
                className={`w-3.5 h-3.5 ${!isMale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
                aria-hidden="true"
              />
              <span>{!isMale ? 'Cycle-Synced Movement' : 'Daily Vitality & Functional Movement'}</span>
            </span>

            {!isMale && cycleDay > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#F8FAFC] text-[#344054] border border-[#EAECF0]">
                <Calendar className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
                <span>Day {cycleDay} • {cyclePhaseName}</span>
              </span>
            )}
          </div>

          {/* Profile Context Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#FAFAFC] text-[#344054] border border-[#EAECF0]">
              Preferred: <strong className="text-[#111318] font-semibold">{movementPreferences}</strong>
            </span>

            <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-[#FAFAFC] text-[#344054] border border-[#EAECF0]">
              Activity: <strong className="text-[#111318] capitalize">{userProfile.lifestyle?.activityLevel || 'Moderate'}</strong>
            </span>
          </div>

          {/* Today's Quick Summary Pill */}
          <div
            className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs ${
              !isMale
                ? 'bg-[#FDE6EF]/30 border border-[rgba(244,63,125,0.2)] text-[#64748B]'
                : 'bg-[#F0F9FF]/60 border border-[#BAE6FD] text-[#475569]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ActivityHeart
                className={`w-4 h-4 shrink-0 ${!isMale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
                aria-hidden="true"
              />
              <span>
                {todayMinutes > 0 ? (
                  <><strong>{todayMinutes} minutes</strong> logged today</>
                ) : (
                  'No movement logged yet today'
                )}
              </span>
            </div>

            <span
              className={`font-mono text-[11px] font-bold ${
                !isMale ? 'text-[#DC326C]' : 'text-[#0288D1]'
              }`}
            >
              {weeklyTotalMinutes} min this week
            </span>
          </div>
        </div>

        {/* Right Column: CTAs */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenLogModal}
            className="h-10 px-4 rounded-xl font-sans font-medium text-sm text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
          >
            <Plus className="w-4 h-4 text-white" aria-hidden="true" />
            <span>Log Activity</span>
          </button>

          <button
            type="button"
            onClick={onAskAi}
            className="h-10 px-4 rounded-xl font-sans font-medium text-sm text-[#344054] bg-[#FAFAFC] hover:bg-[#F2F4F7] border border-[#EAECF0] shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <MessageChatCircle
              className={`w-4 h-4 ${!isMale ? 'text-[#F43F7D]' : 'text-[#0288D1]'}`}
              aria-hidden="true"
            />
            <span>Movement Guidance</span>
          </button>

          <span className="text-[10px] font-mono text-[#98A2B3] text-center pt-0.5">
            🌱 Educational suggestions • Non-diagnostic
          </span>
        </div>
      </div>
    </div>
  );
};
