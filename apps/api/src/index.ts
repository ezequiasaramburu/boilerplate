import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { connectDb } from '@my/database';
import {
  authRateLimit,
  corsMiddleware,
  csrfSecurityHeaders,
  csrfTokenEndpoint,
  errorHandler,
  globalRateLimit,
  ipFilter,
  jwtCSRFProtection,
  loggingMiddleware,
  notFoundHandler,
  oauthRateLimit,
  requestSizeLimit,
  sanitizeInput,
  securityHeaders,
} from './middleware/index.js';
import { authenticateToken } from './middleware/auth.middleware.js';
import passport from './config/passport.config.js';
import { authRouter } from './routes/auth.js';
import { billingRouter } from './routes/billing.js';
import { invoiceRoutes, publicInvoiceRoutes } from './routes/invoices.js';
import { socialAuthRouter } from './routes/social-auth.js';
import { usageRouter } from './routes/usage.js';
import { usersRouter } from './routes/users.js';
import webhookAdminRouter from './routes/webhook-admin.js';
import { webhookRouter } from './routes/webhooks.js';
import { API_VERSION } from './config/constants.js';

const app = express();
const port = process.env.PORT;

// Connect to database
await connectDb();

// Core Middleware (order matters!)
app.set('trust proxy', 1); // Trust first proxy for rate limiting

// Security middleware
app.use(securityHeaders); // Enhanced helmet security
app.use(corsMiddleware);
app.use(ipFilter); // IP filtering
app.use(requestSizeLimit); // Request size limits

// Rate limiting
app.use(globalRateLimit); // Apply global rate limit to all routes

// Mount Stripe webhooks BEFORE JSON parsing to preserve raw body for signature verification
app.use(`${API_VERSION}/webhooks`, webhookRouter);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing for CSRF
app.use(cookieParser());

// Input sanitization
app.use(sanitizeInput);

// CSRF protection headers
app.use(csrfSecurityHeaders);

// Logging
app.use(loggingMiddleware);

// Session middleware for Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// API v1 routes with specific rate limiting

// CSRF token endpoint (public)
app.get(`${API_VERSION}/csrf-token`, csrfTokenEndpoint);

// Apply specific rate limits and CSRF protection to different route groups
app.use(`${API_VERSION}/auth`, authRateLimit, jwtCSRFProtection, authRouter);
app.use(`${API_VERSION}/auth/oauth`, oauthRateLimit, socialAuthRouter); // OAuth skips CSRF
app.use(`${API_VERSION}/users`, authenticateToken, usersRouter);
app.use(`${API_VERSION}/billing`, authenticateToken, billingRouter);
app.use(`${API_VERSION}/usage`, authenticateToken, usageRouter);
app.use(`${API_VERSION}/invoices`, invoiceRoutes);
app.use(`${API_VERSION}/admin/webhooks`, webhookAdminRouter);

// Public invoice routes (no auth required)
app.use(`${API_VERSION}/invoices`, publicInvoiceRoutes);

// Health check (shared handler)
const healthHandler = (_: express.Request, res: express.Response) => {
  res.json({
    success: true,
    message: 'API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};

app.get(`${API_VERSION}/health`, healthHandler);
app.get('/health', healthHandler);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 API listening on http://localhost:${port}`);
});
