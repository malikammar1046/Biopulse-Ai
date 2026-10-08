import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Apple,
  Dumbbell,
  HeartPulse,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  Calendar,
  WifiOff,
  LogIn,
  ClipboardCheck,
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';
import { lifestyleService, SessionError } from '../../services/lifestyleService';
import type {
  LifestyleRecommendationsResult,
  LifestyleSimulationOverride,
  RecommendationItem,
} from '../../types/lifestyle';

import { LifestyleSkeleton } from '../../components/lifestyle/LifestyleSkeleton';
import { TodayPriorityCard } from '../../components/lifestyle/TodayPriorityCard';
import { NutritionPillarView } from '../../components/lifestyle/NutritionPillarView';
import { FitnessPillarView } from '../../components/lifestyle/FitnessPillarView';
import { LifestylePillarView } from '../../components/lifestyle/LifestylePillarView';
import { EvidenceSourcesSection } from '../../components/lifestyle/EvidenceSourcesSection';
import { ClinicianReviewBanner } from '../../components/lifestyle/ClinicianReviewBanner';
import { RecommendationDetailModal } from '../../components/lifestyle/RecommendationDetailModal';
import { LifestyleEmptyState } from '../../components/lifestyle/LifestyleEmptyState';

type PillarTab = 'nutrition' | 'fitness' | 'lifestyle';
type ErrorClassification = 'NETWORK' | 'SESSION' | 'NO_ASSESSMENT' | 'SERVER';

