import { Router } from 'express';
import { usageController } from '../controllers/usage.controller.js';
import {
  authenticatedRateLimit,
  sensitiveRateLimit,
  validateRequest,
} from '../middleware/index.js';
import {
  acknowledgeAlertSchema,
  recordUsageSchema,
  usageReportSchema,
} from '@my/types';

const router = Router();

// All usage routes require authentication
// Usage recording - stricter rate limit since it affects billing
router.post('/record',
  sensitiveRateLimit, // Higher rate limit for usage recording
  validateRequest({ body: recordUsageSchema }),
  usageController.recordUsage.bind(usageController),
);

// Get current usage statistics
router.get('/current',
  authenticatedRateLimit,
  usageController.getCurrentUsage.bind(usageController),
);

// Generate usage report
router.get('/report',
  authenticatedRateLimit,
  validateRequest({ query: usageReportSchema }),
  usageController.generateReport.bind(usageController),
);

// Get usage alerts
router.get('/alerts',
  authenticatedRateLimit,
  usageController.getAlerts.bind(usageController),
);

// Acknowledge alerts
router.post('/alerts/acknowledge',
  authenticatedRateLimit,
  validateRequest({ body: acknowledgeAlertSchema }),
  usageController.acknowledgeAlerts.bind(usageController),
);

// Check usage limits (useful for frontend to check before actions)
router.get('/limits/check',
  authenticatedRateLimit,
  usageController.checkLimits.bind(usageController),
);

export { router as usageRouter };
