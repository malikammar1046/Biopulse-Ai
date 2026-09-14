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
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased relative">
      <ScrollToTop />

      {/* Desktop Medical Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Mobile Top Header (hidden on desktop) */}
        <header className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 text-[#0F172A] select-none shadow-xs">
          <Link to={overviewRoute} className="flex items-center">
            <Logo size="xs" theme="light" showTagline={false} />
          </Link>
          <Link
            to={ROUTES.HOME}
            className="text-[11px] font-mono text-[#0288D1] hover:text-[#01579B] flex items-center gap-1 font-semibold"
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
