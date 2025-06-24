import { prisma } from '@my/database';
import {
  type CurrentUsageStats,
  type RecordUsageRequest,
  type UsageAlert,
  UsageAlertType,
  UsageMetricType,
  type UsageQuota,
  type UsageRecord,
  type UsageReport,
  type UsageReportRequest,
} from '@my/types';
import { notificationService } from './notification.service.js';

export class UsageService {
  /**
   * Record a usage event for a user's subscription
   */
  async recordUsage(
    userId: string,
    request: RecordUsageRequest,
  ): Promise<UsageRecord> {
    try {
      // Get user's active subscription
      const subscription = await this.getActiveSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Get current billing period
      const billingPeriod = this.getCurrentBillingPeriod(subscription);

      // Create usage record
      const usageRecord = await prisma.usageRecord.create({
        data: {
          subscriptionId: subscription.id,
          userId,
          metricType: request.metricType,
          quantity: request.quantity,
          description: request.description,
          metadata: request.metadata,
          billingPeriodStart: billingPeriod.start,
          billingPeriodEnd: billingPeriod.end,
        },
        include: {
          subscription: {
            include: { plan: true },
          },
          user: true,
        },
      });

      // Update quota and check limits
      await this.updateQuotaUsage(subscription.id, request.metricType, request.quantity);

      // Check if we need to send alerts
      await this.checkAndSendAlerts(subscription.id, userId, request.metricType);

      return usageRecord;
    } catch (error) {
      console.error('Error recording usage:', error);
      throw new Error('Failed to record usage');
    }
  }

  /**
   * Get current usage statistics for a user's subscription
   */
  async getCurrentUsageStats(userId: string): Promise<CurrentUsageStats> {
    try {
      const subscription = await this.getActiveSubscription(userId);
      if (!subscription) {
        return {};
      }

      const quotas = await prisma.usageQuota.findMany({
        where: { subscriptionId: subscription.id },
      });

      const stats: CurrentUsageStats = {};

      for (const quota of quotas) {
        const percentage = quota.limitAmount > 0
          ? (quota.currentAmount / quota.limitAmount) * 100
          : 0;

        // Calculate trend
        const trend = await this.calculateUsageTrend(subscription.id, quota.metricType);

        stats[quota.metricType] = {
          current: quota.currentAmount,
          limit: quota.limitAmount,
          percentage: Math.round(percentage * 100) / 100,
          exceeded: quota.exceeded,
          resetDate: quota.resetDate,
          trend,
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting usage stats:', error);
      throw new Error('Failed to get usage statistics');
    }
  }

  /**
   * Generate usage report for a subscription
   */
  async generateUsageReport(
    userId: string,
    request: UsageReportRequest,
  ): Promise<UsageReport> {
    try {
      const subscription = await this.getActiveSubscription(userId);
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const { startDate, endDate } = this.getReportPeriod(request, subscription);

      const whereClause = {
        subscriptionId: subscription.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(request.metricTypes && {
          metricType: { in: request.metricTypes },
        }),
      };

      // Get usage records
      const records = await prisma.usageRecord.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: request.includeDetails ? { user: true } : undefined,
      });

      // Generate summary
      const summary = {
        totalRecords: records.length,
        totalQuantity: records.reduce((sum, record) => sum + record.quantity, 0),
        period: { start: startDate, end: endDate },
      };

      // Group by metric type
      const metricGroups = this.groupRecordsByMetric(records);
      const metrics = await this.generateMetricSummaries(subscription.id, metricGroups);

      // Generate timeline if requested
      const timeline = request.groupBy
        ? this.generateTimeline(records, request.groupBy)
        : undefined;

      return {
        summary,
        metrics,
        timeline,
        details: request.includeDetails ? records : undefined,
      };
    } catch (error) {
      console.error('Error generating usage report:', error);
      throw new Error('Failed to generate usage report');
    }
  }

  /**
   * Update or create usage quota for a subscription
   */
  async updateQuota(
    subscriptionId: string,
    metricType: UsageMetricType,
    limitAmount: number,
    options: {
      hardLimit?: boolean;
      alertThreshold?: number;
      resetDate?: Date;
    } = {},
  ): Promise<UsageQuota> {
    try {
      const quota = await prisma.usageQuota.upsert({
        where: {
          subscriptionId_metricType: {
            subscriptionId,
            metricType,
          },
        },
        update: {
          limitAmount,
          hardLimit: options.hardLimit ?? true,
          alertThreshold: options.alertThreshold,
          resetDate: options.resetDate,
          exceeded: false,
          alertSent: false,
        },
        create: {
          subscriptionId,
          metricType,
          limitAmount,
          currentAmount: 0,
          hardLimit: options.hardLimit ?? true,
          alertThreshold: options.alertThreshold,
          resetDate: options.resetDate,
        },
      });

      return quota;
    } catch (error) {
      console.error('Error updating quota:', error);
      throw new Error('Failed to update usage quota');
    }
  }

