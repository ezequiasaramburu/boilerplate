'use client';

import React from 'react';
import { cn } from '../lib/utils';

export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  type:
    | 'INFO'
    | 'SUCCESS'
    | 'WARNING'
    | 'ERROR'
    | 'BILLING'
    | 'USAGE_ALERT'
    | 'SECURITY'
    | 'FEATURE'
    | 'SYSTEM';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  read: boolean;
  createdAt: Date;
  actionUrl?: string | null;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  className?: string;
}

const typeStyles = {
  INFO: 'bg-blue-50 border-blue-200 text-blue-900',
  SUCCESS: 'bg-green-50 border-green-200 text-green-900',
  WARNING: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  ERROR: 'bg-red-50 border-red-200 text-red-900',
  BILLING: 'bg-purple-50 border-purple-200 text-purple-900',
  USAGE_ALERT: 'bg-orange-50 border-orange-200 text-orange-900',
  SECURITY: 'bg-red-50 border-red-200 text-red-900',
  FEATURE: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  SYSTEM: 'bg-gray-50 border-gray-200 text-gray-900',
};

const typeIcons = {
  INFO: '💡',
  SUCCESS: '✅',
  WARNING: '⚠️',
  ERROR: '❌',
  BILLING: '💳',
  USAGE_ALERT: '📊',
  SECURITY: '🔒',
  FEATURE: '🎉',
  SYSTEM: '⚙️',
};

const priorityIndicators = {
  LOW: '',
  NORMAL: '',
  HIGH: 'border-l-4 border-l-yellow-500',
  URGENT: 'border-l-4 border-l-red-500',
};

export function NotificationItem({
  id,
  title,
  message,
  type,
  priority,
  read,
  createdAt,
  actionUrl,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onClick,
  className,
}: NotificationItemProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    } else if (actionUrl) {
      window.open(actionUrl, '_blank');
    }

    // Auto-mark as read when clicked
    if (!read && onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  return (
    <div
      className={cn(
        'relative p-4 border rounded-lg transition-all duration-200',
        'hover:shadow-md cursor-pointer',
        typeStyles[type],
        priorityIndicators[priority],
        read ? 'opacity-75' : 'opacity-100',
        !read && 'ring-1 ring-blue-200',
        className,
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!read && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />}

      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className="text-lg flex-shrink-0 mt-0.5">{typeIcons[type]}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn('font-medium text-sm leading-tight', !read && 'font-semibold')}>
              {title}
            </h4>
            <time className="text-xs opacity-70 flex-shrink-0">{formatTime(createdAt)}</time>
          </div>

          <p className="text-sm opacity-80 mt-1 leading-relaxed">{message}</p>

          {/* Priority indicator */}
          {(priority === 'HIGH' || priority === 'URGENT') && (
            <div
              className={cn(
                'inline-block px-2 py-0.5 text-xs font-medium rounded mt-2',
                priority === 'HIGH' && 'bg-yellow-100 text-yellow-800',
                priority === 'URGENT' && 'bg-red-100 text-red-800',
              )}
            >
              {priority}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {!read && onMarkAsRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(id);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark read
          </button>
        )}

        {read && onMarkAsUnread && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsUnread(id);
            }}
            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
          >
            Mark unread
          </button>
        )}

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
