import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Calendar,
  Users01,
} from '../icons';
import { useTranslation } from 'react-i18next';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import { resolvePathway } from '../../types/onboarding';
import { Logo } from '../brand/Logo';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../common/UserAvatar';

export interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export const AppSidebar: React.FC = () => {
  const { t } = useTranslation(['navigation', 'common']);
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
  const isFemale = pathway === 'female';

  const brandTagline =
    pathway === 'male'
      ? "Men's Health Intelligence"
      : pathway === 'female'
        ? "Women's Health Intelligence"
        : 'Unified Health Intelligence';

  // Overview active match includes path aliases and root
  const isOverviewActive =
    location.pathname === overviewPath ||
    location.pathname === ROUTES.APP.ROOT ||
    location.pathname === ROUTES.APP.DASHBOARD ||
    location.pathname === ROUTES.APP.OVASENSE ||
    location.pathname === ROUTES.APP.ANDROSENSE ||
    location.pathname === ROUTES.APP.VITASENSE;

  // Exact and hierarchical active state detection with related route aliases
  const isItemActive = (path: string): boolean => {
    if (path === overviewPath) {
      return isOverviewActive;
    }
    if (location.pathname === path) {
      return true;
    }
    if (path !== ROUTES.APP.ROOT && location.pathname.startsWith(path + '/')) {
      return true;
    }
    // Related route connections
    if (path === ROUTES.APP.PROGRESS && location.pathname.startsWith(ROUTES.APP.TIMELINE)) {
      return true;
    }
    if (
      path === ROUTES.APP.CHAT &&
      (location.pathname.startsWith(ROUTES.APP.AI_TWIN) ||
        location.pathname.startsWith('/app/ai') ||
        location.pathname.startsWith('/app/assistant'))
    ) {
      return true;
    }
    if (
      path === ROUTES.APP.LIFESTYLE &&
      (location.pathname.startsWith(ROUTES.APP.DIET) ||
        location.pathname.startsWith(ROUTES.APP.NUTRITION))
    ) {
      return true;
    }
    if (
      path === ROUTES.APP.SETTINGS &&
      location.pathname.startsWith(ROUTES.APP.PROFILE)
    ) {
      return true;
    }
    return false;
  };

  // ── 1. MAIN (Core Application Overview, Lifestyle & Progress) ──
  const mainItems: NavItem[] = [
    { label: t('overview'), path: overviewPath, icon: LayoutGrid01 },
    { label: t('lifestyle'), path: ROUTES.APP.LIFESTYLE, icon: Scales01 },
    { label: t('longitudinal'), path: ROUTES.APP.PROGRESS, icon: LineChartUp01 },
  ];

  // ── 2. HEALTH (Clinical Assessment, Reports, Clinical Care) ──
  const femaleHealthItems: NavItem[] = [
    { label: t('screening'), path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: t('reports'), path: ROUTES.APP.REPORTS, icon: File06 },
    { label: t('appointments'), path: ROUTES.APP.APPOINTMENTS, icon: CalendarCheck01 },
    { label: t('careCircle'), path: ROUTES.APP.CARE_CIRCLE, icon: Users01 },
  ];

  const maleHealthItems: NavItem[] = [
    { label: t('screening'), path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: t('reports'), path: ROUTES.APP.REPORTS, icon: File06 },
    { label: t('appointments'), path: ROUTES.APP.APPOINTMENTS, icon: CalendarCheck01 },
    { label: t('careCircle'), path: ROUTES.APP.CARE_CIRCLE, icon: Users01 },
  ];

  const healthItems = isFemale ? femaleHealthItems : maleHealthItems;

  // ── 3. DAILY TRACKING (Direct, un-collapsed tracking destinations) ──
  const dailyTrackingItems: NavItem[] = [
    ...(isFemale
      ? [{ label: t('cycle'), path: ROUTES.APP.CYCLE, icon: Calendar }]
      : []),
    { label: t('symptoms'), path: ROUTES.APP.SYMPTOMS, icon: ActivityHeart },
    { label: t('fitness'), path: ROUTES.APP.FITNESS, icon: Activity },
    { label: t('medications'), path: ROUTES.APP.MEDICATIONS, icon: MedicalCross },
  ];

  // ── 4. INTELLIGENCE (AI Companion & Clinical Intelligence) ──
  const intelligenceItems: NavItem[] = [
    { label: t('aiCompanion'), path: ROUTES.APP.CHAT, icon: MessageChatCircle },
  ];

  // ── 5. ACCOUNT (Pinned to bottom) ──
  const settingsItem: NavItem = {
    label: t('settings'),
    path: ROUTES.APP.SETTINGS,
    icon: Settings01,
  };

  // Visual styling tokens adhering to BioPulse design system
  const sidebarContainerClass =
    'w-64 bg-white border-r border-[#EAECF0] text-[#111318] flex flex-col h-screen sticky top-0 p-4 hidden md:flex shrink-0 select-none z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]';

  const sectionLabelClass =
    'text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3 block mb-1 select-none';

  const getLinkClasses = (active: boolean) => {
    if (active) {
      return isFemale
        ? 'bg-[#FDE6EF] text-[#F43F7D] border-[#F43F7D]/25 font-semibold shadow-xs'
        : 'bg-[#E1F5FE] text-[#0288D1] border-[#B3E5FC] font-semibold shadow-xs';
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

  const renderNavLink = (item: NavItem) => {
    const active = isItemActive(item.path);
    const Icon = item.icon;

    return (
      <Link
        key={item.path}
        to={item.path}
        aria-current={active ? 'page' : undefined}
        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group border outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
          isFemale
            ? 'focus-visible:ring-[#F43F7D]/40'
            : 'focus-visible:ring-[#0288D1]/40'
        } ${getLinkClasses(active)}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-5 h-5 shrink-0 transition-colors ${getIconClasses(active)}`}
            aria-hidden="true"
          />
          <span className="truncate">{item.label}</span>
        </div>
        {active && (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotClass()}`} />
        )}
      </Link>
    );
  };

  return (
    <aside className={sidebarContainerClass} aria-label="Sidebar Navigation">
      {/* Brand Logo at Top */}
      <div className="px-2 py-2 shrink-0">
        <Link to={overviewPath} className="flex items-center" aria-label="BioPulse AI Dashboard">
          <Logo size="sm" theme="light" showTagline tagline={brandTagline} />
        </Link>
      </div>

      {/* Navigation Links Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden my-2 pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200">
        {/* ── 1. MAIN Section ── */}
        <nav aria-label="Main navigation" className="space-y-0.5">
          <span className={sectionLabelClass}>
            {t('mainSection', 'Main')}
          </span>
          {mainItems.map(renderNavLink)}
        </nav>

        {/* ── 2. HEALTH Section ── */}
        <nav aria-label="Health navigation" className="space-y-0.5">
          <span className={sectionLabelClass}>
            {t('healthSection', 'Health')}
          </span>
          {healthItems.map(renderNavLink)}
        </nav>

        {/* ── 3. DAILY TRACKING Section (Direct, un-collapsed) ── */}
        <nav aria-label="Daily tracking navigation" className="space-y-0.5">
          <span className={sectionLabelClass}>
            {t('dailyTrackingSection', 'Daily Tracking')}
          </span>
          {dailyTrackingItems.map(renderNavLink)}
        </nav>

        {/* ── 4. INTELLIGENCE Section ── */}
        <nav aria-label="Intelligence navigation" className="space-y-0.5">
          <span className={sectionLabelClass}>
            {t('intelligenceSection', 'Intelligence')}
          </span>
          {intelligenceItems.map(renderNavLink)}
        </nav>
      </div>

      {/* ── 5. ACCOUNT & Bottom Area ── */}
      <div className="pt-3 border-t border-[#EAECF0] space-y-2 shrink-0">
        <nav aria-label="Account navigation" className="space-y-0.5">
          {renderNavLink(settingsItem)}
        </nav>

        {/* User Profile Card */}
        {(() => {
          const displayName =
            userProfile?.fullName ||
            (userProfile?.email ? userProfile.email.split('@')[0] : 'User');
          const displayEmail = userProfile?.email || '';

          return (
            <div className="p-2.5 rounded-xl bg-white border border-[#EAECF0] flex items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar
                  avatarUrl={userProfile?.avatarUrl}
                  name={displayName}
                  email={displayEmail}
                  size="sm"
                  pathway={pathway}
                  gender={userProfile?.gender}
                  showBorder={false}
                />
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
                title={t('logout')}
                aria-label={t('logout')}
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
