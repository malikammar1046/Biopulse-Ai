import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { AppSidebar } from '../components/navigation/AppSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { FloatingOvaSenseAI } from '../components/dashboard/FloatingOvaSenseAI';
import { Logo } from '../components/brand/Logo';
import { ArrowLeft } from 'lucide-react';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#F8F5FA] text-[#1C1326] antialiased">
      <ScrollToTop />

      {/* Desktop Deep Plum / Obsidian Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Top Header (hidden on desktop) */}
        <header className="md:hidden h-14 bg-[#180A26] border-b border-white/10 px-4 flex items-center justify-between shrink-0 text-white select-none">
          <Link to={ROUTES.APP.DASHBOARD} className="flex items-center">
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

        {/* Scrollable Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating OvaSense AI WhatsApp-style Assistant */}
      <FloatingOvaSenseAI />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav />
    </div>
  );
};

