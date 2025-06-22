import Stripe from 'stripe'
import { prisma } from '@my/database'
import { stripeService } from './stripe.service.js'
import { STRIPE_WEBHOOK_EVENTS, type StripeWebhookEventType } from '@my/types'

class WebhookService {
  // Verify and process Stripe webhook
  async processStripeWebhook(payload: string | Buffer, signature: string): Promise<void> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required')
      }

      // Verify webhook signature
      const stripe = stripeService.getStripeInstance()
      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

      // Check if we've already processed this event
      const existingEvent = await prisma.webhookEvent.findUnique({
        where: { stripeEventId: event.id },
      })

      if (existingEvent?.processed) {
        console.log(`Webhook event ${event.id} already processed`)
        return
      }

      // Store webhook event
      await prisma.webhookEvent.upsert({
        where: { stripeEventId: event.id },
        update: { processed: false },
        create: {
          stripeEventId: event.id,
          eventType: event.type,
          data: event.data as any,
          processed: false,
        },
      })

      // Process the event based on type
      await this.handleWebhookEvent(event)

      // Mark as processed
      await prisma.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: { processed: true },
      })

      console.log(`Successfully processed webhook event: ${event.type}`)
    } catch (error) {
      console.error('Error processing Stripe webhook:', error)
      
      // Store error in webhook event if we have the event ID
      try {
        const stripe = stripeService.getStripeInstance()
        const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
        
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
        })
      } catch (innerError) {
        console.error('Error storing webhook error:', innerError)
      }

      throw error
    }
  }

  // Handle different webhook event types
  private async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type as StripeWebhookEventType) {
      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_CREATED:
        await this.handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_UPDATED:
        await this.handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      case STRIPE_WEBHOOK_EVENTS.CHECKOUT_SESSION_COMPLETED:
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }
  }

  // Handle subscription creation
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const customer = await this.getCustomerFromStripe(subscription.customer as string)
      const userId = customer.metadata?.userId

      if (!userId) {
        console.warn('No userId found in customer metadata for subscription:', subscription.id)
        return
      }

      // Get subscription plan
      const priceId = subscription.items.data[0]?.price.id
      if (!priceId) {
        throw new Error('No price ID found in subscription')
      }

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: priceId },
      })

      if (!plan) {
        throw new Error(`No plan found for price ID: ${priceId}`)
      }

      // Create subscription in database
      await prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: priceId,
          status: this.mapStripeStatus(subscription.status),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          amount: subscription.items.data[0]?.price.unit_amount || 0,
          currency: subscription.items.data[0]?.price.currency || 'usd',
          interval: this.mapStripeInterval(subscription.items.data[0]?.price.recurring?.interval || 'month'),
          intervalCount: subscription.items.data[0]?.price.recurring?.interval_count || 1,
        },
      })

      console.log(`Created subscription for user ${userId}:`, subscription.id)
    } catch (error) {
      console.error('Error handling subscription created:', error)
      throw error
    }
  }

  // Handle subscription updates
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: this.mapStripeStatus(subscription.status),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
      })

      console.log(`Updated subscription:`, subscription.id)
    } catch (error) {
      console.error('Error handling subscription updated:', error)
      throw error
    }
  }

  // Handle subscription deletion
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      })

      console.log(`Deleted subscription:`, subscription.id)
    } catch (error) {
      console.error('Error handling subscription deleted:', error)
      throw error
    }
  }

  // Handle successful invoice payment
  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (invoice.subscription) {
        // Update subscription status to active
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: { status: 'ACTIVE' },
        })

        console.log(`Payment succeeded for subscription:`, invoice.subscription)
      }
    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error)
      throw error
    }
  }

  // Handle failed invoice payment
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      if (invoice.subscription) {
        // Update subscription status to past due
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription as string },
          data: { status: 'PAST_DUE' },
        })

        console.log(`Payment failed for subscription:`, invoice.subscription)
      }
    } catch (error) {
      console.error('Error handling invoice payment failed:', error)
      throw error
    }
  }

  // Handle customer creation
  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    try {
      const userId = customer.metadata?.userId
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customer.id },
        })

        console.log(`Created customer for user ${userId}:`, customer.id)
      }
    } catch (error) {
      console.error('Error handling customer created:', error)
      throw error
    }
  }

  // Handle customer updates
  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    try {
      // Update user information if needed
      const userId = customer.metadata?.userId
      if (userId && customer.email) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customer.id },
          data: { 
            email: customer.email,
            name: customer.name || undefined,
          },
        })

        console.log(`Updated customer:`, customer.id)
      }
    } catch (error) {
      console.error('Error handling customer updated:', error)
      throw error
    }
  }

  // Handle checkout session completion
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      if (session.mode === 'subscription' && session.subscription) {
        // The subscription.created webhook will handle the actual subscription creation
        console.log(`Checkout session completed for subscription:`, session.subscription)
      }
    } catch (error) {
      console.error('Error handling checkout session completed:', error)
      throw error
    }
  }

  // Helper methods
  private async getCustomerFromStripe(customerId: string): Promise<Stripe.Customer> {
    const stripe = stripeService.getStripeInstance()
    const customer = await stripe.customers.retrieve(customerId)
    return customer as Stripe.Customer
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
    const statusMap: Record<Stripe.Subscription.Status, string> = {
      active: 'ACTIVE',
      canceled: 'CANCELED',
      incomplete: 'INCOMPLETE',
      incomplete_expired: 'INCOMPLETE_EXPIRED',
      past_due: 'PAST_DUE',
      trialing: 'TRIALING',
      unpaid: 'UNPAID',
    }
    return statusMap[stripeStatus] || 'INCOMPLETE'
  }

  private mapStripeInterval(stripeInterval: string): string {
    return stripeInterval.toUpperCase()
  }
}

export const webhookService = new WebhookService() 