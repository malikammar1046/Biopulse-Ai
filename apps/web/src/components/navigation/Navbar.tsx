import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Activity } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Home', path: ROUTES.HOME },
    { label: 'About', path: ROUTES.ABOUT },
    { label: 'How It Works', path: ROUTES.HOW_IT_WORKS },
    { label: 'Features', path: ROUTES.FEATURES },
    { label: 'Team', path: ROUTES.TEAM },
    { label: 'Contact', path: ROUTES.CONTACT },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#10071A]/90 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-purple-950/20 py-3.5'
          : 'bg-[#10071A]/60 backdrop-blur-md border-b border-white/5 py-4'
      }`}
    >
      <Container size="xl">
        <div className="flex items-center justify-between">
          {/* Brand Logo with PMOSense Pulse Indicator */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform duration-200">
                <Activity className="w-5 h-5" />
              </div>
              {/* PMOSense Pulse Dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#FB7185] shadow-[0_0_8px_#FB7185] animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-display tracking-tight text-white group-hover:text-[#E879F9] transition-colors">
                PMOSense
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#B4A6C7] -mt-1">
                Health Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-xs">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 ${
                    active
                      ? 'text-white font-bold'
                      : 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-gradient-brand rounded-full -z-10 shadow-sm shadow-purple-900/30"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to={ROUTES.LOGIN}>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#EDE4F7] hover:bg-white/10 hover:text-white"
              >
                Log In
              </Button>
            </Link>
            <Link to={ROUTES.APP.DASHBOARD}>
              <Button
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-md shadow-purple-950/20"
                iconRight={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Explore App
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-2xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-[#180A25] border-b border-white/10 text-white shadow-2xl overflow-hidden"
          >
            <Container size="xl" className="py-6 flex flex-col gap-4">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                      isActive(link.path)
                        ? 'bg-gradient-brand text-white'
                        : 'text-[#B4A6C7] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                <Link to={ROUTES.LOGIN} className="w-full">
                  <Button variant="outline" size="md" fullWidth className="border-white/20 text-white hover:bg-white/10">
                    Log In
                  </Button>
                </Link>
                <Link to={ROUTES.APP.DASHBOARD} className="w-full">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white"
                  >
                    Explore App
                  </Button>
                </Link>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
