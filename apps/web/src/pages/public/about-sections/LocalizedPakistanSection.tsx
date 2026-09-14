import React from 'react';
import { Utensils, Smartphone, FileText, Globe2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';

export const LocalizedPakistanSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#FAFCFF] via-[#F8FAFC] to-[#FFFFFF] text-[#162A45] border-t border-slate-200/80 overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-[#059669]">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Context-Aware Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#162A45] leading-tight">
            Designed for real lives in{' '}
            <span className="text-[#059669]">
              Pakistan.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans max-w-2xl mx-auto">
            Health technology should adapt to the people using it — respecting local dietary habits, diagnostic document formats, and clinical consultation norms.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 text-left hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#162A45]">
              Regional Diet Context
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tailored nutritional suggestions for roti, daal, seasonal vegetables, and chai timing to support insulin sensitivity and metabolic health.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 text-left hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-[#0891B2] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#162A45]">
              Mobile-First Accessibility
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Optimized for smartphone logging, fast load times, and low bandwidth resilience across regional mobile connections.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 text-left hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#162A45]">
              Local Diagnostic Lab Formats
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Parser support for printed slips and PDFs from diagnostic providers across Pakistan with interactive user verification.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3 text-left hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284C7] flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-[#162A45]">
              Culturally Sensitive Literacy
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Clear, compassionate explanations designed to bridge medical terminology, reducing anxiety around reproductive-endocrine health.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default LocalizedPakistanSection;
