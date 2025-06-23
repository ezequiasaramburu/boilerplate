import { Request, Response } from 'express'
import { webhookService } from '../services/webhook.service.js'
import { prisma } from '@my/database'

class WebhookAdminController {
  // Get webhook processing statistics
  async getWebhookStats(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7
      const stats = await webhookService.getWebhookStats(days)
      
      res.json({
        success: true,
        data: stats,
        period: `${days} days`,
      })
    } catch (error) {
      console.error('Error fetching webhook stats:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch webhook statistics',
      })
    }
  }

  // Get recent webhook events with optional filtering
  async getRecentWebhookEvents(req: Request, res: Response): Promise<void> {
    try {
      const {
        limit = '50',
        eventType,
        processed,
        hasError,
      } = req.query

      const where: any = {}
      
      if (eventType) {
        where.eventType = eventType as string
      }
      
      if (processed !== undefined) {
        where.processed = processed === 'true'
      }
      
      if (hasError !== undefined) {
        if (hasError === 'true') {
          where.processingError = { not: null }
        } else {
          where.processingError = null
        }
      }

      const events = await prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        select: {
          id: true,
          stripeEventId: true,
          eventType: true,
          processed: true,
          processingError: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      res.json({
        success: true,
        data: events,
        total: events.length,
      })
    } catch (error) {
      console.error('Error fetching webhook events:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch webhook events',
      })
    }
  }

  // Get failed webhook events that need attention
  async getFailedWebhookEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20

      const failedEvents = await prisma.webhookEvent.findMany({
        where: {
          OR: [
            { processed: false },
            { processingError: { not: null } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })

      res.json({
        success: true,
        data: failedEvents,
        total: failedEvents.length,
      })
    } catch (error) {
      console.error('Error fetching failed webhook events:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch failed webhook events',
      })
    }
  }

  // Retry a specific webhook event
  async retryWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params

      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: { id: eventId },
      })

      if (!webhookEvent) {
        res.status(404).json({
          success: false,
          error: 'Webhook event not found',
        })
        return
      }

      if (webhookEvent.processed) {
        res.status(400).json({
          success: false,
          error: 'Webhook event already processed',
        })
        return
      }

      // Clear previous error and retry
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          processingError: null,
          processed: false,
        },
      })

      // Here you would trigger a reprocessing of the webhook
      // For now, we'll just mark it as ready for retry
      res.json({
        success: true,
        message: 'Webhook event marked for retry',
        eventId,
      })
    } catch (error) {
      console.error('Error retrying webhook event:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to retry webhook event',
      })
    }
  }

  // Get webhook event details
  async getWebhookEventDetails(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params

      const webhookEvent = await prisma.webhookEvent.findUnique({
        where: { id: eventId },
      })

      if (!webhookEvent) {
        res.status(404).json({
          success: false,
          error: 'Webhook event not found',
        })
        return
      }

      res.json({
        success: true,
        data: webhookEvent,
      })
    } catch (error) {
      console.error('Error fetching webhook event details:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch webhook event details',
      })
    }
  }

  // Clean up old webhook events
  async cleanupOldEvents(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30
      const deletedCount = await webhookService.cleanupOldWebhookEvents(days)

      res.json({
        success: true,
        message: `Cleaned up ${deletedCount} old webhook events`,
        deletedCount,
        olderThanDays: days,
      })
    } catch (error) {
      console.error('Error cleaning up webhook events:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup webhook events',
      })
    }
  }

  // Get webhook event types summary
  async getEventTypesSummary(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7
      const since = new Date()
      since.setDate(since.getDate() - days)

      const eventSummary = await prisma.webhookEvent.groupBy({
        by: ['eventType'],
        where: {
          createdAt: { gte: since },
        },
        _count: {
          eventType: true,
        },
        _sum: {
          processed: true,
        },
      })

      const summary = eventSummary.map(item => ({
        eventType: item.eventType,
        totalCount: item._count.eventType,
        processedCount: item._sum.processed || 0,
        failedCount: item._count.eventType - (item._sum.processed || 0),
        successRate: Math.round(((item._sum.processed || 0) / item._count.eventType) * 100),
      }))

      res.json({
        success: true,
        data: summary,
        period: `${days} days`,
      })
    } catch (error) {
      console.error('Error fetching event types summary:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch event types summary',
      })
    }
  }

  // Get webhook processing health status
  async getWebhookHealth(req: Request, res: Response): Promise<void> {
    try {
      const recentEvents = await prisma.webhookEvent.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        select: {
          processed: true,
          processingError: true,
        },
      })

      const totalRecent = recentEvents.length
      const processedRecent = recentEvents.filter(e => e.processed).length
      const failedRecent = recentEvents.filter(e => e.processingError).length

      const healthStatus = {
        status: failedRecent / totalRecent > 0.1 ? 'unhealthy' : 'healthy', // More than 10% failure rate
        totalEventsLastHour: totalRecent,
        processedEventsLastHour: processedRecent,
        failedEventsLastHour: failedRecent,
        successRateLastHour: totalRecent > 0 ? Math.round((processedRecent / totalRecent) * 100) : 100,
        lastEventProcessed: recentEvents.length > 0 ? new Date().toISOString() : null,
      }

      res.json({
        success: true,
        data: healthStatus,
      })
    } catch (error) {
      console.error('Error checking webhook health:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to check webhook health',
      })
    }
  }
}

export const webhookAdminController = new WebhookAdminController() 