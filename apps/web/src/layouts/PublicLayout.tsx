import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { ROUTES } from '../constants/routes';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === ROUTES.HOME;

  return (
    <div className="flex flex-col min-h-screen bg-[#10071A] text-[#1C1326]">
      <ScrollToTop />
      <Navbar />
      <main className={`flex-grow ${isHome ? 'pt-0' : 'pt-20 bg-[#F8F5FA]'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
