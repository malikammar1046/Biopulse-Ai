import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Calendar,
  FileText,
  Activity,
  Heart,
  Droplet,
  Search,
  Sparkles,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import { UserAvatar } from '../common/UserAvatar';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';

export interface HeaderConfig {
  eyebrow: string;
  title: string | ((firstName: string, greetingTime: string) => string);
  subtitle: string;
}

export type RouteKey =
  | 'overview'
  | 'screening'
  | 'clinicalData'
  | 'progress'
  | 'nutrition'
  | 'fitness'
  | 'companion'
  | 'tracking'
  | 'cycle'
  | 'reports'
  | 'care'
  | 'settings'
  | 'hub';

/**
 * Route-driven configuration matrix for Female, Male, and General pathways.
 * Strictly adheres to clinical terminology guidelines:
 * - Female: PCOS, cycle, menstrual patterns
 * - Male: Hypogonadism, hormonal health, testosterone screening
 */
export const PAGE_HEADER_CONFIG: Record<
  RouteKey,
  Record<HealthPathway, HeaderConfig>
> = {
  overview: {
    female: {
      eyebrow: 'Female Health / Overview',
      title: (firstName, greetingTime) => `${greetingTime}, ${firstName}`,
      subtitle: "Here's your latest PCOS screening and health overview.",
    },
    male: {
      eyebrow: 'Male Health / Overview',
      title: (firstName, greetingTime) => `${greetingTime}, ${firstName}`,
      subtitle: "Here's your latest hypogonadism screening and health overview.",
    },
    general: {
      eyebrow: 'Health Intelligence / Overview',
      title: (firstName, greetingTime) => `${greetingTime}, ${firstName}`,
      subtitle: "Here's your latest health intelligence and screening overview.",
    },
  },
  screening: {
    female: {
      eyebrow: 'Female Health / Screening',
      title: 'PCOS Screening',
      subtitle: 'Review your risk assessment, screening tier, and next steps.',
    },
    male: {
      eyebrow: 'Male Health / Screening',
      title: 'Hypogonadism Screening',
      subtitle: 'Review your current screening result, assessment stage, and next steps.',
    },
    general: {
      eyebrow: 'Health Screening',
      title: 'Baseline Screening',
      subtitle: 'Review your clinical health assessment and current risk stage.',
    },
  },
  clinicalData: {
    female: {
      eyebrow: 'Female Health / Clinical Data',
      title: 'Clinical Data',
      subtitle: 'Add laboratory or clinical values to improve your assessment.',
    },
    male: {
      eyebrow: 'Male Health / Clinical Data',
      title: 'Clinical Data',
      subtitle: 'Add hormonal and clinical values to improve your assessment.',
    },
    general: {
      eyebrow: 'Health / Clinical Data',
      title: 'Clinical Data',
      subtitle: 'Add laboratory or clinical values to improve your assessment.',
    },
  },
  progress: {
    female: {
      eyebrow: 'Female Health / Progress',
      title: 'Longitudinal Health',
      subtitle: 'See how your key health indicators have changed over time.',
    },
    male: {
      eyebrow: 'Male Health / Progress',
      title: 'Longitudinal Health',
      subtitle: 'See how your key hormonal and health indicators have changed over time.',
    },
    general: {
      eyebrow: 'Health / Progress',
      title: 'Longitudinal Health',
      subtitle: 'See how your key health indicators have changed over time.',
    },
  },
  nutrition: {
    female: {
      eyebrow: 'Female Health / Nutrition',
      title: 'Nutrition Plan',
      subtitle: 'Personalized nutrition guidance based on your health profile.',
    },
    male: {
      eyebrow: 'Male Health / Nutrition',
      title: 'Nutrition Plan',
      subtitle: 'Personalized nutrition guidance based on your health profile.',
    },
    general: {
      eyebrow: 'Health / Nutrition',
      title: 'Nutrition Plan',
      subtitle: 'Personalized nutrition guidance based on your health profile.',
    },
  },
  fitness: {
    female: {
      eyebrow: 'Female Health / Fitness',
      title: 'Movement & Fitness',
      subtitle: 'Activity guidance designed around your current health profile.',
    },
    male: {
      eyebrow: 'Male Health / Fitness',
      title: 'Movement & Fitness',
      subtitle: 'Activity guidance designed around your current health profile.',
    },
    general: {
      eyebrow: 'Health / Fitness',
      title: 'Movement & Fitness',
      subtitle: 'Activity guidance designed around your current health profile.',
    },
  },
  companion: {
    female: {
      eyebrow: 'Female Health / AI Companion',
      title: 'BioPulse Companion',
      subtitle: 'Ask questions and understand your health information.',
    },
    male: {
      eyebrow: 'Male Health / AI Companion',
      title: 'BioPulse Companion',
      subtitle: 'Ask questions and better understand your health information.',
    },
    general: {
      eyebrow: 'Health / AI Companion',
      title: 'BioPulse Companion',
      subtitle: 'Ask questions and understand your health information.',
    },
  },
  tracking: {
    female: {
      eyebrow: 'Female Health / Daily Tracking',
      title: 'Daily Tracking',
      subtitle: 'Track symptoms, cycle patterns, lifestyle, and daily health signals.',
    },
    male: {
      eyebrow: 'Male Health / Daily Tracking',
      title: 'Daily Tracking',
      subtitle: 'Track vitality symptoms, lifestyle factors, and daily health signals.',
    },
    general: {
      eyebrow: 'Health / Daily Tracking',
      title: 'Daily Tracking',
      subtitle: 'Track symptoms, lifestyle, and daily health signals.',
    },
  },
  cycle: {
    female: {
      eyebrow: 'Female Health / Daily Tracking',
      title: 'Cycle Tracking',
      subtitle: 'Track your period dates, phases, and natural hormonal rhythm.',
    },
    male: {
      eyebrow: 'Male Health / Daily Tracking',
      title: 'Daily Tracking',
      subtitle: 'Track vitality symptoms, lifestyle factors, and daily health signals.',
    },
    general: {
      eyebrow: 'Health / Daily Tracking',
      title: 'Cycle Tracking',
      subtitle: 'Track reproductive and hormonal rhythm markers.',
    },
  },
  reports: {
    female: {
      eyebrow: 'Female Health / Reports',
      title: 'Health Reports',
      subtitle: 'Review your assessments, clinical reports, and health history.',
    },
    male: {
      eyebrow: 'Male Health / Reports',
      title: 'Health Reports',
      subtitle: 'Review your screening results, clinical reports, and health history.',
    },
    general: {
      eyebrow: 'Health / Reports',
      title: 'Health Reports',
      subtitle: 'Review your assessments, clinical reports, and health history.',
    },
  },
  care: {
    female: {
      eyebrow: 'Female Health / Care',
      title: 'Appointments & Care',
      subtitle: 'Manage appointments and connect with appropriate specialists.',
    },
    male: {
      eyebrow: 'Male Health / Care',
      title: 'Appointments & Care',
      subtitle: 'Manage appointments and connect with appropriate specialists.',
    },
    general: {
      eyebrow: 'Health / Care',
      title: 'Appointments & Care',
      subtitle: 'Manage appointments and connect with appropriate specialists.',
    },
  },
  settings: {
    female: {
      eyebrow: 'Female Health / Settings',
      title: 'Profile & Settings',
      subtitle: 'Manage your health profile, preferences, and account.',
    },
    male: {
      eyebrow: 'Male Health / Settings',
      title: 'Profile & Settings',
      subtitle: 'Manage your health profile, preferences, and account.',
    },
    general: {
      eyebrow: 'Health / Settings',
      title: 'Profile & Settings',
      subtitle: 'Manage your health profile, preferences, and account.',
    },
  },
  hub: {
    female: {
      eyebrow: 'Female Health / Health Hub',
      title: 'Health Intelligence Hub',
      subtitle: 'Unified intelligence snapshot across all your clinical indicators.',
    },
    male: {
      eyebrow: 'Male Health / Health Hub',
      title: 'Health Intelligence Hub',
      subtitle: 'Unified intelligence snapshot across all your clinical indicators.',
    },
    general: {
      eyebrow: 'Health / Health Hub',
      title: 'Health Intelligence Hub',
      subtitle: 'Unified intelligence snapshot across all your clinical indicators.',
    },
  },
};

