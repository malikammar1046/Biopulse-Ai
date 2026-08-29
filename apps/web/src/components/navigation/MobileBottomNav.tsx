import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Activity, FileText, User } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: ROUTES.APP.DASHBOARD, icon: LayoutDashboard },
    { label: 'Cycle', path: ROUTES.APP.CYCLE, icon: Calendar },
    { label: 'Symptoms', path: ROUTES.APP.SYMPTOMS, icon: Activity },
    { label: 'Reports', path: ROUTES.APP.REPORTS, icon: FileText },
    { label: 'Profile', path: ROUTES.APP.SETTINGS, icon: User },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    (path === ROUTES.APP.DASHBOARD && location.pathname === ROUTES.APP.ROOT);

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
