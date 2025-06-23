import type { EmailData, SubscriptionWithPlan } from '@my/types';

class NotificationService {
  // Send email notification (placeholder - integrate with your email service)
  async sendEmail(emailData: EmailData): Promise<void> {
    try {
      // TODO: Integrate with your email service (Resend, SendGrid, etc.)
      console.log('📧 Email notification:', {
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
        timestamp: new Date().toISOString(),
      });

      // In production, replace with actual email service:
      // await emailService.send(emailData)
    } catch (error) {
      console.error('Failed to send email notification:', error);
      // Don't throw - email failures shouldn't stop webhook processing
    }
  }

  // Subscription created notification
  async notifySubscriptionCreated(subscription: SubscriptionWithPlan): Promise<void> {
    const emailData: EmailData = {
      to: subscription.user.email,
      subject: `Welcome to ${subscription.plan.name}! 🎉`,
      template: 'subscription-created',
      data: {
        userName: subscription.user.name || 'there',
        planName: subscription.plan.name,
        amount: this.formatAmount(subscription.amount, subscription.currency),
        trialEnd: subscription.trialEnd,
        nextBillingDate: subscription.currentPeriodEnd,
        features: subscription.plan.features || [],
      },
    };

    await this.sendEmail(emailData);
  }

  // Payment succeeded notification
  async notifyPaymentSucceeded(
    subscription: SubscriptionWithPlan,
    invoiceAmount: number,
  ): Promise<void> {
    const emailData: EmailData = {
      to: subscription.user.email,
      subject: 'Payment Confirmed ✅',
      template: 'payment-succeeded',
      data: {
        userName: subscription.user.name || 'there',
        planName: subscription.plan.name,
        amount: this.formatAmount(invoiceAmount, subscription.currency),
        nextBillingDate: subscription.currentPeriodEnd,
        invoiceUrl: '#', // TODO: Add invoice URL from Stripe
      },
    };

    await this.sendEmail(emailData);
  }

  // Payment failed notification
  async notifyPaymentFailed(
    subscription: SubscriptionWithPlan,
    invoiceAmount: number,
  ): Promise<void> {
    const emailData: EmailData = {
      to: subscription.user.email,
      subject: '⚠️ Payment Failed - Action Required',
      template: 'payment-failed',
      data: {
        userName: subscription.user.name || 'there',
        planName: subscription.plan.name,
        amount: this.formatAmount(invoiceAmount, subscription.currency),
        retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        updatePaymentUrl: `${process.env.FRONTEND_URL}/billing/payment-method`,
      },
    };

    await this.sendEmail(emailData);
  }

  // Subscription canceled notification
  async notifySubscriptionCanceled(subscription: SubscriptionWithPlan): Promise<void> {
    const emailData: EmailData = {
      to: subscription.user.email,
      subject: 'Subscription Canceled',
      template: 'subscription-canceled',
      data: {
        userName: subscription.user.name || 'there',
        planName: subscription.plan.name,
        accessUntil: subscription.currentPeriodEnd,
        reactivateUrl: `${process.env.FRONTEND_URL}/billing`,
      },
    };

    await this.sendEmail(emailData);
  }

  // Subscription expiring soon notification
  async notifySubscriptionExpiring(subscription: SubscriptionWithPlan): Promise<void> {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil(
      (subscription.currentPeriodEnd.getTime() - Date.now()) / millisecondsPerDay,
    );

    const emailData: EmailData = {
      to: subscription.user.email,
      subject: `Subscription Expiring in ${daysLeft} Days`,
      template: 'subscription-expiring',
      data: {
        userName: subscription.user.name || 'there',
        planName: subscription.plan.name,
        daysLeft,
        expirationDate: subscription.currentPeriodEnd,
        renewUrl: `${process.env.FRONTEND_URL}/billing`,
      },
    };

    await this.sendEmail(emailData);
  }

  // Trial ending notification
  async notifyTrialEnding(subscription: SubscriptionWithPlan): Promise<void> {
    if (!subscription.trialEnd) return;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const daysLeft = Math.ceil(
      (subscription.trialEnd.getTime() - Date.now()) / millisecondsPerDay,
    );

    const emailData: EmailData = {
      to: subscription.user.email,
      subject: `Trial Ending in ${daysLeft} Days`,
      template: 'trial-ending',
      data: {
        userName: subscription.user.name || 'there',
        planName: subscription.plan.name,
        daysLeft,
        trialEndDate: subscription.trialEnd,
        upgradeUrl: `${process.env.FRONTEND_URL}/billing/upgrade`,
      },
    };

    await this.sendEmail(emailData);
  }

  // Admin notifications for important events
  async notifyAdmin(event: string, data: Record<string, any>): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const emailData: EmailData = {
      to: adminEmail,
      subject: `[Admin Alert] ${event}`,
      template: 'admin-notification',
      data: {
        event,
        timestamp: new Date().toISOString(),
        ...data,
      },
    };

    await this.sendEmail(emailData);
  }

  // Webhook processing error notification
  async notifyWebhookError(eventType: string, eventId: string, error: string): Promise<void> {
    await this.notifyAdmin('Webhook Processing Error', {
      eventType,
      eventId,
      error,
      severity: 'high',
    });
  }

  // Format amount for display
  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  // Slack/Discord webhook notification (for team alerts)
  async sendSlackNotification(message: string, channel: string = 'general'): Promise<void> {
    try {
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!slackWebhookUrl) return;

      const payload = {
        channel: `#${channel}`,
        text: message,
        username: 'SaaS Bot',
        icon_emoji: ':moneybag:',
      };

      // TODO: Replace with actual HTTP request
      console.log('💬 Slack notification:', payload);

      // In production:
      // await fetch(slackWebhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // })
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  // Revenue milestone notifications
  async notifyRevenueMilestone(monthlyRevenue: number, milestone: number): Promise<void> {
    await this.notifyAdmin('Revenue Milestone Reached! 🎉', {
      monthlyRevenue: this.formatAmount(monthlyRevenue, 'usd'),
      milestone: this.formatAmount(milestone, 'usd'),
    });

    await this.sendSlackNotification(
      `🎉 Revenue milestone reached! Monthly revenue: ${this.formatAmount(monthlyRevenue, 'usd')}`,
      'revenue',
    );
  }
}

export const notificationService = new NotificationService();
