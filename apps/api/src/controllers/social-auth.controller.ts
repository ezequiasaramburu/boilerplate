import type { NextFunction, Request, Response } from 'express';
import { socialAuthService } from '../services/social-auth.service.js';
import { type ApiResponse, Provider, type SocialAuthResponse } from '@my/types';

export class SocialAuthController {
  // Handle OAuth callback success
  async handleOAuthSuccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authResult = req.user as unknown as SocialAuthResponse;

      if (!authResult) {
        res.status(400).json({
          success: false,
          message: 'OAuth authentication failed',
        });
        return;
      }

      // In a real app, you'd redirect to frontend with tokens
      // For now, we'll return the tokens directly
      const response: ApiResponse = {
        success: true,
        message: authResult.isNewUser ? 'Account created and logged in successfully' : 'Logged in successfully',
        data: authResult,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Handle OAuth callback failure
  async handleOAuthFailure(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.status(400).json({
      success: false,
      message: 'Social authentication failed',
    });
  }

  // Link social account to existing user (authenticated route)
  async linkSocialAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // This would be called after OAuth flow with user already authenticated
      const userId = (req.user as any)?.id;
      const oauthProfile = req.body.profile; // Would come from OAuth callback

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      await socialAuthService.linkSocialAccount(userId, oauthProfile);

      const response: ApiResponse = {
        success: true,
        message: 'Social account linked successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Unlink social account
  async unlinkSocialAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;
      const { provider } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!Object.values(Provider).includes(provider as Provider)) {
        res.status(400).json({
          success: false,
          message: 'Invalid provider',
        });
        return;
      }

      await socialAuthService.unlinkSocialAccount(userId, provider as Provider);

      const response: ApiResponse = {
        success: true,
        message: 'Social account unlinked successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get user's linked social accounts
  async getUserSocialAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const socialAccounts = await socialAuthService.getUserSocialAccounts(userId);

      const response: ApiResponse = {
        success: true,
        message: 'Social accounts retrieved successfully',
        data: { socialAccounts },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const socialAuthController = new SocialAuthController();
