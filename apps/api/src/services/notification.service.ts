import { prisma } from '@my/database';
import type { 
  Notification,
  CreateNotificationInput,
  UpdateNotificationInput,
  BulkUpdateNotificationsInput,
  NotificationListRequest,
  PaginatedNotificationsResult,
  NotificationStats,
  NotificationType,
  NotificationPriority,
  NOTIFICATION_TEMPLATES,
  NotificationTemplateKey,
} from '@my/types';

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationInput): Promise<Notification> {
    return prisma.notification.create({
      data,
    });
  }

  /**
   * Create notification from template
   */
  async createFromTemplate(
    templateKey: NotificationTemplateKey,
    userId: string,
    variables: Record<string, string> = {},
    overrides: Partial<CreateNotificationInput> = {}
  ): Promise<Notification> {
    const template = NOTIFICATION_TEMPLATES[templateKey];
    
    // Replace template variables
    const title = this.replaceTemplateVariables(template.titleTemplate, variables);
    const message = this.replaceTemplateVariables(template.messageTemplate, variables);
    
    const notificationData: CreateNotificationInput = {
      userId,
      type: template.type,
      title,
      message,
      priority: template.priority,
      category: template.category,
      actionUrl: template.actionUrl,
      ...overrides, // Allow overriding any field
    };

    return this.createNotification(notificationData);
  }

  /**
   * Get notifications for a user with pagination and filters
   */
  async getUserNotifications(
    userId: string,
    filters: NotificationListRequest
  ): Promise<PaginatedNotificationsResult> {
    const {
      page,
      limit,
      read,
      type,
      priority,
      category,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId,
      // Filter out expired notifications
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (read !== undefined) {
      where.read = read;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    // Execute queries in parallel
    const [notifications, total, stats] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' }, // High priority first
          { createdAt: 'desc' }, // Then newest first
        ],
      }),
      prisma.notification.count({ where }),
      this.getNotificationStats(userId),
    ]);

    return {
      items: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const where = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    const [total, unread, byType, byPriority] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, read: false } }),
      prisma.notification.groupBy({
        by: ['type'],
        where,
        _count: { _all: true },
      }),
      prisma.notification.groupBy({
        by: ['priority'],
        where,
        _count: { _all: true },
      }),
    ]);

    // Convert arrays to record objects
    const typeStats = Object.values(NotificationType).reduce((acc, type) => {
      acc[type] = byType.find(item => item.type === type)?._count._all || 0;
      return acc;
    }, {} as Record<NotificationType, number>);

    const priorityStats = Object.values(NotificationPriority).reduce((acc, priority) => {
      acc[priority] = byPriority.find(item => item.priority === priority)?._count._all || 0;
      return acc;
    }, {} as Record<NotificationPriority, number>);

    return {
      total,
      unread,
      byType: typeStats,
      byPriority: priorityStats,
    };
  }

  /**
   * Get a single notification by ID (must belong to user)
   */
  async getNotificationById(id: string, userId: string): Promise<Notification | null> {
    return prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(id: string, userId: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: {
        read: false,
        readAt: null,
      },
    });
  }

  /**
   * Bulk update notifications (mark multiple as read/unread)
   */
  async bulkUpdateNotifications(
    data: BulkUpdateNotificationsInput,
    userId: string
  ): Promise<{ count: number }> {
    const updateData: any = {
      read: data.read,
    };

    if (data.read) {
      updateData.readAt = new Date();
    } else {
      updateData.readAt = null;
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: { in: data.notificationIds },
        userId, // Ensure user can only update their own notifications
      },
      data: updateData,
    });

    return { count: result.count };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string, userId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: {
        id,
        userId, // Ensure user can only delete their own notifications
      },
    });
  }

  /**
   * Delete multiple notifications
   */
  async bulkDeleteNotifications(
    notificationIds: string[],
    userId: string
  ): Promise<{ count: number }> {
    const result = await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
    });

    return { count: result.count };
  }

  /**
   * Clean up expired notifications (for scheduled jobs)
   */
  async cleanupExpiredNotifications(): Promise<{ count: number }> {
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return { count: result.count };
  }

  /**
   * Get recent notifications for a user (for real-time updates)
   */
  async getRecentNotifications(
    userId: string,
    limit: number = 5,
    since?: Date
  ): Promise<Notification[]> {
    const where: any = {
      userId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (since) {
      where.createdAt = { gt: since };
    }

    return prisma.notification.findMany({
      where,
      take: limit,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Replace template variables in strings
   */
  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}

export const notificationService = new NotificationService();