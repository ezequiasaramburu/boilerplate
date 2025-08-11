import type { NextFunction, Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import type {
  ApiResponse,
  BulkUpdateNotificationsInput,
  CreateNotificationInput,
  NotificationListRequest,
} from '@my/types';

export class NotificationController {
  /**
   * Get notifications for the authenticated user
   * GET /api/v1/notifications
   */
  async getNotifications(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const filters = req.query as unknown as NotificationListRequest;

      const result = await notificationService.getUserNotifications(userId, filters);

      const response: ApiResponse = {
        success: true,
        message: 'Notifications retrieved successfully',
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification statistics for the authenticated user
   * GET /api/v1/notifications/stats
   */
  async getNotificationStats(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const stats = await notificationService.getNotificationStats(userId);

      const response: ApiResponse = {
        success: true,
        message: 'Notification stats retrieved successfully',
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single notification by ID
   * GET /api/v1/notifications/:id
   */
  async getNotificationById(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await notificationService.getNotificationById(id, userId);

      if (!notification) {
        res.status(404).json({
          success: false,
          message: 'Notification not found',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Notification retrieved successfully',
        data: notification,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  async markAsRead(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Notification marked as read',
        data: notification,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as unread
   * PATCH /api/v1/notifications/:id/unread
   */
  async markAsUnread(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const notification = await notificationService.markAsUnread(id, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Notification marked as unread',
        data: notification,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk update notifications (mark multiple as read/unread)
   * PATCH /api/v1/notifications/bulk
   */
  async bulkUpdate(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const data = req.body as BulkUpdateNotificationsInput;

      const result = await notificationService.bulkUpdateNotifications(data, userId);

      const response: ApiResponse = {
        success: true,
        message: `${result.count} notifications updated successfully`,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/mark-all-read
   */
  async markAllAsRead(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(userId);

      const response: ApiResponse = {
        success: true,
        message: `${result.count} notifications marked as read`,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * DELETE /api/v1/notifications/:id
   */
  async deleteNotification(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);

      const response: ApiResponse = {
        success: true,
        message: 'Notification deleted successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete multiple notifications
   * DELETE /api/v1/notifications/bulk
   */
  async bulkDelete(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { notificationIds } = req.body;

      if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'notificationIds must be a non-empty array',
        });
        return;
      }

      const result = await notificationService.bulkDeleteNotifications(notificationIds, userId);

      const response: ApiResponse = {
        success: true,
        message: `${result.count} notifications deleted successfully`,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent notifications (for real-time updates)
   * GET /api/v1/notifications/recent
   */
  async getRecentNotifications(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 5;
      const since = req.query.since ? new Date(req.query.since as string) : undefined;

      const notifications = await notificationService.getRecentNotifications(userId, limit, since);

      const response: ApiResponse = {
        success: true,
        message: 'Recent notifications retrieved successfully',
        data: notifications,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a notification (admin only)
   * POST /api/v1/notifications
   */
  async createNotification(
    req: Request & { user?: any },
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = req.body as CreateNotificationInput;
      const notification = await notificationService.createNotification(data);

      const response: ApiResponse = {
        success: true,
        message: 'Notification created successfully',
        data: notification,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
