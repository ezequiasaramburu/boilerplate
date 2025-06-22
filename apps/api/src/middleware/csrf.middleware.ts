import Tokens from 'csrf'
import type { Request, Response, NextFunction } from 'express'

// Initialize CSRF token generator
const tokens = new Tokens()

// Generate a secret for CSRF tokens (you should store this in env in production)
const csrfSecret = process.env.CSRF_SECRET || 'your-csrf-secret-key'

// Extend Request interface to include CSRF token
declare global {
  namespace Express {
    interface Request {
      csrfToken?: () => string
      csrfSecret?: string
    }
  }
}

// CSRF token generation middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for certain routes (health checks, public endpoints)
  const skipRoutes = [
    '/health',
    '/api/v1/health',
    '/api/v1/auth/oauth/google',
    '/api/v1/auth/oauth/github',
    '/api/v1/auth/oauth/google/callback',
    '/api/v1/auth/oauth/github/callback'
  ]

  if (skipRoutes.includes(req.path)) {
    return next()
  }

  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Add token generation function for safe methods
    req.csrfToken = () => tokens.create(csrfSecret)
    return next()
  }

  // For unsafe methods (POST, PUT, DELETE, PATCH), validate CSRF token
  const token = req.headers['x-csrf-token'] as string || 
                req.body._csrf || 
                req.query._csrf as string

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
      error: 'CSRF_TOKEN_MISSING'
    })
  }

  // Verify the CSRF token
  if (!tokens.verify(csrfSecret, token)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      error: 'CSRF_TOKEN_INVALID'
    })
  }

  // Add token generation function
  req.csrfToken = () => tokens.create(csrfSecret)
  next()
}

// Double-submit cookie CSRF protection (alternative/additional method)
export const doubleSubmitCookieCSRF = (req: Request, res: Response, next: NextFunction) => {
  const cookieName = '__Host-csrf-token'
  
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Set CSRF cookie for safe methods
    const csrfToken = tokens.create(csrfSecret)
    res.cookie(cookieName, csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    })
    req.csrfToken = () => csrfToken
    return next()
  }

  // For unsafe methods, validate double-submit cookie
  const cookieToken = req.cookies[cookieName]
  const headerToken = req.headers['x-csrf-token'] as string

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF protection required',
      error: 'CSRF_PROTECTION_REQUIRED'
    })
  }

  // Verify cookie and header tokens match
  if (cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token mismatch',
      error: 'CSRF_TOKEN_MISMATCH'
    })
  }

  // Verify the token is valid
  if (!tokens.verify(csrfSecret, headerToken)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      error: 'CSRF_TOKEN_INVALID'
    })
  }

  req.csrfToken = () => tokens.create(csrfSecret)
  next()
}

// JWT-based CSRF protection (for APIs using JWT)
export const jwtCSRFProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for JWT-authenticated endpoints if using proper SameSite cookies
  // This is a design decision - JWT APIs often don't need CSRF if:
  // 1. Tokens are stored in localStorage/sessionStorage (not cookies)
  // 2. Proper CORS is configured
  // 3. No session-based authentication is used

  const authHeader = req.headers.authorization
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT authentication detected, skip CSRF for this request
    // But log it for security monitoring
    console.info('CSRF skipped for JWT-authenticated request:', {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    })
    return next()
  }

  // Apply CSRF protection for non-JWT requests
  return csrfProtection(req, res, next)
}

// CSRF token endpoint (for getting tokens)
export const csrfTokenEndpoint = (req: Request, res: Response) => {
  const token = tokens.create(csrfSecret)
  
  res.json({
    success: true,
    message: 'CSRF token generated',
    data: {
      csrfToken: token,
      expiresIn: 3600, // 1 hour
      usage: {
        header: 'Include token in X-CSRF-Token header',
        body: 'Or include as _csrf field in request body',
        query: 'Or include as _csrf query parameter'
      }
    }
  })
}

/**
 * CSRF Protection Usage Guide:
 * 
 * 1. GET CSRF Token:
 *    GET /api/v1/csrf-token
 * 
 * 2. Include token in requests:
 *    - Header: X-CSRF-Token: <token>
 *    - Body: { "_csrf": "<token>", ...otherData }
 *    - Query: POST /api/endpoint?_csrf=<token>
 * 
 * 3. JWT Authentication:
 *    - JWT-authenticated requests skip CSRF (Bearer token)
 *    - Session-based requests require CSRF
 * 
 * 4. Safe Methods:
 *    - GET, HEAD, OPTIONS don't require CSRF
 *    - POST, PUT, DELETE, PATCH require CSRF
 * 
 * 5. OAuth Flows:
 *    - OAuth callbacks skip CSRF protection
 *    - Regular auth endpoints require CSRF
 */ 