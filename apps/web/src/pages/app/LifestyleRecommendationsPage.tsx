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
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { lifestyleService } from '../../services/lifestyleService';
import type {
  LifestyleRecommendationsResult,
  LifestyleSimulationOverride,
  RecommendationItem,
} from '../../types/lifestyle';

import { LifestyleSkeleton } from '../../components/lifestyle/LifestyleSkeleton';
import { TodayPriorityCard } from '../../components/lifestyle/TodayPriorityCard';
import { StatusSummaryRow } from '../../components/lifestyle/StatusSummaryRow';
import { NutritionPillarView } from '../../components/lifestyle/NutritionPillarView';
import { FitnessPillarView } from '../../components/lifestyle/FitnessPillarView';
import { LifestylePillarView } from '../../components/lifestyle/LifestylePillarView';
import { EvidenceSourcesSection } from '../../components/lifestyle/EvidenceSourcesSection';
import { ClinicianReviewBanner } from '../../components/lifestyle/ClinicianReviewBanner';
import { MissingDataBanner } from '../../components/lifestyle/MissingDataBanner';
import { RecommendationDetailModal } from '../../components/lifestyle/RecommendationDetailModal';
import { LifestyleEmptyState } from '../../components/lifestyle/LifestyleEmptyState';
import { AILifestylePlanSection } from '../../components/lifestyle/AILifestylePlanSection';

type PillarTab = 'nutrition' | 'fitness' | 'lifestyle';
type ErrorClassification = 'NETWORK' | 'SESSION' | 'NO_ASSESSMENT' | 'SERVER';

