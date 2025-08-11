'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { NotificationBadge } from './notification-badge';
import { NotificationFeed, type NotificationFeedProps } from './notification-feed';

export interface NotificationDropdownProps extends Omit<NotificationFeedProps, 'className'> {
  trigger?: React.ReactNode;
  unreadCount?: number;
  className?: string;
  dropdownClassName?: string;
  maxHeight?: string;
  placement?: 'left' | 'right' | 'center';
}

// Hook for handling dropdown open/close behavior
function useDropdownState(isOpen: boolean) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        return false;
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') return false;
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  return { dropdownRef, triggerRef };
}

// Default trigger button component
function DefaultTrigger({
  triggerRef,
  onClick,
  unreadCount,
  className,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  onClick: () => void;
  unreadCount: number;
  className?: string;
}) {
  return (
    <button
      ref={triggerRef}
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className,
      )}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <NotificationBadge count={unreadCount}>
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-3.5-3.5L15 17zM21 4a9 9 0 01-9 9 9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9zM3 17h5l-3.5-3.5L3 17z"
          />
        </svg>
      </NotificationBadge>
    </button>
  );
}

// Dropdown header component
function DropdownHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Notifications</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Dropdown footer component
function DropdownFooter({
  onClose,
  hasNotifications,
}: {
  onClose: () => void;
  hasNotifications: boolean;
}) {
  if (!hasNotifications) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <button
        onClick={() => {
          onClose();
          window.location.href = '/dashboard/notifications';
        }}
        className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        View all notifications
      </button>
    </div>
  );
}

const PLACEMENT_CLASSES = {
  left: 'right-0',
  right: 'right-0',
  center: 'left-1/2 transform -translate-x-1/2',
};

interface DropdownContentProps {
  dropdownRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  placement: 'left' | 'right' | 'center';
  dropdownClassName?: string;
  maxHeight: string;
  notifications: any[];
  loading?: boolean;
  error?: string | null;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  feedProps: any;
}

function DropdownContent(props: DropdownContentProps) {
  const {
    dropdownRef,
    onClose,
    placement,
    dropdownClassName,
    maxHeight,
    notifications,
    loading,
    error,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
    onMarkAllAsRead,
    feedProps,
  } = props;
  return (
    <>
      <div className="fixed inset-0 z-40" />
      <div
        ref={dropdownRef}
        className={cn(
          'absolute top-full mt-2 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg',
          'animate-in fade-in slide-in-from-top-2 duration-200',
          PLACEMENT_CLASSES[placement],
          dropdownClassName,
        )}
      >
        <DropdownHeader onClose={onClose} />
        <div className="overflow-y-auto p-4" style={{ maxHeight }}>
          <NotificationFeed
            notifications={notifications}
            loading={loading}
            error={error}
            onMarkAsRead={onMarkAsRead}
            onMarkAsUnread={onMarkAsUnread}
            onDelete={onDelete}
            onMarkAllAsRead={onMarkAllAsRead}
            emptyMessage="No notifications"
            emptyIcon="🔔"
            {...feedProps}
          />
        </div>
        <DropdownFooter onClose={onClose} hasNotifications={notifications.length > 0} />
      </div>
    </>
  );
}

export function NotificationDropdown(props: NotificationDropdownProps) {
  const {
    trigger,
    unreadCount = 0,
    notifications,
    loading,
    error,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
    onMarkAllAsRead,
    className,
    dropdownClassName,
    maxHeight = '400px',
    placement = 'right',
    ...feedProps
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const { dropdownRef, triggerRef } = useDropdownState(isOpen);

  return (
    <div className="relative">
      {trigger || (
        <DefaultTrigger
          triggerRef={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          unreadCount={unreadCount}
          className={className}
        />
      )}

      {isOpen && (
        <DropdownContent
          dropdownRef={dropdownRef}
          onClose={() => setIsOpen(false)}
          placement={placement}
          dropdownClassName={dropdownClassName}
          maxHeight={maxHeight}
          notifications={notifications}
          loading={loading}
          error={error}
          onMarkAsRead={onMarkAsRead}
          onMarkAsUnread={onMarkAsUnread}
          onDelete={onDelete}
          onMarkAllAsRead={onMarkAllAsRead}
          feedProps={feedProps}
        />
      )}
    </div>
  );
}
