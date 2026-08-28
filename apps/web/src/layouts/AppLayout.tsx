import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  User,
  Calendar,
  SmilePlus,
  FileText,
  BrainCircuit,
  Sparkles,
  History,
  Settings,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { Badge } from '../components/ui/Badge';
import { ScrollToTop } from '../components/common/ScrollToTop';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  const sidebarLinks = [
    { label: 'Dashboard', path: ROUTES.APP.DASHBOARD, icon: LayoutDashboard },
    { label: 'Health Profile', path: ROUTES.APP.PROFILE, icon: User },
    { label: 'Cycle Tracking', path: ROUTES.APP.CYCLE, icon: Calendar },
    { label: 'Symptom Tracking', path: ROUTES.APP.SYMPTOMS, icon: SmilePlus },
    { label: 'Medical Reports', path: ROUTES.APP.REPORTS, icon: FileText },
    { label: 'AI Assessment', path: ROUTES.APP.ASSESSMENT, icon: BrainCircuit },
    { label: 'Lifestyle Support', path: ROUTES.APP.LIFESTYLE, icon: Sparkles },
    { label: 'Health Timeline', path: ROUTES.APP.TIMELINE, icon: History },
    { label: 'Settings', path: ROUTES.APP.SETTINGS, icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path || (path === ROUTES.APP.DASHBOARD && location.pathname === ROUTES.APP.ROOT);

  return (
    <div className="flex min-h-screen bg-[#F8F5FA] text-[#1C1326]">
      <ScrollToTop />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#E7DFEF] flex flex-col justify-between p-4 hidden md:flex shrink-0">
        <div>
          {/* Brand */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 px-3 py-4 mb-4 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-brand flex items-center justify-center text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold font-display text-[#1C1326] block">
                PMOSense
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#8D7E9E] -mt-1 block">
                App Portal (Preview)
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {sidebarLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#EDE4F7] text-[#6E2D8B]'
                      : 'text-[#584B68] hover:bg-[#F2ECF7] hover:text-[#1C1326]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#6E2D8B]' : 'text-[#8D7E9E]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#E7DFEF] space-y-3">
          <div className="px-3 py-2 rounded-2xl bg-[#EDE4F7]/60 border border-[#D8B4FE]/40">
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6E2D8B]" />
              <span className="text-[11px] font-bold text-[#6E2D8B]">Phase 2 Preview</span>
            </div>
            <p className="text-[11px] text-[#584B68] leading-tight">
              Authenticated features will activate in Phase 2 development.
            </p>
          </div>

          <Link
            to={ROUTES.HOME}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#584B68] hover:bg-[#F2ECF7] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top App Bar */}
        <header className="h-16 bg-white border-b border-[#E7DFEF] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Link to={ROUTES.HOME} className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center text-white">
                <Activity className="w-4 h-4" />
              </div>
            </Link>
            <Badge variant="primary" showDot size="sm">
              PHASE 2 APPLICATION SHELL
            </Badge>
          </div>

          <Link
            to={ROUTES.HOME}
            className="text-xs font-semibold text-[#6E2D8B] hover:text-[#4A154B] flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Marketing Site</span>
          </Link>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
