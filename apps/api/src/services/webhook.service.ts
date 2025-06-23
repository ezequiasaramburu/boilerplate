import Stripe from 'stripe';
import { prisma } from '@my/database';
import { stripeService } from './stripe.service.js';
import { notificationService } from './notification.service.js';
import { BillingInterval, STRIPE_WEBHOOK_EVENTS, type StripeWebhookEventType, SubscriptionStatus } from '@my/types';

// Extend Stripe Invoice interface to include subscription property
interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription | null;
}

class WebhookService {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  // Verify and process Stripe webhook with retry mechanism
  async processStripeWebhook(payload: string | Buffer, signature: string): Promise<void> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.MAX_RETRY_ATTEMPTS) {
      try {
        await this.processWebhookAttempt(payload, signature, attempt + 1);
        return; // Success - exit retry loop
      } catch (error) {
        lastError = error as Error;
        attempt++;

        console.error(`Webhook processing attempt ${attempt} failed:`, error);

        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          // Wait before retrying
          await this.sleep(this.RETRY_DELAY * attempt);
        }
      }
    }

    // All attempts failed
    console.error(`Webhook processing failed after ${this.MAX_RETRY_ATTEMPTS} attempts`);
    throw lastError;
  }

  // Single webhook processing attempt
  private async processWebhookAttempt(
    payload: string | Buffer,
    signature: string,
    attempt: number,
  ): Promise<void> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
      }

      // Verify webhook signature
      const stripe = stripeService.getStripeInstance();
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      console.log(`🔄 Processing webhook ${event.type} (${event.id}) - Attempt ${attempt}`);

      // Check if we've already processed this event
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { stripeEventId: event.id },
      });

      if (existingEvent?.processed) {
        console.log(`✅ Webhook event ${event.id} already processed`);
        return;
      }

      await this.processWebhookEventFlow(event);

    } catch (error) {
      await this.handleWebhookProcessingError(error, payload, signature, attempt);
      throw error;
    }
  }

  // Process webhook event flow
  private async processWebhookEventFlow(event: Stripe.Event): Promise<void> {
    // Store webhook event
    await prisma.webhookEvent.upsert({
      where: { stripeEventId: event.id },
      update: {
        processed: false,
        processingError: null, // Clear previous errors on retry
      },
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        data: event.data as any,
        processed: false,
      },
    });

    // Process the event based on type
    await this.handleWebhookEvent(event);

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    });

    console.log(`✅ Successfully processed webhook event: ${event.type} (${event.id})`);

    // Send success notification for critical events
    await this.notifyWebhookSuccess(event);
  }

  // Handle webhook processing errors
  private async handleWebhookProcessingError(
    error: unknown,
    payload: string | Buffer,
    signature: string,
    attempt: number,
  ): Promise<void> {
    console.error(`❌ Error processing Stripe webhook (attempt ${attempt}):`, error);

    // Store error in webhook event
    try {
      const stripe = stripeService.getStripeInstance();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

      await prisma.webhookEvent.upsert({
        where: { stripeEventId: event.id },
        update: {
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
        create: {
          stripeEventId: event.id,
          eventType: event.type,
          data: event.data as any,
          processed: false,
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Notify admin of webhook processing error
      await notificationService.notifyWebhookError(
        event.type,
        event.id,
        error instanceof Error ? error.message : 'Unknown error',
      );

    } catch (innerError) {
      console.error('Error storing webhook error:', innerError);
    }
  }

  // Handle different webhook event types
  private async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type as StripeWebhookEventType) {
      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        await this.handleInvoicePaymentSucceeded(event.data.object as InvoiceWithSubscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await this.handleInvoicePaymentFailed(event.data.object as InvoiceWithSubscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_CREATED:
        await this.handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_UPDATED:
        await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`⚠️  Unhandled webhook event type: ${event.type}`);
    }
  }

  // Handle subscription creation with notifications
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const { userId, plan } = await this.validateSubscriptionData(subscription);
      const newSubscription = await this.createDatabaseSubscription(subscription, userId, plan);

      console.log(`💰 Created subscription for user ${userId}: ${subscription.id}`);

      // Initialize usage quotas for the new subscription
      await this.initializeUsageQuotas(newSubscription.id, plan);

      await this.sendSubscriptionNotifications(newSubscription, plan);
      await this.checkRevenueMilestone();
    } catch (error) {
      console.error('❌ Error handling subscription created:', error);
      throw error;
    }
  }

  // Validate subscription data and return userId and plan
  private async validateSubscriptionData(subscription: Stripe.Subscription): Promise<{
    userId: string;
    plan: any;
  }> {
    const customer = await this.getCustomerFromStripe(subscription.customer as string);
    const userId = customer.metadata?.userId;

    if (!userId) {
      throw new Error(`No userId found in customer metadata for subscription: ${subscription.id}`);
    }

    const priceId = subscription.items.data[0]?.price.id;
    if (!priceId) {
      throw new Error('No price ID found in subscription');
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: priceId },
    });

    if (!plan) {
      throw new Error(`No plan found for price ID: ${priceId}`);
    }

    return { userId, plan };
  }

  // Create subscription in database
  private async createDatabaseSubscription(
    subscription: Stripe.Subscription,
    userId: string,
    plan: any,
  ): Promise<any> {
    const priceId = subscription.items.data[0]?.price.id!;

    return prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: priceId,
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        trialStart: subscription.trial_start
          ? new Date(subscription.trial_start * 1000)
          : null,
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : null,
        amount: subscription.items.data[0]?.price.unit_amount || 0,
        currency: subscription.items.data[0]?.price.currency || 'usd',
        interval: this.mapStripeInterval(subscription.items.data[0]?.price.recurring?.interval || 'month'),
        intervalCount: subscription.items.data[0]?.price.recurring?.interval_count || 1,
      },
      include: {
        plan: true,
        user: true,
      },
    });
  }

  // Send subscription-related notifications
  private async sendSubscriptionNotifications(newSubscription: any, plan: any): Promise<void> {
    await notificationService.notifySubscriptionCreated(newSubscription);
    await notificationService.sendSlackNotification(
      `🎉 New subscription! ${newSubscription.user.email} subscribed to ${plan.name}`,
      'sales',
    );
  }

  // Initialize usage quotas for a new subscription
  private async initializeUsageQuotas(subscriptionId: string, plan: any): Promise<void> {
    try {
      const { usageService } = await import('./usage.service.js');
      const { UsageMetricType } = await import('@my/types');

      const quotaPromises = [];

      // Initialize user quota if plan has user limit
      if (plan.maxUsers) {
        quotaPromises.push(
          usageService.updateQuota(
            subscriptionId,
            UsageMetricType.USERS,
            plan.maxUsers,
            { alertThreshold: 80 },
          ),
        );
      }

      // Initialize project quota if plan has project limit
      if (plan.maxProjects) {
        quotaPromises.push(
          usageService.updateQuota(
            subscriptionId,
            UsageMetricType.PROJECTS,
            plan.maxProjects,
            { alertThreshold: 80 },
          ),
        );
      }

      // Initialize storage quota if plan has storage limit
      if (plan.maxStorage) {
        quotaPromises.push(
          usageService.updateQuota(
            subscriptionId,
            UsageMetricType.STORAGE,
            Number(plan.maxStorage),
            { alertThreshold: 85 },
          ),
        );
      }

      // Initialize API calls quota (default limit for all plans)
      const apiCallLimit = plan.name === 'STARTER' ? 10000 :
        plan.name === 'PRO' ? 100000 :
          1000000; // Enterprise

      quotaPromises.push(
        usageService.updateQuota(
          subscriptionId,
          UsageMetricType.API_CALLS,
          apiCallLimit,
          { alertThreshold: 90 },
        ),
      );

      await Promise.all(quotaPromises);
      console.log(`📊 Usage quotas initialized for subscription: ${subscriptionId}`);

    } catch (error) {
      console.error('❌ Error initializing usage quotas:', error);
      // Don't throw - quota initialization failure shouldn't stop subscription creation
    }
  }

  // Handle subscription updates with enhanced logging
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const existingSubscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
        include: { plan: true, user: true },
      });

      if (!existingSubscription) {
        console.warn(`⚠️  Subscription not found for update: ${subscription.id}`);
        return;
      }

      const previousStatus = existingSubscription.status;
      const newStatus = this.mapStripeStatus(subscription.status);

      const updatedSubscription = await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: newStatus,
          currentPeriodStart: new Date(subscription.items.data[0]?.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.items.data[0]?.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
        include: {
          plan: true,
          user: true,
        },
      });

      console.log(`🔄 Updated subscription ${subscription.id}: ${previousStatus} → ${newStatus}`);

      // Handle status changes
      if (previousStatus !== newStatus) {
        await this.handleStatusChange(updatedSubscription, previousStatus, newStatus);
      }

    } catch (error) {
      console.error('❌ Error handling subscription updated:', error);
      throw error;
    }
  }

  // Handle subscription deletion with notifications
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const deletedSubscription = await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
        include: {
          plan: true,
          user: true,
        },
      });

      console.log(`❌ Deleted subscription: ${subscription.id}`);

      // Send cancellation notification
      await notificationService.notifySubscriptionCanceled(deletedSubscription);

      // Alert team about churn
      await notificationService.sendSlackNotification(
        `😞 Subscription canceled: ${deletedSubscription.user.email} (${deletedSubscription.plan.name})`,
        'churn',
      );

    } catch (error) {
      console.error('❌ Error handling subscription deleted:', error);
      throw error;
    }
  }

  // Handle successful payments with notifications
  private async handleInvoicePaymentSucceeded(invoice: InvoiceWithSubscription): Promise<void> {
    try {
      if (!invoice.subscription) return;

      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription as string },
        include: { plan: true, user: true },
      });

      if (!subscription) {
        console.warn(`⚠️  Subscription not found for invoice: ${invoice.id}`);
        return;
      }

      console.log(`💳 Payment succeeded for subscription ${subscription.stripeSubscriptionId}: ${invoice.amount_paid / 100} ${invoice.currency}`);

      // Send payment confirmation
      await notificationService.notifyPaymentSucceeded(subscription, invoice.amount_paid);

      // Update next billing date if needed
      if (invoice.period_end) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPeriodEnd: new Date(invoice.period_end * 1000),
          },
        });
      }

    } catch (error) {
      console.error('❌ Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  // Handle failed payments with urgent notifications
  private async handleInvoicePaymentFailed(invoice: InvoiceWithSubscription): Promise<void> {
    try {
      if (!invoice.subscription) return;

      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription as string },
        include: { plan: true, user: true },
      });

      if (!subscription) {
        console.warn(`⚠️  Subscription not found for failed invoice: ${invoice.id}`);
        return;
      }

      console.log(`⚠️  Payment failed for subscription ${subscription.stripeSubscriptionId}: ${invoice.amount_due / 100} ${invoice.currency}`);

      // Send payment failure notification
      await notificationService.notifyPaymentFailed(subscription, invoice.amount_due);

      // Alert team about payment failure
      await notificationService.sendSlackNotification(
        `🚨 Payment failed: ${subscription.user.email} (${subscription.plan.name}) - $${invoice.amount_due / 100}`,
        'billing-alerts',
      );

      // Admin notification for high-value failures
      if (invoice.amount_due >= 5000) { // $50+
        await notificationService.notifyAdmin('High-Value Payment Failure', {
          userEmail: subscription.user.email,
          planName: subscription.plan.name,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          subscriptionId: subscription.stripeSubscriptionId,
        });
      }

    } catch (error) {
      console.error('❌ Error handling invoice payment failed:', error);
      throw error;
    }
  }

  // Handle customer creation
  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    try {
      const userId = customer.metadata?.userId;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customer.id },
        });

        console.log(`Created customer for user ${userId}:`, customer.id);
      }
    } catch (error) {
      console.error('Error handling customer created:', error);
      throw error;
    }
  }

  // Handle customer updates
  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    try {
      // Update user information if needed
      const userId = customer.metadata?.userId;
      if (userId && customer.email) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customer.id },
          data: {
            email: customer.email,
            name: customer.name || undefined,
          },
        });

        console.log(`Updated customer:`, customer.id);
      }
    } catch (error) {
      console.error('Error handling customer updated:', error);
      throw error;
    }
  }

  // Handle checkout session completion
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      if (session.mode === 'subscription' && session.subscription) {
        // The subscription.created webhook will handle the actual subscription creation
        console.log(`Checkout session completed for subscription:`, session.subscription);
      }
    } catch (error) {
      console.error('Error handling checkout session completed:', error);
      throw error;
    }
  }

  // Helper methods
  private async getCustomerFromStripe(customerId: string): Promise<Stripe.Customer> {
    const stripe = stripeService.getStripeInstance();
    const customer = await stripe.customers.retrieve(customerId);
    return customer as Stripe.Customer;
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      past_due: SubscriptionStatus.PAST_DUE,
      trialing: SubscriptionStatus.TRIALING,
      unpaid: SubscriptionStatus.UNPAID,
      paused: SubscriptionStatus.ACTIVE, // Map paused to ACTIVE as fallback
    };
    return statusMap[stripeStatus] || SubscriptionStatus.INCOMPLETE;
  }

  private mapStripeInterval(stripeInterval: string): BillingInterval {
    return stripeInterval.toUpperCase() === 'YEAR' ? BillingInterval.YEAR : BillingInterval.MONTH;
  }

  // Handle status changes with appropriate notifications
  private async handleStatusChange(
    subscription: any,
    previousStatus: string,
    newStatus: string,
  ): Promise<void> {
    // Subscription became active after trial
    if (previousStatus === 'TRIALING' && newStatus === 'ACTIVE') {
      await notificationService.sendSlackNotification(
        `🎯 Trial converted: ${subscription.user.email} (${subscription.plan.name})`,
        'conversions',
      );
    }

    // Subscription went past due
    if (newStatus === 'PAST_DUE') {
      await notificationService.sendSlackNotification(
        `⚠️  Subscription past due: ${subscription.user.email} (${subscription.plan.name})`,
        'billing-alerts',
      );
    }

    // Subscription became unpaid (about to cancel)
    if (newStatus === 'UNPAID') {
      await notificationService.sendSlackNotification(
        `🚨 Subscription unpaid (will cancel): ${subscription.user.email} (${subscription.plan.name})`,
        'billing-alerts',
      );

      // Final attempt notification to user
      await notificationService.notifyAdmin('Subscription About to Cancel', {
        userEmail: subscription.user.email,
        planName: subscription.plan.name,
        subscriptionId: subscription.stripeSubscriptionId,
      });
    }
  }

  // Check and notify about revenue milestones
  private async checkRevenueMilestone(): Promise<void> {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Calculate monthly recurring revenue (MRR)
      const activeSubscriptions = await prisma.subscription.findMany({
        where: {
          status: { in: ['ACTIVE', 'TRIALING'] },
          createdAt: {
            gte: currentMonth,
            lt: nextMonth,
          },
        },
        include: { plan: true },
      });

      const monthlyRevenue = activeSubscriptions.reduce((total, sub) => {
        // Convert to monthly amount
        const monthlyAmount = sub.interval === 'YEAR'
          ? sub.amount / 12
          : sub.amount;
        return total + monthlyAmount;
      }, 0);

      // Check milestones: $1k, $5k, $10k, $25k, $50k, $100k
      const milestones = [100000, 500000, 1000000, 2500000, 5000000, 10000000]; // in cents

      for (const milestone of milestones) {
        if (monthlyRevenue >= milestone) {
          await notificationService.notifyRevenueMilestone(monthlyRevenue, milestone);
          break; // Only notify the highest reached milestone
        }
      }

    } catch (error) {
      console.error('Error checking revenue milestone:', error);
      // Don't throw - this is not critical
    }
  }

  // Send success notifications for important events
  private async notifyWebhookSuccess(event: Stripe.Event): Promise<void> {
    const criticalEvents = [
      'customer.subscription.created',
      'customer.subscription.deleted',
      'invoice.payment_failed',
    ];

    if (criticalEvents.includes(event.type)) {
      console.log(`📢 Critical webhook processed: ${event.type}`);
    }
  }

  // Utility: Sleep for retry delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get detailed webhook processing statistics
  async getWebhookStats(days: number = 7): Promise<{
    totalEvents: number
    processedEvents: number
    failedEvents: number
    eventTypes: Record<string, number>
    errorRate: number
  }> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.webhookEvent.findMany({
      where: {
        createdAt: { gte: since },
      },
    });

    const totalEvents = events.length;
    const processedEvents = events.filter(e => e.processed).length;
    const failedEvents = events.filter(e => e.processingError).length;

    const eventTypes = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorRate = totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0;

    return {
      totalEvents,
      processedEvents,
      failedEvents,
      eventTypes,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  // Clean up old webhook events (run via cron job)
  async cleanupOldWebhookEvents(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.webhookEvent.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        processed: true,
      },
    });

    console.log(`🧹 Cleaned up ${result.count} old webhook events (older than ${olderThanDays} days)`);
    return result.count;
  }
}

export const webhookService = new WebhookService();
