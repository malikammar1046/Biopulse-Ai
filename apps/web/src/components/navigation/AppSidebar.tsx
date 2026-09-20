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
  const maleMainItems: NavItem[] = [
    { label: 'Overview', path: overviewPath, icon: LayoutDashboard },
    { label: 'Nutrition Plan', path: ROUTES.APP.DIET, icon: Utensils },
    { label: 'Screening', path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: 'Progress', path: ROUTES.APP.PROGRESS, icon: TrendingUp },
  ];

  const femaleMainItems: NavItem[] = [
    { label: 'Overview', path: overviewPath, icon: LayoutDashboard },
    { label: 'Screening', path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: 'Progress', path: ROUTES.APP.PROGRESS, icon: TrendingUp },
  ];

  const mainItems = pathway === 'female' ? femaleMainItems : maleMainItems;

  // Section 2: HEALTH
  const maleHealthItems: NavItem[] = [
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: FileText },
    { label: 'Appointments', path: ROUTES.APP.APPOINTMENTS, icon: Stethoscope },
  ];

  const femaleHealthItems: NavItem[] = [
    { label: 'Nutrition', path: ROUTES.APP.DIET, icon: Utensils },
    { label: 'Fitness / Movement', path: ROUTES.APP.FITNESS, icon: Dumbbell },
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: FileText },
    { label: 'Appointments', path: ROUTES.APP.APPOINTMENTS, icon: Stethoscope },
  ];

  const healthItems = pathway === 'female' ? femaleHealthItems : maleHealthItems;

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
      ...(pathway === 'male'
        ? [{ label: 'Fitness', path: ROUTES.APP.FITNESS, icon: Dumbbell }]
        : []),
      { label: 'Medications', path: ROUTES.APP.MEDICATIONS, icon: Pill },
    ],
  };

  // Section 4: TOOLS
  const toolItems: NavItem[] = [
    { label: pathway === 'female' ? 'AI Companion' : 'AI Assistant', path: ROUTES.APP.CHAT, icon: Sparkles },
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

  const isFemale = pathway === 'female';

  // Dynamic theme styling
  const sidebarContainerClass = isFemale
    ? 'w-64 bg-[#FAFAFC] border-r border-[#EAECF0] text-[#111318] flex flex-col h-screen sticky top-0 p-4 hidden md:flex shrink-0 select-none z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
    : 'w-64 bg-[#F0F9FF] border-r border-[#BAE6FD] text-[#0F172A] flex flex-col h-screen sticky top-0 p-4 hidden md:flex shrink-0 select-none z-30 shadow-xs';

  const sectionLabelClass = isFemale
    ? 'text-[11px] font-semibold text-[#98A2B3] tracking-wide px-2.5 block mb-1 uppercase'
    : 'text-[10px] font-mono font-bold uppercase tracking-wider text-[#0288D1] px-2.5 block mb-1';

  const getLinkClasses = (active: boolean) => {
    if (isFemale) {
      return active
        ? 'bg-[#FBE7F0] text-[#A92D61] border border-[#FCE1ED] font-semibold shadow-xs'
        : 'border-transparent text-[#667085] hover:bg-[#FFF5F9] hover:text-[#E84A8A] font-medium';
    }
    return active
      ? 'bg-[#0288D1] text-white border-[#0288D1] font-bold shadow-xs'
      : 'border-transparent text-[#334155] hover:bg-[#E0F2FE] hover:text-[#0288D1] font-semibold';
  };

  const getIconClasses = (active: boolean) => {
    if (isFemale) {
      return active ? 'text-[#E84A8A]' : 'text-[#667085] group-hover:text-[#E84A8A]';
    }
    return active ? 'text-white' : 'text-[#0288D1] group-hover:text-[#0288D1]';
  };

  const getDotClass = () => (isFemale ? 'bg-[#E84A8A]' : 'bg-white');

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
                    className={`w-4 h-4 transition-colors ${getIconClasses(active)}`}
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
                    className={`w-4 h-4 transition-colors ${getIconClasses(active)}`}
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
                  ? isFemale
                    ? 'bg-[#FBE7F0] text-[#A92D61] border-[#FCE1ED]'
                    : 'bg-[#E0F2FE] text-[#0288D1] border-[#BAE6FD]'
                  : isFemale
                  ? 'border-transparent text-[#667085] hover:text-[#E84A8A] hover:bg-[#FFF5F9]'
                  : 'border-transparent text-[#334155] hover:text-[#0288D1] hover:bg-[#E0F2FE]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Activity className={`w-4 h-4 shrink-0 ${isFemale ? 'text-[#E84A8A]' : 'text-[#0288D1]'}`} />
                <span className="truncate">Daily Tracking</span>
                {isTrackingActive && !isTrackingOpen && (
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isFemale ? 'bg-[#E84A8A]' : 'bg-[#29B6F6]'}`} />
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white border ${
                  isFemale ? 'text-[#A92D61] border-[#FCE1ED]' : 'text-[#0288D1] border-[#BAE6FD]'
                }`}>
                  {trackingGroup.items.length}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${
                    isTrackingOpen ? `rotate-180 ${isFemale ? 'text-[#E84A8A]' : 'text-[#0288D1]'}` : ''
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
                  <div className={`ml-3 pl-2.5 my-1 border-l-2 space-y-0.5 ${
                    isFemale ? 'border-[#FBE7F0]' : 'border-[#BAE6FD]'
                  }`}>
                    {trackingGroup.items.map((item) => {
                      const active = isItemActive(item.path);
                      const ItemIcon = item.icon;

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-150 group border ${
                            active
                              ? isFemale
                                ? 'bg-[#FBE7F0] text-[#A92D61] border-[#FCE1ED] font-semibold shadow-xs'
                                : 'bg-[#0288D1] text-white border-[#0288D1] font-semibold shadow-xs'
                              : isFemale
                              ? 'border-transparent text-[#667085] hover:bg-[#FFF5F9] hover:text-[#E84A8A]'
                              : 'border-transparent text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ItemIcon
                              className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                active
                                  ? isFemale ? 'text-[#A92D61]' : 'text-white'
                                  : isFemale ? 'text-[#E84A8A]' : 'text-[#0288D1]'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {active && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isFemale ? 'bg-[#E84A8A]' : 'bg-white'}`} />
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
                      className={`w-4 h-4 transition-colors ${getIconClasses(active)}`}
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
      <div className={`pt-3 border-t space-y-2.5 shrink-0 ${
        isFemale ? 'border-[#EAECF0]' : 'border-[#BAE6FD]'
      }`}>
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
                    ? isFemale
                      ? 'bg-[#FBE7F0] text-[#A92D61] border-[#FCE1ED] font-semibold'
                      : 'bg-[#0288D1] text-white border-[#0288D1]'
                    : isFemale
                    ? 'border-transparent text-[#667085] hover:bg-[#FFF5F9] hover:text-[#E84A8A]'
                    : 'border-transparent text-[#475569] hover:bg-[#E0F2FE] hover:text-[#0288D1]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isFemale ? 'text-[#E84A8A]' : 'text-[#0288D1]'}`} />
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
            <div className={`p-2.5 rounded-xl bg-white border flex items-center justify-between gap-2.5 shadow-xs ${
              isFemale ? 'border-[#EAECF0]' : 'border-[#BAE6FD]'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full overflow-hidden border flex items-center justify-center shrink-0 ${
                  isFemale ? 'border-[#FCE1ED] bg-[#E84A8A]' : 'border-[#BAE6FD] bg-[#0288D1]'
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
                className={`p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer shrink-0 ${
                  isFemale ? 'hover:bg-[#FFF5F9]' : 'hover:bg-[#E0F2FE]'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()}
      </div>
    </aside>
  );
};

export default AppSidebar;
