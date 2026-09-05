import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  ArrowRight, 
  ChevronDown, 
  Heart, 
  Sparkles, 
  Activity, 
  Layers,
  FileText,
  Stethoscope,
  type LucideIcon
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';

interface NavDropdownItem {
  label: string;
  sublabel: string;
  path: string;
  icon: LucideIcon;
  color?: string;
}

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, userProfile } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'eduhub' | 'howitworks' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Education Hub Dropdown: Women's Health, Men's Health, Understand PMOS, Understand Male Hypogonadism
  const eduHubItems: NavDropdownItem[] = [
    {
      label: "Women's Health",
      sublabel: 'PCOS/PMOS screening, cycles & metabolic signals',
      path: ROUTES.WOMENS_HEALTH,
      icon: Heart,
      color: '#FB7185',
    },
    {
      label: "Men's Health",
      sublabel: 'Male hypogonadism, testosterone & signaling',
      path: ROUTES.MENS_HEALTH,
      icon: Activity,
      color: '#60A5FA',
    },
    {
      label: 'Understand PMOS',
      sublabel: 'Ovarian biology, cycle patterns & metabolic signals',
      path: ROUTES.UNDERSTAND_PCOS_CANONICAL,
      icon: Sparkles,
      color: '#E879F9',
    },
    {
      label: 'Understand Male Hypogonadism',
      sublabel: 'Testosterone signaling, HPT axis & pattern education',
      path: ROUTES.UNDERSTAND_MALE_HYPOGONADISM,
      icon: Activity,
      color: '#38BDF8',
    },
  ];

  // 2. How It Works Dropdown: How It Works, AI That Explains, Features, For Doctors
  const howItWorksItems: NavDropdownItem[] = [
    {
      label: 'How It Works',
      sublabel: 'Our 8-phase screening & progressive reassessment model',
      path: ROUTES.HOW_IT_WORKS,
      icon: Layers,
      color: '#C084FC',
    },
    {
      label: 'AI That Explains',
      sublabel: 'Transparent SHAP feature attribution & explainable AI',
      path: ROUTES.AI_EXPLAINS,
      icon: Sparkles,
      color: '#FDA4AF',
    },
    {
      label: 'Features',
      sublabel: 'Interactive tools, 4-tier model, OCR & lifestyle support',
      path: ROUTES.FEATURES,
      icon: FileText,
      color: '#34D399',
    },
    {
      label: 'For Doctors',
      sublabel: 'Clinical collaboration, structured summaries & research data',
      path: ROUTES.FOR_DOCTORS,
      icon: Stethoscope,
      color: '#818CF8',
    },
  ];

  const isEduHubActive =
    location.pathname === ROUTES.WOMENS_HEALTH ||
    location.pathname === ROUTES.MENS_HEALTH ||
    location.pathname === ROUTES.UNDERSTAND_PCOS ||
    location.pathname === ROUTES.UNDERSTAND_PCOS_CANONICAL ||
    location.pathname === ROUTES.UNDERSTAND_MALE_HYPOGONADISM ||
    location.pathname === ROUTES.UNDERSTAND_HYPOGONADISM ||
    location.pathname === ROUTES.UNDERSTAND_MALE_FERTILITY;

  const isHowItWorksActive =
    location.pathname === ROUTES.HOW_IT_WORKS ||
    location.pathname === ROUTES.AI_EXPLAINS ||
    location.pathname === ROUTES.FEATURES ||
    location.pathname === ROUTES.FOR_DOCTORS;

  const isCareCircleActive = location.pathname === ROUTES.CARE_CIRCLE;
  const isAboutActive = location.pathname === ROUTES.ABOUT;
  const isContactActive = location.pathname === ROUTES.CONTACT;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#10071A]/95 backdrop-blur-xl border-b border-white/10 shadow-xl shadow-purple-950/30 py-3'
          : 'bg-[#10071A]/70 backdrop-blur-md border-b border-white/5 py-4'
      }`}
      ref={navRef}
    >
      <Container size="xl">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link to={ROUTES.HOME} className="flex items-center shrink-0">
            <Logo size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-full shadow-xs">
            {/* Home */}
            <Link
              to={ROUTES.HOME}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 ${
                location.pathname === ROUTES.HOME
                  ? 'text-white bg-gradient-brand shadow-xs'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </Link>

            {/* About Us (immediately after Home) */}
            <Link
              to={ROUTES.ABOUT}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 ${
                isAboutActive
                  ? 'text-white bg-gradient-brand shadow-xs'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
              }`}
            >
              About Us
            </Link>

            {/* 1. Education Hub Dropdown (Women's Health, Men's Health, Understand PMOS, Understand Hypogonadism) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('eduhub')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'eduhub' ? null : 'eduhub')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 cursor-pointer ${
                  isEduHubActive
                    ? 'text-white bg-gradient-brand shadow-xs'
                    : 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
                }`}
              >
                <span>Education Hub</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'eduhub' ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'eduhub' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute top-full left-0 mt-2 w-84 p-2.5 rounded-2xl bg-[#180A25]/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-purple-950/60 z-50"
                  >
                    <div className="space-y-1">
                      {eduHubItems.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                              active
                                ? 'bg-gradient-brand text-white'
                                : 'text-[#EDE4F7] hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-white/10 shrink-0 mt-0.5">
                              <Icon
                                className="w-4 h-4"
                                style={{ color: item.color || '#FB7185' }}
                              />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight">{item.label}</div>
                              <div className="text-[11px] text-[#B4A6C7] mt-0.5 leading-snug">
                                {item.sublabel}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. How It Works Dropdown (How It Works, AI That Explains, Features, For Doctors) */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('howitworks')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                type="button"
                onClick={() => setActiveDropdown(activeDropdown === 'howitworks' ? null : 'howitworks')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 cursor-pointer ${
                  isHowItWorksActive
                    ? 'text-white bg-gradient-brand shadow-xs'
                    : 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
                }`}
              >
                <span>How It Works</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'howitworks' ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {activeDropdown === 'howitworks' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute top-full left-0 mt-2 w-84 p-2.5 rounded-2xl bg-[#180A25]/95 backdrop-blur-xl border border-white/15 shadow-2xl shadow-purple-950/60 z-50"
                  >
                    <div className="space-y-1">
                      {howItWorksItems.map((item) => {
                        const Icon = item.icon;
                        const active = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                              active
                                ? 'bg-gradient-brand text-white'
                                : 'text-[#EDE4F7] hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <div className="p-2 rounded-lg bg-white/10 shrink-0 mt-0.5">
                              <Icon
                                className="w-4 h-4"
                                style={{ color: item.color || '#C084FC' }}
                              />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-tight">{item.label}</div>
                              <div className="text-[11px] text-[#B4A6C7] mt-0.5 leading-snug">
                                {item.sublabel}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Care Circle on Main Navbar */}
            <Link
              to={ROUTES.CARE_CIRCLE}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 ${
                isCareCircleActive
                  ? 'text-white bg-gradient-brand shadow-xs'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
              }`}
            >
              Care Circle
            </Link>

            {/* 4. Contact on Main Navbar */}
            <Link
              to={ROUTES.CONTACT}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-colors duration-200 ${
                isContactActive
                  ? 'text-white bg-gradient-brand shadow-xs'
                  : 'text-[#B4A6C7] hover:text-white hover:bg-white/10'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to={ROUTES.APP.DASHBOARD}>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-md shadow-purple-950/20"
                  iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {userProfile?.fullName ? `${userProfile.fullName.split(' ')[0]}'s Dashboard` : 'Dashboard'}
                </Button>
              </Link>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#EDE4F7] hover:bg-white/10 hover:text-white cursor-pointer"
                  >
                    Log In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white hover:brightness-110 shadow-md shadow-purple-950/20 cursor-pointer"
                    iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-2xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors cursor-pointer"
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
            className="lg:hidden bg-[#180A25] border-b border-white/10 text-white shadow-2xl overflow-y-auto max-h-[calc(100vh-80px)]"
          >
            <Container size="xl" className="py-6 flex flex-col gap-5">
              {/* Core Home & About Links */}
              <div className="flex flex-col gap-1">
                <Link
                  to={ROUTES.HOME}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    location.pathname === ROUTES.HOME
                      ? 'bg-gradient-brand text-white'
                      : 'text-[#B4A6C7] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to={ROUTES.ABOUT}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === ROUTES.ABOUT
                      ? 'bg-gradient-brand text-white font-bold'
                      : 'text-[#EDE4F7] hover:bg-white/10'
                  }`}
                >
                  <span>About Us</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </div>

              {/* Education Hub Section */}
              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#FB7185] px-4 py-1">
                  Education Hub
                </div>
                {eduHubItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-gradient-brand text-white font-bold'
                        : 'text-[#EDE4F7] hover:bg-white/10'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                ))}
              </div>

              {/* How It Works Section */}
              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#C084FC] px-4 py-1">
                  How It Works
                </div>
                {howItWorksItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-gradient-brand text-white font-bold'
                        : 'text-[#EDE4F7] hover:bg-white/10'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                ))}
              </div>

              {/* Main Company & Support Links */}
              <div className="space-y-1 pt-2 border-t border-white/10">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#B4A6C7] px-4 py-1">
                  Connect & Support
                </div>
                <Link
                  to={ROUTES.CARE_CIRCLE}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === ROUTES.CARE_CIRCLE
                      ? 'bg-gradient-brand text-white font-bold'
                      : 'text-[#EDE4F7] hover:bg-white/10'
                  }`}
                >
                  <span>Care Circle</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
                <Link
                  to={ROUTES.CONTACT}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === ROUTES.CONTACT
                      ? 'bg-gradient-brand text-white font-bold'
                      : 'text-[#EDE4F7] hover:bg-white/10'
                  }`}
                >
                  <span>Contact</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </div>

              {/* Auth Actions */}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
                <Link to={ROUTES.LOGIN} className="w-full">
                  <Button variant="outline" size="md" fullWidth className="border-white/20 text-white hover:bg-white/10">
                    Log In
                  </Button>
                </Link>
                <Link to={ROUTES.REGISTER} className="w-full">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    className="bg-gradient-to-r from-[#8E3EAF] via-[#A21CAF] to-[#E87084] text-white"
                  >
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
