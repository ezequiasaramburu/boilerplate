import type { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import {
  ApiResponse,
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
} from '@my/types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = registerSchema.parse(req.body);
      const result = await authService.register(userData);

      const response: ApiResponse = {
        success: true,
        message: 'User registered successfully',
        data: result,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials = loginSchema.parse(req.body);
      const result = await authService.login(credentials);

      const response: ApiResponse = {
        success: true,
        message: 'Login successful',
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await authService.refreshTokens(refreshToken);

      const response: ApiResponse = {
        success: true,
        message: 'Tokens refreshed successfully',
        data: { tokens },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      await authService.logout(refreshToken);

      const response: ApiResponse = {
        success: true,
        message: 'Logout successful',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore - user will be added by auth middleware
      const userId = req.user.id;
      await authService.logoutAll(userId);

      const response: ApiResponse = {
        success: true,
        message: 'Logged out from all devices successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore - user will be added by auth middleware
      const userId = req.user.id;
      const passwords = changePasswordSchema.parse(req.body);

      await authService.changePassword(userId, passwords);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // @ts-ignore - user will be added by auth middleware
      const { user } = req;

      const response: ApiResponse = {
        success: true,
        message: 'Profile retrieved successfully',
        data: { user },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
