import React from 'react';
import { useAuth } from '../../features/authentication';
import { useHealthStore } from '../../store/healthStore';
import { FemaleDashboardOverview, MaleDashboardOverview } from '../../components/dashboard';

/**
 * SCREEN 12 & 17: BIOPULSE DYNAMIC HOME DASHBOARD
 * Automatically switches between:
 * - SCREEN 12: Female PCOS Dashboard (mbl 17.png)
 * - SCREEN 17: Male Hypogonadism Dashboard (BioPulse AI Health Dashboard.png)
 * Consumes unified realtime state via useHealthStore() with cross-screen synchronization.
 */
export default function MobileDashboardScreen() {
  const { pathway: authPathway } = useAuth();
  const { pathway: storePathway } = useHealthStore();

  const activePathway = storePathway || authPathway;
  const isFemale = activePathway !== 'male_hypogonadism' && activePathway !== 'male';

  if (isFemale) {
    return <FemaleDashboardOverview />;
  }

  return <MaleDashboardOverview />;
}
