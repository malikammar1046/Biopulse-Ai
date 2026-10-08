import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid01,
  Calendar,
  ActivityHeart,
  File06,
  User01,
  Scales01,
} from '../icons';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useUserHealth();
  const overviewPath = getPathwayDashboardRoute(userProfile);
  const pathway = resolvePathway(userProfile.gender, userProfile.pathway);

  const navItems = [
    { label: 'Home', path: overviewPath, icon: LayoutGrid01 },
    { label: 'Lifestyle', path: ROUTES.APP.LIFESTYLE, icon: Scales01 },
    ...(pathway === 'female'
      ? [{ label: 'Cycle', path: ROUTES.APP.CYCLE, icon: Calendar }]
      : [{ label: 'Hub', path: ROUTES.APP.HUB, icon: LayoutGrid01 }]),
    { label: 'Symptoms', path: ROUTES.APP.SYMPTOMS, icon: ActivityHeart },
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: File06 },
    { label: 'Profile', path: ROUTES.APP.SETTINGS, icon: User01 },
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

  const isFemale = pathway === 'female';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] bg-white/98 backdrop-blur-md border-t border-[#EAECF0] shadow-lg z-30 flex items-center justify-around px-1 select-none pb-[env(safe-area-inset-bottom,0px)] pt-1">
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center gap-0.5 sm:gap-1 flex-1 max-w-[64px] py-1 rounded-xl transition-all active:scale-95 cursor-pointer ${
              active
                ? (isFemale ? 'text-[#F43F7D] font-bold' : 'text-[#29B6F6] font-bold')
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-sans truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
