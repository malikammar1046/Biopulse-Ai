import React, { useState } from 'react';
import { SearchLg, Bell01, ChevronDown } from '@untitledui/icons';
import { useUserHealth } from '../../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../../types/onboarding';
import { UserAvatar } from '../../common/UserAvatar';

interface ExecutiveDashboardHeaderProps {
  timeframe: 'today' | 'week' | 'month';
  onTimeframeChange: (timeframe: 'today' | 'week' | 'month') => void;
  onSearch?: (query: string) => void;
  pathwayOverride?: HealthPathway;
}

export const ExecutiveDashboardHeader: React.FC<ExecutiveDashboardHeaderProps> = ({
  timeframe,
  onTimeframeChange,
  onSearch,
  pathwayOverride,
}) => {
  const { userProfile, openAiChatWithPrompt } = useUserHealth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const pathway = pathwayOverride || resolvePathway(userProfile.gender, userProfile.pathway);

  const pathwayMeta = {
    female: {
      title: 'BioPulse AI',
      subtitle: "Your personalized women's health and PCOS companion",
      badge: "Women's Health & PCOS Screening",
      badgeClass: 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]',
    },
    male: {
      title: 'BioPulse AI',
      subtitle: "Your personalized men's health and hypogonadism screening companion",
      badge: "Men's Health • Hypogonadism Screening",
      badgeClass: 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]',
    },
    general: {
      title: 'BioPulse AI',
      subtitle: 'Your personalized health intelligence companion',
      badge: 'Baseline Health & Wellness',
      badgeClass: 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]',
    },
  }[pathway];

  const fullName = userProfile.fullName?.trim() || 'Health Member';
  const email = userProfile.email || 'member@biopulse.ai';

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeframeLabels = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  return (
    <div className="space-y-4 select-none text-left">
      {/* ── Top Bar: User Profile & Controls ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* User Card & Greeting Title */}
        <div className="space-y-2">
          {/* User pill profile & pathway badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E8F0] shadow-xs">
              <UserAvatar
                avatarUrl={userProfile.avatarUrl}
                name={fullName}
                email={email}
                size="sm"
                pathway={pathway}
                gender={userProfile.gender}
                showBorder={false}
              />
              <div className="leading-tight">
                <span className="text-xs font-bold font-display text-[#0F172A] block">
                  {fullName}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono block">
                  {email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] ml-1" />
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${pathwayMeta.badgeClass}`}>
              {pathwayMeta.badge}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-[#0F172A] tracking-tight">
              {pathwayMeta.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#475569] font-sans">
              {pathwayMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Tools: Search Bar, Notifications, Date, Timeframe Filter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Search Bar Input */}
          <div className="relative flex-1 sm:flex-initial">
            <SearchLg className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="w-full sm:w-56 h-10 pl-9 pr-4 rounded-full bg-white border border-[#E2E8F0] text-xs font-sans text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#29B6F6] shadow-xs transition-all"
            />
          </div>

          {/* Notifications Bell Button */}
          <button
            type="button"
            onClick={() => openAiChatWithPrompt('What are my upcoming health tasks and reminders for today?')}
            className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#475569] hover:text-[#0288D1] hover:border-[#BAE6FD] shadow-xs relative transition-all cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell01 className="w-4 h-4" aria-hidden="true" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0288D1] border-2 border-white" />
          </button>

          {/* Date String */}
          <span className="text-xs font-mono text-[#64748B] px-2 hidden sm:inline-block">
            {todayStr}
          </span>

          {/* Timeframe Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTimeframeOpen((prev) => !prev)}
              className="h-10 px-4 rounded-full bg-white border border-[#E2E8F0] text-xs font-bold text-[#0F172A] hover:border-[#BAE6FD] shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{timeframeLabels[timeframe]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform ${isTimeframeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTimeframeOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-white border border-[#E2E8F0] shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                {(['today', 'week', 'month'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      onTimeframeChange(t);
                      setIsTimeframeOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      timeframe === t
                        ? 'bg-[#E0F2FE] text-[#0288D1]'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    {timeframeLabels[t]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
