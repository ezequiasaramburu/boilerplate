import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { type AuthUser, UserRole } from '@my/types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    const user = await authService.verifyAccessToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

// Convenience middleware for admin only
export const requireAdmin = requireRole([UserRole.ADMIN]);

// Convenience middleware for admin or moderator
export const requireModerator = requireRole([UserRole.ADMIN, UserRole.MODERATOR]);

// Optional authentication - adds user to request if token is valid, but doesn't block access
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await authService.verifyAccessToken(token);
      req.user = user;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
};
