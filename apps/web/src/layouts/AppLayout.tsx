import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { AppSidebar } from '../components/navigation/AppSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { FloatingOvaSenseAI } from '../components/dashboard/FloatingOvaSenseAI';
import { Logo } from '../components/brand/Logo';
import { PageAtmosphere } from '../components/brand/PageAtmosphere';
import { isDashboardRoute } from '../components/brand/atmosphereTokens';
import { ROUTES, getPathwayDashboardRoute } from '../constants/routes';
import { useUserHealth } from '../context/UserHealthContext';
import { ArrowLeft } from '@untitledui/icons';

import { AppDashboardHeader } from '../components/navigation/AppDashboardHeader';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useUserHealth();
  const overviewRoute = getPathwayDashboardRoute(userProfile);
  const isFemale = userProfile?.pathway === 'female' || userProfile?.gender === 'female';
  const isDashboard = isDashboardRoute(location.pathname);

  return (
    <div
      className={`flex min-h-screen antialiased relative text-[#0F172A] ${
        isDashboard ? 'bg-[#F8FAFC]' : 'bg-transparent'
      }`}
    >
      {/* ── Route-Aware Ambient Botanical / Biological Atmosphere (Disabled on Dashboards) ── */}
      <PageAtmosphere />

      <ScrollToTop />

      {/* Desktop Medical Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Mobile Top Header (hidden on desktop) */}
        <header className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 select-none shadow-xs text-[#0F172A]">
          <Link to={overviewRoute} className="flex items-center">
            <Logo size="xs" theme="light" showTagline={false} />
          </Link>
          <Link
            to={ROUTES.HOME}
            className={`text-[11px] font-mono flex items-center gap-1 font-semibold transition-colors ${
              isFemale ? 'text-[#F43F7D] hover:text-[#DC326C]' : 'text-[#0288D1] hover:text-[#01579B]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Public Site</span>
          </Link>
        </header>

        {/* Standardized Authenticated BioPulse Dashboard Header */}
        <AppDashboardHeader />

        {/* Page Content Viewport with standardized header-to-content spacing */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 lg:pt-6 pb-12 sm:pb-16 max-w-7xl w-full mx-auto">
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