/**
 * Urdu localized page header configuration matrix
 */
export const URDU_PAGE_HEADER_CONFIG: Record<
  RouteKey,
  Record<HealthPathway, HeaderConfig>
> = {
  overview: {
    female: {
      eyebrow: 'خواتین کی صحت / جائزہ',
      title: (firstName, greetingTime) => `${greetingTime}، ${firstName}`,
      subtitle: 'آپ کا تازہ ترین PCOS اسکریننگ اور صحت کا جائزہ۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / جائزہ',
      title: (firstName, greetingTime) => `${greetingTime}، ${firstName}`,
      subtitle: 'آپ کا تازہ ترین ہائپوگوناڈزم اسکریننگ اور صحت کا جائزہ۔',
    },
    general: {
      eyebrow: 'ہیلتھ انٹیلیجنس / جائزہ',
      title: (firstName, greetingTime) => `${greetingTime}، ${firstName}`,
      subtitle: 'آپ کی تازہ ترین ہیلتھ انٹیلیجنس اور اسکریننگ کا جائزہ۔',
    },
  },
  screening: {
    female: {
      eyebrow: 'خواتین کی صحت / اسکریننگ',
      title: 'PCOS اسکریننگ',
      subtitle: 'اپنا خطرے کا تخمینہ، اسکریننگ کا مرحلہ اور اگلے اقدامات دیکھیں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / اسکریننگ',
      title: 'ہائپوگوناڈزم اسکریننگ',
      subtitle: 'اپنا موجودہ اسکریننگ رزلٹ، اسسمنٹ مرحلہ اور اگلے اقدامات دیکھیں۔',
    },
    general: {
      eyebrow: 'صحت کی اسکریننگ',
      title: 'بنیادی اسکریننگ',
      subtitle: 'اپنی کلینیکل ہیلتھ اسسمنٹ اور موجودہ رسک اسٹیج دیکھیں۔',
    },
  },
  clinicalData: {
    female: {
      eyebrow: 'خواتین کی صحت / کلینیکل ڈیٹا',
      title: 'کلینیکل ڈیٹا',
      subtitle: 'اپنی اسسمنٹ کو بہتر بنانے کے لیے لیبارٹری یا طبی ریکارڈ درج کریں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / کلینیکل ڈیٹا',
      title: 'کلینیکل ڈیٹا',
      subtitle: 'اپنی اسسمنٹ کو بہتر بنانے کے لیے ہارمونل یا کلینیکل اقدار درج کریں۔',
    },
    general: {
      eyebrow: 'صحت / کلینیکل ڈیٹا',
      title: 'کلینیکل ڈیٹا',
      subtitle: 'اپنی اسسمنٹ کو بہتر بنانے کے لیے لیبارٹری یا کلینیکل اقدار درج کریں۔',
    },
  },
  progress: {
    female: {
      eyebrow: 'خواتین کی صحت / پیش رفت',
      title: 'طویل مدتی صحت (Longitudinal Health)',
      subtitle: 'دیکھیں کہ وقت کے ساتھ آپ کے صحت کے اہم اشاریے کیسے تبدیل ہوئے ہیں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / پیش رفت',
      title: 'طویل مدتی صحت (Longitudinal Health)',
      subtitle: 'دیکھیں کہ وقت کے ساتھ آپ کے ہارمونل اور عمومی اشاریے کیسے تبدیل ہوئے ہیں۔',
    },
    general: {
      eyebrow: 'صحت / پیش رفت',
      title: 'طویل مدتی صحت (Longitudinal Health)',
      subtitle: 'دیکھیں کہ وقت کے ساتھ آپ کے صحت کے اشاریے کیسے تبدیل ہوئے ہیں۔',
    },
  },
  nutrition: {
    female: {
      eyebrow: 'خواتین کی صحت / غذائیت',
      title: 'نیوٹریشن پلان',
      subtitle: 'آپ کے ہیلتھ پروفائل کے مطابق بنائی گئی مخصوص غذائی رہنمائی۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / غذائیت',
      title: 'نیوٹریشن پلان',
      subtitle: 'آپ کے ہیلتھ پروفائل کے مطابق بنائی گئی مخصوص غذائی رہنمائی۔',
    },
    general: {
      eyebrow: 'صحت / غذائیت',
      title: 'نیوٹریشن پلان',
      subtitle: 'آپ کے ہیلتھ پروفائل کے مطابق بنائی گئی مخصوص غذائی رہنمائی۔',
    },
  },
  fitness: {
    female: {
      eyebrow: 'خواتین کی صحت / فٹنس',
      title: 'ورزش اور جسمانی سرگرمی',
      subtitle: 'آپ کی صحت کی صورتحال کے مطابق تیار کردہ متحرک رہنمائی۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / فٹنس',
      title: 'ورزش اور جسمانی سرگرمی',
      subtitle: 'آپ کی صحت کی صورتحال کے مطابق تیار کردہ متحرک رہنمائی۔',
    },
    general: {
      eyebrow: 'صحت / فٹنس',
      title: 'ورزش اور جسمانی سرگرمی',
      subtitle: 'آپ کی صحت کی صورتحال کے مطابق تیار کردہ متحرک رہنمائی۔',
    },
  },
  companion: {
    female: {
      eyebrow: 'خواتین کی صحت / AI ساتھی',
      title: 'BioPulse ساتھی',
      subtitle: 'سوالات پوچھیں اور اپنی صحت کے بارے میں رہنمائی حاصل کریں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / AI ساتھی',
      title: 'BioPulse ساتھی',
      subtitle: 'سوالات پوچھیں اور اپنی صحت کے بارے میں رہنمائی حاصل کریں۔',
    },
    general: {
      eyebrow: 'صحت / AI ساتھی',
      title: 'BioPulse ساتھی',
      subtitle: 'سوالات پوچھیں اور اپنی صحت کے بارے میں رہنمائی حاصل کریں۔',
    },
  },
  tracking: {
    female: {
      eyebrow: 'خواتین کی صحت / روزمرہ ٹریکنگ',
      title: 'روزمرہ ٹریکنگ',
      subtitle: 'علامات، ماہواری کے پیٹرن اور طرزِ زندگی کو باقاعدگی سے ٹریک کریں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / روزمرہ ٹریکنگ',
      title: 'روزمرہ ٹریکنگ',
      subtitle: 'علامات، توانائی کے اشاریے اور طرزِ زندگی کو باقاعدگی سے ٹریک کریں۔',
    },
    general: {
      eyebrow: 'صحت / روزمرہ ٹریکنگ',
      title: 'روزمرہ ٹریکنگ',
      subtitle: 'علامات، طرزِ زندگی اور روزمرہ صحت کے اشاریے ٹریک کریں۔',
    },
  },
  cycle: {
    female: {
      eyebrow: 'خواتین کی صحت / سائیکل ٹریکنگ',
      title: 'ماہواری سائیکل ٹریکنگ',
      subtitle: 'اپنی تاریخیں، فیزز اور قدرتی ہارمونل تال کو مانیٹر کریں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / روزمرہ ٹریکنگ',
      title: 'روزمرہ ٹریکنگ',
      subtitle: 'توانائی، علامات اور طرزِ زندگی کے اشاریے مانیٹر کریں۔',
    },
    general: {
      eyebrow: 'صحت / سائیکل ٹریکنگ',
      title: 'سائیکل ٹریکنگ',
      subtitle: 'تولیدی اور ہارمونل تال کے اشاریے مانیٹر کریں۔',
    },
  },
  reports: {
    female: {
      eyebrow: 'خواتین کی صحت / رپورٹس',
      title: 'میڈیکل رپورٹس',
      subtitle: 'اپنی اسسمنٹس، لیب رپورٹس اور میڈیکل ہسٹری کا جائزہ لیں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / رپورٹس',
      title: 'میڈیکل رپورٹس',
      subtitle: 'اپنے اسکریننگ نتائج، لیب رپورٹس اور میڈیکل ہسٹری کا جائزہ لیں۔',
    },
    general: {
      eyebrow: 'صحت / رپورٹس',
      title: 'میڈیکل رپورٹس',
      subtitle: 'اپنی اسسمنٹس، لیب رپورٹس اور میڈیکل ہسٹری کا جائزہ لیں۔',
    },
  },
  care: {
    female: {
      eyebrow: 'خواتین کی صحت / کیئر',
      title: 'اپائنٹمنٹس اور کیئر',
      subtitle: 'اپنی اپائنٹمنٹس کا انتظام کریں اور متعلقہ ماہرین سے رابطہ کریں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / کیئر',
      title: 'اپائنٹمنٹس اور کیئر',
      subtitle: 'اپنی اپائنٹمنٹس کا انتظام کریں اور متعلقہ ماہرین سے رابطہ کریں۔',
    },
    general: {
      eyebrow: 'صحت / کیئر',
      title: 'اپائنٹمنٹس اور کیئر',
      subtitle: 'اپنی اپائنٹمنٹس کا انتظام کریں اور متعلقہ ماہرین سے رابطہ کریں۔',
    },
  },
  settings: {
    female: {
      eyebrow: 'خواتین کی صحت / سیٹنگز',
      title: 'پروفائل اور ترتیبات',
      subtitle: 'اپنا ہیلتھ پروفائل، ترجیحات اور اکاؤنٹ سیٹنگز سنبھالیں۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / سیٹنگز',
      title: 'پروفائل اور ترتیبات',
      subtitle: 'اپنا ہیلتھ پروفائل، ترجیحات اور اکاؤنٹ سیٹنگز سنبھالیں۔',
    },
    general: {
      eyebrow: 'صحت / سیٹنگز',
      title: 'پروفائل اور ترتیبات',
      subtitle: 'اپنا ہیلتھ پروفائل، ترجیحات اور اکاؤنٹ سیٹنگز سنبھالیں۔',
    },
  },
  hub: {
    female: {
      eyebrow: 'خواتین کی صحت / انٹیلیجنس ہب',
      title: 'ہیلتھ انٹیلیجنس ہب',
      subtitle: 'آپ کے تمام طبی اشاریوں کا ایک جامع اور مربوط خلاصہ۔',
    },
    male: {
      eyebrow: 'مردانہ صحت / انٹیلیجنس ہب',
      title: 'ہیلتھ انٹیلیجنس ہب',
      subtitle: 'آپ کے تمام طبی اشاریوں کا ایک جامع اور مربوط خلاصہ۔',
    },
    general: {
      eyebrow: 'صحت / انٹیلیجنس ہب',
      title: 'ہیلتھ انٹیلیجنس ہب',
      subtitle: 'آپ کے تمام طبی اشاریوں کا ایک جامع اور مربوط خلاصہ۔',
    },
  },
};

