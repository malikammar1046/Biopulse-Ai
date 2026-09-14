import React from 'react';
import {
  AboutHeroSection,
  DisconnectedProblemSection,
  OurApproachSection,
  TwoPathwaysOneEcosystemSection,
  LocalizedPakistanSection,
  AboutResponsibleAISection,
  AboutCTASection,
} from './about-sections';

export const About: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-transparent">
      {/* 1. Our Purpose: Understanding the Complexity of Reproductive Health */}
      <AboutHeroSection />

      {/* 2. The Problem: Disconnected Information Silos */}
      <DisconnectedProblemSection />

      {/* 3. Our Approach: Four Core Principles (Progressive, Explainable, Cost-Aware, Doctor-Ready) */}
      <OurApproachSection />

      {/* 4. Two Dedicated Pathways: Female PCOS & Male Hypogonadism */}
      <TwoPathwaysOneEcosystemSection />

      {/* 5. Culturally Grounded Guidance: Designed for Pakistani Health Realities */}
      <LocalizedPakistanSection />

      {/* 6. Responsible Health AI: Explainability, Safety, and Clinical Collaboration */}
      <AboutResponsibleAISection />

      {/* 7. Final CTA */}
      <AboutCTASection />
    </div>
  );
};

export default About;
