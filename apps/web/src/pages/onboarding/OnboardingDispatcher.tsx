import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import type { UserGender } from '../../types/onboarding';
import { PathwaySelectionScreen } from '../../components/auth/PathwaySelectionScreen';
import { BioPulseLoadingScreen } from '../../components/brand/BioPulseLoadingScreen';
import { preloadOnboardingRoutes } from '../../utils/routePreloaders';

export const OnboardingDispatcher: React.FC = () => {
  const { t } = useTranslation(['onboarding']);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, updateUserProfile } = useUserHealth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPathway, setTransitionPathway] = useState<'female' | 'male' | null>(null);

  // Preload lazy onboarding route chunks
  useEffect(() => {
    preloadOnboardingRoutes();
  }, []);

  const isExplicitRelaunch = (location.state as any)?.allowReonboard;

  // 1. If already onboarded and not explicitly re-onboarding, go to user's specialized dashboard
  if (userProfile.isOnboarded && !isExplicitRelaunch) {
    return <Navigate to={getPathwayDashboardRoute(userProfile)} replace />;
  }

  // 2. If user already has an assigned pathway and not re-onboarding, route directly
  if (!isExplicitRelaunch && (userProfile.pathway === 'female' || userProfile.pathway === 'male')) {
    const directTarget = userProfile.pathway === 'female' ? ROUTES.ONBOARDING_FEMALE : ROUTES.ONBOARDING_MALE;
    return <Navigate to={directTarget} replace />;
  }

  // 3. Immediate Botanical Loading Screen on Pathway Click (Replaces selection screen instantly)
  if (isTransitioning) {
    return (
      <BioPulseLoadingScreen
        message={
          transitionPathway === 'male'
            ? t('onboarding:pathwaySelection.maleLoading', 'Preparing your Men’s Health pathway...')
            : t('onboarding:pathwaySelection.femaleLoading', 'Preparing your Women’s Health pathway...')
        }
        fullScreen={true}
      />
    );
  }

  // 4. Interactive Pathway Selector matching the new Female & Male design
  const handleSelectPathway = async (pathway: 'female' | 'male') => {
    // Immediately show botanical loader before executing network persistence
    setIsTransitioning(true);
    setTransitionPathway(pathway);
    const derivedGender: UserGender = pathway === 'female' ? 'female' : 'male';

    try {
      await updateUserProfile({
        pathway,
        gender: derivedGender,
      });
    } catch (err) {
      console.warn('Pathway profile update warning in OnboardingDispatcher:', err);
    }

    const target = pathway === 'female' ? ROUTES.ONBOARDING_FEMALE : ROUTES.ONBOARDING_MALE;
    navigate(target, { replace: true });
  };

  return (
    <PathwaySelectionScreen
      onSelectPathway={handleSelectPathway}
      loading={isTransitioning}
      loadingPathway={transitionPathway}
    />
  );
};

export default OnboardingDispatcher;
