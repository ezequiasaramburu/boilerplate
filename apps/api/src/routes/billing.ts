import { Router } from 'express';
import { billingController } from '../controllers/billing.controller.js';
import {
  authenticatedRateLimit,
  sensitiveRateLimit,
  validateRequest,
} from '../middleware/index.js';
import {
  createCheckoutSessionSchema,
  createPortalSessionSchema,
} from '@my/types';

const router = Router();

// Public routes
router.get('/plans',
  authenticatedRateLimit,
  billingController.getPlans.bind(billingController),
);

// Protected routes (require authentication)
router.post('/checkout',
  sensitiveRateLimit, // Strict rate limit on checkout creation
  validateRequest({ body: createCheckoutSessionSchema }),
  billingController.createCheckoutSession.bind(billingController),
);

router.post('/portal',
  sensitiveRateLimit, // Strict rate limit on portal access
  validateRequest({ body: createPortalSessionSchema }),
  billingController.createPortalSession.bind(billingController),
);

router.get('/subscription',
  authenticatedRateLimit,
  billingController.getSubscriptionUsage.bind(billingController),
);

router.post('/subscription/cancel',
  sensitiveRateLimit, // Very strict limit on cancellation
  billingController.cancelSubscription.bind(billingController),
);

router.post('/subscription/reactivate',
  sensitiveRateLimit, // Very strict limit on reactivation
  billingController.reactivateSubscription.bind(billingController),
);

export { router as billingRouter };
