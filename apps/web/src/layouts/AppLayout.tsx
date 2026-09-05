import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { AppSidebar } from '../components/navigation/AppSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { FloatingOvaSenseAI } from '../components/dashboard/FloatingOvaSenseAI';
import { Logo } from '../components/brand/Logo';
import { ROUTES, getPathwayDashboardRoute } from '../constants/routes';
import { useUserHealth } from '../context/UserHealthContext';
import { ArrowLeft } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { userProfile } = useUserHealth();
  const overviewRoute = getPathwayDashboardRoute(userProfile);

  return (
    <div className="flex min-h-screen bg-[#F8F5FA] text-[#1C1326] antialiased relative">
      <ScrollToTop />

      {/* Desktop Deep Plum / Obsidian Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Top Header (hidden on desktop) */}
        <header className="md:hidden h-14 bg-[#180A26] border-b border-white/10 px-4 flex items-center justify-between shrink-0 text-white select-none">
          <Link to={overviewRoute} className="flex items-center">
            <Logo size="xs" theme="dark" showTagline={false} />
          </Link>
          <Link
            to={ROUTES.HOME}
            className="text-[11px] font-mono text-[#D8B4FE] hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Site</span>
          </Link>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Interactive AI Twin Chat Experience */}
      <FloatingOvaSenseAI />

      {/* Mobile Sticky Bottom Navigation (< md) */}
      <MobileBottomNav />
    </div>
  );
};
