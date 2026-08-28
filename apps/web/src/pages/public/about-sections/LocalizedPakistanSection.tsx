import React from 'react';
import { Utensils, Smartphone, FileText, Globe2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const LocalizedPakistanSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#FFF0F2] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="accent" showDot size="md">
            Context-Aware Architecture
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Designed for real lives in Pakistan.
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Health technology should adapt to the people using it — respecting local dietary habits,
            diagnostic document formats, and clinical consultation norms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-7 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#1C1326]">
              Regional Diet Context
            </h3>
            <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
              Tailored nutritional suggestions for roti, daal, rice dishes, and chai timing to support insulin sensitivity.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#1C1326]">
              Mobile-First Design
            </h3>
            <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
              Optimized for smartphone logging, fast load times, and low bandwidth resilience.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#1C1326]">
              Real Hospital Scans
            </h3>
            <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
              Accepts phone camera photos and PDFs from Pakistani diagnostic centers with user verification.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#047857] flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#1C1326]">
              Bilingual Terminology
            </h3>
            <p className="text-xs sm:text-sm text-[#584B68] leading-relaxed">
              Clear health explanations designed to bridge medical jargon and everyday conversational phrasing.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};