  /**
   * Get user's usage alerts
   */
  async getUserAlerts(
    userId: string,
    options: {
      unacknowledgedOnly?: boolean;
      metricType?: UsageMetricType;
      limit?: number;
    } = {},
  ): Promise<UsageAlert[]> {
    try {
      const alerts = await prisma.usageAlert.findMany({
        where: {
          userId,
          ...(options.unacknowledgedOnly && { acknowledged: false }),
          ...(options.metricType && { metricType: options.metricType }),
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit,
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      });

      return alerts;
    } catch (error) {
      console.error('Error getting user alerts:', error);
      throw new Error('Failed to get usage alerts');
    }
  }

  /**
   * Acknowledge usage alerts
   */
  async acknowledgeAlerts(userId: string, alertIds: string[]): Promise<void> {
    try {
      await prisma.usageAlert.updateMany({
        where: {
          id: { in: alertIds },
          userId,
        },
        data: {
          acknowledged: true,
          resolvedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error acknowledging alerts:', error);
      throw new Error('Failed to acknowledge alerts');
    }
  }

  /**
   * Reset usage quotas for a billing period
   */
  async resetQuotas(subscriptionId: string): Promise<void> {
    try {
      await prisma.usageQuota.updateMany({
        where: { subscriptionId },
        data: {
          currentAmount: 0,
          exceeded: false,
          alertSent: false,
        },
      });
    } catch (error) {
      console.error('Error resetting quotas:', error);
      throw new Error('Failed to reset usage quotas');
    }
  }

  /**
   * Check if usage exceeds limits and block if necessary
   */
  async checkUsageLimits(
    userId: string,
    metricType: UsageMetricType,
    requestedQuantity: number = 1,
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const subscription = await this.getActiveSubscription(userId);
      if (!subscription) {
        return { allowed: false, reason: 'No active subscription' };
      }

      const quota = await prisma.usageQuota.findUnique({
        where: {
          subscriptionId_metricType: {
            subscriptionId: subscription.id,
            metricType,
          },
        },
      });

      if (!quota) {
        return { allowed: true }; // No limits set
      }

      const potentialUsage = quota.currentAmount + requestedQuantity;

      if (quota.hardLimit && potentialUsage > quota.limitAmount) {
        return {
          allowed: false,
          reason: `Usage limit exceeded for ${metricType}. Current: ${quota.currentAmount}, Limit: ${quota.limitAmount}`,
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return { allowed: false, reason: 'Error checking usage limits' };
    }
  }

  // Private helper methods
  private async getActiveSubscription(userId: string) {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private getCurrentBillingPeriod(subscription: any) {
    const start = new Date(subscription.currentPeriodStart);
    const end = new Date(subscription.currentPeriodEnd);

    return { start, end };
  }

  private async updateQuotaUsage(
    subscriptionId: string,
    metricType: UsageMetricType,
    quantity: number,
  ): Promise<void> {
    const quota = await prisma.usageQuota.findUnique({
      where: {
        subscriptionId_metricType: {
          subscriptionId,
          metricType,
        },
      },
    });

    if (quota) {
      const newAmount = quota.currentAmount + quantity;
      const exceeded = newAmount > quota.limitAmount;

      await prisma.usageQuota.update({
        where: { id: quota.id },
        data: {
          currentAmount: newAmount,
          exceeded,
        },
      });
    }
  }

  private async checkAndSendAlerts(
    subscriptionId: string,
    userId: string,
    metricType: UsageMetricType,
  ): Promise<void> {
    const quota = await prisma.usageQuota.findUnique({
      where: {
        subscriptionId_metricType: {
          subscriptionId,
          metricType,
        },
      },
    });

    if (!quota || !quota.alertThreshold) return;

    const percentage = (quota.currentAmount / quota.limitAmount) * 100;
    let alertType: UsageAlertType | null = null;

    if (percentage >= 100) {
      alertType = UsageAlertType.EXCEEDED;
    } else if (percentage >= 95) {
      alertType = UsageAlertType.CRITICAL;
    } else if (percentage >= 90) {
      alertType = UsageAlertType.APPROACHING;
    } else if (percentage >= quota.alertThreshold) {
      alertType = UsageAlertType.WARNING;
    }

    if (alertType) {
      await this.createUsageAlert({
        subscriptionId,
        userId,
        metricType,
        alertType,
        quota,
      });
    }
  }

  private async createUsageAlert(
    options: {
      subscriptionId: string;
      userId: string;
      metricType: UsageMetricType;
      alertType: UsageAlertType;
      quota: any;
    },
  ): Promise<void> {
    const { subscriptionId, userId, metricType, alertType, quota } = options;

    // Check if similar alert already exists and is not resolved
    const existingAlert = await prisma.usageAlert.findFirst({
      where: {
        subscriptionId,
        metricType,
        alertType,
        resolvedAt: null,
      },
    });

    if (existingAlert) return; // Don't create duplicate alerts

    const alert = await prisma.usageAlert.create({
      data: {
        subscriptionId,
        userId,
        metricType,
        alertType,
        threshold: quota.alertThreshold,
        currentUsage: quota.currentAmount,
        limitAmount: quota.limitAmount,
      },
      include: {
        user: true,
        subscription: { include: { plan: true } },
      },
    });

    // Send notification
    await notificationService.notifyUsageAlert(alert);
  }

  private async calculateUsageTrend(subscriptionId: string, metricType: UsageMetricType) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = await prisma.usageRecord.findMany({
      where: {
        subscriptionId,
        metricType,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentRecords.length < 2) {
      return { direction: 'stable' as const, change: 0, period: '7 days' };
    }

    const firstHalf = recentRecords.slice(0, Math.floor(recentRecords.length / 2));
    const secondHalf = recentRecords.slice(Math.floor(recentRecords.length / 2));

    const firstHalfSum = firstHalf.reduce((sum, r) => sum + r.quantity, 0);
    const secondHalfSum = secondHalf.reduce((sum, r) => sum + r.quantity, 0);

    const change = firstHalfSum - secondHalfSum;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return { direction, change: Math.abs(change), period: '7 days' };
  }

  private getReportPeriod(request: UsageReportRequest, subscription: any) {
    const defaultStart = new Date(subscription.currentPeriodStart);
    const defaultEnd = new Date(subscription.currentPeriodEnd);

    return {
      startDate: request.startDate || defaultStart,
      endDate: request.endDate || defaultEnd,
    };
  }

  private groupRecordsByMetric(records: any[]) {
    return records.reduce((groups, record) => {
      const metric = record.metricType;
      if (!groups[metric]) {
        groups[metric] = [];
      }
      groups[metric].push(record);
      return groups;
    }, {} as Record<UsageMetricType, any[]>);
  }

  private async generateMetricSummaries(
    subscriptionId: string,
    metricGroups: Record<UsageMetricType, any[]>,
  ) {
    const metrics = [];

    for (const [metricType, records] of Object.entries(metricGroups)) {
      const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
      const recordCount = records.length;
      const averageQuantity = recordCount > 0 ? totalQuantity / recordCount : 0;

      // Get quota info
      const quota = await prisma.usageQuota.findUnique({
        where: {
          subscriptionId_metricType: {
            subscriptionId,
            metricType: metricType as UsageMetricType,
          },
        },
      });

      const quotaInfo = quota ? {
        limit: quota.limitAmount,
        current: quota.currentAmount,
        percentage: (quota.currentAmount / quota.limitAmount) * 100,
        exceeded: quota.exceeded,
      } : undefined;

      metrics.push({
        metricType: metricType as UsageMetricType,
        totalQuantity,
        recordCount,
        averageQuantity: Math.round(averageQuantity * 100) / 100,
        quotaInfo,
      });
    }

    return metrics;
  }

  private generateTimeline(records: any[], groupBy: 'day' | 'week' | 'month') {
    // Simplified timeline generation - group by day for now
    const timeline = records.reduce((acc, record) => {
      const date = new Date(record.createdAt);
      date.setHours(0, 0, 0, 0); // Start of day

      const key = `${date.toISOString()}-${record.metricType}`;
      if (!acc[key]) {
        acc[key] = {
          date,
          metricType: record.metricType,
          quantity: 0,
        };
      }
      acc[key].quantity += record.quantity;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(timeline).sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

export const usageService = new UsageService();
