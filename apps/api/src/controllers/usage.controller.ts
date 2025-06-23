import type { NextFunction, Request, Response } from 'express';
import { usageService } from '../services/usage.service.js';
import type {
  ApiResponse,
  AuthUser,
  RecordUsageRequest,
  UsageReportRequest,
} from '@my/types';

export class UsageController {
  /**
   * Record usage for the authenticated user
   */
  async recordUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const usageRequest: RecordUsageRequest = req.body;

      const usageRecord = await usageService.recordUsage(userId, usageRequest);

      const response: ApiResponse = {
        success: true,
        message: 'Usage recorded successfully',
        data: { usageRecord },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current usage statistics for the authenticated user
   */
  async getCurrentUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;

      const usageStats = await usageService.getCurrentUsageStats(userId);

      const response: ApiResponse = {
        success: true,
        message: 'Current usage statistics retrieved successfully',
        data: { usageStats },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate usage report for the authenticated user
   */
  async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const reportRequest: UsageReportRequest = req.query;

      const report = await usageService.generateUsageReport(userId, reportRequest);

      const response: ApiResponse = {
        success: true,
        message: 'Usage report generated successfully',
        data: { report },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get usage alerts for the authenticated user
   */
  async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const { unacknowledged, metricType, limit } = req.query;

      const alerts = await usageService.getUserAlerts(userId, {
        unacknowledgedOnly: unacknowledged === 'true',
        metricType: metricType as any,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Usage alerts retrieved successfully',
        data: { alerts },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Acknowledge usage alerts
   */
  async acknowledgeAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const { alertIds } = req.body;

      await usageService.acknowledgeAlerts(userId, alertIds);

      const response: ApiResponse = {
        success: true,
        message: 'Alerts acknowledged successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check usage limits before performing an action
   */
  async checkLimits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id;
      const { metricType, quantity = 1 } = req.query;

      const limitCheck = await usageService.checkUsageLimits(
        userId,
        metricType as any,
        parseInt(quantity as string),
      );

      const response: ApiResponse = {
        success: true,
        message: 'Usage limits checked successfully',
        data: { limitCheck },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const usageController = new UsageController();
