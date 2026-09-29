import React from 'react';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway, type HealthPathway } from '../../types/onboarding';
import { FemaleDashboardOverview } from '../../components/female/FemaleDashboardOverview';
import { MaleDashboardOverview } from '../../components/male/MaleDashboardOverview';

interface DashboardProps {
  pathway?: HealthPathway;
}

export const Dashboard: React.FC<DashboardProps> = ({ pathway: pathwayProp }) => {
  const { userProfile } = useUserHealth();
  const activePathway = pathwayProp || resolvePathway(userProfile?.gender, userProfile?.pathway);
  const isMale = activePathway === 'male';

  if (isMale) {
    return <MaleDashboardOverview />;
  }

  return <FemaleDashboardOverview />;
};

export default Dashboard;
