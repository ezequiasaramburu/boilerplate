import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import {
  authenticatedRateLimit,
  sensitiveRateLimit,
  validateRequest,
} from '../middleware/index.js';
import {
  analyticsRequestSchema,
  mrrBreakdownSchema,
  churnAnalysisSchema,
} from '@my/types';

const router = Router();

// All analytics routes require authentication and are considered sensitive
// Apply rate limiting to prevent abuse and protect server resources

// Comprehensive dashboard endpoint
router.get('/dashboard',
  sensitiveRateLimit, // Analytics queries can be expensive
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getDashboard.bind(analyticsController),
);

// Dashboard with comparison to previous period
router.get('/dashboard/comparison',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getDashboardWithComparison.bind(analyticsController),
);

// Real-time metrics for live dashboard
router.get('/realtime',
  authenticatedRateLimit, // Less strict as this should be fast
  analyticsController.getRealTimeMetrics.bind(analyticsController),
);

// Revenue analytics endpoints
router.get('/revenue',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getRevenueMetrics.bind(analyticsController),
);

router.get('/revenue/mrr',
  sensitiveRateLimit,
  validateRequest({ query: mrrBreakdownSchema }),
  analyticsController.getMRRBreakdown.bind(analyticsController),
);

// Customer analytics endpoints
router.get('/customers',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getCustomerMetrics.bind(analyticsController),
);

router.get('/customers/churn',
  sensitiveRateLimit,
  validateRequest({ query: churnAnalysisSchema }),
  analyticsController.getChurnAnalysis.bind(analyticsController),
);

// Subscription analytics endpoints
router.get('/subscriptions',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getSubscriptionMetrics.bind(analyticsController),
);

router.get('/subscriptions/plans',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getPlanPerformance.bind(analyticsController),
);

// Usage analytics endpoints
router.get('/usage',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getUsageMetrics.bind(analyticsController),
);

// Growth analytics endpoints
router.get('/growth',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getGrowthMetrics.bind(analyticsController),
);

// Financial analytics endpoints
router.get('/financial',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getFinancialMetrics.bind(analyticsController),
);

// Advanced analytics endpoints
router.get('/timeseries',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getTimeSeries.bind(analyticsController),
);

router.get('/cohort',
  sensitiveRateLimit, // Cohort analysis can be particularly expensive
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getCohortAnalysis.bind(analyticsController),
);

router.get('/geographic',
  sensitiveRateLimit,
  validateRequest({ query: analyticsRequestSchema }),
  analyticsController.getGeographicData.bind(analyticsController),
);

export { router as analyticsRouter };
