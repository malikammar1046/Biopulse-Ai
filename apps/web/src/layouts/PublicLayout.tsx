import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { ROUTES } from '../constants/routes';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const hasDarkHero =
    location.pathname === ROUTES.HOME ||
    location.pathname === ROUTES.UNDERSTAND_PCOS ||
    location.pathname === ROUTES.ABOUT ||
    location.pathname === ROUTES.HOW_IT_WORKS ||
    location.pathname === ROUTES.FEATURES ||
    location.pathname === ROUTES.CARE_CIRCLE ||
    location.pathname === ROUTES.CONTACT ||
    location.pathname === ROUTES.LOGIN ||
    location.pathname === ROUTES.REGISTER;

  return (
    <div className="flex flex-col min-h-screen bg-[#10071A] text-[#1C1326]">
      <ScrollToTop />
      <Navbar />
      <main className={`flex-grow bg-[#10071A] ${hasDarkHero ? 'pt-0' : 'pt-20'}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
