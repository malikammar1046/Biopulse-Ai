import React from 'react';
import { clsx } from 'clsx';
import { Badge, type BadgeVariant } from './Badge';

export interface SectionHeaderProps {
  eyebrow?: string;
  eyebrowVariant?: BadgeVariant;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  eyebrowVariant = 'primary',
  title,
  subtitle,
  align = 'center',
  className,
}) => {
  return (
    <div
      className={clsx(
        'max-w-3xl mb-12 sm:mb-16',
        align === 'center' && 'mx-auto text-center',
        align === 'left' && 'text-left',
        align === 'right' && 'ml-auto text-right',
        className
      )}
    >
      {eyebrow && (
        <div className="mb-3">
          <Badge variant={eyebrowVariant} showDot size="md">
            {eyebrow}
          </Badge>
        </div>
      )}

      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1326] mb-4 font-display">
        {title}
      </h2>

      {subtitle && (
        <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
