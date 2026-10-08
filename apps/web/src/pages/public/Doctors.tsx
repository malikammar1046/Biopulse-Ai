import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  AlertCircle,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Heart,
  Activity,
  Award,
  ChevronDown,
  Sparkles,
  Users,
  Banknote,
  Clock,
  Star,
  Search,
  CheckCircle2,
  X,
  Calendar,
  MessageCircle,
  Filter,
  Mars,
  Venus,
  HeartHandshake,
} from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { useDoctors } from '../../services/doctorService';
import type { Doctor } from '../../types/doctor';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';
import { getDoctorPathway, type PathwayClinicalBranch } from '../../utils/doctorPathway';

type HealthBranch = 'all' | 'female' | 'male' | 'both';

export const Doctors: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { userProfile } = useUserHealth();
  const authenticatedPathway = userProfile?.id
    ? resolvePathway(userProfile.gender, userProfile.pathway)
    : null;

  const { doctors, loading, error, refetch } = useDoctors();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBranch, setActiveBranch] = useState<HealthBranch>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pcos' | 'hypogonadism' | 'sexology' | 'budget' | 'video' | 'senior'>('all');
  const [activeSort, setActiveSort] = useState<'default' | 'fee-asc' | 'fee-desc' | 'exp-desc' | 'rating-desc' | 'name'>('default');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    document.title = 'Meet Our Specialists | PCOS, Hypogonadism & Care | BioPulse';
  }, []);

  // Sync pathway from URL query parameter
  useEffect(() => {
    const urlPathway = searchParams.get('pathway') || searchParams.get('filter');
    if (urlPathway === 'female_pcos' || urlPathway === 'female' || urlPathway === 'pcos') {
      setActiveBranch('female');
    } else if (urlPathway === 'male_hypogonadism' || urlPathway === 'male' || urlPathway === 'hypogonadism') {
      setActiveBranch('male');
    }
  }, [searchParams]);

  // Check intent / restore selected doctor after login or direct deep-link
  useEffect(() => {
    const targetDocId = searchParams.get('doctorId');
    let savedDocId: number | null = null;
    if (typeof window !== 'undefined') {
      const intentRaw = sessionStorage.getItem('biopulse_booking_intent');
      if (intentRaw) {
        try {
          const parsed = JSON.parse(intentRaw);
          if (parsed?.doctorId) savedDocId = Number(parsed.doctorId);
        } catch {
          // ignore
        }
      }
    }
    const docIdToSelect = targetDocId ? Number(targetDocId) : savedDocId;
    if (docIdToSelect && doctors.length > 0) {
      const match = doctors.find((d) => d.id === docIdToSelect);
      if (match) {
        setSelectedDoctor(match);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('biopulse_booking_intent');
        }
      }
    }
  }, [searchParams, doctors]);

  // Helper to parse min fee numeric value for sorting
  const extractMinFee = (feeStr: string | null | undefined): number => {
    if (!feeStr) return 999999;
    const clean = feeStr.replace(/,/g, '');
    const match = clean.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 999999;
  };

  // Helper to determine clinical branch (female, male, both, or unassigned)
  const getDoctorBranch = (doc: Doctor): PathwayClinicalBranch => {
    return getDoctorPathway(doc);
  };

  // Filtered & Sorted Doctors
  const filteredAndSortedDoctors = useMemo(() => {
    let result = [...doctors];

    // Branch filter: All vs Female (PCOS) vs Male (Hypogonadism) vs Both Genders (Sexology)
    if (activeBranch === 'female') {
      result = result.filter((doc) => getDoctorBranch(doc) === 'female');
    } else if (activeBranch === 'male') {
      result = result.filter((doc) => getDoctorBranch(doc) === 'male');
    } else if (activeBranch === 'both') {
      result = result.filter((doc) => getDoctorBranch(doc) === 'both');
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          (doc.specialty && doc.specialty.toLowerCase().includes(q)) ||
          (doc.qualifications && doc.qualifications.toLowerCase().includes(q)) ||
          (doc.location && doc.location.toLowerCase().includes(q)) ||
          (doc.services_offered && doc.services_offered.toLowerCase().includes(q)) ||
          (doc.short_bio && doc.short_bio.toLowerCase().includes(q))
      );
    }

    // Category / Feature filters
    if (activeFilter === 'pcos') {
      result = result.filter(
        (doc) =>
          (doc.specialty && (doc.specialty.toLowerCase().includes('pcos') || doc.specialty.toLowerCase().includes('hormon'))) ||
          (doc.short_bio && doc.short_bio.toLowerCase().includes('pcos')) ||
          (doc.services_offered && doc.services_offered.toLowerCase().includes('pcos'))
      );
    } else if (activeFilter === 'hypogonadism') {
      result = result.filter(
        (doc) =>
          (doc.specialty && (doc.specialty.toLowerCase().includes('androlog') || doc.specialty.toLowerCase().includes('urolog'))) ||
          (doc.short_bio && (doc.short_bio.toLowerCase().includes('hypogonadism') || doc.short_bio.toLowerCase().includes('testosterone'))) ||
          (doc.services_offered && doc.services_offered.toLowerCase().includes('hypogonadism'))
      );
    } else if (activeFilter === 'sexology') {
      result = result.filter((doc) => getDoctorBranch(doc) === 'both');
    } else if (activeFilter === 'budget') {
      // Under Rs. 2,500
      result = result.filter((doc) => extractMinFee(doc.fee) <= 2500);
    } else if (activeFilter === 'video') {
      result = result.filter(
        (doc) =>
          (doc.location && doc.location.toLowerCase().includes('video')) ||
          (doc.short_bio && doc.short_bio.toLowerCase().includes('video'))
      );
    } else if (activeFilter === 'senior') {
      // 15+ years experience
      result = result.filter((doc) => (doc.experience_years ?? 0) >= 15);
    }

    // Sorting
    result.sort((a, b) => {
      // Prioritize authenticated patient's clinical pathway
      if (authenticatedPathway === 'female') {
        const pA = a.pathway === 'female_pcos' ? 0 : a.pathway === 'both' ? 1 : 2;
        const pB = b.pathway === 'female_pcos' ? 0 : b.pathway === 'both' ? 1 : 2;
        if (pA !== pB) return pA - pB;
      } else if (authenticatedPathway === 'male') {
        const pA = a.pathway === 'male_hypogonadism' ? 0 : a.pathway === 'both' ? 1 : 2;
        const pB = b.pathway === 'male_hypogonadism' ? 0 : b.pathway === 'both' ? 1 : 2;
        if (pA !== pB) return pA - pB;
      }

      if (activeSort === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (activeSort === 'fee-asc') {
        return extractMinFee(a.fee) - extractMinFee(b.fee);
      }
      if (activeSort === 'fee-desc') {
        return extractMinFee(b.fee) - extractMinFee(a.fee);
      }
      if (activeSort === 'exp-desc') {
        return (b.experience_years ?? 0) - (a.experience_years ?? 0);
      }
      if (activeSort === 'rating-desc') {
        const ratingA = typeof a.rating === 'string' ? parseFloat(a.rating) : (a.rating ?? 0);
        const ratingB = typeof b.rating === 'string' ? parseFloat(b.rating) : (b.rating ?? 0);
        return ratingB - ratingA;
      }
      // Default order
      return a.display_order - b.display_order;
    });

    return result;
  }, [doctors, activeBranch, searchTerm, activeFilter, activeSort, authenticatedPathway]);

  // Counts for tabs
  const femaleCount = useMemo(() => doctors.filter((d) => getDoctorBranch(d) === 'female').length, [doctors]);
  const maleCount = useMemo(() => doctors.filter((d) => getDoctorBranch(d) === 'male').length, [doctors]);
  const bothCount = useMemo(() => doctors.filter((d) => getDoctorBranch(d) === 'both').length, [doctors]);

  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#F8FCFD] text-[#162A45] min-h-screen">
      {/* ── 1. Hero / Header Section ── */}
      <section className="relative pt-32 pb-16 sm:pb-20 border-b border-[#D7EAF2]/80 bg-gradient-to-b from-[#FFFFFF] via-[#F4F9FC] to-[#EFF7FA] overflow-hidden">
        {/* Subtle Organic Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#16B8C4]/10 rounded-full blur-3xl pointer-events-none -z-0" />
        <div className="absolute bottom-5 right-10 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none -z-0" />

        <Container size="xl" className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Heading & Narrative */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-6 text-left"
            >
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D7EAF2] text-[11px] font-extrabold tracking-widest text-[#16B8C4] uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#16B8C4] animate-pulse" />
                <span>OLADOC VERIFIED CLINICAL DIRECTORY • LAHORE</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#073B72] leading-[1.12] font-display">
                Specialists in <span className="text-pink-600">PCOS</span>, <span className="text-indigo-600">Hypogonadism</span> & <span className="text-purple-600">Sexual Health</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-[#55718F] leading-relaxed max-w-xl font-sans font-normal">
                Direct access to top Gynecologists, Urologists, Andrologists, and Sexologists treating male & female reproductive systems, hormonal imbalances, and couples fertility with complete fee transparency.
              </p>

              {/* 3 Core Feature Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 border border-[#D7EAF2] text-xs font-semibold text-[#073B72] shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                    <Venus className="w-3.5 h-3.5" />
                  </div>
                  <span>Female PCOS & Gynecology</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 border border-[#D7EAF2] text-xs font-semibold text-[#073B72] shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Mars className="w-3.5 h-3.5" />
                  </div>
                  <span>Male Hypogonadism (TRT)</span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/90 border border-[#D7EAF2] text-xs font-semibold text-[#073B72] shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </div>
                  <span>Both Genders • Sexology</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Key Directory Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="lg:col-span-5 relative flex items-center justify-center"
            >
              <div className="relative w-full max-w-md bg-gradient-to-br from-white via-[#F5FBFD] to-[#E9F6FA] border border-[#D7EAF2] rounded-3xl p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16B8C4]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>BioPulse Clinical Specialists</span>
                  </div>
                  <span className="text-xs italic text-[#55718F] font-serif">
                    Lahore Central Directory ♡
                  </span>
                </div>

                {/* 3-Column Category Stats Grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="p-3 rounded-2xl bg-white border border-[#D7EAF2] shadow-2xs text-center">
                    <div className="flex items-center justify-center text-pink-600 mb-1">
                      <Venus className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-extrabold text-[#073B72]">{femaleCount}</div>
                    <p className="text-[9px] font-bold text-[#55718F] uppercase">Gynecology</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-[#D7EAF2] shadow-2xs text-center">
                    <div className="flex items-center justify-center text-indigo-600 mb-1">
                      <Mars className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-extrabold text-[#073B72]">{maleCount}</div>
                    <p className="text-[9px] font-bold text-[#55718F] uppercase">Urology</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-[#D7EAF2] shadow-2xs text-center">
                    <div className="flex items-center justify-center text-purple-600 mb-1">
                      <HeartHandshake className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-extrabold text-[#073B72]">{bothCount}</div>
                    <p className="text-[9px] font-bold text-[#55718F] uppercase">Sexology</p>
                  </div>
                </div>

                {/* Fee & Verified Highlight */}
                <div className="p-4 rounded-2xl bg-white/95 border border-[#D7EAF2] shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#073B72]">Fee Transparency: Rs. 1,000 - 5,000</h4>
                      <p className="text-[11px] text-[#55718F]">
                        In-Clinic in Lahore or Live Video Consultation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </section>

      {/* ── 2. Search, Filter & Directory Section ── */}
      <section className="py-10 sm:py-14 bg-[#F8FCFD] flex-1">
        <Container size="xl">
          {/* STATE: LOADING */}
          {loading && (
            <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#D7EAF2] flex items-center justify-center text-[#16B8C4] shadow-sm animate-pulse">
                <Stethoscope className="w-7 h-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#073B72]">Loading Verified Directory...</h3>
                <p className="text-xs text-[#55718F]">Connecting to Lahore clinical specialists and fee structures</p>
              </div>
            </div>
          )}

          {/* STATE: ERROR */}
          {!loading && error && (
            <div className="max-w-md mx-auto py-16 px-6 rounded-3xl bg-white border border-[#D7EAF2] text-center space-y-5 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#073B72]">Unable to Load Doctors</h3>
                <p className="text-xs text-[#55718F]">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#073B72] hover:bg-[#052b54] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          )}

          {/* STATE: SUCCESS / DOCTORS LIST */}
          {!loading && !error && (
            <div className="space-y-8">
              {/* Category Navigation Bar (All / Female PCOS / Male Hypogonadism / Both Genders Sexology) */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 p-1.5 bg-white border border-[#D7EAF2] rounded-2xl max-w-3xl mx-auto shadow-2xs">
                <button
                  onClick={() => setActiveBranch('all')}
                  className={`flex-1 min-w-[120px] py-2.5 px-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeBranch === 'all'
                      ? 'bg-[#073B72] text-white shadow-xs'
                      : 'text-[#55718F] hover:bg-[#F4F9FC]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>All ({doctors.length})</span>
                </button>

                <button
                  onClick={() => setActiveBranch('female')}
                  className={`flex-1 min-w-[140px] py-2.5 px-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeBranch === 'female'
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-xs'
                      : 'text-[#073B72] hover:bg-pink-50/60'
                  }`}
                >
                  <Venus className="w-3.5 h-3.5 text-pink-500" />
                  <span>PCOS Care ({femaleCount})</span>
                </button>

                <button
                  onClick={() => setActiveBranch('male')}
                  className={`flex-1 min-w-[140px] py-2.5 px-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeBranch === 'male'
                      ? 'bg-gradient-to-r from-indigo-700 to-blue-700 text-white shadow-xs'
                      : 'text-[#073B72] hover:bg-indigo-50/60'
                  }`}
                >
                  <Mars className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Hypogonadism ({maleCount})</span>
                </button>

                <button
                  onClick={() => setActiveBranch('both')}
                  className={`flex-1 min-w-[140px] py-2.5 px-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeBranch === 'both'
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-xs'
                      : 'text-[#073B72] hover:bg-purple-50/60'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                  <span>Both Genders ({bothCount})</span>
                </button>
              </div>

              {/* Search, Filter Tabs & Sorting Bar */}
              <div className="bg-white rounded-3xl border border-[#D7EAF2] p-5 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#55718F] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search doctor, clinic area (Shadman, Jail Rd, Johar Town), or service..."
                      className="w-full pl-10 pr-4 py-2 rounded-2xl bg-[#F8FCFD] border border-[#D7EAF2] text-xs font-medium text-[#073B72] placeholder:text-[#55718F]/70 focus:outline-none focus:ring-2 focus:ring-[#16B8C4]/40"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#55718F] hover:text-[#073B72]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Doctor Count & Sorting Bar */}
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs font-semibold text-[#55718F]">
                      Showing <span className="text-[#073B72] font-bold">{filteredAndSortedDoctors.length}</span> verified specialists
                    </span>

                    <div className="relative inline-flex items-center">
                      <select
                        value={activeSort}
                        onChange={(e) => setActiveSort(e.target.value as any)}
                        className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-[#F8FCFD] border border-[#D7EAF2] text-xs font-semibold text-[#073B72] shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#16B8C4] cursor-pointer"
                      >
                        <option value="default">Sort: Recommended</option>
                        <option value="fee-asc">Fee: Low to High</option>
                        <option value="fee-desc">Fee: High to Low</option>
                        <option value="exp-desc">Most Experienced</option>
                        <option value="rating-desc">Top Rated (★)</option>
                        <option value="name">Name (A-Z)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-[#55718F] absolute right-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D7EAF2]/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#55718F] mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-[#16B8C4]" /> Fast Filters:
                  </span>

                  <button
                    onClick={() => setActiveFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeFilter === 'all'
                        ? 'bg-[#073B72] text-white shadow-xs'
                        : 'bg-[#F4F9FC] text-[#55718F] hover:bg-slate-100'
                    }`}
                  >
                    All Types
                  </button>

                  <button
                    onClick={() => setActiveFilter('sexology')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'sexology'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-purple-50 text-purple-700 border border-purple-200/70 hover:bg-purple-100/60'
                    }`}
                  >
                    <HeartHandshake className="w-3 h-3 text-purple-600" />
                    Both Genders / Sexology
                  </button>

                  <button
                    onClick={() => setActiveFilter('pcos')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'pcos'
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-pink-50 text-pink-700 border border-pink-200/70 hover:bg-pink-100/60'
                    }`}
                  >
                    <Heart className="w-3 h-3 text-pink-600 fill-pink-600" />
                    PCOS Specialists
                  </button>

                  <button
                    onClick={() => setActiveFilter('hypogonadism')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'hypogonadism'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200/70 hover:bg-indigo-100/60'
                    }`}
                  >
                    <Mars className="w-3 h-3 text-indigo-600" />
                    Male Hypogonadism (TRT)
                  </button>

                  <button
                    onClick={() => setActiveFilter('budget')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'budget'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-100/60'
                    }`}
                  >
                    <Banknote className="w-3 h-3 text-emerald-600" />
                    Under Rs. 2,500
                  </button>

                  <button
                    onClick={() => setActiveFilter('video')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'video'
                        ? 'bg-[#16B8C4] text-white shadow-xs'
                        : 'bg-cyan-50 text-[#073B72] border border-[#D7EAF2] hover:bg-cyan-100/50'
                    }`}
                  >
                    <MessageCircle className="w-3 h-3 text-[#16B8C4]" />
                    Video Consultation
                  </button>

                  <button
                    onClick={() => setActiveFilter('senior')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeFilter === 'senior'
                        ? 'bg-[#073B72] text-white shadow-xs'
                        : 'bg-[#F4F9FC] text-[#073B72] border border-[#D7EAF2] hover:bg-slate-100'
                    }`}
                  >
                    <Award className="w-3 h-3 text-[#16B8C4]" />
                    15+ Years Exp
                  </button>
                </div>
              </div>

              {/* Empty Search Result */}
              {filteredAndSortedDoctors.length === 0 && (
                <div className="max-w-md mx-auto py-16 px-6 rounded-3xl bg-white border border-[#D7EAF2] text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-[#F5FBFD] border border-[#D7EAF2] text-[#55718F] flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6 text-[#16B8C4]" />
                  </div>
                  <h3 className="text-base font-bold text-[#073B72]">No matching doctors found</h3>
                  <p className="text-xs text-[#55718F]">
                    Try searching with another keyword or reset your branch/filter options.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveBranch('all');
                      setActiveFilter('all');
                      setActiveSort('default');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#073B72] text-white text-xs font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset All Filters
                  </button>
                </div>
              )}

              {/* Authenticated Patient Pathway Priority Banner */}
              {authenticatedPathway === 'female' && (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-white border border-pink-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                      <Venus className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#073B72]">Recommended for your PCOS Pathway</h4>
                      <p className="text-xs text-[#55718F]">
                        Specialists in polycystic ovary syndrome, reproductive endocrinology, and hormonal cycle care are prioritized below.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-pink-700 bg-pink-100/70 border border-pink-200 px-3 py-1 rounded-full self-start sm:self-auto shrink-0">
                    Prioritized Care
                  </span>
                </div>
              )}

              {authenticatedPathway === 'male' && (
                <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-sky-50 to-white border border-indigo-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Mars className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#073B72]">Recommended for your Male Hormonal Pathway</h4>
                      <p className="text-xs text-[#55718F]">
                        Specialists in male hypogonadism, andrology, and testosterone deficiency evaluation are prioritized below.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-3 py-1 rounded-full self-start sm:self-auto shrink-0">
                    Prioritized Care
                  </span>
                </div>
              )}

              {/* 3-Column Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredAndSortedDoctors.map((doctor) => {
                  const branch = getDoctorBranch(doctor);
                  return (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      branch={branch}
                      onSelectDoctor={() => setSelectedDoctor(doctor)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* ── 3. Interactive Consultation / Booking Modal ── */}
      <AnimatePresence>
        {selectedDoctor && (
          <ConsultationModal
            doctor={selectedDoctor}
            branch={getDoctorBranch(selectedDoctor)}
            onClose={() => setSelectedDoctor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Individual Doctor Card Component.
 * Supports Doctor Photo, Fallback Avatar, Contact (Phone, Email),
 * Fee Structure, Qualifications, Experience, and Booking Action.
 */
const DoctorCard: React.FC<{
  doctor: Doctor;
  branch: PathwayClinicalBranch;
  onSelectDoctor: () => void;
}> = ({ doctor, branch, onSelectDoctor }) => {
  const [imgError, setImgError] = useState(false);

  // Initials generator
  const getInitials = (name: string): string => {
    const clean = name.replace(/^(Dr\.|Prof\.|Assoc\.\s*Prof\.|Assist\s*Prof\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'DR';
  };

  const initials = getInitials(doctor.name);

  // Email action with prefilled subject
  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!doctor.email) return;
    let subject = 'Clinical Consultation Inquiry - PMOSense';
    if (branch === 'female') {
      subject = 'PCOS & Gynecological Consultation Inquiry - PMOSense';
    } else if (branch === 'male') {
      subject = 'Male Hypogonadism & Andrology Consultation Inquiry - PMOSense';
    } else {
      subject = 'Reproductive Health & Sexual Medicine Inquiry - PMOSense';
    }

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(doctor.email)}&su=${encodeURIComponent(subject)}`;
    const newWindow = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = `mailto:${doctor.email}?subject=${encodeURIComponent(subject)}`;
    }
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Branch styling helpers
  const getBorderHover = () => {
    if (branch === 'both') return 'hover:border-purple-400';
    if (branch === 'male') return 'hover:border-indigo-400';
    return 'hover:border-[#16B8C4]/60';
  };

  const getGlowColor = () => {
    if (branch === 'both') return 'bg-purple-50/60 group-hover:bg-purple-100/40';
    if (branch === 'male') return 'bg-indigo-50/60 group-hover:bg-indigo-100/40';
    return 'bg-cyan-50/70 group-hover:bg-[#16B8C4]/15';
  };

  const getButtonBg = () => {
    if (branch === 'both') return 'bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-900 hover:to-purple-800';
    if (branch === 'male') return 'bg-gradient-to-r from-indigo-800 to-blue-800 hover:from-indigo-900 hover:to-indigo-800';
    return 'bg-gradient-to-r from-[#073B72] to-[#0A4D94] hover:from-[#052b54] hover:to-[#073B72]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-white rounded-3xl border border-[#D7EAF2] p-6 flex flex-col justify-between shadow-2xs hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${getBorderHover()}`}
    >
      {/* Corner Ambient Glow */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full blur-xl pointer-events-none transition-colors ${getGlowColor()}`} />

      <div className="space-y-4">
        {/* Track Badge: Female PCOS vs Male Hypogonadism vs Both Genders */}
        <div className="flex items-center justify-between">
          {branch === 'both' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[10px] font-extrabold border border-purple-200/80">
              <HeartHandshake className="w-3 h-3 text-purple-600" /> Both Genders • Sexology
            </span>
          ) : branch === 'male' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-extrabold border border-indigo-200/70">
              <Mars className="w-3 h-3 text-indigo-600" /> Male Hypogonadism & Andrology
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 text-pink-800 text-[10px] font-extrabold border border-pink-200/70">
              <Venus className="w-3 h-3 text-pink-600" /> PCOS & Gynecological Care
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
            <ShieldCheck className="w-2.5 h-2.5 text-slate-500" /> BioPulse Specialist
          </span>
        </div>

        {/* Header: Photo / Avatar + Name + Specialty */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {doctor.profile_image && !imgError ? (
              <img
                src={doctor.profile_image}
                alt={doctor.name}
                onError={() => setImgError(true)}
                className={`w-18 h-18 rounded-2xl object-cover border-2 shadow-xs transition-colors ${
                  branch === 'both'
                    ? 'border-[#D7EAF2] group-hover:border-purple-400'
                    : branch === 'male'
                    ? 'border-[#D7EAF2] group-hover:border-indigo-400'
                    : 'border-[#D7EAF2] group-hover:border-[#16B8C4]'
                }`}
                loading="lazy"
              />
            ) : (
              <div
                className={`w-18 h-18 rounded-2xl border-2 flex items-center justify-center relative shadow-xs transition-colors ${
                  branch === 'both'
                    ? 'bg-gradient-to-br from-purple-50 via-slate-50 to-indigo-50 border-[#D7EAF2] group-hover:border-purple-400'
                    : branch === 'male'
                    ? 'bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 border-[#D7EAF2] group-hover:border-indigo-400'
                    : 'bg-gradient-to-br from-cyan-50 via-teal-50 to-blue-50 border-[#D7EAF2] group-hover:border-[#16B8C4]'
                }`}
              >
                <span className="text-base font-bold text-[#073B72] font-display">
                  {initials}
                </span>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#D7EAF2] flex items-center justify-center text-[#16B8C4] shadow-2xs">
                  <Stethoscope className="w-3 h-3" />
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className={`text-base sm:text-lg font-bold text-[#073B72] transition-colors leading-tight ${
                branch === 'both'
                  ? 'group-hover:text-purple-700'
                  : branch === 'male'
                  ? 'group-hover:text-indigo-700'
                  : 'group-hover:text-[#16B8C4]'
              }`}
            >
              {doctor.name}
            </h3>

            {doctor.qualifications && (
              <p className="text-[11px] font-medium text-[#55718F] mt-0.5 truncate" title={doctor.qualifications}>
                {doctor.qualifications}
              </p>
            )}

            {doctor.specialty && (
              <p
                className={`text-xs font-semibold truncate mt-1 ${
                  branch === 'both'
                    ? 'text-purple-600'
                    : branch === 'male'
                    ? 'text-indigo-600'
                    : 'text-[#16B8C4]'
                }`}
              >
                {doctor.specialty}
              </p>
            )}

            {doctor.relevance_reason && (
              <p className="text-[11px] font-medium text-emerald-700 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{doctor.relevance_reason}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── Prominent Fee Structure & Clinical Badges ── */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Fee Structure Box */}
          <div className="px-3 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <Banknote className="w-3 h-3 text-emerald-600" /> Fee Structure
            </span>
            <span className="text-xs font-extrabold text-emerald-950 truncate mt-0.5">
              {doctor.fee || 'Rs. 2,000 - 3,500'}
            </span>
          </div>

          {/* Experience / Rating Box */}
          <div className="px-3 py-2 rounded-2xl bg-[#F4F9FC] border border-[#D7EAF2] flex flex-col justify-center">
            <span className="text-[10px] font-bold text-[#073B72] uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {doctor.rating ? `${doctor.rating}` : '4.8'} ({doctor.reviews_count ?? 120})
            </span>
            <span className="text-xs font-bold text-[#073B72] truncate mt-0.5">
              {doctor.experience_years ? `${doctor.experience_years} Years Exp.` : 'Senior Specialist'}
            </span>
          </div>
        </div>

        {/* Short Bio */}
        {doctor.short_bio ? (
          <p className="text-xs text-[#55718F] line-clamp-3 leading-relaxed min-h-[3.25rem]">
            {doctor.short_bio}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic min-h-[3.25rem]">
            Verified medical specialist practicing in Lahore.
          </p>
        )}

        {/* Services / Tags Chips */}
        {doctor.services_offered && (
          <div className="flex flex-wrap gap-1 pt-1">
            {doctor.services_offered
              .split(',')
              .slice(0, 3)
              .map((service, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-[#F4F9FC] border border-[#D7EAF2] text-[10px] font-semibold text-[#073B72] truncate max-w-[170px]"
                >
                  {service.trim()}
                </span>
              ))}
          </div>
        )}

        {/* Practice Details & Contact Information */}
        <div className="pt-3 border-t border-[#D7EAF2]/60 space-y-2 text-xs">
          {/* Practice Location */}
          {doctor.location && (
            <div className="flex items-center gap-2 text-[#55718F]">
              <MapPin className="w-3.5 h-3.5 text-[#16B8C4] shrink-0" />
              <span className="truncate">{doctor.location}</span>
            </div>
          )}

          {/* Wait Time Indicator */}
          {doctor.wait_time && (
            <div className="flex items-center gap-2 text-[#55718F]">
              <Clock className="w-3.5 h-3.5 text-[#16B8C4] shrink-0" />
              <span>Wait Time: <strong className="text-[#073B72]">{doctor.wait_time}</strong></span>
            </div>
          )}

          {/* Quick Contact Line */}
          <div className="flex items-center justify-between gap-2 pt-1">
            {doctor.phone && (
              <a
                href={`tel:${doctor.phone}`}
                onClick={handlePhoneClick}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#073B72] hover:text-[#16B8C4] transition-colors"
                title={`Call ${doctor.name}`}
              >
                <Phone className="w-3 h-3 text-[#16B8C4]" />
                <span>{doctor.phone}</span>
              </a>
            )}

            {doctor.email && (
              <button
                type="button"
                onClick={handleEmailClick}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#073B72] hover:text-[#16B8C4] transition-colors cursor-pointer"
                title={`Email ${doctor.name}`}
              >
                <Mail className="w-3 h-3 text-[#16B8C4]" />
                <span>Email Doctor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Book / View Action */}
      <div className="mt-5 pt-4 border-t border-[#D7EAF2] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelectDoctor}
          className={`w-full py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${getButtonBg()}`}
        >
          <span>Book Consultation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Detailed Consultation & Booking Modal.
 * Shows verified profile, complete fee details, clinic address, and direct booking actions.
 */
/**
 * Detailed Consultation & Booking Modal.
 * Shows specialist profile, fee details, clinic address, and direct booking actions.
 * Connected directly to patient appointments and authenticated care flow.
 */
const ConsultationModal: React.FC<{
  doctor: Doctor;
  branch: PathwayClinicalBranch;
  onClose: () => void;
}> = ({ doctor, branch, onClose }) => {
  const navigate = useNavigate();
  const { userProfile, bookAppointment } = useUserHealth();

  const [formSent, setFormSent] = useState(false);
  const [patientName, setPatientName] = useState(userProfile?.fullName || '');
  const [patientPhone, setPatientPhone] = useState(userProfile?.phone || '');
  const [preferredDate, setPreferredDate] = useState('');
  const preferredTime = '15:30';
  const [consultationMode, setConsultationMode] = useState<'video' | 'clinic'>('video');
  const [patientNote, setPatientNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // If not authenticated, store booking intent and redirect to login
    if (!userProfile?.id) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'biopulse_booking_intent',
          JSON.stringify({
            doctorId: doctor.id,
            doctorName: doctor.name,
            specialty: doctor.specialty,
            pathway: doctor.pathway,
            preferredDate,
            preferredTime,
            patientNote,
          })
        );
      }
      navigate(`/login?redirect=${encodeURIComponent(`/doctors?intent=book&doctorId=${doctor.id}`)}`);
      return;
    }

    // Authenticated user: create genuine appointment
    setIsSubmitting(true);
    try {
      const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const res = await bookAppointment({
        providerId: String(doctor.id),
        providerName: doctor.name,
        providerSpecialty: doctor.specialty || undefined,
        providerImage: doctor.profile_image || undefined,
        fee: doctor.fee || undefined,
        title: `Clinical Consultation with ${doctor.name}`,
        appointmentType: 'consultation',
        scheduledDate: preferredDate || tomorrowStr,
        scheduledTime: preferredTime || '15:30',
        durationMinutes: 30,
        location: consultationMode === 'video' ? 'Online Video Consultation' : (doctor.location || 'Clinic Consultation'),
        meetingUrl: consultationMode === 'video' ? 'https://meet.biopulse.ai/consultation' : undefined,
        reason: patientNote || (doctor.relevance_reason ? `Consultation: ${doctor.relevance_reason}` : 'Clinical Consultation'),
        patientNotes: patientPhone ? `Contact Phone: ${patientPhone}` : '',
        bookingSource: 'public_doctors_directory',
      });

      if (res.success) {
        setFormSent(true);
      } else {
        setErrorMessage(res.error || 'Unable to create appointment at this time.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBranchBadge = () => {
    if (branch === 'both') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
          <HeartHandshake className="w-3 h-3 text-purple-600" /> Both Genders • Sexology & Reproduction
        </span>
      );
    }
    if (branch === 'male') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-bold border border-indigo-200">
          <Mars className="w-3 h-3 text-indigo-600" /> Male Hypogonadism Specialist
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-800 text-[10px] font-bold border border-pink-200">
        <Venus className="w-3 h-3 text-pink-600" /> PCOS Care Specialist
      </span>
    );
  };

  const getReasonPlaceholder = () => {
    if (branch === 'both') return 'Reason (e.g., hormone panel review, reproductive consultation)';
    if (branch === 'male') return 'Reason (e.g., testosterone evaluation, fatigue, vitality)';
    return 'Reason (e.g., PCOS follow-up, cycle regularity, ultrasound review)';
  };

  const getSubmitBtnStyle = () => {
    if (branch === 'both') return 'bg-purple-700 hover:bg-purple-800';
    if (branch === 'male') return 'bg-indigo-700 hover:bg-indigo-800';
    return 'bg-[#073B72] hover:bg-[#052b54]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#D7EAF2] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F4F9FC] border border-[#D7EAF2] flex items-center justify-center text-[#55718F] hover:text-[#073B72] hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Doctor Header */}
        <div className="flex items-start gap-4 pb-5 border-b border-[#D7EAF2]">
          {doctor.profile_image ? (
            <img
              src={doctor.profile_image}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D7EAF2]"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 border-2 border-[#D7EAF2] flex items-center justify-center text-lg font-bold text-[#073B72]">
              <Stethoscope className="w-7 h-7 text-[#16B8C4]" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {getBranchBadge()}

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                <ShieldCheck className="w-3 h-3 text-slate-500" /> BioPulse Specialist
              </span>
            </div>

            <h2 className="text-xl font-bold text-[#073B72] mt-1.5">{doctor.name}</h2>
            <p className="text-xs text-[#55718F] font-medium">{doctor.qualifications}</p>
            <p className="text-xs font-semibold text-[#16B8C4]">{doctor.specialty}</p>
            {doctor.relevance_reason && (
              <p className="text-[11px] font-medium text-emerald-700 mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{doctor.relevance_reason}</span>
              </p>
            )}
          </div>
        </div>

        {/* Key Information Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-5">
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/70">
            <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Fee Structure
            </span>
            <p className="text-xs font-extrabold text-emerald-950 mt-0.5">
              {doctor.fee || 'Rs. 2,000 - 3,500'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200/70">
            <span className="text-[10px] font-bold text-[#073B72] uppercase flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#16B8C4]" /> Wait Time
            </span>
            <p className="text-xs font-extrabold text-[#073B72] mt-0.5">
              {doctor.wait_time || 'Under 15 Min'}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/70 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-600 fill-amber-600" /> Rating
            </span>
            <p className="text-xs font-extrabold text-amber-950 mt-0.5">
              {doctor.rating ? `${doctor.rating} / 5.0` : '4.8 / 5.0'}
            </p>
          </div>
        </div>

        {/* Location & Practice Info */}
        <div className="space-y-3 p-4 rounded-2xl bg-[#F8FCFD] border border-[#D7EAF2] text-xs">
          <div className="flex items-start gap-2 text-[#55718F]">
            <MapPin className="w-4 h-4 text-[#16B8C4] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#073B72]">Practice Location:</strong>
              <p className="text-[#55718F]">{doctor.location || 'Lahore, Punjab, Pakistan'}</p>
            </div>
          </div>

          {doctor.services_offered && (
            <div className="flex items-start gap-2 text-[#55718F]">
              <Activity className="w-4 h-4 text-[#16B8C4] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#073B72]">Clinical Focus & Services:</strong>
                <p className="text-[#55718F]">{doctor.services_offered}</p>
              </div>
            </div>
          )}
        </div>

        {/* Booking Form or Confirmation */}
        <div className="mt-5">
          {formSent ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-emerald-900">Consultation Requested!</h4>
              <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
                Your appointment with <strong>{doctor.name}</strong> has been created and linked to your BioPulse Care Dashboard.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/app/appointments');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View in My Appointments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#073B72] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#16B8C4]" /> Request Consultation
                </h4>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setConsultationMode('video')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      consultationMode === 'video'
                        ? 'bg-[#16B8C4] text-white'
                        : 'bg-[#F4F9FC] text-[#55718F] hover:bg-slate-200'
                    }`}
                  >
                    Video Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultationMode('clinic')}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      consultationMode === 'clinic'
                        ? 'bg-[#073B72] text-white'
                        : 'bg-[#F4F9FC] text-[#55718F] hover:bg-slate-200'
                    }`}
                  >
                    In-Person
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Your Full Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8FCFD] border border-[#D7EAF2] text-xs text-[#073B72] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. 0300 1234567)"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8FCFD] border border-[#D7EAF2] text-xs text-[#073B72] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8FCFD] border border-[#D7EAF2] text-xs text-[#073B72] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
                />
                <input
                  type="text"
                  placeholder={getReasonPlaceholder()}
                  value={patientNote}
                  onChange={(e) => setPatientNote(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F8FCFD] border border-[#D7EAF2] text-xs text-[#073B72] focus:outline-none focus:ring-1 focus:ring-[#16B8C4]"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full sm:flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${getSubmitBtnStyle()}`}
                >
                  {isSubmitting
                    ? 'Requesting Appointment...'
                    : userProfile?.id
                    ? 'Request Consultation'
                    : 'Sign In & Request Consultation'}
                </button>

                {doctor.phone && (
                  <a
                    href={`tel:${doctor.phone}`}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Direct</span>
                  </a>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Doctors;
