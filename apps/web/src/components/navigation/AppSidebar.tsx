import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid01,
  CalendarCheck01,
  Activity,
  ActivityHeart,
  Scales01,
  File06,
  MedicalCross,
  Settings01,
  LogOut01,
  MessageChatCircle,
  ClipboardCheck,
  LineChartUp01,
  ChevronDown,
  Calendar,
} from '../icons';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import { resolvePathway } from '../../types/onboarding';
import { Logo } from '../brand/Logo';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useUserHealth();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const overviewPath = getPathwayDashboardRoute(userProfile);
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const brandTagline =
    pathway === 'male'
      ? "Men's Health Intelligence"
      : pathway === 'female'
      ? "Women's Health Intelligence"
      : 'Unified Health Intelligence';

  const isOverviewActive =
    location.pathname === overviewPath ||
    location.pathname === ROUTES.APP.ROOT ||
    location.pathname === ROUTES.APP.DASHBOARD;

  const isItemActive = (path: string) => {
    if (path === overviewPath) {
      return isOverviewActive;
    }
    return location.pathname === path;
  };

  // Section 1: MAIN
  const maleMainItems: NavItem[] = [
    { label: 'Overview', path: overviewPath, icon: LayoutGrid01 },
    { label: 'Lifestyle & Nutrition', path: ROUTES.APP.LIFESTYLE, icon: Scales01 },
    { label: 'Screening', path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: 'Progress', path: ROUTES.APP.PROGRESS, icon: LineChartUp01 },
  ];

  const femaleMainItems: NavItem[] = [
    { label: 'Overview', path: overviewPath, icon: LayoutGrid01 },
    { label: 'Screening', path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: 'Progress', path: ROUTES.APP.PROGRESS, icon: LineChartUp01 },
  ];

  const mainItems = pathway === 'female' ? femaleMainItems : maleMainItems;

  // Section 2: HEALTH
  const maleHealthItems: NavItem[] = [
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: File06 },
    { label: 'Appointments', path: ROUTES.APP.APPOINTMENTS, icon: CalendarCheck01 },
  ];

  const femaleHealthItems: NavItem[] = [
    { label: 'Lifestyle & Nutrition', path: ROUTES.APP.LIFESTYLE, icon: Scales01 },
    { label: 'Fitness / Movement', path: ROUTES.APP.FITNESS, icon: Activity },
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: File06 },
    { label: 'Appointments', path: ROUTES.APP.APPOINTMENTS, icon: CalendarCheck01 },
  ];

  const healthItems = pathway === 'female' ? femaleHealthItems : maleHealthItems;

  // Section 3: DAILY TRACKING (Collapsible, female gets Cycle, male never gets Cycle)
  const trackingGroup: NavGroup = {
    id: 'tracking',
    title: 'Daily Tracking',
    icon: ActivityHeart,
    items: [
      ...(pathway === 'female'
        ? [{ label: 'Cycle', path: ROUTES.APP.CYCLE, icon: Calendar }]
        : []),
      { label: 'Symptoms', path: ROUTES.APP.SYMPTOMS, icon: ActivityHeart },
      ...(pathway === 'male'
        ? [{ label: 'Fitness', path: ROUTES.APP.FITNESS, icon: Activity }]
        : []),
      { label: 'Medications', path: ROUTES.APP.MEDICATIONS, icon: MedicalCross },
    ],
  };

  // Section 4: TOOLS
  const toolItems: NavItem[] = [
    { label: pathway === 'female' ? 'AI Companion' : 'AI Assistant', path: ROUTES.APP.CHAT, icon: MessageChatCircle },
  ];

  // Section 5: ACCOUNT
  const accountItems: NavItem[] = [
    { label: 'Profile & Settings', path: ROUTES.APP.SETTINGS, icon: Settings01 },
  ];

  // Collapsible tracking open/closed state (auto-opens if on a tracking page)
  const isTrackingActive = trackingGroup.items.some((i) => isItemActive(i.path));
  const [isTrackingOpen, setIsTrackingOpen] = useState(isTrackingActive);

  useEffect(() => {
    if (isTrackingActive) {
      setIsTrackingOpen(true);
    }
  }, [location.pathname, isTrackingActive]);

  const isFemale = pathway === 'female';

  // Dynamic theme styling - Unified #29b6f6 primary accent with restrained tones
  const sidebarContainerClass =
    'w-64 bg-white border-r border-[#EAECF0] text-[#111318] flex flex-col h-screen sticky top-0 p-4 hidden md:flex shrink-0 select-none z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';

  const sectionLabelClass =
    'text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2.5 block mb-1';

  const getLinkClasses = (active: boolean) => {
    if (active) {
      return isFemale
        ? 'bg-[#FDE6EF] text-[#F43F7D] border border-[#F43F7D]/25 font-semibold shadow-xs'
        : 'bg-[#E1F5FE] text-[#0288D1] border border-[#B3E5FC] font-semibold shadow-xs';
    }
    return 'border-transparent text-[#475569] hover:bg-slate-50 hover:text-[#0F172A] font-medium';
  };

  const getIconClasses = (active: boolean) => {
    if (active) {
      return isFemale ? 'text-[#F43F7D]' : 'text-[#29B6F6]';
    }
    return 'text-[#64748B] group-hover:text-[#0F172A]';
  };

  const getDotClass = () => (isFemale ? 'bg-[#F43F7D]' : 'bg-[#29B6F6]');

  return (
    <aside className={sidebarContainerClass}>
      {/* Brand Logo at Top */}
      <div className="px-2 py-2 shrink-0">
        <Link to={overviewPath} className="flex items-center">
          <Logo size="sm" theme="light" showTagline tagline={brandTagline} />
        </Link>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden my-3 pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        {/* ── 1. MAIN Section ── */}
        <nav className="space-y-1">
          <span className={sectionLabelClass}>
            Main
          </span>

          {mainItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group border ${getLinkClasses(active)}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-5 h-5 transition-colors ${getIconClasses(active)}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>
                {active && <span className={`w-1.5 h-1.5 rounded-full ${getDotClass()}`} />}
              </Link>
            );
          })}
        </nav>

        {/* ── 2. HEALTH Section ── */}
        <nav className="space-y-1 pt-1">
          <span className={sectionLabelClass}>
            Health
          </span>

          {healthItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group border ${getLinkClasses(active)}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-5 h-5 transition-colors ${getIconClasses(active)}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>
                {active && <span className={`w-1.5 h-1.5 rounded-full ${getDotClass()}`} />}
              </Link>
            );
          })}
        </nav>

        {/* ── 3. DAILY TRACKING (Collapsible) ── */}
        <div className="pt-1">
          <div className="rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsTrackingOpen(!isTrackingOpen)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer select-none group border ${
                isTrackingActive && !isTrackingOpen
                  ? (isFemale ? 'bg-[#FDE6EF] text-[#F43F7D] border-[#F43F7D]/25' : 'bg-[#E1F5FE] text-[#0288D1] border-[#B3E5FC]')
                  : 'border-transparent text-[#475569] hover:text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <ActivityHeart className={`w-5 h-5 shrink-0 ${isTrackingActive ? (isFemale ? 'text-[#F43F7D]' : 'text-[#29B6F6]') : 'text-[#64748B] group-hover:text-[#0F172A]'}`} aria-hidden="true" />
                <span className="truncate">Daily Tracking</span>
                {isTrackingActive && !isTrackingOpen && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isFemale ? 'bg-[#F43F7D]' : 'bg-[#29B6F6]'}`} />
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B]">
                  {trackingGroup.items.length}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                    isTrackingOpen ? (isFemale ? 'rotate-180 text-[#F43F7D]' : 'rotate-180 text-[#29B6F6]') : ''
                  }`}
                  aria-hidden="true"
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isTrackingOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="ml-3 pl-2.5 my-1 border-l-2 border-[#E2E8F0] space-y-0.5">
                    {trackingGroup.items.map((item) => {
                      const active = isItemActive(item.path);
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-150 group border ${
                            active
                              ? (isFemale
                                  ? 'bg-[#FDE6EF] text-[#F43F7D] border-[#F43F7D]/25 font-semibold shadow-xs'
                                  : 'bg-[#E1F5FE] text-[#0288D1] border-[#B3E5FC] font-semibold shadow-xs')
                              : 'border-transparent text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemIcon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                active ? (isFemale ? 'text-[#F43F7D]' : 'text-[#29B6F6]') : 'text-[#64748B] group-hover:text-[#0F172A]'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {active && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isFemale ? 'bg-[#F43F7D]' : 'bg-[#29B6F6]'}`} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 4. TOOLS Section (Male Only) ── */}
        {!isFemale && (
          <nav className="space-y-1 pt-1">
            <span className={sectionLabelClass}>
              Tools
            </span>

            {toolItems.map((item) => {
              const active = isItemActive(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group border ${getLinkClasses(active)}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-5 h-5 transition-colors ${getIconClasses(active)}`}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </div>
                  {active && <span className={`w-1.5 h-1.5 rounded-full ${getDotClass()}`} />}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── 5. ACCOUNT & Bottom Area ── */}
      <div className="pt-3 border-t border-[#EAECF0] space-y-2.5 shrink-0">
        <nav className="space-y-1">
          {accountItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors border ${
                  active
                    ? (isFemale
                        ? 'bg-[#FDE6EF] text-[#F43F7D] border-[#F43F7D]/25 font-semibold'
                        : 'bg-[#E1F5FE] text-[#0288D1] border-[#B3E5FC] font-semibold')
                    : 'border-transparent text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? (isFemale ? 'text-[#F43F7D]' : 'text-[#29B6F6]') : 'text-[#64748B] group-hover:text-[#0F172A]'}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card */}
        {(() => {
          const displayName =
            userProfile?.fullName ||
            (userProfile?.email ? userProfile.email.split('@')[0] : 'User');
          const displayEmail = userProfile?.email || '';
          const initial = displayName.charAt(0).toUpperCase() || 'U';

          return (
            <div className="p-2.5 rounded-xl bg-white border border-[#EAECF0] flex items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full overflow-hidden border flex items-center justify-center shrink-0 ${
                  isFemale ? 'border-[#F43F7D]/30 bg-[#F43F7D]' : 'border-[#B3E5FC] bg-[#29B6F6]'
                }`}>
                  {userProfile?.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white font-mono">
                      {initial}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#111318] block truncate">
                    {displayName}
                  </span>
                  <span className="text-[9px] text-[#667085] block truncate">
                    {displayEmail}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              >
                <LogOut01 className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};

export default AppSidebar;
