import React from 'react';
import {
  AboutHeroSection,
  WhatIsPCOSSection,
  BiologicalChainSection,
  InteractiveBiologySection,
  DisconnectedProblemSection,
  IntelligenceLayerSection,
  WhyDifferentSection,
  FourPillarsSection,
  LocalizedPakistanSection,
  AboutResponsibleAISection,
  ResearchFoundationSection,
  AboutTeamSection,
  AboutCTASection,
} from './about-sections';

export const About: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 1. Hero: Understanding the Complexity with 3D Reproductive System */}
      <AboutHeroSection />

      {/* 2. Educational: What is PMOS/PCOS? (Hormonal, Reproductive, Metabolic) */}
      <WhatIsPCOSSection />

      {/* 3. Biological Chain: A Chain of Interconnected Changes */}
      <BiologicalChainSection />

      {/* 4. Interactive Biology: 5 Core Physiological Domains */}
      <InteractiveBiologySection />

      {/* 5. The Real Problem: Disconnected Information Silos */}
      <DisconnectedProblemSection />

      {/* 6. What We Are Building: Health Intelligence Layer & Transformation Pipeline */}
      <IntelligenceLayerSection />

      {/* 7. Why We Are Different: Factual Comparison Table */}
      <WhyDifferentSection />

      {/* 8. Four Core Distinctions: Connected, Explainable, Longitudinal, Human-Centered */}
      <FourPillarsSection />

      {/* 9. Context-Aware: Designed for Real Lives in Pakistan */}
      <LocalizedPakistanSection />

      {/* 10. Responsible AI: AI Should Explain, Not Pretend to Know Everything */}
      <AboutResponsibleAISection />

      {/* 11. Academic Foundation: Built as a Research Project. Designed as a Real Product. */}
      <ResearchFoundationSection />

      {/* 12. Team Preview: Verified Researcher Profiles */}
      <AboutTeamSection />

      {/* 13. Final CTA: Understand the Patterns. Understand the Bigger Picture. */}
      <AboutCTASection />
    </div>
  );
};
