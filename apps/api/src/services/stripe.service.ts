import Stripe from 'stripe'
import { prisma } from '@my/database'
import type { 
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  CreatePortalSessionRequest,
  CreatePortalSessionResponse,
  SubscriptionUsage,
  BillingInterval,
  SubscriptionStatus
} from '@my/types'

class StripeService {
  private stripe: Stripe | null = null

  constructor() {
    // Don't initialize Stripe immediately - wait until it's needed
  }

  private initializeStripe(): Stripe {
    if (this.stripe) {
      return this.stripe
    }

    let stripeSecretKey = process.env.STRIPE_SECRET_KEY
    
    // For development, allow a dummy key to prevent initialization errors
    if (!stripeSecretKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`
          ⚠️  Stripe not configured for development
          To use billing features, add your Stripe keys to .env:
          
          STRIPE_SECRET_KEY=sk_test_your_key
          STRIPE_PUBLISHABLE_KEY=pk_test_your_key  
          STRIPE_WEBHOOK_SECRET=whsec_your_secret
          
          Using dummy key for now...
        `)
        stripeSecretKey = 'sk_test_dummy_key_for_development'
      } else {
        throw new Error('STRIPE_SECRET_KEY environment variable is required for billing operations')
      }
    }

    try {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-05-28.basil', // Latest API version
        typescript: true,
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development' && stripeSecretKey === 'sk_test_dummy_key_for_development') {
        console.warn('Stripe initialized with dummy key - billing features disabled')
        // Create a dummy Stripe object for development
        this.stripe = {} as Stripe
      } else {
        throw error
      }
    }

    return this.stripe
  }

  // Create checkout session for subscription
  async createCheckoutSession(
    userId: string,
    request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const stripe = this.initializeStripe()
      
      // Get or create Stripe customer
      const customer = await this.getOrCreateCustomer(userId)

      // Default URLs
      const successUrl = request.successUrl || `${process.env.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = request.cancelUrl || `${process.env.FRONTEND_URL}/billing/cancel`

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: request.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        metadata: {
          userId,
          ...request.metadata,
        },
      }

      // Add trial if specified
      if (request.trialDays && request.trialDays > 0) {
        sessionParams.subscription_data = {
          trial_period_days: request.trialDays,
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      if (!session.url) {
        throw new Error('Failed to create checkout session URL')
      }

      return {
        sessionId: session.id,
        url: session.url,
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw new Error('Failed to create checkout session')
    }
  }

  // Create customer portal session
  async createPortalSession(
    userId: string,
    request: CreatePortalSessionRequest
  ): Promise<CreatePortalSessionResponse> {
    try {
      const stripe = this.initializeStripe()
      
      // Get Stripe customer
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      })

      if (!user?.stripeCustomerId) {
        throw new Error('User does not have a Stripe customer ID')
      }

      const returnUrl = request.returnUrl || `${process.env.FRONTEND_URL}/billing`

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      })

      return {
        url: session.url,
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      throw new Error('Failed to create customer portal session')
    }
  }

  // Get or create Stripe customer
  async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          stripeCustomerId: true,
        },
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Return existing customer if available
      if (user.stripeCustomerId) {
        try {
          const customer = await this.stripe.customers.retrieve(user.stripeCustomerId)
          if (customer && !customer.deleted) {
            return customer as Stripe.Customer
          }
        } catch (error) {
          console.warn('Stripe customer not found, creating new one:', error)
        }
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })

      // Update user with new customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      })

      return customer
    } catch (error) {
      console.error('Error getting/creating customer:', error)
      throw new Error('Failed to get or create Stripe customer')
    }
  }

  // Get user's subscription usage and billing info
  async getUserSubscriptionUsage(userId: string): Promise<SubscriptionUsage | null> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
          },
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      if (!subscription) {
        return null
      }

      // TODO: Implement actual usage tracking
      // For now, return mock data
      return {
        planName: subscription.plan.name,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        usageStats: {
          users: { current: 1, limit: subscription.plan.maxUsers || undefined },
          projects: { current: 3, limit: subscription.plan.maxProjects || undefined },
          storage: { current: 250 * 1024 * 1024, limit: subscription.plan.maxStorage ? Number(subscription.plan.maxStorage) : undefined },
        },
        billingInfo: {
          amount: subscription.amount,
          currency: subscription.currency,
          interval: subscription.interval as BillingInterval,
          nextBillingDate: subscription.currentPeriodEnd,
        },
      }
    } catch (error) {
      console.error('Error getting subscription usage:', error)
      throw new Error('Failed to get subscription usage')
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: ['ACTIVE', 'TRIALING'],
          },
        },
      })

      if (!subscription) {
        throw new Error('No active subscription found')
      }

      if (cancelAtPeriodEnd) {
        // Cancel at period end
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { cancelAtPeriodEnd: true },
        })
      } else {
        // Cancel immediately
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId)

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          },
        })
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  // Reactivate subscription
  async reactivateSubscription(userId: string): Promise<void> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          cancelAtPeriodEnd: true,
        },
      })

      if (!subscription) {
        throw new Error('No subscription to reactivate')
      }

      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      })

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { cancelAtPeriodEnd: false },
      })
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      throw new Error('Failed to reactivate subscription')
    }
  }

  // Get available subscription plans
  async getSubscriptionPlans(): Promise<any[]> {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { active: true },
        orderBy: { amount: 'asc' },
      })

      return plans.map(plan => ({
        ...plan,
        features: plan.features ? (plan.features as string[]) : [],
        formattedAmount: this.formatAmount(plan.amount, plan.currency),
      }))
    } catch (error) {
      console.error('Error getting subscription plans:', error)
      throw new Error('Failed to get subscription plans')
    }
  }

  // Format amount for display
  private formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  // Get Stripe instance (for webhook handling)
  getStripeInstance(): Stripe {
    return this.stripe
  }
}

export const stripeService = new StripeService() 