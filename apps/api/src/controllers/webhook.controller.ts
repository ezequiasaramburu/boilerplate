import type { NextFunction, Request, Response } from 'express';
import { webhookService } from '../services/webhook.service.js';

export class WebhookController {
  // Handle Stripe webhooks
  async handleStripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      if (!signature) {
        res.status(400).json({
          success: false,
          message: 'Missing Stripe signature',
          error: 'MISSING_SIGNATURE',
        });
        return;
      }

      await webhookService.processStripeWebhook(payload, signature);

      // Return 200 to acknowledge receipt
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error) {
      console.error('Webhook error:', error);

      // Return 400 for webhook errors to let Stripe know to retry
      res.status(400).json({
        success: false,
        message: 'Webhook processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const webhookController = new WebhookController();
