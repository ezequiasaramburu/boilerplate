import { Router } from 'express';
import { billingController } from '../controllers/billing.controller.js';
import { authenticatedRateLimit } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Truly public plans route (no auth), with basic rate limiting
router.get(
  '/plans',
  authenticatedRateLimit,
  billingController.getPlans.bind(billingController),
);

export { router as publicBillingRouter };
