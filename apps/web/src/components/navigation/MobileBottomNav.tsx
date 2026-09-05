import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Activity, FileText, User, LayoutGrid } from 'lucide-react';
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#180A26]/95 border-t border-white/10 backdrop-blur-xl z-30 flex items-center justify-around px-2 select-none">
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-1 w-14 py-1 rounded-xl transition-all ${
              active
                ? 'text-[#FB7185] font-bold scale-105'
                : 'text-[#A797BD] hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-sans">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
