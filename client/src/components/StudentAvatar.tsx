import React, { useState, useEffect } from 'react';
import { formatImageUrl } from '../utils/formatImageUrl';

interface StudentAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function StudentAvatar({ name, photoUrl, size = 'md', className = '' }: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const getInitials = (fullName: string) => {
    if (!fullName) return 'ST';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-20 h-20 text-xl font-extrabold',
  };

  const hasPhoto = photoUrl && photoUrl.trim().length > 0 && !imageError;

  if (hasPhoto) {
    return (
      <img
        src={formatImageUrl(photoUrl)}
        alt={name}
        onError={() => setImageError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover border border-primary/30 shadow-xs flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold glow-primary flex-shrink-0 select-none ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
