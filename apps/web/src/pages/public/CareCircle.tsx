import React, { useEffect } from 'react';
import { CareCircleHeroSection } from './care-circle-sections/CareCircleHeroSection';
import { CareCircleProblemSection } from './care-circle-sections/CareCircleProblemSection';
import { CareCirclePermissionSection } from './care-circle-sections/CareCirclePermissionSection';
import { WeeklyDoctorBriefSection } from './care-circle-sections/WeeklyDoctorBriefSection';
import { AppointmentPreparationSection } from './care-circle-sections/AppointmentPreparationSection';
import { FamilySupportSection } from './care-circle-sections/FamilySupportSection';
import { PrivateConversationsSection } from './care-circle-sections/PrivateConversationsSection';
import { CareCircleNetworkSection } from './care-circle-sections/CareCircleNetworkSection';
import { WhyCareCircleDifferentSection } from './care-circle-sections/WhyCareCircleDifferentSection';
import { ResponsibleSharingSection } from './care-circle-sections/ResponsibleSharingSection';
import { CareCircleCTASection } from './care-circle-sections/CareCircleCTASection';

export const CareCircle: React.FC = () => {
  useEffect(() => {
    document.title = 'Care Circle | BIOPulse AI Health Intelligence';
  }, []);

  return (
    <div className="flex flex-col w-full overflow-hidden bg-transparent text-[#162A45] selection:bg-[#0891B2] selection:text-white">
      {/* 1. Cinematic Hero Section */}
      <CareCircleHeroSection />

      {/* 2. The Fragmentation Problem vs Unified Core */}
      <CareCircleProblemSection />

      {/* 3 & 4. One Patient, Different Views & Granular Permission Control */}
      <CareCirclePermissionSection />

      {/* 5. The Weekly Doctor Brief Synthesis */}
      <WeeklyDoctorBriefSection />

      {/* 6. Before the Appointment Timeline */}
      <AppointmentPreparationSection />

      {/* 7. Family & Loved Ones Support */}
      <FamilySupportSection />

      {/* 8. Zero-Compromise Private Conversations */}
      <PrivateConversationsSection />

      {/* 9. Interactive Care Circle Network Graph HUD */}
      <CareCircleNetworkSection />

      {/* 10. Why Care Circle is Architecturally Different */}
      <WhyCareCircleDifferentSection />

      {/* 11. Four Pillars of Responsible Sharing */}
      <ResponsibleSharingSection />

      {/* 12. Final Call-to-Action */}
      <CareCircleCTASection />
    </div>
  );
};
