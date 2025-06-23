import { Router } from 'express'
import { webhookAdminController } from '../controllers/webhook-admin.controller.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js'

const router = Router()

// All webhook admin routes require admin authentication
router.use(authenticateToken, requireAdmin)

// Webhook monitoring and statistics
router.get('/stats', webhookAdminController.getWebhookStats)
router.get('/health', webhookAdminController.getWebhookHealth)
router.get('/events', webhookAdminController.getRecentWebhookEvents)
router.get('/events/failed', webhookAdminController.getFailedWebhookEvents)
router.get('/events/summary', webhookAdminController.getEventTypesSummary)

// Individual webhook event management
router.get('/events/:eventId', webhookAdminController.getWebhookEventDetails)
router.post('/events/:eventId/retry', webhookAdminController.retryWebhookEvent)

// Maintenance operations
router.delete('/events/cleanup', webhookAdminController.cleanupOldEvents)

export default router 