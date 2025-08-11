import { z } from 'zod';

// Enums matching Prisma schema
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  BILLING = 'BILLING',
  USAGE_ALERT = 'USAGE_ALERT',
  SECURITY = 'SECURITY',
  FEATURE = 'FEATURE',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Base notification interface
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  read: boolean;
  readAt?: Date | null;
  priority: NotificationPriority;
  category?: string | null;
  metadata?: Record<string, any> | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Create notification schema
export const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  actionUrl: z.string().url().optional(),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
  category: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
  expiresAt: z.date().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

// Update notification schema
export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
  readAt: z.date().optional(),
});

export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;

// Bulk update schema
export const bulkUpdateNotificationsSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
  read: z.boolean(),
});

export type BulkUpdateNotificationsInput = z.infer<typeof bulkUpdateNotificationsSchema>;

// Notification list request schema
export const notificationListRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  read: z.coerce.boolean().optional(),
  type: z.nativeEnum(NotificationType).optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
  category: z.string().optional(),
});

export type NotificationListRequest = z.infer<typeof notificationListRequestSchema>;

// Notification stats interface
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

// Paginated result
export interface PaginatedNotificationsResult {
  items: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: NotificationStats;
}

// Notification templates for common scenarios
export interface NotificationTemplate {
  type: NotificationType;
  priority: NotificationPriority;
  category: string;
  titleTemplate: string;
  messageTemplate: string;
  actionUrl?: string;
}

// Common notification templates
export const NOTIFICATION_TEMPLATES = {
  WELCOME: {
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.NORMAL,
    category: 'welcome',
    titleTemplate: 'Welcome to {{appName}}!',
    messageTemplate: 'Your account has been successfully created. Start exploring our features.',
  },
  SUBSCRIPTION_CREATED: {
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.HIGH,
    category: 'billing',
    titleTemplate: 'Subscription Activated',
    messageTemplate: 'Your {{planName}} subscription is now active. Thank you for subscribing!',
    actionUrl: '/dashboard/billing',
  },
  SUBSCRIPTION_CANCELLED: {
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    category: 'billing',
    titleTemplate: 'Subscription Cancelled',
    messageTemplate: 'Your subscription has been cancelled. You can reactivate it anytime.',
    actionUrl: '/dashboard/billing',
  },
  USAGE_THRESHOLD_WARNING: {
    type: NotificationType.WARNING,
    priority: NotificationPriority.HIGH,
    category: 'usage',
    titleTemplate: 'Usage Alert: {{threshold}}% Used',
    messageTemplate: 'You have used {{percentage}}% of your {{metricType}} quota for this billing period.',
    actionUrl: '/dashboard/usage',
  },
  USAGE_THRESHOLD_CRITICAL: {
    type: NotificationType.ERROR,
    priority: NotificationPriority.URGENT,
    category: 'usage',
    titleTemplate: 'Critical: {{threshold}}% Usage Reached',
    messageTemplate: 'You have reached {{percentage}}% of your {{metricType}} quota. Consider upgrading your plan.',
    actionUrl: '/dashboard/billing',
  },
  PAYMENT_FAILED: {
    type: NotificationType.ERROR,
    priority: NotificationPriority.URGENT,
    category: 'billing',
    titleTemplate: 'Payment Failed',
    messageTemplate: 'Your payment could not be processed. Please update your payment method.',
    actionUrl: '/dashboard/billing',
  },
  PAYMENT_SUCCESS: {
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.NORMAL,
    category: 'billing',
    titleTemplate: 'Payment Successful',
    messageTemplate: 'Your payment of {{amount}} has been processed successfully.',
    actionUrl: '/dashboard/billing',
  },
  PASSWORD_CHANGED: {
    type: NotificationType.SECURITY,
    priority: NotificationPriority.HIGH,
    category: 'security',
    titleTemplate: 'Password Changed',
    messageTemplate: 'Your password was successfully changed. If this wasn\'t you, please contact support.',
  },
  EMAIL_VERIFIED: {
    type: NotificationType.SUCCESS,
    priority: NotificationPriority.NORMAL,
    category: 'security',
    titleTemplate: 'Email Verified',
    messageTemplate: 'Your email address has been successfully verified.',
  },
} as const satisfies Record<string, NotificationTemplate>;

export type NotificationTemplateKey = keyof typeof NOTIFICATION_TEMPLATES;