import React from 'react';
import { Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface WhyWeAskCardProps {
  title?: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
}

export const WhyWeAskCard: React.FC<WhyWeAskCardProps> = ({
  title = 'Why we ask this',
  description,
  icon: Icon = Lightbulb,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#FFF5F8] border border-[#FCE7F3] shadow-2xs flex flex-col gap-2 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 text-[#F43F7D]">
        <div className="w-6 h-6 rounded-full bg-[#FDE6EF] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#F43F7D]" />
        </div>
        <span className="text-xs font-bold tracking-tight text-[#073B72]">{title}</span>
      </div>
      <p className="text-[11px] sm:text-xs text-[#55718F] font-sans leading-relaxed">
        {description}
      </p>
    </div>
  );
};
