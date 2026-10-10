import React from 'react';
import { InfoCircle } from '@untitledui/icons';

interface WhyWeAskCardProps {
  title?: string;
  description: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
}

export const WhyWeAskCard: React.FC<WhyWeAskCardProps> = ({
  title = 'Why we ask this',
  description,
  icon: Icon = InfoCircle,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#FFF8FA] border border-[#FDE6EF] shadow-2xs flex flex-col gap-2 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 text-[#F43F7D]">
        <div className="w-6 h-6 rounded-full bg-[#FDE6EF] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#F43F7D]" aria-hidden="true" />
        </div>
        <span className="text-[13px] sm:text-sm font-semibold tracking-tight text-[#BE185D]">{title}</span>
      </div>
      <p className="text-[13px] sm:text-sm text-[#64748B] font-sans leading-relaxed">
        {description}
      </p>
    </div>
  );
};
