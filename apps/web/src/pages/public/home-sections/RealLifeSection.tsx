import React from 'react';
import { Utensils, Footprints, FileText } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export const RealLifeSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#FFF0F2] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="accent" showDot size="md">
            Localized Empathy
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Technology should fit your life —{' '}
            <span className="bg-gradient-to-r from-[#6E2D8B] via-[#A21CAF] to-[#E87084] bg-clip-text text-transparent">
              not the other way around.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Engineered with realistic healthcare habits, regional dietary contexts, and pragmatic lifestyle realities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Real Food Context */}
          <Card variant="standard" hoverEffect className="p-8 space-y-4 border-[#E7DFEF] bg-white">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
              <Utensils className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-display text-[#1C1326]">
              Pakistani Dietary Context
            </h3>

            <p className="text-sm text-[#584B68] leading-relaxed">
              No impractical western meal plans. Guidance accounts for everyday meals—roti portions, daal,
              brown vs white rice, chai adjustments, and sensible carbohydrate distribution.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#6E2D8B]">
              <span className="px-2.5 py-1 rounded-lg bg-[#F2ECF7]">Roti & Daal Context</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#F2ECF7]">Chai Timing</span>
            </div>
          </Card>

          {/* Real Movement */}
          <Card variant="standard" hoverEffect className="p-8 space-y-4 border-[#E7DFEF] bg-white">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
              <Footprints className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-display text-[#1C1326]">
              Everyday Movement Pacing
            </h3>

            <p className="text-sm text-[#584B68] leading-relaxed">
              Tailored for real-world schedules. Emphasizes brisk neighborhood walks, low-impact home mobility routines,
              and post-meal movement to support insulin sensitivity without demanding gym equipment.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#E87084]">
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF0F2]">Home Mobility</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FFF0F2]">Post-Meal Walks</span>
            </div>
          </Card>

          {/* Real Documents */}
          <Card variant="standard" hoverEffect className="p-8 space-y-4 border-[#E7DFEF] bg-white">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold font-display text-[#1C1326]">
              Real-World Lab Documents
            </h3>

            <p className="text-sm text-[#584B68] leading-relaxed">
              Designed for actual hospital and clinic prints. Accepts camera phone snapshots, multi-page PDFs,
              and varied regional diagnostic center formats with human verification safeguards.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#A21CAF]">
              <span className="px-2.5 py-1 rounded-lg bg-[#FDF2F8]">Phone Snapshots</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#FDF2F8]">Hospital PDFs</span>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
};
