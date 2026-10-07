/**
 * BioPulse Mobile — useDashboardData Hook
 *
 * Dedicated data layer hook bridging the dashboard UI and authoritative backend services.
 * Implements:
 * - Realtime loading, loaded, empty, error, and retry states
 * - Optimistic rendering with persistent local caching
 * - Cross-module synchronization into useHealthStore
 * - Zero health fabrication policy
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../features/authentication';
import { useHealthStore, HealthPathway } from '../store/healthStore';
import {
  fetchDashboardData,
  getCachedDashboardData,
  DashboardData,
} from '../services/dashboardService';

export type DashboardViewState = 'loading' | 'loaded' | 'empty' | 'error';

export interface UseDashboardDataResult {
  state: DashboardViewState;
  data: DashboardData | null;
  error: string | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useDashboardData(pathwayOverride?: HealthPathway): UseDashboardDataResult {
  const { user, isAuthenticated, isLoading } = useAuth();
  const {
    pathway: storePathway,
    updateScreeningAssessment,
    updateCycle,
    updateProfile,
  } = useHealthStore();

  const [state, setState] = useState<DashboardViewState>('loading');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const activePathway = pathwayOverride || storePathway || (user?.pathway as HealthPathway) || 'female';

  const loadData = useCallback(
    async (isPullToRefresh = false) => {
      if (isLoading) return;

      if (!isAuthenticated || !user || !user.accessToken) {
        if (isMountedRef.current) {
          setError('User session expired. Please log in again.');
          setState('error');
        }
        return;
      }

      const userId = user.id;
      const token = user.accessToken;

      if (isPullToRefresh) {
        if (isMountedRef.current) setIsRefreshing(true);
      } else if (!data) {
        // Try reading cached data first for instant perceived rendering
        try {
          const cached = await getCachedDashboardData(userId);
          if (cached && isMountedRef.current) {
            setData(cached);
            setState(cached.isAllEmpty ? 'empty' : 'loaded');
          }
        } catch {
          // Ignore cache errors
        }
      }

      try {
        const freshData = await fetchDashboardData(userId, token, activePathway);

        if (!isMountedRef.current) return;

        setData(freshData);
        setError(null);
        setState(freshData.isAllEmpty ? 'empty' : 'loaded');

        // Synchronize with global HealthStore so other screens reflect changes
        if (freshData.assessment.hasAssessment && freshData.assessment.probabilityPercent !== null) {
          updateScreeningAssessment({
            probabilityPercent: freshData.assessment.probabilityPercent,
            riskCategory: freshData.assessment.riskCategory || 'lower',
            riskBand: (freshData.assessment.riskLabel as any) || 'Lower Risk',
            tier: freshData.assessment.tier,
            tierStatus: freshData.assessment.tierStatus,
            lastAssessedDate: freshData.assessment.lastAssessedDate || 'Recent',
            topFactors: freshData.assessment.topFactors,
          });
        }

        if (freshData.cycle?.hasCycleData) {
          updateCycle({
            currentCycleDay: freshData.cycle.currentCycleDay,
            cycleLength: freshData.cycle.cycleLength,
            nextPeriodDaysRemaining: freshData.cycle.nextPeriodDaysRemaining,
            nextPeriodExpectedDate: freshData.cycle.nextPeriodExpectedDate,
            fertileWindowStart: freshData.cycle.fertileWindowStart,
            fertileWindowEnd: freshData.cycle.fertileWindowEnd,
          });
        }

        if (freshData.userName) {
          updateProfile({
            fullName: freshData.userName,
          });
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;

        console.warn('[useDashboardData] Fetch error:', err?.message || err);

        // If we already have data from cache, don't break the UI to error screen;
        // keep data visible and just clear refreshing
        if (!data) {
          setError(err?.message || 'Unable to load health dashboard data. Check your connection.');
          setState('error');
        }
      } finally {
        if (isMountedRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [isLoading, isAuthenticated, user, activePathway, data, updateScreeningAssessment, updateCycle, updateProfile]
  );

  useEffect(() => {
    loadData(false);
  }, [user?.id, user?.accessToken, isAuthenticated, isLoading, activePathway]);

  const refresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const retry = useCallback(async () => {
    setState('loading');
    setError(null);
    await loadData(false);
  }, [loadData]);

  return {
    state,
    data,
    error,
    isRefreshing,
    refresh,
    retry,
  };
}
