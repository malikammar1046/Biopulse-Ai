import React, { useState } from 'react';
import { SearchLg, Bell01, Plus, Calendar, Edit01 } from '@untitledui/icons';
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
      title: snapshotMetrics.cycleDay > 0 ? `${snapshotMetrics.phaseName} Active` : 'Track Your Cycle',
      desc: snapshotMetrics.cycleDay > 0
        ? `You are on Cycle Day ${snapshotMetrics.cycleDay} (${snapshotMetrics.totalCycleDays}-day cycle).`
        : 'Log your first period to activate live cycle day tracking.',
      time: 'Just now',
      unread: true,
    },
    {
      id: 'n2',
      title: 'Water Goal',
      desc: `Your daily target is ${((userProfile.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)}L (${userProfile.lifestyle?.dailyWaterGlasses || 8} glasses).`,
      time: '2h ago',
      unread: true,
    },
    {
      id: 'n3',
      title: 'Health Records Private',
      desc: 'Your personal health data is privately encrypted with Row Level Security (RLS).',
      time: 'Today',
      unread: false,
    },
  ];

  return (
    <header className="relative w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0] select-none">
      {/* ── Left: Greeting & Date Subtitle ── */}
      <div className="space-y-1 text-left">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#0F172A] tracking-tight">
            {greeting}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#64748B] font-sans">
          Here’s your clinical health summary today.
        </p>
      </div>

      {/* ── Right: Date, Search, Notifications & Quick Actions ── */}
      <div className="flex items-center gap-3 self-start md:self-auto">
        {/* Date Display Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono font-bold text-[#0288D1]">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{todayFormatted}</span>
        </div>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden lg:flex items-center relative">
          <input
            type="text"
            placeholder="Search symptoms, lab reports, meals..."
            className="w-56 px-3.5 py-2 pl-9 rounded-2xl bg-white border border-[#E2E8F0] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0288D1] transition-all"
          />
          <SearchLg className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        </div>

        {/* Notification Bell with Unread Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-2xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0288D1] hover:bg-[#F8FAFC] transition-all cursor-pointer shadow-xs"
            aria-label="Notifications"
          >
            <Bell01 className="w-4 h-4" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0288D1] text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-xs">
              3
            </span>
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-white border border-[#E2E8F0] shadow-2xl p-4 z-50 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold font-mono text-[#0F172A] uppercase">Notifications</span>
                <span className="text-[10px] font-mono text-[#0288D1] font-bold">3 New</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">{n.title}</span>
                      <span className="text-[9px] font-mono text-[#64748B]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-tight">{n.desc}</p>
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
          className="flex items-center gap-2 px-4 py-2 rounded-2xl font-sans font-bold text-xs text-white bg-[#0288D1] hover:bg-[#0277BD] shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span>Log Today</span>
        </button>

        {/* User Profile Avatar */}
        <div className="w-9 h-9 rounded-2xl overflow-hidden border border-[#BAE6FD] bg-[#E0F2FE] flex items-center justify-center shrink-0 shadow-xs">
          {userProfile.avatarUrl ? (
            <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold font-mono text-[#0288D1]">
              {userProfile.fullName.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Quick Log Modal Overlay */}
      {showQuickLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#E2E8F0] p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Edit01 className="w-4 h-4 text-[#0288D1]" aria-hidden="true" />
                <h3 className="text-sm font-bold font-display text-[#0F172A]">Quick Daily Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickLogModal(false)}
                className="text-xs text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#64748B]">
              What would you like to log for today ({todayFormatted})?
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { title: 'Cycle Details', desc: 'Flow or symptoms' },
                { title: 'Symptoms', desc: 'Energy, Fatigue, Mood' },
                { title: 'Food & Meals', desc: 'Breakfast, Lunch, Dinner' },
                { title: 'Movement', desc: 'Walking or home exercise' },
                { title: 'Medications', desc: 'Prescriptions & vitamins' },
                { title: 'Water Intake', desc: '+1 Glass (250ml)' },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setShowQuickLogModal(false);
                    openAiChatWithPrompt(`I would like to log: ${item.title}`);
                  }}
                  className="p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#E0F2FE] border border-[#E2E8F0] text-left transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#0F172A] block">{item.title}</span>
                  <span className="text-[10px] text-[#64748B]">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
