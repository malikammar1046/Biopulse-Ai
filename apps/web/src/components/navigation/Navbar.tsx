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

  // Close mobile drawer when route changes
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
          ? 'bg-[#F8F5FA]/85 backdrop-blur-md border-b border-[#E7DFEF]/70 shadow-sm shadow-purple-950/5 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <Container size="xl">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-md shadow-purple-900/20 group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold font-display text-[#1C1326] tracking-tight group-hover:text-[#6E2D8B] transition-colors">
                PMOSense
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-[#8D7E9E] -mt-1">
                Health Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-[#E7DFEF] px-3 py-1.5 rounded-full shadow-xs">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 ${
                    active
                      ? 'text-[#6E2D8B]'
                      : 'text-[#584B68] hover:text-[#1C1326] hover:bg-[#F2ECF7]/50'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-[#EDE4F7] rounded-full -z-10"
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
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link to={ROUTES.REGISTER}>
              <Button
                variant="primary"
                size="sm"
                iconRight={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-2xl bg-white border border-[#E7DFEF] text-[#1C1326] hover:bg-[#F2ECF7] transition-colors"
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
            className="lg:hidden bg-white border-b border-[#E7DFEF] shadow-xl overflow-hidden"
          >
            <Container size="xl" className="py-6 flex flex-col gap-4">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                      isActive(link.path)
                        ? 'bg-[#EDE4F7] text-[#6E2D8B]'
                        : 'text-[#584B68] hover:bg-[#F2ECF7]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-[#E7DFEF] flex flex-col gap-2.5">
                <Link to={ROUTES.LOGIN} className="w-full">
                  <Button variant="outline" size="md" fullWidth>
                    Log In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER} className="w-full">
                  <Button variant="primary" size="md" fullWidth>
                    Get Started
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