export const LifestyleRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, postOnboardingReadiness } = useUserHealth();
  const isMale = userProfile?.pathway === 'male' || userProfile?.gender === 'male';
  const defaultPathway = isMale ? 'androsense' : 'ovasense';

  const [activeTab, setActiveTab] = useState<PillarTab>('nutrition');
  const [data, setData] = useState<LifestyleRecommendationsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorClassification | null>(null);

  // Selected recommendation for the detail modal/drawer
  const [selectedRecommendation, setSelectedRecommendation] = useState<RecommendationItem | null>(null);

  // Interactive preference simulation state
  const [dietaryPref, setDietaryPref] = useState<string>('standard');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');

  // In-flight abort controller to cancel stale duplicate fetches
  const inFlightAbortRef = React.useRef<AbortController | null>(null);

  const fetchRecommendations = async (override?: LifestyleSimulationOverride, refresh = false) => {
    // Abort any existing in-flight request to prevent race conditions & duplicate load
    if (inFlightAbortRef.current) {
      inFlightAbortRef.current.abort();
    }
    const controller = new AbortController();
    inFlightAbortRef.current = controller;

    try {
      setError(null);
      setErrorType(null);
      if (override) {
        setSimulating(true);
        const result = await lifestyleService.simulateRecommendations(override);
        if (controller.signal.aborted) return;
        setData(result);
      } else {
        setLoading(true);
        const result = await lifestyleService.getRecommendations(defaultPathway, refresh, controller.signal);
        if (controller.signal.aborted) return;
        setData(result);
      }
      setError(null);
      setErrorType(null);
    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'AbortError') {
        return;
      }
      console.error('Failed to load lifestyle recommendations:', err);
      const msg = String(err?.message || '');
      const statusCode = err?.status || (err?.response && err.response.status);

      if (
        statusCode === 401 ||
        msg.includes('401') ||
        msg.toLowerCase().includes('session') ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('log in')
      ) {
        setErrorType('SESSION');
        setError('Your session has expired.');
      } else if (
        statusCode === 404 ||
        msg.includes('404') ||
        msg.toLowerCase().includes('no active assessment') ||
        msg.toLowerCase().includes('screening assessment')
      ) {
        setErrorType('NO_ASSESSMENT');
        setError('Complete your screening to unlock personalized recommendations.');
      } else if (
        statusCode >= 500 ||
        msg.includes('500') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('Internal Server Error')
      ) {
        setErrorType('SERVER');
        setError("We couldn't prepare your recommendations right now. Please try again.");
      } else if (
        (err?.name === 'TypeError' && msg.includes('Failed to fetch')) ||
        msg.includes('NetworkError') ||
        (typeof navigator !== 'undefined' && !navigator.onLine)
      ) {
        setErrorType('NETWORK');
        setError("We couldn't connect to BioPulse.");
      } else {
        setErrorType('SERVER');
        setError("We couldn't prepare your recommendations right now.");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setSimulating(false);
      }
    }
  };

  useEffect(() => {
    if (postOnboardingReadiness === 'initializing') {
      return;
    }
    fetchRecommendations();
    return () => {
      if (inFlightAbortRef.current) {
        inFlightAbortRef.current.abort();
      }
    };
  }, [defaultPathway, postOnboardingReadiness]);

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

  // Adherence tracking: Optimistic update with persistent backend mutation
  const handleUpdateStatus = async (
    recommendationId: string,
    newStatus: 'NEW' | 'ACTIVE' | 'IMPROVING' | 'MAINTAIN' | 'REASSESS' | 'COMPLETED' | 'SKIPPED'
  ) => {
    if (!data) return;
    const oldRecommendations = data.recommendations;
    const updatedRecommendations = data.recommendations.map((rec) =>
      rec.id === recommendationId ? { ...rec, status: newStatus } : rec
    );

    // Optimistic UI update
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
      });
    } catch (err) {
      console.error('Failed to persist recommendation status:', err);
      // Revert optimistic update on backend failure
      setData((prev) => (prev ? { ...prev, recommendations: oldRecommendations } : null));
    }
  };

  // Find Today's Priority recommendation (highest priority item)
  const topPriorityRecommendation = useMemo(() => {
    if (!data?.recommendations || data.recommendations.length === 0) return null;
    return (
      data.recommendations.find((r) => r.priority === 'high') ||
      data.recommendations[0]
    );
  }, [data]);

  // Format updated date cleanly
  const formattedUpdatedDate = useMemo(() => {
    if (!data?.generated_at) return null;
    try {
      return new Date(data.generated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [data?.generated_at]);

  // 1. Loading State (High-Fidelity Skeleton) - also during post-onboarding initialization
  const isInitializing = postOnboardingReadiness === 'initializing';
  if ((loading && !data) || isInitializing) {
    return <LifestyleSkeleton />;
  }

  // 2. Error State (Calm, professional, differentiated, with retry)
  if (error && !data && !isInitializing) {
    if (errorType === 'SESSION') {
      return (
        <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#073B72]">Your session has expired.</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Please sign in again to access your personalized recommendations.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#073B72] hover:bg-[#0B4A8B] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Again</span>
          </button>
        </div>
      );
    }

    if (errorType === 'NO_ASSESSMENT') {
      return (
        <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-pink-50 text-[#F43F7D] flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#073B72]">
            Complete your screening to unlock personalized recommendations.
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your recommendations are dynamically tailored to your screening results, symptoms, and biomarkers.
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/assessment')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F43F7D] hover:bg-[#DC326C] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <span>Go to Screening</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (errorType === 'NETWORK') {
      return (
        <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <WifiOff className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#073B72]">We couldn&apos;t connect to BioPulse.</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Please check your internet connection and try again.
          </p>
          <button
            type="button"
            onClick={() => fetchRecommendations()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#073B72] hover:bg-[#0B4A8B] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      );
    }

    // Default: SERVER error
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#073B72]">
          We couldn&apos;t prepare your recommendations right now.
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Our recommendation service encountered an issue. Please try again in a few moments.
        </p>
        <button
          type="button"
          onClick={() => fetchRecommendations()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#073B72] hover:bg-[#0B4A8B] text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  // 3. Baseline / Empty State (If no recommendations exist)
  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return <LifestyleEmptyState isMale={isMale} />;
  }

  const { nutrition, fitness, lifestyle, evidence_rationale, evidence_registry } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-16 text-left">
      {/* A. Clean Compact Toolbar */}
      <div className="rounded-2xl bg-white border border-[#D7EAF2] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            {/* Metadata Tags: Pathway, Tier, Date */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  isMale
                    ? 'bg-sky-50 text-[#0868B9] border-sky-200'
                    : 'bg-teal-50 text-[#0E9EAA] border-teal-200'
                }`}
              >
                {data.pathway === 'androsense'
                  ? 'Male Hypogonadism Pathway'
                  : 'Female PCOS Metabolic Pathway'}
              </span>

              {data.risk_category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                  {data.risk_category.replace(/_/g, ' ')} Tier
                </span>
              )}

              {formattedUpdatedDate && (
                <span className="inline-flex items-center gap-1 text-xs text-[#55718F]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Updated {formattedUpdatedDate}</span>
                </span>
              )}
            </div>
          </div>

          {/* Interactive Customization Controls */}
          <div className="p-3.5 rounded-xl bg-[#F5FBFD] border border-[#D7EAF2] flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#073B72]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#16B8C4]" />
              <span className="hidden sm:inline">Preferences:</span>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="pref-diet" className="text-xs text-slate-600">Diet</label>
              <select
                id="pref-diet"
                value={dietaryPref}
                onChange={(e) => handleDietaryChange(e.target.value)}
                disabled={simulating}
                className="text-xs font-medium bg-white border border-[#D7EAF2] rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#16B8C4] cursor-pointer"
              >
                <option value="standard">Standard</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="pref-activity" className="text-xs text-slate-600">Activity</label>
              <select
                id="pref-activity"
                value={activityLevel}
                onChange={(e) => handleActivityChange(e.target.value)}
                disabled={simulating}
                className="text-xs font-medium bg-white border border-[#D7EAF2] rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#16B8C4] cursor-pointer"
              >
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="very_active">Active</option>
              </select>
            </div>

            {simulating ? (
              <span className="text-xs font-medium text-[#16B8C4] flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Updating...</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => fetchRecommendations(undefined, true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 hover:text-[#073B72] hover:bg-white border border-transparent hover:border-[#D7EAF2] transition-colors cursor-pointer"
                title="Recalculate recommendations from current health data"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clinician Review Banner if recommended (Calm, non-alarming) */}
      {data.clinician_review?.recommended && (
        <ClinicianReviewBanner clinicianReview={data.clinician_review} />
      )}

      {/* Missing Data Notification Banner (Single compact banner) */}
      {data.missing_data && data.missing_data.length > 0 && (
        <MissingDataBanner missingData={data.missing_data} />
      )}

      {/* 7-Day Personalized AI Lifestyle Plan (Hybrid Rule-Based + Generative AI Engine) */}
      <AILifestylePlanSection
        pathway={data.pathway || defaultPathway}
        isMale={isMale}
        dietaryPreference={dietaryPref}
        activityLevel={activityLevel}
      />

      {/* B. Today's Priority Featured Card */}
      {topPriorityRecommendation && (
        <TodayPriorityCard
          priorityRecommendation={topPriorityRecommendation}
          onViewRecommendation={(rec) => setSelectedRecommendation(rec)}
          onUpdateStatus={handleUpdateStatus}
          isMale={isMale}
        />
      )}

      {/* C. Recommendation Status Summary */}
      <StatusSummaryRow
        recommendations={data.recommendations}
        isMale={isMale}
      />

      {/* D. Main Three Pillar Tabs Navigation */}
      <nav
        aria-label="Lifestyle Pillars"
        className="flex items-center gap-2 border-b border-[#D7EAF2] pb-2 overflow-x-auto scrollbar-none"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          id="tab-nutrition"
          aria-selected={activeTab === 'nutrition'}
          aria-controls="panel-nutrition"
          onClick={() => setActiveTab('nutrition')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'nutrition'
              ? isMale
                ? 'bg-[#0868B9] text-white shadow-xs'
                : 'bg-[#0E9EAA] text-white shadow-xs'
              : 'text-[#55718F] hover:text-[#073B72] hover:bg-slate-100'
          }`}
        >
          <Apple className="w-4 h-4" />
          <span>Nutrition</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-fitness"
          aria-selected={activeTab === 'fitness'}
          aria-controls="panel-fitness"
          onClick={() => setActiveTab('fitness')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'fitness'
              ? isMale
                ? 'bg-[#0868B9] text-white shadow-xs'
                : 'bg-[#0E9EAA] text-white shadow-xs'
              : 'text-[#55718F] hover:text-[#073B72] hover:bg-slate-100'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Fitness</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-lifestyle"
          aria-selected={activeTab === 'lifestyle'}
          aria-controls="panel-lifestyle"
          onClick={() => setActiveTab('lifestyle')}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'lifestyle'
              ? isMale
                ? 'bg-[#0868B9] text-white shadow-xs'
                : 'bg-[#0E9EAA] text-white shadow-xs'
              : 'text-[#55718F] hover:text-[#073B72] hover:bg-slate-100'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Lifestyle & Recovery</span>
        </button>
      </nav>

      {/* E. Active Pillar Tab View */}
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

      {/* G. Evidence & Clinical Sources (Collapsed by default) */}
      <EvidenceSourcesSection
        evidenceRegistry={evidence_registry}
        evidenceRationale={evidence_rationale}
        recommendations={data.recommendations}
        disclaimer={data.disclaimer}
        isMale={isMale}
      />

      {/* H. Small Non-Diagnostic Medical Disclaimer */}
      <footer className="text-center py-4 border-t border-[#D7EAF2]/60 text-xs text-[#55718F] leading-relaxed max-w-3xl mx-auto">
        {data.disclaimer ||
          'BioPulse AI lifestyle recommendations provide educational health guidance based on clinical consensus. This protocol is not a medical diagnosis or treatment plan. Always consult your physician before making substantial changes to your diet, exercise, or medical regimen.'}
      </footer>

      {/* Polished Recommendation Detail Modal / Drawer */}
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
