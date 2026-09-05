import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LayoutGrid,
  Calendar,
  Activity,
  Utensils,
  Dumbbell,
  FileText,
  Pill,
  Users,
  Stethoscope,
  GitBranch,
  Settings,
  LogOut,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import { resolvePathway } from '../../types/onboarding';
import { Logo } from '../brand/Logo';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, openAiChatWithPrompt } = useUserHealth();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const overviewPath = getPathwayDashboardRoute(userProfile);
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);
  const brandTagline =
    pathway === 'male'
      ? 'AndroSense AI'
      : pathway === 'female'
      ? 'OvaSense AI'
      : 'VITASense';

  const mainNavItems = [
    { label: 'Overview', path: overviewPath, icon: LayoutDashboard },
    { label: 'Master Health Hub', path: ROUTES.APP.HUB, icon: LayoutGrid },
    {
      label: pathway === 'male' ? 'AndroSense AI' : pathway === 'female' ? 'OvaSense AI' : 'VITASense AI',
      path: ROUTES.APP.CHAT,
      icon: Sparkles,
    },
    { label: 'Assessment', path: ROUTES.APP.ASSESSMENT, icon: ClipboardCheck },
    { label: 'Health Timeline', path: ROUTES.APP.TIMELINE, icon: GitBranch },
    ...(pathway === 'female'
      ? [{ label: 'Your Cycle', path: ROUTES.APP.CYCLE, icon: Calendar }]
      : []),
    { label: 'Symptoms', path: ROUTES.APP.SYMPTOMS, icon: Activity },
    { label: 'Food & Meals', path: ROUTES.APP.DIET, icon: Utensils },
    { label: 'Movement', path: ROUTES.APP.FITNESS, icon: Dumbbell },
    { label: 'Lab Reports', path: ROUTES.APP.REPORTS, icon: FileText },
    { label: 'Medications', path: ROUTES.APP.MEDICATIONS, icon: Pill },
    { label: 'Care Circle', path: ROUTES.APP.CARE_CIRCLE, icon: Users },
    { label: 'Appointments', path: ROUTES.APP.APPOINTMENTS, icon: Stethoscope },
  ];

  const bottomNavItems = [
    { label: 'Settings', path: ROUTES.APP.SETTINGS, icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === overviewPath) {
      return (
        location.pathname === overviewPath ||
        location.pathname === ROUTES.APP.ROOT ||
        location.pathname === ROUTES.APP.DASHBOARD
      );
    }
    return location.pathname === path;
  };

  return (
    <aside className="w-64 bg-[#180A26] border-r border-white/10 text-white flex flex-col justify-between p-4 hidden md:flex shrink-0 select-none z-30">
      <div className="space-y-6">
        {/* Brand Logo at Top */}
        <div className="px-3 py-3">
          <Link to={overviewPath} className="flex items-center">
            <Logo size="sm" theme="dark" showTagline tagline={brandTagline} />
          </Link>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D8B4FE] px-3 mb-2 block">
            Health Portal
          </span>
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-[#6E2D8B] to-[#8E3EAF] text-white shadow-md shadow-purple-950/50'
                    : 'text-[#A797BD] hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      active ? 'text-white' : 'text-[#A797BD] group-hover:text-white'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />}
              </Link>
            );
          })}
        </nav>

        {/* Digital Twin AI Quick Launcher in Sidebar */}
        <div className="px-1">
          <div
            onClick={() =>
              openAiChatWithPrompt(
                pathway === 'male'
                  ? 'Explain what my hormone health and recent logs mean'
                  : pathway === 'female'
                  ? 'Explain what my current cycle day and logs mean'
                  : 'Explain what my baseline health patterns and logs mean'
              )
            }
            className="p-3.5 rounded-2xl bg-gradient-to-b from-[#250E3E] to-[#140624] border border-[#8E3EAF]/30 hover:border-[#FB7185] text-left cursor-pointer transition-all duration-200 group shadow-md"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#FB7185]" />
                <span>AI That Explains</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#34D399]/20 text-[#34D399] font-bold">
                Online
              </span>
            </div>
            <p className="text-[11px] text-[#A797BD] leading-tight group-hover:text-white transition-colors">
              Your health insights are ready. Ask a question.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Area: Settings, Help & User Profile Card */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-[#A797BD] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D8B4FE] bg-[#6E2D8B] flex items-center justify-center shrink-0">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white font-mono">
                  {userProfile.fullName.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {userProfile.fullName}
              </span>
              <span className="text-[10px] text-[#A797BD] block truncate">
                {userProfile.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-[#A797BD] hover:text-[#FB7185] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
