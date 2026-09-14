import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Activity, FileText, User, LayoutGrid, Utensils } from 'lucide-react';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useUserHealth();
  const overviewPath = getPathwayDashboardRoute(userProfile);
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);

  const navItems = [
    { label: 'Home', path: overviewPath, icon: LayoutDashboard },
    { label: 'Nutrition', path: ROUTES.APP.DIET, icon: Utensils },
    ...(pathway === 'female'
      ? [{ label: 'Cycle', path: ROUTES.APP.CYCLE, icon: Calendar }]
      : [{ label: 'Hub', path: ROUTES.APP.HUB, icon: LayoutGrid }]),
    { label: 'Symptoms', path: ROUTES.APP.SYMPTOMS, icon: Activity },
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: FileText },
    { label: 'Profile', path: ROUTES.APP.SETTINGS, icon: User },
  ];

  const isActive = (path: string) => {
    if (path === overviewPath) {
      return (
        location.pathname === overviewPath ||
        location.pathname === ROUTES.APP.DASHBOARD ||
        location.pathname === ROUTES.APP.ROOT
      );
    }
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E2E8F0] shadow-lg z-30 flex items-center justify-around px-2 select-none pb-[env(safe-area-inset-bottom,0px)]">
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              active
                ? 'text-[#0288D1] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-sans font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
