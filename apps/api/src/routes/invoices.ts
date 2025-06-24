import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authenticatedRateLimit } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/index.js';
import {
  createInvoiceSchema,
  generateInvoicePdfSchema,
  invoiceListRequestSchema,
  updateInvoiceSchema,
} from '@my/types';

const router = Router();
const invoiceController = new InvoiceController();

// Apply authentication to all invoice routes
router.use(authenticateToken);

// Apply rate limiting
router.use(authenticatedRateLimit);

// Invoice CRUD operations
router.post('/',
  validateRequest({ body: createInvoiceSchema }),
  invoiceController.createInvoice.bind(invoiceController),
);
router.get('/',
  validateRequest({ query: invoiceListRequestSchema }),
  invoiceController.listInvoices.bind(invoiceController),
);
router.get('/summary', invoiceController.getInvoiceSummary.bind(invoiceController));
router.get('/:invoiceId', invoiceController.getInvoice.bind(invoiceController));
router.put('/:invoiceId',
  validateRequest({ body: updateInvoiceSchema }),
  invoiceController.updateInvoice.bind(invoiceController),
);

// PDF operations
router.post('/:invoiceId/pdf',
  validateRequest({ body: generateInvoicePdfSchema }),
  invoiceController.generatePdf.bind(invoiceController),
);
router.get('/:invoiceId/download', invoiceController.downloadPdf.bind(invoiceController));

// Usage-based invoice creation
router.post('/subscriptions/:subscriptionId/usage', invoiceController.createInvoiceFromUsage.bind(invoiceController));

// Admin operations
router.post('/admin/mark-overdue', invoiceController.markOverdueInvoices.bind(invoiceController));

// Public routes (no auth required)
const publicRouter = Router();

// Public invoice access by number and email
publicRouter.get('/public/:invoiceNumber', invoiceController.getInvoiceByNumber.bind(invoiceController));

export { router as invoiceRoutes, publicRouter as publicInvoiceRoutes };
