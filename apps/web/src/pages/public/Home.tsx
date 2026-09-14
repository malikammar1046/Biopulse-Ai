import React, { useEffect } from 'react';
import {
  HeroSection,
  TwoHealthPathwaysSection,
  HowItWorksSection,
  FeaturesSection,
  FinalCTASection,
} from './home-sections';

export const Home: React.FC = () => {
  useEffect(() => {
    document.title = 'BioPulse AI | Reproductive-Endocrine Screening & Decision Support';
  }, []);

  return (
    <div className="w-full overflow-hidden bg-transparent text-[#162A45]">
      {/* 1. Hero: Unified Platform Positioning + 4-Item Value Strip */}
      <HeroSection />

      {/* 2. Two Screening Pathways: PCOS (Female) & Hypogonadism (Male) */}
      <TwoHealthPathwaysSection />

      {/* 3. Short How BioPulse Works: 3 Simple Steps */}
      <HowItWorksSection />

      {/* 4. Short Feature Preview: 3 Key Differentiators */}
      <FeaturesSection />

      {/* 5. Final CTA: High-Conversion Call to Action */}
      <FinalCTASection />
    </div>
  );
};

export default Home;