export const LifestyleRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, postOnboardingReadiness } = useUserHealth();
  const { user, loading: authLoading } = useAuth();
  const activeUserId = user?.id || userProfile?.id;
  const isMale = userProfile?.pathway === 'male' || userProfile?.gender === 'male';
  const defaultPathway = isMale ? 'androsense' : 'ovasense';

  const [activeTab, setActiveTab] = useState<PillarTab>('nutrition');

  // Synchronous cache lookup for instantaneous return visits (< 1ms)
  const initialCached = useMemo(() => {
    return lifestyleService.getCachedRecommendations(defaultPathway, activeUserId);
  }, [defaultPathway, activeUserId]);

  const [data, setData] = useState<LifestyleRecommendationsResult | null>(() => initialCached);
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorClassification | null>(null);
  const [nonBlockingNotice, setNonBlockingNotice] = useState<string | null>(null);

  // Selected recommendation for the detail modal
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationItem | null>(null);

  // Interactive preference simulation state
  const [dietaryPref, setDietaryPref] = useState<string>('standard');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');

  // Toggle for collapsible evidence sources drawer
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState<boolean>(false);

  // In-flight abort controller
  const inFlightAbortRef = React.useRef<AbortController | null>(null);

  const fetchRecommendations = async (override?: LifestyleSimulationOverride, refresh = false) => {
    if (inFlightAbortRef.current) {
      inFlightAbortRef.current.abort();
    }
    const controller = new AbortController();
    inFlightAbortRef.current = controller;

    try {
      if (override) {
        setSimulating(true);
        setError(null);
        setErrorType(null);
        const result = await lifestyleService.simulateRecommendations(override);
        if (controller.signal.aborted) return;
        setData(result);
        setSimulating(false);
      } else {
        // Only trigger skeleton if we don't have any cached data to show
        if (!data) {
          setLoading(true);
          setError(null);
          setErrorType(null);
        }
        setNonBlockingNotice(null);

        const result = await lifestyleService.getRecommendations(
          defaultPathway,
          refresh,
          controller.signal,
          activeUserId
        );

        if (controller.signal.aborted) return;
        setData(result);
        setLoading(false);
        setError(null);
        setErrorType(null);
        setNonBlockingNotice(null);
      }
    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'AbortError') {
        return;
      }
      console.warn('Lifestyle recommendation fetch notice:', err);
      const msg = String(err?.message || '');
      const statusCode = err?.status || (err?.response && err.response.status);

      let classifiedType: ErrorClassification = 'SERVER';
      let errorMsg = "We couldn't prepare your recommendations right now.";

      if (
        err instanceof SessionError ||
        err?.code === 'SESSION_UNAVAILABLE' ||
        statusCode === 401 ||
        msg.includes('401') ||
        msg.toLowerCase().includes('session') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('log in')
      ) {
        classifiedType = 'SESSION';
        errorMsg = 'Your session has expired. Please sign in again.';
      } else if (
        statusCode === 404 ||
        msg.includes('404') ||
        msg.toLowerCase().includes('no active assessment') ||
        msg.toLowerCase().includes('screening assessment')
      ) {
        classifiedType = 'NO_ASSESSMENT';
        errorMsg = 'Complete your screening to unlock personalized recommendations.';
      } else if (
        (err?.name === 'TypeError' && msg.includes('Failed to fetch')) ||
        msg.includes('NetworkError') ||
        (typeof navigator !== 'undefined' && !navigator.onLine)
      ) {
        classifiedType = 'NETWORK';
        errorMsg = "We couldn't connect to BioPulse. Please check your internet connection.";
      } else if (
        statusCode >= 500 ||
        msg.includes('500') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504') ||
        msg.includes('Internal Server Error')
      ) {
        classifiedType = 'SERVER';
        errorMsg = "We couldn't prepare your recommendations right now. Please try again.";
      }

      // If we already have cached data, preserve it and display non-blocking update warning
      if (data && !override) {
        setNonBlockingNotice('Unable to update with latest health data. Showing recent cached protocol.');
      } else {
        setErrorType(classifiedType);
        setError(errorMsg);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setSimulating(false);
      }
    }
  };

  useEffect(() => {
    // 1. Wait if auth is still hydrating from cold boot
    if (authLoading) {
      return;
    }

    // 2. Wait if onboarding is currently in flight
    if (postOnboardingReadiness === 'initializing') {
      return;
    }

    // 3. Sync from cache if pathway switched
    const cached = lifestyleService.getCachedRecommendations(defaultPathway, activeUserId);
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    fetchRecommendations();

    return () => {
      if (inFlightAbortRef.current) {
        inFlightAbortRef.current.abort();
      }
    };
  }, [defaultPathway, postOnboardingReadiness, authLoading, activeUserId]);

  const handleDietaryChange = (newPref: string) => {
    setDietaryPref(newPref);
    fetchRecommendations({
      module: defaultPathway,
      dietary_preference: newPref,
      activity_level: activityLevel,
    });
  };

  const handleActivityChange = (newLevel: string) => {
    setActivityLevel(newLevel);
    fetchRecommendations({
      module: defaultPathway,
      dietary_preference: dietaryPref,
      activity_level: newLevel,
    });
  };

  const handleUpdateStatus = async (
    recommendationId: string,
    newStatus: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED'
  ) => {
    if (!data) return;
    const oldRecommendations = data.recommendations;
    const updatedRecommendations = data.recommendations.map((rec) =>
      rec.id === recommendationId ? { ...rec, status: newStatus } : rec
    );

    setData({
      ...data,
      recommendations: updatedRecommendations,
    });

    if (selectedRecommendation?.id === recommendationId) {
      setSelectedRecommendation({
        ...selectedRecommendation,
        status: newStatus,
      });
    }

    try {
      await lifestyleService.updateRecommendationStatus({
        recommendation_id: recommendationId,
        status: newStatus,
        module: data.pathway || defaultPathway,
        userId: activeUserId,
      });
    } catch (err) {
      console.error('Failed to persist recommendation status:', err);
      setData((prev) => (prev ? { ...prev, recommendations: oldRecommendations } : null));
    }
  };

  // Top Priority Recommendation
  const topPriorityRecommendation = useMemo(() => {
    if (!data?.recommendations || data.recommendations.length === 0) return null;
    return (
      data.recommendations.find((r) => r.priority === 'high') ||
      data.recommendations[0]
    );
  }, [data]);

  // Formatted date
  const formattedUpdatedDate = useMemo(() => {
    if (!data?.generated_at) return null;
    try {
      return new Date(data.generated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  }, [data?.generated_at]);

  // Loading State
  const isInitializing = postOnboardingReadiness === 'initializing';
  if (isInitializing || (loading && !data)) {
    return <LifestyleSkeleton />;
  }

  // Error States
  if (error && !data && !isInitializing) {
    if (errorType === 'SESSION') {
      return (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#073B72]">Your session has expired.</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Please sign in again to access your personalized recommendations.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#073B72] hover:bg-[#0B4A8B] text-white text-sm font-semibold transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Again</span>
          </button>
        </div>
      );
    }

    if (errorType === 'NO_ASSESSMENT') {
      return (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-pink-50 text-[#F43F7D] flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#073B72]">
            Complete your screening to unlock your protocol.
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your lifestyle recommendations are dynamically tuned to your hormonal, metabolic, and clinical screening results.
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/assessment')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#F43F7D] hover:bg-[#DC326C] text-white text-sm font-semibold transition cursor-pointer"
          >
            <span>Go to Screening</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (errorType === 'NETWORK') {
      return (
        <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <WifiOff className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#073B72]">We couldn&apos;t connect to BioPulse.</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Please check your internet connection and try again.
          </p>
          <button
            type="button"
            onClick={() => fetchRecommendations(undefined, true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#073B72] hover:bg-[#0B4A8B] text-white text-sm font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#073B72]">
          We couldn&apos;t prepare your protocol right now.
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Our recommendation service encountered an issue. Please try again in a few moments.
        </p>
        <button
          type="button"
          onClick={() => fetchRecommendations(undefined, true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#073B72] hover:bg-[#0B4A8B] text-white text-sm font-semibold transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // Baseline / Empty State
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return <LifestyleEmptyState isMale={isMale} />;
  }

  const { nutrition, fitness, lifestyle, evidence_rationale, evidence_registry } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-left">
      {/* Subtle non-blocking banner if fresh background sync failed while showing cached data */}
      {nonBlockingNotice && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/70 p-3.5 flex items-center justify-between gap-3 text-xs text-amber-800 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{nonBlockingNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setNonBlockingNotice(null);
              fetchRecommendations(undefined, true);
            }}
            className="font-semibold text-amber-900 underline hover:no-underline shrink-0 cursor-pointer"
          >
            Retry Refresh
          </button>
        </div>
      )}

      {/* ── A. AIRY LIFESTYLE SANCTUARY HEADER ── */}
      <header className="rounded-3xl bg-white border border-[#E2EEF4] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isMale
                    ? 'bg-sky-50 text-[#0868B9] border-sky-200'
                    : 'bg-teal-50 text-[#0E9EAA] border-teal-200'
                }`}
              >
                {data.pathway === 'androsense'
                  ? 'Male Androgen & Vitality Support'
                  : 'Female PCOS Metabolic Rhythm'}
              </span>

              {data.risk_category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                  {data.risk_category.replace(/_/g, ' ')} Tier
                </span>
              )}

              {formattedUpdatedDate && (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated {formattedUpdatedDate}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#073B72] tracking-tight">
              Daily Lifestyle Protocol
            </h1>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              Personalized nutritional fuel, functional movement, and circadian recovery tailored to your metabolic blueprint.
            </p>
          </div>

          {/* Clean Interactive Preference Pills */}
          <div className="p-3.5 rounded-2xl bg-[#F7FBFC] border border-[#E2EEF4] flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#073B72]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0E9EAA]" />
              <span className="hidden sm:inline">Preferences:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                id="pref-diet"
                value={dietaryPref}
                onChange={(e) => handleDietaryChange(e.target.value)}
                disabled={simulating}
                className="text-xs font-semibold bg-white border border-[#E2EEF4] rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0E9EAA] cursor-pointer shadow-xs"
                title="Dietary Preference"
              >
                <option value="standard">Standard</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                id="pref-activity"
                value={activityLevel}
                onChange={(e) => handleActivityChange(e.target.value)}
                disabled={simulating}
                className="text-xs font-semibold bg-white border border-[#E2EEF4] rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0E9EAA] cursor-pointer shadow-xs"
                title="Activity Level"
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="very_active">Active</option>
              </select>
            </div>

            {simulating ? (
              <span className="text-xs font-semibold text-[#0E9EAA] flex items-center gap-1.5 px-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => fetchRecommendations(undefined, true)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-[#073B72] hover:bg-white border border-transparent hover:border-[#E2EEF4] transition cursor-pointer"
                title="Recalculate protocol"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Clinician Review Banner if medically indicated */}
      {data.clinician_review?.recommended && (
        <ClinicianReviewBanner clinicianReview={data.clinician_review} />
      )}

      {/* ── B. TODAY'S PRIME ANCHOR HERO CARD ── */}
      {topPriorityRecommendation && (
        <TodayPriorityCard
          priorityRecommendation={topPriorityRecommendation}
          onViewRecommendation={(rec) => setSelectedRecommendation(rec)}
          onUpdateStatus={handleUpdateStatus}
          isMale={isMale}
        />
      )}

      {/* ── C. REFINED THREE PILLAR SEGMENTED NAVIGATION ── */}
      <nav
        aria-label="Lifestyle Pillars"
        className="flex items-center justify-center sm:justify-start gap-2 bg-[#F7FBFC] p-1.5 rounded-2xl border border-[#E2EEF4] max-w-fit mx-auto sm:mx-0"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          id="tab-nutrition"
          aria-selected={activeTab === 'nutrition'}
          aria-controls="panel-nutrition"
          onClick={() => setActiveTab('nutrition')}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'nutrition'
              ? isMale
                ? 'bg-[#0868B9] text-white shadow-sm'
                : 'bg-[#0E9EAA] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#073B72] hover:bg-white/80'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>Nutritional Fuel</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-fitness"
          aria-selected={activeTab === 'fitness'}
          aria-controls="panel-fitness"
          onClick={() => setActiveTab('fitness')}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'fitness'
              ? isMale
                ? 'bg-[#0868B9] text-white shadow-sm'
                : 'bg-[#0E9EAA] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#073B72] hover:bg-white/80'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Movement & Strength</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-lifestyle"
          aria-selected={activeTab === 'lifestyle'}
          aria-controls="panel-lifestyle"
          onClick={() => setActiveTab('lifestyle')}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'lifestyle'
              ? isMale
                ? 'bg-[#0868B9] text-white shadow-sm'
                : 'bg-[#0E9EAA] text-white shadow-sm'
              : 'text-slate-600 hover:text-[#073B72] hover:bg-white/80'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Rest & Circadian Balance</span>
        </button>
      </nav>

      {/* ── D. ACTIVE PILLAR CONTENT ── */}
      <main id="pillar-content-panels">
        {activeTab === 'nutrition' && (
          <div id="panel-nutrition" role="tabpanel" aria-labelledby="tab-nutrition">
            <NutritionPillarView
              nutrition={nutrition}
              recommendations={data.recommendations}
              onSelectRecommendation={(rec) => setSelectedRecommendation(rec)}
              onUpdateStatus={handleUpdateStatus}
              isMale={isMale}
            />
          </div>
        )}

        {activeTab === 'fitness' && (
          <div id="panel-fitness" role="tabpanel" aria-labelledby="tab-fitness">
            <FitnessPillarView
              fitness={fitness}
              recommendations={data.recommendations}
              onSelectRecommendation={(rec) => setSelectedRecommendation(rec)}
              onUpdateStatus={handleUpdateStatus}
              isMale={isMale}
            />
          </div>
        )}

        {activeTab === 'lifestyle' && (
          <div id="panel-lifestyle" role="tabpanel" aria-labelledby="tab-lifestyle">
            <LifestylePillarView
              lifestyle={lifestyle}
              recommendations={data.recommendations}
              onSelectRecommendation={(rec) => setSelectedRecommendation(rec)}
              onUpdateStatus={handleUpdateStatus}
              isMale={isMale}
            />
          </div>
        )}
      </main>

      {/* ── E. QUIET COLLAPSIBLE CLINICAL EVIDENCE FOOTER ── */}
      <section className="rounded-3xl bg-white border border-[#E2EEF4] p-5 sm:p-6 shadow-sm space-y-3">
        <button
          type="button"
          onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
          className="w-full flex items-center justify-between text-left cursor-pointer focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#073B72] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#073B72]">
                Clinical Foundations & Research Sources
              </h4>
              <p className="text-xs text-slate-500">
                Explore peer-reviewed clinical guidelines, biomarker attributions, and evidence registries
              </p>
            </div>
          </div>
          {showEvidenceDrawer ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showEvidenceDrawer && (
          <div className="pt-4 border-t border-slate-100 animate-fadeIn">
            <EvidenceSourcesSection
              evidenceRegistry={evidence_registry}
              evidenceRationale={evidence_rationale}
              recommendations={data.recommendations}
              disclaimer={data.disclaimer}
              isMale={isMale}
            />
          </div>
        )}
      </section>

      {/* ── F. MEDICAL DISCLAIMER ── */}
      <footer className="text-center pt-2 pb-4 text-xs text-slate-400 leading-relaxed max-w-3xl mx-auto">
        {data.disclaimer ||
          'BioPulse AI lifestyle recommendations provide educational health guidance based on clinical consensus. This protocol is not a medical diagnosis or treatment plan. Always consult your physician before making substantial changes to your diet, exercise, or medical regimen.'}
      </footer>

      {/* Recommendation Detail Modal */}
      <RecommendationDetailModal
        recommendation={selectedRecommendation}
        onClose={() => setSelectedRecommendation(null)}
        onUpdateStatus={handleUpdateStatus}
        evidenceRegistry={evidence_registry}
        isMale={isMale}
      />
    </div>
  );
};

export default LifestyleRecommendationsPage;
