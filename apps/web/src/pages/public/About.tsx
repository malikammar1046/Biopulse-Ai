import React from 'react';
import {
  AboutHeroSection,
  TwoPathwaysOneEcosystemSection,
  BiologicalChainSection,
  InteractiveBiologySection,
  DisconnectedProblemSection,
  IntelligenceLayerSection,
  WhyDifferentSection,
  FourPillarsSection,
  LocalizedPakistanSection,
  AboutResponsibleAISection,
  ClinicalFoundationSection,
  AboutCTASection,
} from './about-sections';

export const About: React.FC = () => {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-[#10071A]">
      {/* 1. Hero: Understanding the Complexity of Reproductive Health */}
      <AboutHeroSection />

      {/* 2. Dual Pathways, One Ecosystem: Women's PCOS, Men's Hypogonadism, and Baseline */}
      <TwoPathwaysOneEcosystemSection />

      {/* 3. Biological Interconnectivity: Interconnected Systems */}
      <BiologicalChainSection />

      {/* 4. Interactive Physiology: 5 Core Physiological Domains */}
      <InteractiveBiologySection />

      {/* 5. The Real Problem: Disconnected Information Silos */}
      <DisconnectedProblemSection />

      {/* 6. What We Are Building: Health Intelligence Layer & 4-Tier Transformation Pipeline */}
      <IntelligenceLayerSection />

      {/* 7. Why We Are Different: Factual Comparison Table */}
      <WhyDifferentSection />

      {/* 8. Four Core Distinctions: Connected, Explainable, Longitudinal, Human-Centered */}
      <FourPillarsSection />

      {/* 9. Context-Aware: Designed for Real Lives */}
      <LocalizedPakistanSection />

      {/* 10. Responsible AI: AI Should Explain, Not Pretend to Know Everything */}
      <AboutResponsibleAISection />

      {/* 11. Clinical & Technology Architecture */}
      <ClinicalFoundationSection />

      {/* 12. Final CTA: Understand the Patterns. Understand the Bigger Picture. */}
      <AboutCTASection />
    </div>
  );
};
