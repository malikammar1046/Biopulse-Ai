import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Search, 
  ChevronDown, 
  Heart, 
  Activity, 
  ArrowRight,
  type LucideIcon
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Logo } from '../brand/Logo';
import { HeaderLeftBotanical, HeaderRightBotanical } from '../brand/BotanicalFoliage';
import { useAuth } from '../../context/AuthContext';

interface NavDropdownItem {
  label: string;
  sublabel: string;
  path: string;
  icon: LucideIcon;
  color?: string;
}

const SEARCH_SUGGESTIONS = [
  { title: 'PCOS Screening & Guidelines', path: ROUTES.UNDERSTAND_PCOS_CANONICAL, category: 'Women\'s Health' },
  { title: 'Male Hypogonadism & HPT Axis', path: ROUTES.UNDERSTAND_MALE_HYPOGONADISM, category: 'Men\'s Health' },
  { title: 'Pakistani Nutrition & 7-Day Meal Plan', path: ROUTES.FEATURES, category: 'Nutrition' },
  { title: 'Progressive Cost-Aware Screening', path: ROUTES.HOW_IT_WORKS, category: 'Screening' },
  { title: 'Supported Conditions Overview', path: ROUTES.CONDITIONS, category: 'Clinical Pathways' },
  { title: 'Explainable AI & Feature Importance', path: ROUTES.FEATURES, category: 'Technology' },
  { title: 'Medical Report OCR Support', path: ROUTES.FEATURES, category: 'Features' },
  { title: 'Contact Clinical Support', path: ROUTES.CONTACT, category: 'Support' },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'understand' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchQuery('');
    }
  }, [isSearchOpen]);

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

  // Education Dropdown: Understand PCOS, Understand Male Hypogonadism
  const understandItems: NavDropdownItem[] = [
    {
      label: 'Understand PCOS',
      sublabel: 'Ovarian biology, metabolic signals & Rotterdam criteria',
      path: ROUTES.UNDERSTAND_PCOS_CANONICAL,
      icon: Heart,
      color: '#E11D48',
    },
    {
      label: 'Understand Male Hypogonadism',
      sublabel: 'Morning testosterone, HPT axis & endocrine guidelines',
      path: ROUTES.UNDERSTAND_MALE_HYPOGONADISM,
      icon: Activity,
      color: '#0891B2',
    },
  ];

  const isHomeActive = location.pathname === ROUTES.HOME;
  const isAboutActive = location.pathname === ROUTES.ABOUT;
  const isHowItWorksActive = location.pathname === ROUTES.HOW_IT_WORKS;
  const isConditionsActive = location.pathname === ROUTES.CONDITIONS;
  const isFeaturesActive = location.pathname === ROUTES.FEATURES;
  const isContactActive = location.pathname === ROUTES.CONTACT;
  const isUnderstandActive =
    location.pathname === ROUTES.UNDERSTAND_PCOS ||
    location.pathname === ROUTES.UNDERSTAND_PCOS_CANONICAL ||
    location.pathname === ROUTES.UNDERSTAND_MALE_HYPOGONADISM ||
    location.pathname === ROUTES.UNDERSTAND_HYPOGONADISM;

  const filteredSuggestions = searchQuery.trim() === ''
    ? SEARCH_SUGGESTIONS
    : SEARCH_SUGGESTIONS.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <>
      <header
        className="fixed top-2.5 sm:top-3.5 md:top-4 left-0 right-0 z-50 pointer-events-none px-3 sm:px-5 lg:px-7 transition-all duration-300"
        ref={navRef}
      >
        <div className="pointer-events-auto max-w-[1480px] mx-auto relative">
          {/* Main Floating Pill Header Bar */}
          <div
            className={`w-full bg-white/95 backdrop-blur-xl border border-slate-100/90 rounded-2xl sm:rounded-[32px] shadow-[0_10px_35px_rgba(2,132,199,0.08),0_2px_6px_rgba(0,0,0,0.03)] px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 relative flex items-center justify-between gap-2 xl:gap-3 transition-all duration-300 ${
              isScrolled
                ? 'shadow-[0_12px_40px_rgba(2,132,199,0.12),0_4px_12px_rgba(0,0,0,0.05)] bg-white/98'
                : ''
            }`}
          >
            {/* ── Botanical Corner Foliage (Clipped to pill rounded corners) ── */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-[32px] overflow-hidden pointer-events-none z-0">
              {/* Left Botanical Watercolor Foliage */}
              <div className="absolute left-0 bottom-0 pointer-events-none select-none h-full flex items-end">
                <HeaderLeftBotanical className="h-full w-auto max-h-[64px] sm:max-h-[72px]" />
              </div>

              {/* Right Botanical Watercolor Foliage */}
              <div className="absolute right-0 top-0 pointer-events-none select-none h-full flex items-start justify-end">
                <HeaderRightBotanical className="h-full w-auto max-h-[64px] sm:max-h-[72px]" />
              </div>
            </div>

            {/* ── Left: BioPulse AI Brand Logo ── */}
            <div className="relative z-10 pl-8 sm:pl-14 md:pl-18 shrink-0">
              <Link
                to={ROUTES.HOME}
                className="flex items-center gap-2 group transition-transform hover:scale-[1.01]"
                aria-label="BioPulse AI Home"
              >
                <Logo size="md" theme="light" />
              </Link>
            </div>

            {/* ── Center: Desktop Navigation Links ── */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-7 text-[13.5px] xl:text-sm font-medium select-none relative z-10">
              {/* Home */}
              <Link
                to={ROUTES.HOME}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isHomeActive ? 'text-[#0891B2] font-bold' : 'text-slate-600 hover:text-[#0891B2]'
                }`}
              >
                Home
                {isHomeActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#0891B2] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>

              {/* About */}
              <Link
                to={ROUTES.ABOUT}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isAboutActive ? 'text-[#0891B2] font-bold' : 'text-slate-600 hover:text-[#0891B2]'
                }`}
              >
                About
                {isAboutActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#0891B2] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>

              {/* How It Works */}
              <Link
                to={ROUTES.HOW_IT_WORKS}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isHowItWorksActive ? 'text-[#0891B2] font-bold' : 'text-slate-600 hover:text-[#0891B2]'
                }`}
              >
                How It Works
                {isHowItWorksActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#0891B2] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>

              {/* Conditions */}
              <Link
                to={ROUTES.CONDITIONS}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isConditionsActive ? 'text-[#0891B2] font-bold' : 'text-slate-600 hover:text-[#0891B2]'
                }`}
              >
                Conditions
                {isConditionsActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#0891B2] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>

              {/* Understand (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('understand')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'understand' ? null : 'understand')}
                  className={`relative py-1 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    isUnderstandActive ? 'text-[#0891B2] font-bold' : 'text-slate-600 hover:text-[#0891B2]'
                  }`}
                  aria-expanded={activeDropdown === 'understand'}
                >
                  <span>Understand</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'understand' ? 'rotate-180 text-[#0891B2]' : 'text-slate-400'
                    }`}
                  />
                  {isUnderstandActive && (
                    <motion.div
                      layoutId="navbar-active-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#0891B2] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {activeDropdown === 'understand' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72 z-50"
                    >
                      <div className="p-2 rounded-2xl bg-white/98 backdrop-blur-xl border border-slate-200/90 shadow-xl shadow-slate-300/40 space-y-1">
                        {understandItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`flex items-start gap-3 p-2.5 rounded-xl transition-all ${
                                isActive
                                  ? 'bg-sky-50/80 text-[#0891B2]'
                                  : 'hover:bg-slate-50 text-[#162A45]'
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                style={{ backgroundColor: `${item.color}15`, color: item.color }}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold font-display">{item.label}</span>
                                <span className="text-[11px] text-slate-500 line-clamp-1">{item.sublabel}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Resources (Concept Art Label) */}
              <Link
                to={ROUTES.FEATURES}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isFeaturesActive ? 'text-[#0891B2] font-bold' : 'text-slate-600 hover:text-[#0891B2]'
                }`}
              >
                Resources
                {isFeaturesActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#0891B2] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>

              {/* Contact */}
              <Link
                to={ROUTES.CONTACT}
                className={`relative py-1 transition-colors whitespace-nowrap ${
                  isContactActive ? 'text-[#0891B2] font-bold' : 'text-slate-600 hover:text-[#0891B2]'
                }`}
              >
                Contact
                {isContactActive && (
                  <motion.div
                    layoutId="navbar-active-indicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2.5px] bg-[#0891B2] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            </nav>

            {/* ── Right: Search + Action Buttons + Cursive Flourish ── */}
            <div className="flex items-center gap-2.5 sm:gap-3 xl:gap-3.5 shrink-0 relative z-10 pr-4 sm:pr-8 md:pr-14 lg:pr-18 xl:pr-22">
              {/* Quick Search Button */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:text-[#0891B2] hover:bg-sky-50/80 transition-all cursor-pointer"
                title="Search topics, symptoms, conditions..."
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
              </button>

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={ROUTES.APP.ROOT}
                    className="hidden sm:inline-flex items-center justify-center px-4 sm:px-5 py-1.5 rounded-full border-[1.5px] border-[#38BDF8] text-xs sm:text-sm font-semibold text-[#0284C7] bg-white hover:bg-sky-50 transition-all whitespace-nowrap shadow-2xs"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to={ROUTES.APP.ROOT}
                    className="inline-flex items-center justify-center px-5 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#00C4DF] to-[#0284C7] hover:from-[#00B4CB] hover:to-[#0369A1] text-xs sm:text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,196,223,0.35)] hover:shadow-lg transition-all whitespace-nowrap flex items-center gap-1.5"
                  >
                    <span>Go to App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <Link
                    to={ROUTES.LOGIN}
                    className="hidden sm:inline-flex items-center justify-center px-4 sm:px-5 py-1.5 rounded-full border-[1.5px] border-[#38BDF8] text-xs sm:text-sm font-semibold text-[#0284C7] bg-white hover:bg-sky-50 hover:border-[#0284C7] transition-all whitespace-nowrap shadow-2xs"
                  >
                    Log in
                  </Link>

                  <Link
                    to={ROUTES.REGISTER}
                    className="inline-flex items-center justify-center px-5 sm:px-6 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#00C4DF] to-[#0284C7] hover:from-[#00B4CB] hover:to-[#0369A1] text-xs sm:text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,196,223,0.35)] hover:shadow-lg transition-all whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Cursive Tagline Accent from Concept: "For a / healthier you. ♡" */}
              <div className="hidden xl:flex flex-col items-start leading-none text-[#0284C7] select-none pl-1 shrink-0 -rotate-1">
                <span className="font-script text-[18px] xl:text-[20px] font-bold tracking-tight">
                  For a
                </span>
                <div className="flex items-center gap-1 -mt-1">
                  <span className="font-script text-[18px] xl:text-[20px] font-bold tracking-tight">
                    healthier you.
                  </span>
                  <Heart className="w-3.5 h-3.5 text-[#E11D48] fill-none stroke-[2.5] shrink-0" />
                </div>
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#162A45] hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ── Mobile Navigation Dropdown Card ── */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mt-2.5 lg:hidden w-full bg-white/98 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 pointer-events-auto"
              >
                {/* Mobile Quick Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search conditions, nutrition, guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchOpen(true)}
                    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-[#0891B2]"
                  />
                </div>

                {/* Navigation Links List */}
                <div className="flex flex-col space-y-1 text-sm font-semibold text-[#162A45]">
                  <Link
                    to={ROUTES.HOME}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isHomeActive ? 'bg-sky-50 text-[#0891B2] font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    to={ROUTES.ABOUT}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isAboutActive ? 'bg-sky-50 text-[#0891B2] font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    to={ROUTES.HOW_IT_WORKS}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isHowItWorksActive ? 'bg-sky-50 text-[#0891B2] font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    How It Works
                  </Link>
                  <Link
                    to={ROUTES.CONDITIONS}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isConditionsActive ? 'bg-sky-50 text-[#0891B2] font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    Conditions We Support
                  </Link>

                  {/* Sub-menu for Understand */}
                  <div className="pt-2 pb-1 px-2.5">
                    <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block mb-1">
                      Understand Pathways
                    </span>
                    <div className="space-y-1 pl-1">
                      <Link
                        to={ROUTES.UNDERSTAND_PCOS_CANONICAL}
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[#E11D48] hover:bg-rose-50/70"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>Understand PCOS</span>
                      </Link>
                      <Link
                        to={ROUTES.UNDERSTAND_MALE_HYPOGONADISM}
                        className="flex items-center gap-2 p-2 rounded-lg text-xs font-bold text-[#0891B2] hover:bg-sky-50/70"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Understand Male Hypogonadism</span>
                      </Link>
                    </div>
                  </div>

                  <Link
                    to={ROUTES.FEATURES}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isFeaturesActive ? 'bg-sky-50 text-[#0891B2] font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    Resources &amp; Capabilities
                  </Link>
                  <Link
                    to={ROUTES.CONTACT}
                    className={`p-2.5 rounded-xl transition-colors ${
                      isContactActive ? 'bg-sky-50 text-[#0891B2] font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    Contact &amp; Support
                  </Link>
                </div>

                {/* Mobile Auth Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                  {!isAuthenticated ? (
                    <>
                      <Link
                        to={ROUTES.REGISTER}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00C4DF] to-[#0284C7] text-white text-center font-bold text-sm shadow-md"
                      >
                        Sign Up Now
                      </Link>
                      <Link
                        to={ROUTES.LOGIN}
                        className="w-full py-2.5 rounded-xl border border-slate-200 text-[#0284C7] text-center font-semibold text-sm hover:bg-slate-50"
                      >
                        Log in to Account
                      </Link>
                    </>
                  ) : (
                    <Link
                      to={ROUTES.APP.ROOT}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00C4DF] to-[#0284C7] text-white text-center font-bold text-sm shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Launch Health App</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Cursive Mobile Footer */}
                <div className="text-center pt-2 select-none">
                  <span className="font-script text-xl font-bold text-[#0284C7]">
                    For a healthier you.{' '}
                  </span>
                  <Heart className="w-3.5 h-3.5 text-[#E11D48] fill-none stroke-[2.5] inline-block" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Interactive Quick Search Modal ── */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-left"
            >
              {/* Search Bar Header */}
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Search className="w-5 h-5 text-[#0891B2]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search PCOS, Male Hypogonadism, Nutrition, Features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredSuggestions.length > 0) {
                      navigate(filteredSuggestions[0].path);
                      setIsSearchOpen(false);
                    }
                    if (e.key === 'Escape') setIsSearchOpen(false);
                  }}
                  className="flex-grow text-sm sm:text-base font-medium text-[#162A45] placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Suggestions List */}
              <div className="max-h-80 overflow-y-auto p-3 space-y-1">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setIsSearchOpen(false);
                      }}
                      className="w-full p-2.5 rounded-xl hover:bg-sky-50/70 flex items-center justify-between text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#0891B2] flex items-center justify-center shrink-0">
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-[#162A45] group-hover:text-[#0891B2] block">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-[#0891B2] font-semibold">
                        Jump →
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-sans">
                    No matching topics found for "{searchQuery}". Try searching for PCOS, Hypogonadism, or Nutrition.
                  </div>
                )}
              </div>

              {/* Bottom Search Footer */}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Press <strong>ESC</strong> to exit</span>
                <span className="font-script text-sm text-[#0891B2] font-bold">BioPulse AI Knowledge</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
