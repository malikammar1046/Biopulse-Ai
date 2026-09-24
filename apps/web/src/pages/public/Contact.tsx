import React from 'react';
import {
  ContactHeroSection,
  ContactFormSection,
  ContactReasonsSection,
  ContactFAQSection,
} from './contact-sections';

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-transparent">
      {/* 1. HERO SECTION */}
      <ContactHeroSection />

      {/* 2. MAIN CONTACT EXPERIENCE (FORM & DIRECT CHANNELS) */}
      <ContactFormSection />

      {/* 3. REASONS TO CONTACT BIOPULSE AI */}
      <ContactReasonsSection />

      {/* 4. FAQ SECTION */}
      <ContactFAQSection />
    </div>
  );
};

export default Contact;

