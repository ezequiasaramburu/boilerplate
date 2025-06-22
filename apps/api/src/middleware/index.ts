import { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { ZodError } from 'zod'
import type { ApiError } from '@my/types'

// Import security middleware
export { 
  securityHeaders, 
  csrfSecurityHeaders,
  sanitizeInput, 
  requestSizeLimit, 
  ipFilter, 
  validateApiKey 
} from './security.middleware.js'

// Import CSRF protection middleware
export {
  csrfProtection,
  doubleSubmitCookieCSRF,
  jwtCSRFProtection,
  csrfTokenEndpoint
} from './csrf.middleware.js'

// Import rate limiting middleware
export {
  globalRateLimit,
  authRateLimit,
  authenticatedRateLimit,
  sensitiveRateLimit,
  oauthRateLimit,
  registrationRateLimit
} from './rate-limit.middleware.js'

// CORS configuration
export const corsMiddleware = cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
})

// Security middleware
export const securityMiddleware = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
})

// Logging middleware
export const loggingMiddleware = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
)

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        } satisfies ApiError)
      } else {
        next(error)
      }
    }
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('API Error:', error)

  // Default error response
  let statusCode = 500
  let message = 'Internal server error'

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400
    message = error.message
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
  } else if (error.name === 'NotFoundError') {
    statusCode = 404
    message = 'Resource not found'
  }

  const errorResponse: ApiError = {
    success: false,
    message,
  }

  res.status(statusCode).json(errorResponse)
}

// Not found middleware
export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse: ApiError = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  }
  res.status(404).json(errorResponse)
} 