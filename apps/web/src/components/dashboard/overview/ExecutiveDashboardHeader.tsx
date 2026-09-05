import React, { useState } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { useUserHealth } from '../../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../../types/onboarding';

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
      title: 'OvaSense AI',
      subtitle: "Your personalized women's health companion",
      badge: "Women's Health & PCOS Screening",
      badgeClass: 'bg-[#6E2D8B]/10 text-[#8E3EAF] border-[#8E3EAF]/30',
    },
    male: {
      title: 'AndroSense AI',
      subtitle: "Your personalized men's health companion",
      badge: "Men's Health & Hormone Vitality",
      badgeClass: 'bg-[#0284C7]/10 text-[#0284C7] border-[#38BDF8]/30',
    },
    general: {
      title: 'VITASense',
      subtitle: 'Your personalized health companion',
      badge: 'Baseline Health & Wellness',
      badgeClass: 'bg-[#8B5CF6]/10 text-[#7C3AED] border-[#A78BFA]/30',
    },
  }[pathway];

  const fullName = userProfile.fullName?.trim() || 'Health Member';
  const email = userProfile.email || 'member@vitasense.health';
  const avatarUrl =
    userProfile.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

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
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#E7DFEF] shadow-xs">
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-7 h-7 rounded-full object-cover border border-[#D8B4FE]"
              />
              <div className="leading-tight">
                <span className="text-xs font-bold font-display text-[#1C1326] block">
                  {fullName}
                </span>
                <span className="text-[10px] text-[#8D7E9E] font-mono block">
                  {email}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8D7E9E] ml-1" />
            </div>

            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${pathwayMeta.badgeClass}`}>
              {pathwayMeta.badge}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-[#1C1326] tracking-tight">
              {pathwayMeta.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#736384] font-sans">
              {pathwayMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Tools: Search Bar, Notifications, Date, Timeframe Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8D7E9E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="w-44 sm:w-56 h-10 pl-9 pr-4 rounded-full bg-white border border-[#E7DFEF] text-xs font-sans text-[#1C1326] placeholder-[#A797BD] focus:outline-none focus:border-[#8E3EAF] shadow-xs transition-all"
            />
          </div>

          {/* Notifications Bell Button */}
          <button
            type="button"
            onClick={() => openAiChatWithPrompt('What are my upcoming health tasks and reminders for today?')}
            className="w-10 h-10 rounded-full bg-white border border-[#E7DFEF] flex items-center justify-center text-[#584B68] hover:text-[#6E2D8B] hover:border-[#D8B4FE] shadow-xs relative transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FB7185] border-2 border-white" />
          </button>

          {/* Date String */}
          <span className="text-xs font-mono text-[#8D7E9E] px-2 hidden sm:inline-block">
            {todayStr}
          </span>

          {/* Timeframe Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTimeframeOpen((prev) => !prev)}
              className="h-10 px-4 rounded-full bg-white border border-[#E7DFEF] text-xs font-bold text-[#1C1326] hover:border-[#D8B4FE] shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{timeframeLabels[timeframe]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#8D7E9E] transition-transform ${isTimeframeOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTimeframeOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-white border border-[#E7DFEF] shadow-xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
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
                        ? 'bg-[#EDE4F7] text-[#6E2D8B] font-bold'
                        : 'text-[#584B68] hover:bg-[#F8F5FA]'
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
