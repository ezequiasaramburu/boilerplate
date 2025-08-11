import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { authenticatedRateLimit } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/index.js';
import {
  bulkUpdateNotificationsSchema,
  createNotificationSchema,
  notificationListRequestSchema,
} from '@my/types';

const router = Router();

// Apply authentication to all notification routes
router.use(authenticateToken);

// Apply rate limiting
router.use(authenticatedRateLimit);

// GET /api/v1/notifications - Get user's notifications with pagination/filtering
router.get(
  '/',
  validateRequest({ query: notificationListRequestSchema }),
  notificationController.getNotifications.bind(notificationController),
);

// GET /api/v1/notifications/stats - Get notification statistics
router.get(
  '/stats',
  notificationController.getNotificationStats.bind(notificationController),
);

// GET /api/v1/notifications/recent - Get recent notifications (for real-time)
router.get(
  '/recent',
  notificationController.getRecentNotifications.bind(notificationController),
);

// PATCH /api/v1/notifications/mark-all-read - Mark all notifications as read
router.patch(
  '/mark-all-read',
  notificationController.markAllAsRead.bind(notificationController),
);

// PATCH /api/v1/notifications/bulk - Bulk update notifications
router.patch(
  '/bulk',
  validateRequest({ body: bulkUpdateNotificationsSchema }),
  notificationController.bulkUpdate.bind(notificationController),
);

// DELETE /api/v1/notifications/bulk - Bulk delete notifications
router.delete(
  '/bulk',
  notificationController.bulkDelete.bind(notificationController),
);

// GET /api/v1/notifications/:id - Get single notification
router.get(
  '/:id',
  notificationController.getNotificationById.bind(notificationController),
);

// PATCH /api/v1/notifications/:id/read - Mark notification as read
router.patch(
  '/:id/read',
  notificationController.markAsRead.bind(notificationController),
);

// PATCH /api/v1/notifications/:id/unread - Mark notification as unread
router.patch(
  '/:id/unread',
  notificationController.markAsUnread.bind(notificationController),
);

// DELETE /api/v1/notifications/:id - Delete notification
router.delete(
  '/:id',
  notificationController.deleteNotification.bind(notificationController),
);

// Admin-only routes
// POST /api/v1/notifications - Create notification (admin only)
router.post(
  '/',
  requireAdmin,
  validateRequest({ body: createNotificationSchema }),
  notificationController.createNotification.bind(notificationController),
);

export { router as notificationRouter };
