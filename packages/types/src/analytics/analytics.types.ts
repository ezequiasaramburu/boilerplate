import { z } from 'zod';
import type { BillingInterval } from '../billing/billing.types.js';

// Base analytics entity with common fields
export interface BaseAnalyticsEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics period enum
export enum AnalyticsPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

// Revenue metrics
export interface RevenueMetrics {
  // Monthly Recurring Revenue
  mrr: number;
  // Annual Recurring Revenue
  arr: number;
  // Average Revenue Per User
  arpu: number;
  // Customer Lifetime Value
  ltv: number;
  // Total revenue for period
  totalRevenue: number;
  // New revenue from new customers
  newRevenue: number;
  // Revenue lost from churned customers
  churnedRevenue: number;
  // Revenue from upgrades/downgrades
  expansionRevenue: number;
  // Net revenue retention rate
  nrr: number;
}

// Customer metrics
export interface CustomerMetrics {
  // Total active customers
  activeCustomers: number;
  // New customers in period
  newCustomers: number;
  // Churned customers in period
  churnedCustomers: number;
  // Customer churn rate (%)
  churnRate: number;
  // Customer growth rate (%)
  growthRate: number;
  // Customers by plan
  customersByPlan: Record<string, number>;
  // Trial conversions
  trialConversions: number;
  // Trial conversion rate (%)
  trialConversionRate: number;
}

// Subscription metrics
export interface SubscriptionMetrics {
  // Total active subscriptions
  activeSubscriptions: number;
  // New subscriptions in period
  newSubscriptions: number;
  // Canceled subscriptions in period
  canceledSubscriptions: number;
  // Subscriptions by status
  subscriptionsByStatus: Record<string, number>;
  // Subscriptions by plan
  subscriptionsByPlan: Record<string, number>;
  // Average subscription value
  averageSubscriptionValue: number;
  // Subscription churn rate
  subscriptionChurnRate: number;
}

// Usage metrics
export interface UsageMetrics {
  // Total usage across all metrics
  totalUsage: Record<string, number>;
  // Average usage per customer
  averageUsagePerCustomer: Record<string, number>;
  // Usage growth rate
  usageGrowthRate: Record<string, number>;
  // Top usage metrics
  topUsageMetrics: Array<{
    metricType: string;
    totalUsage: number;
    uniqueUsers: number;
  }>;
}

// Financial metrics
export interface FinancialMetrics {
  // Revenue metrics
  revenue: RevenueMetrics;
  // Billing metrics
  invoicesGenerated: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  outstandingAmount: number;
  collectionRate: number;
  averagePaymentTime: number; // days
}

// Geographic data
export interface GeographicData {
  country: string;
  customers: number;
  revenue: number;
  percentage: number;
}

// Time series data point
export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
  label?: string;
}

// Cohort analysis data
export interface CohortData {
  cohortMonth: string;
  customersCount: number;
  revenue: number;
  retentionRates: number[]; // retention rate for each subsequent month
}

// Plan performance
export interface PlanPerformance {
  planId: string;
  planName: string;
  activeSubscriptions: number;
  newSubscriptions: number;
  churnedSubscriptions: number;
  revenue: number;
  arpu: number;
  churnRate: number;
  conversionRate: number;
}

// Growth metrics
export interface GrowthMetrics {
  // Month-over-month growth rates
  mrrGrowthRate: number;
  customerGrowthRate: number;
  revenueGrowthRate: number;
  // Compound Annual Growth Rate
  cagr: number;
  // Quick ratio (new MRR + expansion MRR) / (churned MRR + contraction MRR)
  quickRatio: number;
  // Logo retention (customer retention regardless of revenue changes)
  logoRetentionRate: number;
}

// Complete analytics dashboard data
export interface AnalyticsDashboard {
  // Period information
  period: {
    start: Date;
    end: Date;
    type: AnalyticsPeriod;
  };
  
  // Core metrics
  revenue: RevenueMetrics;
  customers: CustomerMetrics;
  subscriptions: SubscriptionMetrics;
  usage: UsageMetrics;
  financial: FinancialMetrics;
  growth: GrowthMetrics;
  
  // Breakdown data
  planPerformance: PlanPerformance[];
  geographicData: GeographicData[];
  cohortAnalysis: CohortData[];
  
  // Time series data
  timeSeries: {
    mrr: TimeSeriesDataPoint[];
    customers: TimeSeriesDataPoint[];
    churn: TimeSeriesDataPoint[];
    revenue: TimeSeriesDataPoint[];
  };
  
  // Computed at
  computedAt: Date;
}

// Analytics request types
export interface AnalyticsRequest {
  startDate?: Date;
  endDate?: Date;
  period?: AnalyticsPeriod;
  includeTimeSeries?: boolean;
  includeCohortAnalysis?: boolean;
  includeGeographicData?: boolean;
  planIds?: string[];
  compareWithPrevious?: boolean;
}

// Analytics comparison data
export interface AnalyticsComparison {
  current: AnalyticsDashboard;
  previous: AnalyticsDashboard;
  changes: {
    mrr: { value: number; percentage: number };
    customers: { value: number; percentage: number };
    churn: { value: number; percentage: number };
    revenue: { value: number; percentage: number };
  };
}

// Specific metric request types
export interface MRRBreakdown {
  current: number;
  newBusiness: number;
  expansion: number;
  contraction: number;
  churn: number;
  net: number;
  growthRate: number;
}

export interface ChurnAnalysis {
  rate: number;
  voluntaryChurn: number;
  involuntaryChurn: number;
  churnReasons: Record<string, number>;
  churnByPlan: Record<string, number>;
  churnByCohort: Array<{
    cohort: string;
    churnRate: number;
    customersLost: number;
  }>;
}

// Real-time metrics for dashboard
export interface RealTimeMetrics {
  activeUsers: number;
  onlineUsers: number;
  recentSignups: number;
  recentUpgrades: number;
  systemHealth: {
    apiResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

// Validation schemas
export const analyticsRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  period: z.nativeEnum(AnalyticsPeriod).optional(),
  includeTimeSeries: z.boolean().optional(),
  includeCohortAnalysis: z.boolean().optional(),
  includeGeographicData: z.boolean().optional(),
  planIds: z.array(z.string()).optional(),
  compareWithPrevious: z.boolean().optional(),
});

export const mrrBreakdownSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const churnAnalysisSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  planIds: z.array(z.string()).optional(),
});

// Export types for convenience
export type { AnalyticsDashboard as Analytics };
export type { AnalyticsRequest as GetAnalyticsRequest };
export type { AnalyticsComparison as AnalyticsWithComparison };
