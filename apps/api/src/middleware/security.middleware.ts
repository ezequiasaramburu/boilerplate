import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';

// Enhanced security headers using Helmet
export const securityHeaders = helmet({
  // Content Security Policy with CSRF considerations
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Remove X-Powered-By header
  hidePoweredBy: true,
  // Strict transport security (HTTPS only in production)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  // Prevent MIME type sniffing
  noSniff: true,
  // Referrer policy - stricter for CSRF protection
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // XSS protection
  xssFilter: true,
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Set to true if you need stronger isolation
  // Cross Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  // Cross Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Origin Agent Cluster
  originAgentCluster: true,
});

// Additional CSRF-specific security headers
export const csrfSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Vary header to prevent caching issues with CSRF tokens
  res.set('Vary', 'Origin, X-Requested-With');

  // Additional security headers for CSRF protection
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');

  // Prevent caching of CSRF-sensitive responses
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }

  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize common XSS patterns
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Remove script tags and common XSS patterns
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      }
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    return value;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  next();
};

// Request size limiter
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Request entity too large',
        error: 'PAYLOAD_TOO_LARGE',
      });
    }
  }

  next();
};

// IP whitelist/blacklist middleware (configurable)
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  // In production, you might want to implement IP whitelisting/blacklisting
  // For now, we'll just log suspicious patterns

  // Block requests from common bad IP patterns (example)
  const suspiciousPatterns = [
    /^10\.0\.0\.1$/, // Example: block specific internal IPs if needed
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(clientIP || ''));

  if (isSuspicious && process.env.NODE_ENV === 'production') {
    console.warn(`Blocked suspicious IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied',
      error: 'IP_BLOCKED',
    });
  }

  next();
};

// API key validation (for premium features)
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required',
      error: 'API_KEY_MISSING',
    });
  }

  // In a real application, validate against database
  // For now, check against environment variable
  const validApiKey = process.env.API_KEY;

  if (validApiKey && apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      error: 'API_KEY_INVALID',
    });
  }

  next();
};
