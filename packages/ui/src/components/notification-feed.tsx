'use client';

import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { NotificationItem, type NotificationItemProps } from './notification-item';

export interface NotificationFeedProps {
  notifications: Omit<
    NotificationItemProps,
    'onMarkAsRead' | 'onMarkAsUnread' | 'onDelete' | 'onClick'
  >[];
  loading?: boolean;
  error?: string | null;
  onMarkAsRead?: (id: string) => Promise<void> | void;
  onMarkAsUnread?: (id: string) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  onMarkAllAsRead?: () => Promise<void> | void;
  onLoadMore?: () => Promise<void> | void;
  hasMore?: boolean;
  className?: string;
  emptyMessage?: string;
  emptyIcon?: string;
}

// Helper for creating async handlers with loading state
function createAsyncHandler(
  setLoadingActions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  actionName: string,
) {
  return async (id: string, action: () => Promise<void> | void) => {
    setLoadingActions((prev) => ({ ...prev, [id]: true }));
    try {
      await action();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to ${actionName}:`, error);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [id]: false }));
    }
  };
}

// Hook for notification actions
function useNotificationActions(
  onMarkAsRead?: (id: string) => Promise<void> | void,
  onMarkAsUnread?: (id: string) => Promise<void> | void,
  onDelete?: (id: string) => Promise<void> | void,
  onMarkAllAsRead?: () => Promise<void> | void,
) {
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const createHandler = createAsyncHandler(setLoadingActions, '');

  const handleMarkAsRead = async (id: string) => {
    if (!onMarkAsRead) return;
    await createHandler(id, () => onMarkAsRead(id));
  };

  const handleMarkAsUnread = async (id: string) => {
    if (!onMarkAsUnread) return;
    await createHandler(id, () => onMarkAsUnread(id));
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    await createHandler(id, () => onDelete(id));
  };

  const handleMarkAllAsRead = async () => {
    if (!onMarkAllAsRead) return;
    setMarkingAllRead(true);
    try {
      await onMarkAllAsRead();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  return {
    loadingActions,
    markingAllRead,
    handleMarkAsRead,
    handleMarkAsUnread,
    handleDelete,
    handleMarkAllAsRead,
  };
}

// Feed header component
function FeedHeader({
  unreadCount,
  onMarkAllAsRead,
  markingAllRead,
}: {
  unreadCount: number;
  onMarkAllAsRead?: () => void;
  markingAllRead: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        {unreadCount > 0 ? (
          <span className="font-medium">{unreadCount} unread</span>
        ) : (
          <span>All caught up!</span>
        )}
      </div>
      {unreadCount > 0 && onMarkAllAsRead && (
        <button
          onClick={onMarkAllAsRead}
          disabled={markingAllRead}
          className={cn(
            'text-xs font-medium text-blue-600 hover:text-blue-800',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          {markingAllRead ? 'Marking...' : 'Mark all read'}
        </button>
      )}
    </div>
  );
}

// Empty state component
function EmptyState({ emptyIcon, emptyMessage }: { emptyIcon: string; emptyMessage: string }) {
  return (
    <div className="p-8 text-center text-gray-500">
      <div className="text-3xl mb-2">{emptyIcon}</div>
      <p className="text-sm">{emptyMessage}</p>
    </div>
  );
}

// Notification list component
function NotificationList({
  notifications,
  loadingActions,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
}: {
  notifications: any[];
  loadingActions: Record<string, boolean>;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="group relative">
          {loadingActions[notification.id] && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <NotificationItem
            {...notification}
            onMarkAsRead={onMarkAsRead}
            onMarkAsUnread={onMarkAsUnread}
            onDelete={onDelete}
            className={cn(loadingActions[notification.id] && 'pointer-events-none')}
          />
        </div>
      ))}
    </div>
  );
}

// Loading and load more component
function FeedFooter({
  loading,
  hasMore,
  onLoadMore,
}: {
  loading: boolean;
  hasMore: boolean;
  onLoadMore?: () => void;
}) {
  return (
    <>
      {loading && (
        <div className="p-6 text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
        </div>
      )}
      {hasMore && !loading && onLoadMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            className={cn(
              'px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800',
              'border border-blue-200 hover:border-blue-300 rounded-lg',
              'transition-colors duration-200',
            )}
          >
            Load more
          </button>
        </div>
      )}
    </>
  );
}

export function NotificationFeed(props: NotificationFeedProps) {
  const {
    notifications,
    loading = false,
    error = null,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
    onMarkAllAsRead,
    onLoadMore,
    hasMore = false,
    className,
    emptyMessage = 'No notifications yet',
    emptyIcon = '🔔',
  } = props;
  const {
    loadingActions,
    markingAllRead,
    handleMarkAsRead,
    handleMarkAsUnread,
    handleDelete,
    handleMarkAllAsRead,
  } = useNotificationActions(onMarkAsRead, onMarkAsUnread, onDelete, onMarkAllAsRead);
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (error)
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );

  return (
    <div className={cn('space-y-4', className)}>
      {notifications.length > 0 && (
        <FeedHeader
          unreadCount={unreadCount}
          onMarkAllAsRead={handleMarkAllAsRead}
          markingAllRead={markingAllRead}
        />
      )}
      {notifications.length === 0 && !loading ? (
        <EmptyState emptyIcon={emptyIcon} emptyMessage={emptyMessage} />
      ) : (
        <NotificationList
          notifications={notifications}
          loadingActions={loadingActions}
          onMarkAsRead={onMarkAsRead ? handleMarkAsRead : undefined}
          onMarkAsUnread={onMarkAsUnread ? handleMarkAsUnread : undefined}
          onDelete={onDelete ? handleDelete : undefined}
        />
      )}
      <FeedFooter loading={loading} hasMore={hasMore} onLoadMore={onLoadMore} />
    </div>
  );
}
