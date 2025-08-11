'use client';

import React from 'react';
import { cn } from '../lib/utils';

interface NotificationBadgeProps {
  count: number;
  maxDisplay?: number;
  className?: string;
  children?: React.ReactNode;
}

export function NotificationBadge({
  count,
  maxDisplay = 99,
  className,
  children,
}: NotificationBadgeProps) {
  const displayCount = count > maxDisplay ? `${maxDisplay}+` : count.toString();
  const shouldShow = count > 0;

  return (
    <div className="relative inline-flex">
      {children}
      {shouldShow && (
        <span
          className={cn(
            'absolute -top-2 -right-2 flex items-center justify-center',
            'h-5 min-w-[1.25rem] px-1 text-xs font-medium text-white',
            'bg-red-500 rounded-full border-2 border-white',
            'animate-in fade-in zoom-in duration-200',
            className,
          )}
        >
          {displayCount}
        </span>
      )}
    </div>
  );
}
