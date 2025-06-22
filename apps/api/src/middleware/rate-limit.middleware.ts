import rateLimit from 'express-rate-limit'
import type { Request, Response } from 'express'

// Rate limit error response
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
    error: 'RATE_LIMIT_EXCEEDED',
    retryAfter: Math.round((req as any).rateLimit?.resetTime || Date.now() / 1000)
  })
}

// Global rate limit - applies to all endpoints
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window per IP
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/v1/health'
  }
})

// Strict rate limit for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
})

// More lenient rate limit for authenticated users
export const authenticatedRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window per IP for authenticated users
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
})

// Very strict rate limit for password reset and sensitive operations
export const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour per IP
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
})

// OAuth rate limit - prevent OAuth abuse
export const oauthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 OAuth attempts per window per IP
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
})

// Registration rate limit - prevent spam registrations
export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
}) 