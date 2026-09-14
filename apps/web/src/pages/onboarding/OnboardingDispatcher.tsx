import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserHealth } from '../../context/UserHealthContext';
import { ROUTES, getPathwayDashboardRoute } from '../../constants/routes';
import type { UserGender } from '../../types/onboarding';
import { PathwaySelectionScreen } from '../../components/auth/PathwaySelectionScreen';

export const OnboardingDispatcher: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useUserHealth();
  const [saving, setSaving] = useState(false);
  const [savingPathway, setSavingPathway] = useState<'female' | 'male' | null>(null);

  // 1. If already onboarded, go to user's specialized dashboard
  if (userProfile.isOnboarded) {
    return <Navigate to={getPathwayDashboardRoute(userProfile)} replace />;
  }

  // 2. Interactive Pathway Selector matching the new Female & Male design
  const handleSelectPathway = async (pathway: 'female' | 'male') => {
    setSaving(true);
    setSavingPathway(pathway);
    const derivedGender: UserGender = pathway === 'female' ? 'female' : 'male';

    await updateUserProfile({
      pathway,
      gender: derivedGender,
    });

    const target = pathway === 'female' ? ROUTES.ONBOARDING_FEMALE : ROUTES.ONBOARDING_MALE;
    navigate(target, { replace: true });
  };

  return (
    <PathwaySelectionScreen
      onSelectPathway={handleSelectPathway}
      loading={saving}
      loadingPathway={savingPathway}
    />
  );
};

export default OnboardingDispatcher;
