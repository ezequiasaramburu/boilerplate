import { z } from 'zod'

// Enums
export enum BillingInterval {
  MONTH = 'MONTH',
  YEAR = 'YEAR'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  PAST_DUE = 'PAST_DUE',
  TRIALING = 'TRIALING',
  UNPAID = 'UNPAID'
}

// Subscription Plan interfaces
export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  stripePriceId: string
  stripeProductId: string
  amount: number // Price in cents
  currency: string
  interval: BillingInterval
  intervalCount: number
  trialDays?: number
  features?: string[]
  maxUsers?: number
  maxProjects?: number
  maxStorage?: number
  popular: boolean
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// Subscription interfaces
export interface Subscription {
  id: string
  userId: string
  planId: string
  plan: SubscriptionPlan
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt?: Date
  trialStart?: Date
  trialEnd?: Date
  amount: number
  currency: string
  interval: BillingInterval
  intervalCount: number
  usageResetDate?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Stripe Customer interface
export interface StripeCustomer {
  id: string
  email: string
  name?: string
  subscriptions: Subscription[]
}

// API Request/Response types
export interface CreateCheckoutSessionRequest {
  priceId: string
  successUrl?: string
  cancelUrl?: string
  trialDays?: number
  metadata?: Record<string, string>
}

export interface CreateCheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface CreatePortalSessionRequest {
  returnUrl?: string
}

export interface CreatePortalSessionResponse {
  url: string
}

export interface SubscriptionUsage {
  planName: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  usageStats: {
    users: { current: number; limit?: number }
    projects: { current: number; limit?: number }
    storage: { current: number; limit?: number }
  }
  billingInfo: {
    amount: number
    currency: string
    interval: BillingInterval
    nextBillingDate: Date
  }
}

// Webhook event types
export interface WebhookEvent {
  id: string
  stripeEventId: string
  eventType: string
  processed: boolean
  data: any
  processingError?: string
  createdAt: Date
  updatedAt: Date
}

// Validation schemas
export const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  trialDays: z.number().min(0).max(365).optional(),
  metadata: z.record(z.string()).optional()
})

export const createPortalSessionSchema = z.object({
  returnUrl: z.string().url().optional()
})

export const subscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  stripePriceId: z.string().min(1, 'Stripe price ID is required'),
  stripeProductId: z.string().min(1, 'Stripe product ID is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  interval: z.nativeEnum(BillingInterval),
  intervalCount: z.number().min(1, 'Interval count must be at least 1'),
  trialDays: z.number().min(0).max(365).optional(),
  features: z.array(z.string()).optional(),
  maxUsers: z.number().min(1).optional(),
  maxProjects: z.number().min(1).optional(),
  maxStorage: z.number().min(1).optional(),
  popular: z.boolean().default(false),
  active: z.boolean().default(true)
})

// Stripe webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed'
} as const

export type StripeWebhookEventType = typeof STRIPE_WEBHOOK_EVENTS[keyof typeof STRIPE_WEBHOOK_EVENTS]

// Plan feature definitions
export const PLAN_FEATURES = {
  STARTER: [
    'Up to 5 projects',
    '1GB storage',
    'Basic support',
    'Standard templates'
  ],
  PRO: [
    'Unlimited projects',
    '100GB storage',
    'Priority support',
    'Premium templates',
    'Advanced analytics',
    'Custom branding'
  ],
  ENTERPRISE: [
    'Everything in Pro',
    'Unlimited storage',
    'White-label solution',
    '24/7 phone support',
    'Custom integrations',
    'SLA guarantee',
    'Dedicated account manager'
  ]
} as const 