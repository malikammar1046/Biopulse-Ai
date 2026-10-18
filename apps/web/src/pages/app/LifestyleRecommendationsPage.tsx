import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  AlertTriangle,
  WifiOff,
  LogIn,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import { useUserHealth } from '../../context/UserHealthContext';
import { useAuth } from '../../context/AuthContext';
import { lifestyleService, SessionError } from '../../services/lifestyleService';
import type {
  LifestyleRecommendationsResult,
  LifestyleSimulationOverride,
} from '../../types/lifestyle';

import { LifestyleSkeleton } from '../../components/lifestyle/LifestyleSkeleton';
import { LifestyleEmptyState } from '../../components/lifestyle/LifestyleEmptyState';
import { OvaSenseLifestyleDashboard } from '../../components/lifestyle/ovasense/OvaSenseLifestyleDashboard';
import { AndroSenseLifestyleDashboard } from '../../components/lifestyle/androsense/AndroSenseLifestyleDashboard';

type ErrorClassification = 'NETWORK' | 'SESSION' | 'NO_ASSESSMENT' | 'SERVER';

export const LifestyleRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, postOnboardingReadiness } = useUserHealth();
  const { user, loading: authLoading } = useAuth();
  const activeUserId = user?.id || userProfile?.id;
  const userProfileIsMale =
    userProfile?.pathway === 'male' ||
    userProfile?.gender === 'male';
  const defaultPathway = userProfileIsMale ? 'androsense' : 'ovasense';

  // Synchronous cache lookup for instantaneous return visits (< 1ms)
  const initialCached = useMemo(() => {
    return lifestyleService.getCachedRecommendations(defaultPathway, activeUserId);
  }, [defaultPathway, activeUserId]);

  const [data, setData] = useState<LifestyleRecommendationsResult | null>(() => initialCached);
  const isMale =
    userProfileIsMale ||
    data?.pathway === 'androsense' ||
    data?.pathway === 'male_hypogonadism';
  const [loading, setLoading] = useState<boolean>(() => !initialCached);
  const [_simulating, setSimulating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorClassification | null>(null);
  const [nonBlockingNotice, setNonBlockingNotice] = useState<string | null>(null);

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
          <div
            className={`w-14 h-14 mx-auto rounded-3xl flex items-center justify-center ${
              isMale ? 'bg-sky-50 text-[#0868B9]' : 'bg-pink-50 text-[#F43F7D]'
            }`}
          >
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
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-semibold transition cursor-pointer ${
              isMale
                ? 'bg-[#0868B9] hover:bg-[#07599c]'
                : 'bg-[#F43F7D] hover:bg-[#DC326C]'
            }`}
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

  // ── FEMALE OVASENSE PROTOCOL (Pixel-Accurate Reference Redesign) ──
  if (!isMale) {
    return (
      <OvaSenseLifestyleDashboard
        data={data}
        onUpdateStatus={handleUpdateStatus}
        onRefresh={() => fetchRecommendations(undefined, true)}
        activeUserId={activeUserId}
        nonBlockingNotice={nonBlockingNotice}
        onClearNonBlockingNotice={() => setNonBlockingNotice(null)}
      />
    );
  }

  // ── MALE ANDROSENSE PROTOCOL (Complete Male Replication in Sky Blue) ──
  return (
    <AndroSenseLifestyleDashboard
      data={data}
      onUpdateStatus={handleUpdateStatus}
      onRefresh={() => fetchRecommendations(undefined, true)}
      activeUserId={activeUserId}
      nonBlockingNotice={nonBlockingNotice}
      onClearNonBlockingNotice={() => setNonBlockingNotice(null)}
    />
  );
};

export default LifestyleRecommendationsPage;
