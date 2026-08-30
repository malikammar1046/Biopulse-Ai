import React, { useState } from 'react';
import { Search, Bell, Plus, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { getTimeBasedGreeting } from '../../utils/profileCompletion';

export const DashboardHeader: React.FC = () => {
  const { userProfile, snapshotMetrics, openAiChatWithPrompt } = useUserHealth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const greeting = getTimeBasedGreeting(userProfile.fullName);

  const notifications = [
    {
      id: 'n1',
      title: `${snapshotMetrics.phaseName} Active`,
      desc: `You are on Cycle Day ${snapshotMetrics.cycleDay} (${snapshotMetrics.totalCycleDays}-day rhythm).`,
      time: 'Just now',
      unread: true,
    },
    {
      id: 'n2',
      title: 'Hydration Target',
      desc: `Daily goal set to ${((userProfile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)}L.`,
      time: '2h ago',
      unread: true,
    },
    {
      id: 'n3',
      title: 'Health Profile Active',
      desc: 'Your personal health data is encrypted and synced.',
      time: 'Today',
      unread: false,
    },
  ];

  return (
    <header className="relative w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7DFEF] select-none">
      {/* ── Left: Greeting & Date Subtitle ── */}
      <div className="space-y-1 text-left">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1C1326] tracking-tight">
            {greeting} <span className="inline-block animate-bounce">👋</span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#584B68] font-sans">
          Here’s your health picture today.
        </p>
      </div>

      {/* ── Right: Date, Search, Notifications & Quick Actions ── */}
      <div className="flex items-center gap-3 self-start md:self-auto">
        {/* Date Display Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#EDE4F7]/60 border border-[#D8B4FE]/40 text-xs font-mono font-bold text-[#6E2D8B]">
          <CalendarIcon className="w-3.5 h-3.5" />
          <span>{todayFormatted}</span>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden lg:flex items-center relative">
          <input
            type="text"
            placeholder="Search symptoms, reports, vitals..."
            className="w-56 px-3.5 py-2 pl-9 rounded-2xl bg-white border border-[#E7DFEF] text-xs text-[#1C1326] placeholder-[#8D7E9E] focus:outline-none focus:ring-2 focus:ring-[#8E3EAF] transition-all"
          />
          <Search className="w-3.5 h-3.5 text-[#8D7E9E] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Notification Bell with Unread Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-2xl bg-white border border-[#E7DFEF] text-[#584B68] hover:text-[#6E2D8B] hover:bg-[#F2ECF7] transition-all cursor-pointer shadow-xs"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E87084] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white border border-[#E7DFEF] shadow-2xl p-4 z-50 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0EAF5]">
                <span className="text-xs font-bold font-mono text-[#1C1326] uppercase">Notifications</span>
                <span className="text-[10px] font-mono text-[#8E3EAF] font-bold">3 New</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-2xl bg-[#F8F5FA] border border-[#E7DFEF]/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1326]">{n.title}</span>
                      <span className="text-[9px] font-mono text-[#8D7E9E]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#584B68] leading-tight">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* "+ Log Today" Quick Action Button */}
        <button
          type="button"
          onClick={() => setShowQuickLogModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-gradient-to-r from-[#6E2D8B] via-[#8E3EAF] to-[#E87084] hover:brightness-110 shadow-md shadow-purple-950/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Log Today</span>
        </button>

        {/* User Profile Avatar */}
        <div className="w-9 h-9 rounded-2xl overflow-hidden border border-[#D8B4FE] bg-[#EDE4F7] flex items-center justify-center shrink-0 shadow-xs">
          {userProfile.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold font-mono text-[#6E2D8B]">
              {userProfile.fullName.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Log Modal Overlay */}
      {showQuickLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E7DFEF] p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EAF5]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8E3EAF]" />
                <h3 className="text-sm font-bold font-display text-[#1C1326]">Quick Health Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickLogModal(false)}
                className="text-xs text-[#8D7E9E] hover:text-[#1C1326]"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#584B68]">
              What would you like to log for today ({todayFormatted})?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: '🩸 Period Flow', desc: 'Light / Medium / Heavy' },
                { title: '⚡ Symptoms', desc: 'Cramps, Acne, Bloating' },
                { title: '🥗 Meal Log', desc: 'Breakfast, Lunch, Dinner' },
                { title: '🏃 Movement', desc: 'Workout or Walking' },
                { title: '💊 Medication', desc: 'Metformin, Inositol' },
                { title: '💧 Water Intake', desc: '+1 Glass (250ml)' },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setShowQuickLogModal(false);
                    openAiChatWithPrompt(`I would like to log: ${item.title}`);
                  }}
                  className="p-3 rounded-2xl bg-[#F8F5FA] hover:bg-[#EDE4F7] border border-[#E7DFEF] text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#1C1326] block">{item.title}</span>
                  <span className="text-[10px] text-[#8D7E9E]">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
