import { Utensils, Footprints, Moon, CheckCircle2 } from 'lucide-react';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';

export const LifestyleActionSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-[#EDE4F7] via-[#F8F5FA] to-[#FFF0F2] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="accent" showDot size="md">
            Phase 07 — Contextual Support
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            07 — Understand what you can do next
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Turn your insights into sustainable lifestyle adjustments tailored to real daily life in Pakistan.
            No generic Western plans — just practical, evidence-informed habits for metabolic and endocrine balance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Nutrition */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE4F7] text-[#6E2D8B] flex items-center justify-center">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Regional Nutrition Pacing
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Practical carbohydrate timing with whole-grain roti, balanced daal portions, and protein-first meal sequencing to stabilize postprandial glucose.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E7DFEF] text-xs text-[#6E2D8B] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Insulin sensitivity support</span>
            </div>
          </div>

          {/* Activity */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF2F8] text-[#A21CAF] flex items-center justify-center">
                <Footprints className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Everyday Movement Pacing
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Low-stress walking routines (15–20 min post-meal walks) and low-impact resistance movement without triggering cortisol spikes.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E7DFEF] text-xs text-[#A21CAF] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sustainable activity pacing</span>
            </div>
          </div>

          {/* Wellbeing */}
          <div className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#E87084] flex items-center justify-center">
                <Moon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1C1326]">
                Sleep & Stress Harmony
              </h3>
              <p className="text-sm text-[#584B68] leading-relaxed">
                Bedtime wind-down routines and hydration pacing to modulate the hypothalamic-pituitary-adrenal (HPA) axis and support restorative sleep.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E7DFEF] text-xs text-[#E87084] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Circadian rhythm alignment</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
