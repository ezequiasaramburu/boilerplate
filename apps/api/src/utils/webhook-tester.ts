import Stripe from 'stripe';
import { webhookService } from '../services/webhook.service.js';
import { stripeService } from '../services/stripe.service.js';

interface TestWebhookOptions {
  eventType: string
  customData?: any
  customerId?: string
  subscriptionId?: string
  delay?: number
}

class WebhookTester {
  private stripe: Stripe;

  constructor() {
    this.stripe = stripeService.getStripeInstance();
  }

  // Simulate a webhook event for testing
  async simulateWebhookEvent(options: TestWebhookOptions): Promise<{
    success: boolean
    eventId: string
    message: string
    error?: string
  }> {
    try {
      const event = await this.createTestEvent(options);
      const payload = JSON.stringify(event);
      const signature = this.createTestSignature(payload);

      // Add optional delay to simulate real-world timing
      if (options.delay) {
        await this.sleep(options.delay);
      }

      await webhookService.processStripeWebhook(payload, signature);

      return {
        success: true,
        eventId: event.id,
        message: `Successfully processed test webhook: ${options.eventType}`,
      };
    } catch (error) {
      return {
        success: false,
        eventId: '',
        message: `Failed to process test webhook: ${options.eventType}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Create sample webhook events for different scenarios
  async createSampleEvents(): Promise<void> {
    console.log('🧪 Creating sample webhook events for testing...');

    const testEvents = [
      {
        eventType: 'customer.created',
        description: 'New customer created',
      },
      {
        eventType: 'customer.subscription.created',
        description: 'New subscription created',
      },
      {
        eventType: 'invoice.payment_succeeded',
        description: 'Payment succeeded',
      },
      {
        eventType: 'invoice.payment_failed',
        description: 'Payment failed',
      },
      {
        eventType: 'customer.subscription.updated',
        description: 'Subscription updated',
      },
      {
        eventType: 'customer.subscription.deleted',
        description: 'Subscription canceled',
      },
    ];

    for (const testEvent of testEvents) {
      try {
        const result = await this.simulateWebhookEvent({
          eventType: testEvent.eventType,
          delay: 500, // 500ms delay between events
        });

        console.log(`${result.success ? '✅' : '❌'} ${testEvent.description}: ${result.message}`);

        if (!result.success && result.error) {
          console.log(`   Error: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Error simulating ${testEvent.eventType}:`, error);
      }
    }
  }

  // Create a test Stripe event
  private async createTestEvent(options: TestWebhookOptions): Promise<Stripe.Event> {
    const eventId = `evt_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const created = Math.floor(Date.now() / 1000);
    const data = this.createTestEventData(options, created);

    return {
      id: eventId,
      object: 'event',
      api_version: '2023-10-16',
      created,
      data,
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: null,
        idempotency_key: null,
      },
      type: options.eventType as any,
    };
  }

  // Create test event data based on event type
  private createTestEventData(options: TestWebhookOptions, created: number): any {
    switch (options.eventType) {
      case 'customer.created':
        return this.createCustomerCreatedData(options, created);
      case 'customer.subscription.created':
        return this.createSubscriptionCreatedData(options, created);
      case 'customer.subscription.updated':
        return this.createSubscriptionUpdatedData(options, created);
      case 'customer.subscription.deleted':
        return this.createSubscriptionDeletedData(options, created);
      case 'invoice.payment_succeeded':
        return this.createInvoiceSucceededData(options, created);
      case 'invoice.payment_failed':
        return this.createInvoiceFailedData(options, created);
      case 'checkout.session.completed':
        return this.createCheckoutCompletedData(options, created);
      default:
        return options.customData || { object: { id: 'test_object' } };
    }
  }

  private createCustomerCreatedData(options: TestWebhookOptions, created: number): any {
    return {
      object: {
        id: options.customerId || 'cus_test_12345',
        object: 'customer',
        email: 'test@example.com',
        metadata: { userId: 'user_test_12345' },
        created,
      },
    };
  }

  private createSubscriptionCreatedData(options: TestWebhookOptions, created: number): any {
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

    return {
      object: {
        id: options.subscriptionId || 'sub_test_12345',
        object: 'subscription',
        customer: options.customerId || 'cus_test_12345',
        status: 'active',
        current_period_start: created,
        current_period_end: created + thirtyDaysInSeconds,
        cancel_at_period_end: false,
        trial_start: null,
        trial_end: null,
        canceled_at: null,
        items: {
          data: [{
            price: {
              id: 'price_test_pro_monthly',
              unit_amount: 2999,
              currency: 'usd',
              recurring: { interval: 'month', interval_count: 1 },
            },
          }],
        },
      },
    };
  }

  private createSubscriptionUpdatedData(options: TestWebhookOptions, created: number): any {
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

    return {
      object: {
        id: options.subscriptionId || 'sub_test_12345',
        object: 'subscription',
        customer: options.customerId || 'cus_test_12345',
        status: 'active',
        current_period_start: created,
        current_period_end: created + thirtyDaysInSeconds,
        cancel_at_period_end: true,
        canceled_at: created,
      },
    };
  }

  private createSubscriptionDeletedData(options: TestWebhookOptions, created: number): any {
    return {
      object: {
        id: options.subscriptionId || 'sub_test_12345',
        object: 'subscription',
        customer: options.customerId || 'cus_test_12345',
        status: 'canceled',
        canceled_at: created,
      },
    };
  }

  private createInvoiceSucceededData(options: TestWebhookOptions, created: number): any {
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

    return {
      object: {
        id: 'in_test_12345',
        object: 'invoice',
        customer: options.customerId || 'cus_test_12345',
        subscription: options.subscriptionId || 'sub_test_12345',
        amount_paid: 2999,
        currency: 'usd',
        status: 'paid',
        period_end: created + thirtyDaysInSeconds,
      },
    };
  }

  private createInvoiceFailedData(options: TestWebhookOptions, created: number): any {
    return {
      object: {
        id: 'in_test_failed_12345',
        object: 'invoice',
        customer: options.customerId || 'cus_test_12345',
        subscription: options.subscriptionId || 'sub_test_12345',
        amount_due: 2999,
        currency: 'usd',
        status: 'open',
        attempt_count: 1,
      },
    };
  }

  private createCheckoutCompletedData(options: TestWebhookOptions, created: number): any {
    return {
      object: {
        id: 'cs_test_12345',
        object: 'checkout.session',
        customer: options.customerId || 'cus_test_12345',
        subscription: options.subscriptionId || 'sub_test_12345',
        mode: 'subscription',
        payment_status: 'paid',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      },
    };
  }

  // Create a test signature (for development only)
  private createTestSignature(payload: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const testSignature = `t=${timestamp},v1=test_signature_${Math.random().toString(36)}`;
    return testSignature;
  }

  // Utility: Sleep function
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test webhook processing performance
  async performanceTest(eventCount: number = 10): Promise<{
    totalEvents: number
    successfulEvents: number
    failedEvents: number
    averageProcessingTime: number
    errors: string[]
  }> {
    console.log(`🚀 Starting performance test with ${eventCount} events...`);

    const results = {
      totalEvents: eventCount,
      successfulEvents: 0,
      failedEvents: 0,
      averageProcessingTime: 0,
      errors: [] as string[],
    };

    const processingTimes = await this.executePerformanceTests(eventCount, results);

    const totalTime = processingTimes.reduce((a, b) => a + b, 0);
    results.averageProcessingTime = totalTime / processingTimes.length;

    this.logPerformanceResults(results);
    return results;
  }

  // Execute performance test events
  private async executePerformanceTests(
    eventCount: number,
    results: { successfulEvents: number; failedEvents: number; errors: string[] },
  ): Promise<number[]> {
    const processingTimes: number[] = [];

    for (let i = 0; i < eventCount; i++) {
      const startTime = Date.now();

      try {
        const result = await this.simulateWebhookEvent({
          eventType: 'customer.subscription.created',
          customerId: `cus_perf_test_${i}`,
          subscriptionId: `sub_perf_test_${i}`,
        });

        const processingTime = Date.now() - startTime;
        processingTimes.push(processingTime);

        if (result.success) {
          results.successfulEvents++;
        } else {
          results.failedEvents++;
          if (result.error) {
            results.errors.push(result.error);
          }
        }
      } catch (error) {
        results.failedEvents++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return processingTimes;
  }

  // Log performance test results
  private logPerformanceResults(results: {
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    averageProcessingTime: number;
    errors: string[];
  }): void {
    console.log(`📊 Performance test completed:`);
    console.log(`   Total events: ${results.totalEvents}`);
    console.log(`   Successful: ${results.successfulEvents}`);
    console.log(`   Failed: ${results.failedEvents}`);
    console.log(`   Average processing time: ${results.averageProcessingTime.toFixed(2)}ms`);

    if (results.errors.length > 0) {
      console.log(`   Errors:`);
      results.errors.forEach((error, index) => {
        console.log(`     ${index + 1}. ${error}`);
      });
    }
  }
}

export const webhookTester = new WebhookTester();

// CLI utility for testing webhooks
if (process.argv[2] === 'test-webhooks') {
  (async () => {
    const command = process.argv[3];

    switch (command) {
      case 'samples':
        await webhookTester.createSampleEvents();
        break;
      case 'performance': {
        const eventCount = parseInt(process.argv[4]) || 10;
        await webhookTester.performanceTest(eventCount);
        break;
      }
      default:
        console.log('📋 Available webhook test commands:');
        console.log('   npm run test-webhooks samples     - Create sample webhook events');
        console.log('   npm run test-webhooks performance [count] - Run performance test');
    }

    process.exit(0);
  })();
}
