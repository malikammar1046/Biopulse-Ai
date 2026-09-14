import React from 'react';
import {
  Sparkles,
  Zap,
  Heart,
  Moon,
  Smile,
  Dumbbell,
  Activity,
  Check,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MensHealthProfile } from '../../../types/onboarding';
import { MaleWhyWeAskCard } from './MaleWhyWeAskCard';

interface MaleStep3Props {
  data: MensHealthProfile;
  onChange: (profile: MensHealthProfile) => void;
}

interface SymptomCardDef {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  check: (m: MensHealthProfile) => boolean;
  toggle: (m: MensHealthProfile) => MensHealthProfile;
}

export const MaleStep3SymptomsADAM: React.FC<MaleStep3Props> = ({ data, onChange }) => {
  const cards: SymptomCardDef[] = [
    {
      id: 'libido',
      title: 'Reduced Sex Drive & Desire',
      desc: 'Noticeable drop in sexual interest or libido compared to your normal baseline.',
      icon: Heart,
      check: (m) => m.sexDrive === 'reduced' || m.sexDrive === 'significantly_reduced',
      toggle: (m) => ({
        ...m,
        sexDrive: m.sexDrive === 'reduced' || m.sexDrive === 'significantly_reduced' ? 'normal' : 'reduced',
      }),
    },
    {
      id: 'energy',
      title: 'Low Energy & Daytime Fatigue',
      desc: 'Frequent tiredness, sluggishness, or a persistent lack of stamina during daily tasks.',
      icon: Zap,
      check: (m) => m.energyLevel === 'low' || m.energyLevel === 'very_low',
      toggle: (m) => ({
        ...m,
        energyLevel: m.energyLevel === 'low' || m.energyLevel === 'very_low' ? 'moderate' : 'low',
      }),
    },
    {
      id: 'sleep',
      title: 'Sleep Disruption & Evening Fatigue',
      desc: 'Restless nights, waking unrefreshed, or falling asleep unusually early after dinner.',
      icon: Moon,
      check: (m) => m.sleepQuality === 'poor' || m.sleepQuality === 'frequently_waking',
      toggle: (m) => ({
        ...m,
        sleepQuality: m.sleepQuality === 'poor' || m.sleepQuality === 'frequently_waking' ? 'restful' : 'poor',
      }),
    },
    {
      id: 'strength',
      title: 'Drop in Strength or Endurance',
      desc: 'Noticeable reduction in physical strength, muscle fullness, or exercise performance.',
      icon: Dumbbell,
      check: (m) => m.muscleStrengthChanges === 'reduced' || m.muscleStrengthChanges === 'significantly_reduced',
      toggle: (m) => ({
        ...m,
        muscleStrengthChanges:
          m.muscleStrengthChanges === 'reduced' || m.muscleStrengthChanges === 'significantly_reduced'
            ? 'stable'
            : 'reduced',
      }),
    },
    {
      id: 'firmness',
      title: 'Morning / Spontaneous Firmness Dips',
      desc: 'Inconsistent, less frequent, or weaker morning and spontaneous firmness.',
      icon: Activity,
      check: (m) => m.erectileDifficulties === 'occasional' || m.erectileDifficulties === 'frequent',
      toggle: (m) => ({
        ...m,
        erectileDifficulties:
          m.erectileDifficulties === 'occasional' || m.erectileDifficulties === 'frequent'
            ? 'none'
            : 'occasional',
      }),
    },
    {
      id: 'mood',
      title: 'Mood Shifts & Lower Motivation',
      desc: 'Feeling less drive, increased irritability, grumpiness, or dips in mental focus.',
      icon: Smile,
      check: (m) => (m.moodChanges || []).length > 0,
      toggle: (m) => ({
        ...m,
        moodChanges:
          (m.moodChanges || []).length > 0
            ? []
            : ['Low Morning Motivation', 'Irritability or Mood Shifts', 'Brain Fog / Focus Dips'],
      }),
    },
    {
      id: 'hair',
      title: 'Facial or Body Hair Thinning',
      desc: 'Gradual thinning or slowing growth in beard density or body hair patterns.',
      icon: Sparkles,
      check: (m) => m.bodyHairChanges === 'thinning' || m.bodyHairChanges === 'reduced_growth',
      toggle: (m) => ({
        ...m,
        bodyHairChanges:
          m.bodyHairChanges === 'thinning' || m.bodyHairChanges === 'reduced_growth'
            ? 'no_change'
            : 'thinning',
      }),
    },
  ];

  const anySelected = cards.some((c) => c.check(data));

  const handleSelectNone = () => {
    onChange({
      ...data,
      sexDrive: 'normal',
      energyLevel: 'moderate',
      sleepQuality: 'restful',
      muscleStrengthChanges: 'stable',
      erectileDifficulties: 'none',
      moodChanges: [],
      bodyHairChanges: 'no_change',
    });
  };

  return (
    <div className="space-y-4 text-left">
      {/* ── Compact Question Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#DDF7F7] flex items-center justify-center shrink-0 shadow-2xs">
          <Zap className="w-5 h-5 text-[#0E9EAA]" />
        </div>

        <div>
          <span className="text-[10px] font-bold font-mono text-[#0E9EAA] uppercase tracking-wider block leading-none">
            Vitality & Symptoms (ADAM)
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-[#073B72] tracking-tight leading-tight mt-0.5">
            Tell us what you have noticed
          </h2>
          <p className="text-xs text-[#55718F] font-sans leading-tight mt-0.5">
            Select any vitality or physical changes you have experienced. These map directly to clinical ADAM hypogonadism criteria.
          </p>
        </div>
      </div>

      {/* ── Main Form Layout: Fields + Why We Ask Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Symptoms Cards Grid Column */}
        <div className="lg:col-span-8 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cards.map((card) => {
              const isSelected = card.check(data);
              const IconComp = card.icon;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onChange(card.toggle(data))}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#EAFBFC] border-[#0E9EAA] shadow-2xs ring-1 ring-[#0E9EAA]/40'
                      : 'bg-white border-[#D7EAF2] hover:border-[#0E9EAA]/40 hover:bg-[#F5FBFD]/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#0E9EAA] text-white'
                          : 'bg-[#FAFCFF] border border-[#D7EAF2] text-[#0E9EAA]'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#073B72] block leading-tight">
                        {card.title}
                      </span>
                      <span className="text-[10px] text-[#55718F] leading-snug mt-0.5 block">
                        {card.desc}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? 'bg-[#0E9EAA] border-[#0E9EAA] text-white'
                        : 'border-[#D7EAF2] bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}

            {/* "None of these symptoms" Option */}
            <button
              type="button"
              onClick={handleSelectNone}
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 sm:col-span-2 ${
                !anySelected
                  ? 'bg-[#EAFBFC] border-[#0E9EAA] shadow-2xs ring-1 ring-[#0E9EAA]/40'
                  : 'bg-white border-[#D7EAF2] hover:border-[#0E9EAA]/40 hover:bg-[#F5FBFD]/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    !anySelected
                      ? 'bg-[#0E9EAA] text-white'
                      : 'bg-[#FAFCFF] border border-[#D7EAF2] text-[#0E9EAA]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#073B72] block leading-tight">
                    No significant symptoms noticed
                  </span>
                  <span className="text-[10px] text-[#55718F] leading-snug mt-0.5 block">
                    I currently feel energetic with normal stamina, focus, and healthy baseline vitality.
                  </span>
                </div>
              </div>

              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                  !anySelected
                    ? 'bg-[#0E9EAA] border-[#0E9EAA] text-white'
                    : 'border-[#D7EAF2] bg-white'
                }`}
              >
                {!anySelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>

        {/* Contextual Helper Card Column */}
        <div className="lg:col-span-4 space-y-3">
          <MaleWhyWeAskCard
            title="Why we ask this"
            description="Male hypogonadism can affect energy, mood, sexual health, and physical performance. Looking at these patterns alongside your health profile helps provide a more informed screening estimate."
            icon={Info}
          />

          <div className="p-3.5 rounded-2xl bg-[#FAFCFF] border border-[#D7EAF2] text-[11px] text-[#55718F] space-y-1.5">
            <span className="font-bold text-[#073B72] block">Clinical Perspective:</span>
            <p>
              In clinical guidelines (Androgen Deficiency in Aging Males questionnaire), loss of libido and reduced morning vigor are among the strongest subjective neurobehavioral cues of androgen insufficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
