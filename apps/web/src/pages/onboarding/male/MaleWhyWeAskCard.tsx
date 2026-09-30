import React from 'react';
import { InfoCircle } from '@untitledui/icons';

interface MaleWhyWeAskCardProps {
  title?: string;
  description: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
}

export const MaleWhyWeAskCard: React.FC<MaleWhyWeAskCardProps> = ({
  title = 'Why we ask this',
  description,
  icon: Icon = InfoCircle,
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#F0FDFE] border border-[#CCFBF1] shadow-2xs flex flex-col gap-2 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 text-[#0E9EAA]">
        <div className="w-6 h-6 rounded-full bg-[#DDF7F7] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#0E9EAA]" aria-hidden="true" />
        </div>
        <span className="text-[13px] sm:text-sm font-semibold tracking-tight text-[#073B72]">{title}</span>
      </div>
      <p className="text-[13px] sm:text-sm text-[#55718F] font-sans leading-relaxed">
        {description}
      </p>
    </div>
  );
};