/**
 * Resolves current pathname into a strongly-typed RouteKey
 */
function resolveRouteKey(pathname: string): RouteKey {
  if (
    pathname === ROUTES.APP.ROOT ||
    pathname === ROUTES.APP.DASHBOARD ||
    pathname === ROUTES.APP.OVASENSE ||
    pathname === ROUTES.APP.ANDROSENSE ||
    pathname === ROUTES.APP.VITASENSE
  ) {
    return 'overview';
  }
  if (pathname.startsWith(ROUTES.APP.ASSESSMENT)) return 'screening';
  if (pathname.startsWith(ROUTES.APP.MEDICATIONS)) return 'clinicalData';
  if (pathname.startsWith(ROUTES.APP.PROGRESS) || pathname.startsWith(ROUTES.APP.TIMELINE)) return 'progress';
  if (
    pathname.startsWith(ROUTES.APP.LIFESTYLE) ||
    pathname.startsWith(ROUTES.APP.DIET) ||
    pathname.startsWith(ROUTES.APP.DIET_WEEK)
  ) {
    return 'nutrition';
  }
  if (pathname.startsWith(ROUTES.APP.FITNESS)) return 'fitness';
  if (
    pathname.startsWith(ROUTES.APP.CHAT) ||
    pathname.startsWith(ROUTES.APP.AI_TWIN) ||
    pathname.startsWith('/app/ai') ||
    pathname.startsWith('/app/assistant')
  ) {
    return 'companion';
  }
  if (pathname.startsWith(ROUTES.APP.CYCLE) || pathname.startsWith(ROUTES.APP.SYMPTOMS)) {
    return 'tracking';
  }
  if (pathname.startsWith(ROUTES.APP.REPORTS)) return 'reports';
  if (pathname.startsWith(ROUTES.APP.APPOINTMENTS) || pathname.startsWith(ROUTES.APP.CARE_CIRCLE)) return 'care';
  if (pathname.startsWith(ROUTES.APP.SETTINGS) || pathname.startsWith(ROUTES.APP.PROFILE)) return 'settings';
  if (pathname.startsWith(ROUTES.APP.HUB) || pathname.startsWith('/app/master-hub')) return 'hub';

  return 'overview';
}

