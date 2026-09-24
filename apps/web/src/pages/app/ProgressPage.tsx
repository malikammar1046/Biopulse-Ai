import React from 'react';
import { motion } from 'framer-motion';
import { HealthProgressSection } from '../../components/longitudinal';
import { useUserHealth } from '../../context/UserHealthContext';
import { resolvePathway } from '../../types/onboarding';

export const ProgressPage: React.FC = () => {
  const { userProfile } = useUserHealth();
  const activePathway = resolvePathway(userProfile.gender, userProfile.pathway);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="max-w-7xl mx-auto space-y-6 pb-16 text-left"
    >
      <HealthProgressSection pathway={activePathway} />
    </motion.div>
  );
};

export default ProgressPage;
