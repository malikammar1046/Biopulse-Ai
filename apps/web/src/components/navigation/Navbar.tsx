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

  const isHome = location.pathname === ROUTES.HOME;

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

  // Dynamic navbar styling based on page context (Home vs Internal)
  const navBg = isHome
    ? isScrolled
      ? 'bg-[#10071A]/85 backdrop-blur-md border-b border-white/10 shadow-lg shadow-purple-950/20 py-3.5'
      : 'bg-transparent py-5'
    : isScrolled
    ? 'bg-[#F8F5FA]/90 backdrop-blur-md border-b border-[#E7DFEF]/80 shadow-sm shadow-purple-950/5 py-3.5'
    : 'bg-white/80 backdrop-blur-md border-b border-[#E7DFEF]/50 py-4';

  const brandTextColor = isHome ? 'text-white' : 'text-[#1C1326]';
  const brandSubColor = isHome ? 'text-[#B4A6C7]' : 'text-[#8D7E9E]';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <Container size="xl">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-md shadow-purple-900/20 group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-bold font-display tracking-tight transition-colors ${brandTextColor} group-hover:text-[#E879F9]`}>
                PMOSense
              </span>
              <span className={`text-[10px] uppercase font-semibold tracking-wider -mt-1 ${brandSubColor}`}>
                Health Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className={`hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-xs ${
              isHome
                ? 'bg-white/10 border-white/15 text-[#F6F2FA]'
                : 'bg-white/80 border-[#E7DFEF] text-[#584B68]'
            }`}
          >
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 ${
                    active
                      ? isHome
                        ? 'text-white font-bold'
                        : 'text-[#6E2D8B]'
                      : isHome
                      ? 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
                      : 'text-[#584B68] hover:text-[#1C1326] hover:bg-[#F2ECF7]/50'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className={`absolute inset-0 rounded-full -z-10 ${
                        isHome ? 'bg-gradient-brand opacity-90' : 'bg-[#EDE4F7]'
                      }`}
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
                className={isHome ? 'text-white hover:bg-white/10 hover:text-white' : ''}
              >
                Log In
              </Button>
            </Link>
            <Link to={ROUTES.APP.DASHBOARD}>
              <Button
                variant="primary"
                size="sm"
                className="bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white hover:brightness-110"
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
              className={`p-2 rounded-2xl border transition-colors ${
                isHome
                  ? 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                  : 'bg-white border-[#E7DFEF] text-[#1C1326] hover:bg-[#F2ECF7]'
              }`}
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
            className={`lg:hidden border-b shadow-xl overflow-hidden ${
              isHome
                ? 'bg-[#180A25] border-white/10 text-white'
                : 'bg-white border-[#E7DFEF] text-[#1C1326]'
            }`}
          >
            <Container size="xl" className="py-6 flex flex-col gap-4">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                      isActive(link.path)
                        ? isHome
                          ? 'bg-gradient-brand text-white'
                          : 'bg-[#EDE4F7] text-[#6E2D8B]'
                        : isHome
                        ? 'text-[#B4A6C7] hover:bg-white/10 hover:text-white'
                        : 'text-[#584B68] hover:bg-[#F2ECF7]'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                <Link to={ROUTES.LOGIN} className="w-full">
                  <Button
                    variant="outline"
                    size="md"
                    fullWidth
                    className={isHome ? 'border-white/20 text-white' : ''}
                  >
                    Log In
                  </Button>
                </Link>
                <Link to={ROUTES.APP.DASHBOARD} className="w-full">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    className="bg-gradient-to-r from-[#8E3EAF] to-[#E87084] text-white"
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