export const AppDashboardHeader: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, snapshotMetrics, reports, appointments, openAiChatWithPrompt } = useUserHealth();
  const { logout } = useAuth();
  const { i18n } = useTranslation(['navigation', 'common']);
  const isUrdu = i18n.language === 'ur';

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(e.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close search suggestions on outside click
  useEffect(() => {
    const handleSearchOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleSearchOutside);
    return () => document.removeEventListener('mousedown', handleSearchOutside);
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
    setIsSearchFocused(false);
  }, [location.pathname]);

  const pathway: HealthPathway = resolvePathway(
    userProfile?.gender,
    userProfile?.pathway
  );
  const isFemale = pathway === 'female';

  // 1. Dynamic User Name & Avatar
  const displayName =
    userProfile?.fullName?.trim() ||
    (userProfile?.email ? userProfile.email.split('@')[0] : 'User');
  const firstName = displayName.split(' ')[0] || 'User';
  const displayEmail = userProfile?.email || 'member@biopulse.ai';

  // 2. Time-Aware Dynamic Greeting (05:00-11:59, 12:00-16:59, 17:00+)
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (isUrdu) {
      if (hour >= 5 && hour < 12) return 'صبح بخیر';
      if (hour >= 12 && hour < 17) return 'دوپہر بخیر';
      return 'شام بخیر';
    }
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [isUrdu]);

  // 3. Resolve Current Route Content
  const routeKey = resolveRouteKey(location.pathname);
  const activeHeaderConfig = isUrdu ? URDU_PAGE_HEADER_CONFIG : PAGE_HEADER_CONFIG;
  const config = activeHeaderConfig[routeKey]?.[pathway] || activeHeaderConfig.overview.general;

  const resolvedTitle =
    typeof config.title === 'function'
      ? config.title(firstName, greetingTime)
      : config.title;

  // 4. Notifications Data Derived from Real State
  const notificationsList = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      desc: string;
      icon: React.ComponentType<{ className?: string }>;
      unread: boolean;
    }> = [];

    // Cycle Status (Female) or Daily Rhythm (Male)
    if (isFemale && snapshotMetrics.cycleDay > 0) {
      list.push({
        id: 'cycle',
        title: isUrdu ? `${snapshotMetrics.phaseName} فعال ہے` : `${snapshotMetrics.phaseName} Active`,
        desc: isUrdu
          ? `آپ سائیکل کے دن ${snapshotMetrics.cycleDay} پر ہیں (${snapshotMetrics.totalCycleDays} روزہ سائیکل)۔`
          : `You are on Cycle Day ${snapshotMetrics.cycleDay} (${snapshotMetrics.totalCycleDays}-day cycle).`,
        icon: Heart,
        unread: false,
      });
    }

    // Unverified Lab Reports
    const unverifiedCount = (reports || []).filter(
      (r) => r.status === 'needs_verification'
    ).length;
    if (unverifiedCount > 0) {
      list.push({
        id: 'reports',
        title: isUrdu
          ? `${unverifiedCount} رپورٹ${unverifiedCount > 1 ? 'س' : ''} کا جائزہ درکار ہے`
          : `${unverifiedCount} Report${unverifiedCount > 1 ? 's' : ''} Need Review`,
        desc: isUrdu
          ? 'OCR کے ذریعے نکالی گئی لیبارٹری اقدار تصدیق کے لیے تیار ہیں۔'
          : 'New laboratory values extracted via OCR ready for verification.',
        icon: FileText,
        unread: true,
      });
    }

    // Upcoming Appointment
    const scheduled = (appointments || []).find((a) => a.status === 'scheduled');
    if (scheduled) {
      list.push({
        id: 'appt',
        title: isUrdu ? 'آنے والی اپائنٹمنٹ' : 'Upcoming Appointment',
        desc: isUrdu
          ? `${scheduled.scheduledDate} کو وقت ${scheduled.scheduledTime} پر مقرر ہے۔`
          : `Scheduled on ${scheduled.scheduledDate} at ${scheduled.scheduledTime}.`,
        icon: Calendar,
        unread: true,
      });
    }

    // Daily Water Baseline
    list.push({
      id: 'water',
      title: isUrdu ? 'پانی پینے کا یومیہ ہدف' : 'Daily Water Target',
      desc: isUrdu
        ? `ہدف روزانہ ${((userProfile?.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)} لیٹر ہے۔`
        : `Target is ${((userProfile?.lifestyle?.dailyWaterGlasses || 8) * 0.25).toFixed(1)}L per day.`,
      icon: Droplet,
      unread: false,
    });

    return list;
  }, [isFemale, snapshotMetrics, reports, appointments, userProfile, isUrdu]);

  const hasUnread = notificationsList.some((n) => n.unread);

  const quickDestinations = useMemo(() => {
    const all = isUrdu
      ? [
          { label: 'علامات کی جانچ', path: ROUTES.APP.SYMPTOMS, hint: 'کیفیت اور درد ٹریک کریں' },
          { label: 'غذائیت اور کھانے', path: ROUTES.APP.LIFESTYLE, hint: 'کھانوں کا لاگ اور اہداف' },
          { label: 'ورزش اور سرگرمی', path: ROUTES.APP.FITNESS, hint: 'ورزشیں اور روٹین' },
          { label: 'طبی رپورٹس اور لیبز', path: ROUTES.APP.REPORTS, hint: 'بلڈ ٹیسٹ اور OCR' },
          { label: 'ادویات اور یاد دہانیاں', path: ROUTES.APP.MEDICATIONS, hint: 'خوراک اور اوقات' },
          {
            label: isFemale ? 'ماہواری سائیکل ٹریکنگ' : 'طاقت اور معمولات',
            path: isFemale ? ROUTES.APP.CYCLE : ROUTES.APP.SYMPTOMS,
            hint: isFemale ? 'سائیکل کے فیزز اور کیلنڈر' : 'ہارمونل چیک اِن',
          },
        ]
      : [
          { label: 'Symptom Check-in', path: ROUTES.APP.SYMPTOMS, hint: 'Track feelings & pain' },
          { label: 'Nutrition & Meals', path: ROUTES.APP.LIFESTYLE, hint: 'Meal log & targets' },
          { label: 'Exercise & Movement', path: ROUTES.APP.FITNESS, hint: 'Workouts & activity' },
          { label: 'Health Reports & Labs', path: ROUTES.APP.REPORTS, hint: 'Blood tests & OCR' },
          { label: 'Medications & Reminders', path: ROUTES.APP.MEDICATIONS, hint: 'Doses & schedule' },
          {
            label: isFemale ? 'Period Cycle Tracking' : 'Vitality & Tracking',
            path: isFemale ? ROUTES.APP.CYCLE : ROUTES.APP.SYMPTOMS,
            hint: isFemale ? 'Cycle phases & calendar' : 'Hormonal check-in',
          },
        ];
    if (!searchQuery.trim()) return all.slice(0, 4);
    const q = searchQuery.toLowerCase();
    return all.filter((d) => d.label.toLowerCase().includes(q) || d.hint.toLowerCase().includes(q));
  }, [isFemale, searchQuery, isUrdu]);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isOverview = routeKey === 'overview';

  return (
    <header className="w-full bg-white border-b border-[#E2E8F0] select-none text-left z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        {/* ── LEFT: Search field on Overview, Breadcrumbs/Title on other routes ── */}
        {isOverview ? (
          <div className="flex-1 max-w-xl w-full relative" ref={searchContainerRef}>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    openAiChatWithPrompt?.(searchQuery.trim());
                    setIsSearchFocused(false);
                    setSearchQuery('');
                  }
                }}
                placeholder={isUrdu ? 'علامات، غذائیت، سرگرمی تلاش کریں یا AI سے پوچھیں...' : 'Search for symptoms, meals, workouts, or ask AI...'}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-xs sm:text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F43F7D]/50 focus:ring-2 focus:ring-[#FDE6EF] transition-all"
              />
            </div>

            {/* Live Search Suggestions Dropdown */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 right-0 mt-2 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-left space-y-1"
                >
                  <div className="px-3 py-1.5 text-[10.5px] font-mono uppercase text-slate-400 font-semibold tracking-wider">
                    {isUrdu ? 'فوری نیویگیشن' : 'Quick Navigation'}
                  </div>
                  {quickDestinations.map((dest) => (
                    <button
                      key={dest.path}
                      type="button"
                      onClick={() => {
                        navigate(dest.path);
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <span>{dest.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{dest.hint}</span>
                    </button>
                  ))}
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        openAiChatWithPrompt?.(searchQuery.trim());
                        setIsSearchFocused(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#7E22CE] bg-[#FAF5FF] hover:bg-[#F3E8FF] transition-colors text-left cursor-pointer mt-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#7E22CE]" />
                      <span>{isUrdu ? `BioPulse AI سے پوچھیں: "${searchQuery}"` : `Ask BioPulse AI: \u201C${searchQuery}\u201D`}</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-1 min-w-0">
            {/* Eyebrow Breadcrumb */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <span>{config.eyebrow.split('/')[0]?.trim()}</span>
              <span className="text-slate-300">/</span>
              <span className={isFemale ? 'text-[#E11D48]' : 'text-[#0891B2]'}>
                {config.eyebrow.split('/')[1]?.trim()}
              </span>
            </div>

            {/* Dynamic Page Title */}
            <h1 className="text-2xl sm:text-[26px] lg:text-[28px] font-bold tracking-tight text-[#0F172A] font-display leading-tight truncate">
              {resolvedTitle}
            </h1>

            {/* Dynamic Short Description */}
            <p className="text-xs sm:text-[13.5px] text-[#64748B] font-sans font-normal leading-relaxed max-w-2xl">
              {config.subtitle}
            </p>
          </div>
        )}

        {/* ── RIGHT: Pathway Badge (on other routes), Notifications & Profile Control ── */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 self-start md:self-center">
          {/* Subtle Pathway Badge (hidden on overview, and compact on mobile) */}
          {!isOverview && (
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-colors select-none ${
                isFemale
                  ? 'bg-[#FDE6EF] text-[#E11D48] border-[#F43F7D]/25'
                  : 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isFemale ? (isUrdu ? 'PCOS پاتھ وے' : 'PCOS Pathway') : (isUrdu ? 'ہائپوگوناڈزم پاتھ وے' : 'Hypogonadism Pathway')}</span>
            </div>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notification Bell Control */}
          <div className="relative" ref={notificationDropdownRef}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl bg-white border border-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title={isUrdu ? 'اطلاعات' : 'Notifications'}
              aria-label={isUrdu ? 'اطلاعات' : 'Notifications'}
              aria-expanded={isNotificationsOpen}
            >
              <Bell className="w-4 h-4" aria-hidden="true" />
              {hasUnread && (
                <span
                  className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                    isFemale ? 'bg-[#E11D48]' : 'bg-[#0891B2]'
                  }`}
                />
              )}
            </button>

            {/* Notifications Popover Panel */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-left space-y-2.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <span className="text-xs font-bold font-mono uppercase text-slate-800 tracking-wider">
                      {isUrdu ? 'صحت کی اپ ڈیٹس' : 'Health Updates'}
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      {notificationsList.length} {isUrdu ? 'آئٹمز' : 'items'}
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {notificationsList.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start gap-2.5 border border-transparent hover:border-slate-100"
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              isFemale
                                ? 'bg-[#FDE6EF] text-[#E11D48]'
                                : 'bg-[#E0F2FE] text-[#0284C7]'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-semibold text-slate-800 truncate block">
                                {item.title}
                              </span>
                              {item.unread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile / Avatar Control */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="inline-flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white border border-[#E2E8F0] hover:bg-slate-50 transition-colors cursor-pointer select-none"
              aria-label={isUrdu ? 'صارف اکاؤنٹ مینو' : 'User Account Menu'}
              aria-expanded={isProfileOpen}
            >
              {/* Avatar / Initials */}
              <UserAvatar
                avatarUrl={userProfile?.avatarUrl}
                name={displayName}
                email={displayEmail}
                size="sm"
                pathway={pathway}
                gender={userProfile?.gender}
                showBorder={false}
              />

              {/* Full Name & Pathway Label */}
              <div className="flex flex-col text-left leading-tight hidden sm:block">
                <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate block">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-500 font-sans block">
                  {isFemale ? (isUrdu ? 'PCOS پاتھ وے' : 'PCOS Pathway') : (isUrdu ? 'ہائپوگوناڈزم پاتھ وے' : 'Hypogonadism Pathway')}
                </span>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {/* Profile Dropdown Menu */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 text-left space-y-1"
                >
                  {/* User Profile Header */}
                  <div className="p-2.5 pb-2 border-b border-slate-100 flex items-center gap-2.5">
                    <UserAvatar
                      avatarUrl={userProfile?.avatarUrl}
                      name={displayName}
                      email={displayEmail}
                      size="lg"
                      pathway={pathway}
                      gender={userProfile?.gender}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {displayName}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400 truncate">
                        {displayEmail}
                      </p>
                    </div>
                  </div>

                  {/* Settings / Profile Links */}
                  <Link
                    to={ROUTES.APP.SETTINGS}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span>{isUrdu ? 'پروفائل اور ترتیبات' : 'Profile & Settings'}</span>
                  </Link>

                  <Link
                    to={ROUTES.APP.ROOT}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    <span>{isUrdu ? 'ڈیش بورڈ ہوم' : 'Dashboard Home'}</span>
                  </Link>

                  {/* Sign Out Action */}
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" aria-hidden="true" />
                      <span>{isUrdu ? 'لاگ آؤٹ' : 'Sign Out'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppDashboardHeader;
