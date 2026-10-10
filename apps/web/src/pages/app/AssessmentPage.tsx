import React from 'react';
import { useUserHealth } from '../../context/UserHealthContext';
import { FemaleScreeningWorkspace } from '../../components/female';
import { MaleScreeningWorkspace } from '../../components/male';

export const AssessmentPage: React.FC = () => {
  const { adaptiveProfile, activeAssessment } = useUserHealth();

  const pathway = adaptiveProfile.pathway;
  const isMale =
    pathway === 'male' ||
    adaptiveProfile.pathway === 'male' ||
    activeAssessment?.module === 'male_hypogonadism';

  if (isMale) {
    return <MaleScreeningWorkspace />;
  }

  return <FemaleScreeningWorkspace />;
};

export default AssessmentPage;
