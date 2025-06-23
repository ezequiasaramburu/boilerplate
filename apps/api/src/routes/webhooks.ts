import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller.js';

const router = Router();

// Stripe webhook endpoint - must be raw body
router.post('/stripe',
  webhookController.handleStripeWebhook.bind(webhookController),
);

export { router as webhookRouter };
