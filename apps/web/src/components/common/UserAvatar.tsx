import React, { useState, useEffect } from 'react';
import type { HealthPathway, UserGender } from '../../types/onboarding';

export type UserAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  size?: UserAvatarSize;
  pathway?: HealthPathway;
  gender?: UserGender;
  className?: string;
  showBorder?: boolean;
  alt?: string;
}

const SIZE_CONFIG: Record<
  UserAvatarSize,
  {
    container: string;
    text: string;
    iconSize?: string;
  }
> = {
  xs: {
    container: 'w-6 h-6',
    text: 'text-[10px]',
  },
  sm: {
    container: 'w-7 h-7',
    text: 'text-[11px]',
  },
  md: {
    container: 'w-9 h-9',
    text: 'text-xs',
  },
  lg: {
    container: 'w-11 h-11',
    text: 'text-sm',
  },
  xl: {
    container: 'w-24 h-24 sm:w-28 sm:h-28',
    text: 'text-2xl sm:text-3xl',
  },
  '2xl': {
    container: 'w-28 h-28 sm:w-32 sm:h-32',
    text: 'text-3xl sm:text-4xl',
  },
};

/**
 * Extracts clean 1-2 character uppercase initials from a user's full name or email.
 * e.g., "Ammar Arshad" -> "AA", "Sarah Connor" -> "SC", "John" -> "J", "ammar@example.com" -> "A"
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length >= 2) {
      const first = parts[0].charAt(0).toUpperCase();
      const last = parts[parts.length - 1].charAt(0).toUpperCase();
      return `${first}${last}`;
    }
  }

  if (email && email.trim()) {
    const cleanEmail = email.trim();
    const username = cleanEmail.split('@')[0];
    if (username) {
      return username.charAt(0).toUpperCase();
    }
  }

  return 'U';
}

export const DEFAULT_AVATAR_URL = '/avatars/avatar-default.svg';

/**
 * Canonical unified UserAvatar component across BioPulse AI.
 * Handles images with object-cover, responsive size presets, pathway styling,
 * neutral default avatar when none is provided, and graceful fallback to initials.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  email,
  size = 'md',
  pathway,
  gender,
  className = '',
  showBorder = true,
  alt,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Reset failure state whenever avatarUrl prop updates
  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const sizeCfg = SIZE_CONFIG[size] || SIZE_CONFIG.md;

  const isMale =
    pathway === 'male' ||
    gender === 'male' ||
    (typeof pathway === 'string' && pathway.toLowerCase().includes('male'));

  const initials = getInitials(name, email);
  const resolvedAlt = alt || name || email || 'User Avatar';

  // Determine active avatar source: user's custom photo/avatar or neutral default avatar
  const hasUserCustomAvatar = Boolean(avatarUrl && avatarUrl.trim());
  const activeImageSrc = hasUserCustomAvatar ? avatarUrl! : DEFAULT_AVATAR_URL;
  const showImage = !imageFailed;

  // Background styling for initials fallback
  const fallbackBgClass = isMale
    ? 'bg-gradient-to-br from-[#0284C7] to-[#0891B2] text-white shadow-xs'
    : 'bg-gradient-to-br from-[#F43F7D] to-[#E11D48] text-white shadow-xs';

  const borderClass = showBorder
    ? isMale
      ? 'border border-[#BAE6FD]/80 ring-1 ring-[#0284C7]/15'
      : 'border border-[#FBCFE8]/80 ring-1 ring-[#E11D48]/15'
    : '';

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center select-none ${
        sizeCfg.container
      } ${showImage ? 'bg-slate-100' : fallbackBgClass} ${borderClass} ${className}`}
      data-testid="user-avatar"
    >
      {showImage ? (
        <img
          src={activeImageSrc}
          alt={resolvedAlt}
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
        />
      ) : (
        <span
          className={`font-mono font-bold tracking-tight uppercase ${sizeCfg.text}`}
          aria-hidden="true"
        >
          {initials}
        </span>
      )}
    </div>
  );
};

export default UserAvatar;
