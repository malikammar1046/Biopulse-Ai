import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { GlobalBotanicalBackground } from '../components/brand/GlobalBotanicalBackground';
import { ROUTES } from '../constants/routes';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === ROUTES.LOGIN || location.pathname === ROUTES.REGISTER;
  const hasDedicatedHero =
    isAuthPage ||
    location.pathname === ROUTES.HOME ||
    location.pathname === ROUTES.UNDERSTAND_PCOS ||
    location.pathname === ROUTES.UNDERSTAND_PCOS_CANONICAL ||
    location.pathname === ROUTES.UNDERSTAND_MALE_HYPOGONADISM ||
    location.pathname === ROUTES.UNDERSTAND_HYPOGONADISM ||
    location.pathname === ROUTES.CONDITIONS ||
    location.pathname === ROUTES.ABOUT ||
    location.pathname === ROUTES.HOW_IT_WORKS ||
    location.pathname === ROUTES.FEATURES ||
    location.pathname === ROUTES.CONTACT ||
    location.pathname === ROUTES.TRUST_PRIVACY;

  return (
    <div className="relative flex flex-col min-h-screen bg-[#FAFCFF] text-[#162A45] overflow-x-hidden">
      {/* ── Global Botanical Foliage & Dual-Tint Atmosphere (Excluding Dashboard) ── */}
      <GlobalBotanicalBackground />

      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      <main className={`flex-grow bg-transparent ${hasDedicatedHero ? 'pt-0' : 'pt-20'}`}>
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};


