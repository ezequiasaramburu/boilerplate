import type { NextFunction, Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import type {
  ApiResponse,
  AuthUser,
  AnalyticsRequest,
} from '@my/types';
import {
  analyticsRequestSchema,
  mrrBreakdownSchema,
  churnAnalysisSchema,
} from '@my/types';

export class AnalyticsController {
  // Get comprehensive analytics dashboard
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Analytics dashboard retrieved successfully',
        data: { dashboard },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get analytics dashboard with comparison to previous period
  async getDashboardWithComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const comparison = await analyticsService.getDashboardWithComparison(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Analytics comparison retrieved successfully',
        data: { comparison },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get detailed MRR breakdown and metrics
  async getMRRBreakdown(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = mrrBreakdownSchema.parse(req.query);
      
      const mrrBreakdown = await analyticsService.getMRRBreakdown(
        validatedData.startDate,
        validatedData.endDate
      );

      const response: ApiResponse = {
        success: true,
        message: 'MRR breakdown retrieved successfully',
        data: { mrrBreakdown },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get detailed churn analysis
  async getChurnAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = churnAnalysisSchema.parse(req.query);
      
      const churnAnalysis = await analyticsService.getChurnAnalysis(
        validatedData.startDate,
        validatedData.endDate,
        validatedData.planIds
      );

      const response: ApiResponse = {
        success: true,
        message: 'Churn analysis retrieved successfully',
        data: { churnAnalysis },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get real-time metrics for live dashboard
  async getRealTimeMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const realTimeMetrics = await analyticsService.getRealTimeMetrics();

      const response: ApiResponse = {
        success: true,
        message: 'Real-time metrics retrieved successfully',
        data: { realTimeMetrics },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get revenue metrics for a specific period
  async getRevenueMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Revenue metrics retrieved successfully',
        data: {
          revenue: dashboard.revenue,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get customer metrics for a specific period
  async getCustomerMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Customer metrics retrieved successfully',
        data: {
          customers: dashboard.customers,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get subscription metrics for a specific period
  async getSubscriptionMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Subscription metrics retrieved successfully',
        data: {
          subscriptions: dashboard.subscriptions,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get usage metrics for a specific period
  async getUsageMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Usage metrics retrieved successfully',
        data: {
          usage: dashboard.usage,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get growth metrics for a specific period
  async getGrowthMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Growth metrics retrieved successfully',
        data: {
          growth: dashboard.growth,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get plan performance metrics
  async getPlanPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Plan performance metrics retrieved successfully',
        data: {
          planPerformance: dashboard.planPerformance,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get financial metrics (invoices, payments, etc.)
  async getFinancialMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const validatedData = analyticsRequestSchema.parse(req.query);
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Financial metrics retrieved successfully',
        data: {
          financial: dashboard.financial,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get time series data for charts
  async getTimeSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters and force time series inclusion
      const validatedData = analyticsRequestSchema.parse({
        ...req.query,
        includeTimeSeries: true,
      });
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Time series data retrieved successfully',
        data: {
          timeSeries: dashboard.timeSeries,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get cohort analysis data
  async getCohortAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters and force cohort analysis inclusion
      const validatedData = analyticsRequestSchema.parse({
        ...req.query,
        includeCohortAnalysis: true,
      });
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Cohort analysis retrieved successfully',
        data: {
          cohortAnalysis: dashboard.cohortAnalysis,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  // Get geographic revenue distribution
  async getGeographicData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters and force geographic data inclusion
      const validatedData = analyticsRequestSchema.parse({
        ...req.query,
        includeGeographicData: true,
      });
      
      const dashboard = await analyticsService.getDashboard(validatedData);

      const response: ApiResponse = {
        success: true,
        message: 'Geographic data retrieved successfully',
        data: {
          geographicData: dashboard.geographicData,
          period: dashboard.period,
          computedAt: dashboard.computedAt,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
