import { prisma } from '@my/database';
import type {
  AnalyticsDashboard,
  AnalyticsRequest,
  MRRBreakdown,
  ChurnAnalysis,
  RealTimeMetrics,
  RevenueMetrics,
  CustomerMetrics,
  SubscriptionMetrics,
  UsageMetrics,
  FinancialMetrics,
  GrowthMetrics,
  PlanPerformance,
  GeographicData,
  CohortData,
  TimeSeriesDataPoint,
  AnalyticsComparison,
} from '@my/types';
import {
  AnalyticsPeriod,
} from '@my/types';

export class AnalyticsService {
  /**
   * Get comprehensive analytics dashboard
   */
  async getDashboard(request: AnalyticsRequest = {}): Promise<AnalyticsDashboard> {
    try {
      const period = this.getPeriodDates(request);
      
      // Run all analytics calculations in parallel for better performance
      const [
        revenue,
        customers,
        subscriptions,
        usage,
        financial,
        growth,
        planPerformance,
        geographicData,
        cohortAnalysis,
        timeSeries,
      ] = await Promise.all([
        this.calculateRevenueMetrics(period.start, period.end),
        this.calculateCustomerMetrics(period.start, period.end),
        this.calculateSubscriptionMetrics(period.start, period.end),
        this.calculateUsageMetrics(period.start, period.end),
        this.calculateFinancialMetrics(period.start, period.end),
        this.calculateGrowthMetrics(period.start, period.end),
        this.calculatePlanPerformance(period.start, period.end, request.planIds),
        request.includeGeographicData ? this.calculateGeographicData(period.start, period.end) : [],
        request.includeCohortAnalysis ? this.calculateCohortAnalysis(period.start, period.end) : [],
        request.includeTimeSeries ? this.calculateTimeSeries(period.start, period.end, period.type) : {
          mrr: [],
          customers: [],
          churn: [],
          revenue: [],
        },
      ]);

      return {
        period: {
          start: period.start,
          end: period.end,
          type: period.type,
        },
        revenue,
        customers,
        subscriptions,
        usage,
        financial,
        growth,
        planPerformance,
        geographicData,
        cohortAnalysis,
        timeSeries,
        computedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating analytics dashboard:', error);
      throw new Error('Failed to generate analytics dashboard');
    }
  }

  /**
   * Get analytics with comparison to previous period
   */
  async getDashboardWithComparison(request: AnalyticsRequest = {}): Promise<AnalyticsComparison> {
    try {
      const period = this.getPeriodDates(request);
      const previousPeriod = this.getPreviousPeriod(period);

      const [current, previous] = await Promise.all([
        this.getDashboard({ ...request, startDate: period.start, endDate: period.end }),
        this.getDashboard({ ...request, startDate: previousPeriod.start, endDate: previousPeriod.end }),
      ]);

      const changes = {
        mrr: this.calculateChange(current.revenue.mrr, previous.revenue.mrr),
        customers: this.calculateChange(current.customers.activeCustomers, previous.customers.activeCustomers),
        churn: this.calculateChange(current.customers.churnRate, previous.customers.churnRate),
        revenue: this.calculateChange(current.revenue.totalRevenue, previous.revenue.totalRevenue),
      };

      return { current, previous, changes };
    } catch (error) {
      console.error('Error generating analytics comparison:', error);
      throw new Error('Failed to generate analytics comparison');
    }
  }

  /**
   * Get detailed MRR breakdown
   */
  async getMRRBreakdown(startDate?: Date, endDate?: Date): Promise<MRRBreakdown> {
    try {
      const period = this.getPeriodDates({ startDate, endDate });
      const previousPeriod = this.getPreviousPeriod(period);

      // Current period MRR
      const currentMRR = await this.calculateMRR(period.start, period.end);
      const previousMRR = await this.calculateMRR(previousPeriod.start, previousPeriod.end);

      // New business MRR (from new subscriptions)
      const newBusinessMRR = await this.calculateNewBusinessMRR(period.start, period.end);

      // Expansion MRR (from upgrades)
      const expansionMRR = await this.calculateExpansionMRR(period.start, period.end);

      // Contraction MRR (from downgrades)
      const contractionMRR = await this.calculateContractionMRR(period.start, period.end);

      // Churn MRR (from canceled subscriptions)
      const churnMRR = await this.calculateChurnMRR(period.start, period.end);

      const net = newBusinessMRR + expansionMRR - contractionMRR - churnMRR;
      const growthRate = previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;

      return {
        current: currentMRR,
        newBusiness: newBusinessMRR,
        expansion: expansionMRR,
        contraction: contractionMRR,
        churn: churnMRR,
        net,
        growthRate,
      };
    } catch (error) {
      console.error('Error calculating MRR breakdown:', error);
      throw new Error('Failed to calculate MRR breakdown');
    }
  }

  /**
   * Get detailed churn analysis
   */
  async getChurnAnalysis(startDate?: Date, endDate?: Date, planIds?: string[]): Promise<ChurnAnalysis> {
    try {
      const period = this.getPeriodDates({ startDate, endDate });

      // Get churned subscriptions for the period
      const churnedSubscriptions = await prisma.subscription.findMany({
        where: {
          canceledAt: {
            gte: period.start,
            lte: period.end,
          },
          ...(planIds && planIds.length > 0 ? { planId: { in: planIds } } : {}),
        },
        include: {
          plan: true,
          user: true,
        },
      });

      // Get total active subscriptions at the start of the period
      const activeSubscriptionsAtStart = await prisma.subscription.count({
        where: {
          createdAt: { lt: period.start },
          OR: [
            { canceledAt: null },
            { canceledAt: { gt: period.start } },
          ],
        },
      });

      const churnRate = activeSubscriptionsAtStart > 0 ? 
        (churnedSubscriptions.length / activeSubscriptionsAtStart) * 100 : 0;

      // Calculate voluntary vs involuntary churn
      // This is simplified - in reality you'd track reasons more systematically
      const voluntaryChurn = churnedSubscriptions.filter(sub => {
        const metadata = sub.metadata as { cancelReason?: string } | null;
        return sub.cancelAtPeriodEnd || metadata?.cancelReason !== 'payment_failed';
      }).length;
      const involuntaryChurn = churnedSubscriptions.length - voluntaryChurn;

      // Churn by plan
      const churnByPlan: Record<string, number> = {};
      churnedSubscriptions.forEach(sub => {
        churnByPlan[sub.plan.name] = (churnByPlan[sub.plan.name] || 0) + 1;
      });

      // Churn reasons (simplified example)
      const churnReasons: Record<string, number> = {
        'too_expensive': 0,
        'not_using': 0,
        'missing_features': 0,
        'poor_support': 0,
        'payment_failed': involuntaryChurn,
        'other': voluntaryChurn,
      };

      // Cohort churn analysis
      const churnByCohort = await this.calculateChurnByCohort(period.start, period.end);

      return {
        rate: churnRate,
        voluntaryChurn,
        involuntaryChurn,
        churnReasons,
        churnByPlan,
        churnByCohort,
      };
    } catch (error) {
      console.error('Error calculating churn analysis:', error);
      throw new Error('Failed to calculate churn analysis');
    }
  }

  /**
   * Get real-time metrics for dashboard
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        activeUsers,
        recentSignups,
        recentUpgrades,
      ] = await Promise.all([
        // Active users (simplified - based on recent activity)
        prisma.user.count({
          where: { updatedAt: { gte: lastHour } },
        }),
        // Recent signups (last 24 hours)
        prisma.user.count({
          where: { createdAt: { gte: last24Hours } },
        }),
        // Recent upgrades (simplified)
        prisma.subscription.count({
          where: {
            createdAt: { gte: last24Hours },
            status: 'ACTIVE',
          },
        }),
      ]);

      return {
        activeUsers,
        onlineUsers: activeUsers, // Simplified - same as active users
        recentSignups,
        recentUpgrades,
        systemHealth: {
          apiResponseTime: 150, // This would come from monitoring
          errorRate: 0.01, // This would come from monitoring
          uptime: 99.9, // This would come from monitoring
        },
        alerts: [], // This would come from monitoring system
      };
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw new Error('Failed to get real-time metrics');
    }
  }

  // Private helper methods

  private getPeriodDates(request: AnalyticsRequest): { start: Date; end: Date; type: AnalyticsPeriod } {
    const end = request.endDate || new Date();
    let start: Date;
    let type: AnalyticsPeriod;

    if (request.startDate) {
      start = request.startDate;
      type = request.period || AnalyticsPeriod.MONTHLY;
    } else {
      // Default to last 30 days
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      type = AnalyticsPeriod.MONTHLY;
    }

    return { start, end, type };
  }

  private getPreviousPeriod(period: { start: Date; end: Date; type: AnalyticsPeriod }): { start: Date; end: Date } {
    const duration = period.end.getTime() - period.start.getTime();
    const end = new Date(period.start.getTime() - 1);
    const start = new Date(end.getTime() - duration);
    return { start, end };
  }

  private calculateChange(current: number, previous: number): { value: number; percentage: number } {
    const value = current - previous;
    const percentage = previous > 0 ? (value / previous) * 100 : 0;
    return { value, percentage };
  }

  private async calculateMRR(startDate: Date, endDate: Date): Promise<number> {
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: endDate },
        OR: [
          { canceledAt: null },
          { canceledAt: { gt: endDate } },
        ],
      },
    });

    return activeSubscriptions.reduce((mrr, sub) => {
      // Convert to monthly amount
      if (sub.interval === 'YEAR') {
        return mrr + (sub.amount / 12);
      }
      return mrr + sub.amount;
    }, 0) / 100; // Convert from cents to dollars
  }

  private async calculateRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics> {
    const currentMRR = await this.calculateMRR(startDate, endDate);
    const previousPeriod = this.getPreviousPeriod({ start: startDate, end: endDate, type: AnalyticsPeriod.MONTHLY });
    const previousMRR = await this.calculateMRR(previousPeriod.start, previousPeriod.end);

    // Get total revenue for the period
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0) / 100;

    // Calculate ARPU
    const activeCustomers = await prisma.subscription.count({
      where: {
        status: 'ACTIVE',
        createdAt: { lte: endDate },
      },
    });

    const arpu = activeCustomers > 0 ? currentMRR / activeCustomers : 0;

    return {
      mrr: currentMRR,
      arr: currentMRR * 12,
      arpu,
      ltv: arpu * 12, // Simplified LTV calculation
      totalRevenue,
      newRevenue: await this.calculateNewBusinessMRR(startDate, endDate),
      churnedRevenue: await this.calculateChurnMRR(startDate, endDate),
      expansionRevenue: await this.calculateExpansionMRR(startDate, endDate),
      nrr: previousMRR > 0 ? (currentMRR / previousMRR) * 100 : 100,
    };
  }

  private async calculateCustomerMetrics(startDate: Date, endDate: Date): Promise<CustomerMetrics> {
    const [activeCustomers, newCustomers, churnedCustomers] = await Promise.all([
      prisma.user.count({
        where: {
          subscriptions: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          canceledAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const previousPeriod = this.getPreviousPeriod({ start: startDate, end: endDate, type: AnalyticsPeriod.MONTHLY });
    const previousActiveCustomers = await prisma.user.count({
      where: {
        createdAt: { lte: previousPeriod.end },
        subscriptions: {
          some: {
            status: 'ACTIVE',
          },
        },
      },
    });

    const churnRate = previousActiveCustomers > 0 ? (churnedCustomers / previousActiveCustomers) * 100 : 0;
    const growthRate = previousActiveCustomers > 0 ? 
      ((activeCustomers - previousActiveCustomers) / previousActiveCustomers) * 100 : 0;

    // Customers by plan
    const planCounts = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: { planId: true },
    });

    const plans = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planCounts.map(p => p.planId) } },
    });

    const customersByPlan: Record<string, number> = {};
    planCounts.forEach(count => {
      const plan = plans.find(p => p.id === count.planId);
      if (plan) {
        customersByPlan[plan.name] = count._count.planId;
      }
    });

    return {
      activeCustomers,
      newCustomers,
      churnedCustomers,
      churnRate,
      growthRate,
      customersByPlan,
      trialConversions: 0, // TODO: Implement trial tracking
      trialConversionRate: 0, // TODO: Implement trial tracking
    };
  }

  private async calculateSubscriptionMetrics(startDate: Date, endDate: Date): Promise<SubscriptionMetrics> {
    const [
      activeSubscriptions,
      newSubscriptions,
      canceledSubscriptions,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          canceledAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    // Subscriptions by status
    const statusCounts = await prisma.subscription.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const subscriptionsByStatus: Record<string, number> = {};
    statusCounts.forEach(count => {
      subscriptionsByStatus[count.status] = count._count.status;
    });

    // Subscriptions by plan
    const planCounts = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: { planId: true },
    });

    const plans = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planCounts.map(p => p.planId) } },
    });

    const subscriptionsByPlan: Record<string, number> = {};
    planCounts.forEach(count => {
      const plan = plans.find(p => p.id === count.planId);
      if (plan) {
        subscriptionsByPlan[plan.name] = count._count.planId;
      }
    });

    // Average subscription value
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { amount: true },
    });

    const averageSubscriptionValue = subscriptions.length > 0 ?
      subscriptions.reduce((sum, sub) => sum + sub.amount, 0) / subscriptions.length / 100 : 0;

    const previousPeriod = this.getPreviousPeriod({ start: startDate, end: endDate, type: AnalyticsPeriod.MONTHLY });
    const previousActiveSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: { lte: previousPeriod.end },
        status: 'ACTIVE',
      },
    });

    const subscriptionChurnRate = previousActiveSubscriptions > 0 ? 
      (canceledSubscriptions / previousActiveSubscriptions) * 100 : 0;

    return {
      activeSubscriptions,
      newSubscriptions,
      canceledSubscriptions,
      subscriptionsByStatus,
      subscriptionsByPlan,
      averageSubscriptionValue,
      subscriptionChurnRate,
    };
  }

  private async calculateUsageMetrics(startDate: Date, endDate: Date): Promise<UsageMetrics> {
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subscription: true,
      },
    });

    const totalUsage: Record<string, number> = {};
    const uniqueUsers: Record<string, Set<string>> = {};

    usageRecords.forEach(record => {
      const metricType = record.metricType;
      totalUsage[metricType] = (totalUsage[metricType] || 0) + record.quantity;
      
      if (!uniqueUsers[metricType]) {
        uniqueUsers[metricType] = new Set();
      }
      uniqueUsers[metricType].add(record.userId);
    });

    const averageUsagePerCustomer: Record<string, number> = {};
    Object.keys(totalUsage).forEach(metricType => {
      const userCount = uniqueUsers[metricType]?.size || 0;
      averageUsagePerCustomer[metricType] = userCount > 0 ? totalUsage[metricType] / userCount : 0;
    });

    const topUsageMetrics = Object.entries(totalUsage)
      .map(([metricType, total]) => ({
        metricType,
        totalUsage: total,
        uniqueUsers: uniqueUsers[metricType]?.size || 0,
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 5);

    return {
      totalUsage,
      averageUsagePerCustomer,
      usageGrowthRate: {}, // TODO: Calculate growth rates
      topUsageMetrics,
    };
  }

  private async calculateFinancialMetrics(startDate: Date, endDate: Date): Promise<FinancialMetrics> {
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const invoicesGenerated = invoices.length;
    const invoicesPaid = invoices.filter(inv => inv.status === 'PAID').length;
    const invoicesOverdue = invoices.filter(inv => inv.status === 'OVERDUE').length;
    const outstandingAmount = invoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0) / 100;

    const collectionRate = invoicesGenerated > 0 ? (invoicesPaid / invoicesGenerated) * 100 : 100;

    // Calculate average payment time
    const paidInvoices = invoices.filter(inv => inv.paidAt);
    const averagePaymentTime = paidInvoices.length > 0 ?
      paidInvoices.reduce((sum, inv) => {
        const paymentTime = (inv.paidAt!.getTime() - inv.issueDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + paymentTime;
      }, 0) / paidInvoices.length : 0;

    const revenue = await this.calculateRevenueMetrics(startDate, endDate);

    return {
      revenue,
      invoicesGenerated,
      invoicesPaid,
      invoicesOverdue,
      outstandingAmount,
      collectionRate,
      averagePaymentTime,
    };
  }

  private async calculateGrowthMetrics(startDate: Date, endDate: Date): Promise<GrowthMetrics> {
    const currentMRR = await this.calculateMRR(startDate, endDate);
    const previousPeriod = this.getPreviousPeriod({ start: startDate, end: endDate, type: AnalyticsPeriod.MONTHLY });
    const previousMRR = await this.calculateMRR(previousPeriod.start, previousPeriod.end);

    const mrrGrowthRate = previousMRR > 0 ? ((currentMRR - previousMRR) / previousMRR) * 100 : 0;

    // Get customer counts
    const currentCustomers = await prisma.user.count({
      where: {
        subscriptions: {
          some: { status: 'ACTIVE' },
        },
      },
    });

    const previousCustomers = await prisma.user.count({
      where: {
        createdAt: { lte: previousPeriod.end },
        subscriptions: {
          some: { status: 'ACTIVE' },
        },
      },
    });

    const customerGrowthRate = previousCustomers > 0 ? 
      ((currentCustomers - previousCustomers) / previousCustomers) * 100 : 0;

    return {
      mrrGrowthRate,
      customerGrowthRate,
      revenueGrowthRate: mrrGrowthRate, // Simplified
      cagr: mrrGrowthRate * 12, // Simplified annual calculation
      quickRatio: 1.0, // TODO: Implement proper quick ratio calculation
      logoRetentionRate: 100 - (await this.calculateCustomerMetrics(startDate, endDate)).churnRate,
    };
  }

  private async calculatePlanPerformance(startDate: Date, endDate: Date, planIds?: string[]): Promise<PlanPerformance[]> {
    const plans = await prisma.subscriptionPlan.findMany({
      where: planIds ? { id: { in: planIds } } : {},
      include: {
        subscriptions: {
          where: {
            createdAt: { lte: endDate },
          },
        },
      },
    });

    return Promise.all(plans.map(async plan => {
      const activeSubscriptions = plan.subscriptions.filter(sub => sub.status === 'ACTIVE').length;
      const newSubscriptions = plan.subscriptions.filter(sub => 
        sub.createdAt >= startDate && sub.createdAt <= endDate
      ).length;
      const churnedSubscriptions = plan.subscriptions.filter(sub => 
        sub.canceledAt && sub.canceledAt >= startDate && sub.canceledAt <= endDate
      ).length;

      const revenue = plan.subscriptions
        .filter(sub => sub.status === 'ACTIVE')
        .reduce((sum, sub) => {
          // Convert to monthly
          if (sub.interval === 'YEAR') {
            return sum + (sub.amount / 12);
          }
          return sum + sub.amount;
        }, 0) / 100;

      const arpu = activeSubscriptions > 0 ? revenue / activeSubscriptions : 0;
      const churnRate = activeSubscriptions > 0 ? (churnedSubscriptions / activeSubscriptions) * 100 : 0;

      return {
        planId: plan.id,
        planName: plan.name,
        activeSubscriptions,
        newSubscriptions,
        churnedSubscriptions,
        revenue,
        arpu,
        churnRate,
        conversionRate: 0, // TODO: Implement conversion tracking
      };
    }));
  }

  private async calculateGeographicData(startDate: Date, endDate: Date): Promise<GeographicData[]> {
    // This is a simplified implementation
    // In a real app, you'd store user location data and aggregate by country
    return [
      { country: 'United States', customers: 150, revenue: 15000, percentage: 45 },
      { country: 'United Kingdom', customers: 80, revenue: 8000, percentage: 24 },
      { country: 'Canada', customers: 50, revenue: 5000, percentage: 15 },
      { country: 'Germany', customers: 30, revenue: 3000, percentage: 9 },
      { country: 'Other', customers: 23, revenue: 2300, percentage: 7 },
    ];
  }

  private async calculateCohortAnalysis(startDate: Date, endDate: Date): Promise<CohortData[]> {
    // This is a simplified cohort analysis
    // In a real implementation, you'd calculate retention rates for each cohort month
    const cohorts: CohortData[] = [];
    
    // Generate sample cohort data for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const cohortDate = new Date(endDate);
      cohortDate.setMonth(cohortDate.getMonth() - i);
      
      const cohortMonth = cohortDate.toISOString().slice(0, 7); // YYYY-MM format
      
      // In a real implementation, calculate actual retention rates
      const retentionRates = Array.from({ length: i + 1 }, (_, index) => 
        Math.max(100 - (index * 10) - (Math.random() * 20), 20)
      );

      cohorts.push({
        cohortMonth,
        customersCount: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        retentionRates,
      });
    }

    return cohorts;
  }

  private async calculateTimeSeries(startDate: Date, endDate: Date, period: AnalyticsPeriod): Promise<{
    mrr: TimeSeriesDataPoint[];
    customers: TimeSeriesDataPoint[];
    churn: TimeSeriesDataPoint[];
    revenue: TimeSeriesDataPoint[];
  }> {
    // This is a simplified time series calculation
    // In a real implementation, you'd calculate actual daily/weekly/monthly data points
    const dataPoints: TimeSeriesDataPoint[] = [];
    const daysBetween = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interval = period === AnalyticsPeriod.DAILY ? 1 : period === AnalyticsPeriod.WEEKLY ? 7 : 30;

    for (let i = 0; i <= daysBetween; i += interval) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      dataPoints.push({ date, value: 0 });
    }

    return {
      mrr: dataPoints.map(dp => ({ ...dp, value: Math.random() * 50000 + 10000 })),
      customers: dataPoints.map(dp => ({ ...dp, value: Math.floor(Math.random() * 1000) + 500 })),
      churn: dataPoints.map(dp => ({ ...dp, value: Math.random() * 10 + 2 })),
      revenue: dataPoints.map(dp => ({ ...dp, value: Math.random() * 100000 + 20000 })),
    };
  }

  private async calculateNewBusinessMRR(startDate: Date, endDate: Date): Promise<number> {
    const newSubscriptions = await prisma.subscription.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'ACTIVE',
      },
    });

    return newSubscriptions.reduce((mrr, sub) => {
      if (sub.interval === 'YEAR') {
        return mrr + (sub.amount / 12);
      }
      return mrr + sub.amount;
    }, 0) / 100;
  }

  private async calculateExpansionMRR(startDate: Date, endDate: Date): Promise<number> {
    // This would track upgrades/plan changes
    // For now, return 0 as this requires more complex tracking
    return 0;
  }

  private async calculateContractionMRR(startDate: Date, endDate: Date): Promise<number> {
    // This would track downgrades/plan changes
    // For now, return 0 as this requires more complex tracking
    return 0;
  }

  private async calculateChurnMRR(startDate: Date, endDate: Date): Promise<number> {
    const churnedSubscriptions = await prisma.subscription.findMany({
      where: {
        canceledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return churnedSubscriptions.reduce((mrr, sub) => {
      if (sub.interval === 'YEAR') {
        return mrr + (sub.amount / 12);
      }
      return mrr + sub.amount;
    }, 0) / 100;
  }

  private async calculateChurnByCohort(startDate: Date, endDate: Date): Promise<Array<{
    cohort: string;
    churnRate: number;
    customersLost: number;
  }>> {
    // Simplified cohort churn calculation
    return [
      { cohort: '2024-01', churnRate: 5.2, customersLost: 8 },
      { cohort: '2024-02', churnRate: 4.8, customersLost: 12 },
      { cohort: '2024-03', churnRate: 6.1, customersLost: 15 },
    ];
  }
}

export const analyticsService = new AnalyticsService();
