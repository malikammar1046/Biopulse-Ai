import React from 'react';
import {
  ContactHeroSection,
  ContactFormSection,
  ContactReasonsSection,
  ContactFAQSection,
  ContactCTASection,
} from './contact-sections';

export const Contact: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#10071A] selection:bg-[#E87084]/30 selection:text-white">
      {/* 1. HERO SECTION */}
      <ContactHeroSection />

      {/* 2. MAIN CONTACT EXPERIENCE (TWO-COLUMN FORM & TOPICS) */}
      <ContactFormSection />

      {/* 3. WHY CONTACT OVASENSE */}
      <ContactReasonsSection />

      {/* 4. FAQ SECTION */}
      <ContactFAQSection />

      {/* 5. FINAL CTA */}
      <ContactCTASection />
    </div>
  );
};

export default Contact;
