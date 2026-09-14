import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Activity,
  Utensils,
  Dumbbell,
  FileText,
  Pill,
  Stethoscope,
  Settings,
  LogOut,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
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
  const mainItems: NavItem[] = [
    { label: 'Overview', path: overviewPath, icon: LayoutDashboard },
    { label: 'Nutrition Plan', path: ROUTES.APP.DIET, icon: Utensils },
    { label: 'Screening', path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: 'Progress', path: ROUTES.APP.PROGRESS, icon: TrendingUp },
  ];

  // Section 2: HEALTH
  const healthItems: NavItem[] = [
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: FileText },
    { label: 'Appointments', path: ROUTES.APP.APPOINTMENTS, icon: Stethoscope },
  ];

  // Section 3: DAILY TRACKING (Collapsible, female gets Cycle, male never gets Cycle)
  const trackingGroup: NavGroup = {
    id: 'tracking',
    title: 'Daily Tracking',
    icon: Activity,
    items: [
      ...(pathway === 'female'
        ? [{ label: 'Cycle', path: ROUTES.APP.CYCLE, icon: Calendar }]
        : []),
      { label: 'Symptoms', path: ROUTES.APP.SYMPTOMS, icon: Activity },
      { label: 'Fitness', path: ROUTES.APP.FITNESS, icon: Dumbbell },
      { label: 'Medications', path: ROUTES.APP.MEDICATIONS, icon: Pill },
    ],
  };

  // Section 4: TOOLS
  const toolItems: NavItem[] = [
    { label: 'AI Assistant', path: ROUTES.APP.CHAT, icon: Sparkles },
  ];

  // Section 5: ACCOUNT
  const accountItems: NavItem[] = [
    { label: 'Profile & Settings', path: ROUTES.APP.SETTINGS, icon: Settings },
  ];

  // Collapsible tracking open/closed state (auto-opens if on a tracking page)
  const isTrackingActive = trackingGroup.items.some((i) => isItemActive(i.path));
  const [isTrackingOpen, setIsTrackingOpen] = useState(isTrackingActive);

  useEffect(() => {
    if (isTrackingActive) {
      setIsTrackingOpen(true);
    }
  }, [location.pathname, isTrackingActive]);

  return (
    <aside className="w-64 bg-[#F0F9FF] border-r border-[#BAE6FD] text-[#0F172A] flex flex-col h-screen sticky top-0 p-4 hidden md:flex shrink-0 select-none z-30 shadow-xs">
      {/* Brand Logo at Top */}
      <div className="px-2 py-2 shrink-0">
        <Link to={overviewPath} className="flex items-center">
          <Logo size="sm" theme="light" showTagline tagline={brandTagline} />
        </Link>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden my-3 pr-1 space-y-4 scrollbar-thin scrollbar-thumb-sky-200 hover:scrollbar-thumb-sky-300">
        {/* ── 1. MAIN Section ── */}
        <nav className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0288D1] px-2.5 block mb-1">
            Main
          </span>

          {mainItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group border ${
                  active
                    ? 'bg-[#0288D1] text-white border-[#0288D1] font-bold shadow-xs'
                    : 'border-transparent text-[#334155] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? 'text-white' : 'text-[#0288D1] group-hover:text-[#0288D1]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>

        {/* ── 2. HEALTH Section ── */}
        <nav className="space-y-1 pt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0288D1] px-2.5 block mb-1">
            Health
          </span>

          {healthItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group border ${
                  active
                    ? 'bg-[#0288D1] text-white border-[#0288D1] font-bold shadow-xs'
                    : 'border-transparent text-[#334155] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? 'text-white' : 'text-[#0288D1] group-hover:text-[#0288D1]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
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
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer select-none group border ${
                isTrackingActive && !isTrackingOpen
                  ? 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
                  : 'border-transparent text-[#334155] hover:text-[#0288D1] hover:bg-[#E0F2FE]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Activity className="w-4 h-4 text-[#0288D1] shrink-0" />
                <span className="truncate">Daily Tracking</span>
                {isTrackingActive && !isTrackingOpen && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#29B6F6] shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white text-[#0288D1] border border-[#BAE6FD]">
                  {trackingGroup.items.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${
                    isTrackingOpen ? 'rotate-180 text-[#0288D1]' : ''
                  }`}
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
                  <div className="ml-3 pl-2.5 my-1 border-l-2 border-[#BAE6FD] space-y-0.5">
                    {trackingGroup.items.map((item) => {
                      const active = isItemActive(item.path);
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 group border ${
                            active
                              ? 'bg-[#0288D1] text-white border-[#0288D1] font-semibold shadow-xs'
                              : 'border-transparent text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemIcon
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                active
                                  ? 'text-white'
                                  : 'text-[#0288D1] group-hover:text-[#0288D1]'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
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

        {/* ── 4. TOOLS Section ── */}
        <nav className="space-y-1 pt-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0288D1] px-2.5 block mb-1">
            Tools
          </span>

          {toolItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group border ${
                  active
                    ? 'bg-[#0288D1] text-white border-[#0288D1] font-bold shadow-xs'
                    : 'border-transparent text-[#334155] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? 'text-white' : 'text-[#0288D1] group-hover:text-[#0288D1]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── 5. ACCOUNT & Bottom Area ── */}
      <div className="pt-3 border-t border-[#BAE6FD] space-y-2.5 shrink-0">
        <nav className="space-y-1">
          {accountItems.map((item) => {
            const active = isItemActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                  active
                    ? 'bg-[#0288D1] text-white border-[#0288D1]'
                    : 'border-transparent text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#0288D1]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Card */}
        <div className="p-2.5 rounded-xl bg-white border border-[#BAE6FD] flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#BAE6FD] bg-[#0288D1] flex items-center justify-center shrink-0">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-white font-mono">
                  {userProfile.fullName.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#0F172A] block truncate">
                {userProfile.fullName}
              </span>
              <span className="text-[9px] text-[#64748B] block truncate">
                {userProfile.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#E0F2FE] transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
