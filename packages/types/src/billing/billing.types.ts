import { z } from 'zod';

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

export enum UsageMetricType {
  USERS = 'USERS',
  PROJECTS = 'PROJECTS',
  STORAGE = 'STORAGE',
  API_CALLS = 'API_CALLS',
  BANDWIDTH = 'BANDWIDTH',
  COMPUTE_HOURS = 'COMPUTE_HOURS',
  CUSTOM = 'CUSTOM'
}

export enum UsageAlertType {
  WARNING = 'WARNING',       // 80% threshold
  CRITICAL = 'CRITICAL',     // 95% threshold
  EXCEEDED = 'EXCEEDED',     // 100% threshold
  APPROACHING = 'APPROACHING' // 90% threshold
}

// Base entity interface for common fields
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Base billing fields
interface BaseBillingFields {
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
}

// Subscription Plan interface
export interface SubscriptionPlan extends BaseEntity, BaseBillingFields {
  name: string;
  description?: string;
  stripePriceId: string;
  stripeProductId: string;
  trialDays?: number;
  features?: string[];
  maxUsers?: number;
  maxProjects?: number;
  maxStorage?: number;
  popular: boolean;
  active: boolean;
}

// Base usage entity with common subscription/user references
interface BaseUsageEntity extends BaseEntity {
  subscriptionId: string;
  metricType: UsageMetricType;
}

// Usage tracking interfaces
export interface UsageRecord extends BaseUsageEntity {
  userId: string;
  quantity: number;
  unitPrice?: number;
  description?: string;
  metadata?: Record<string, any>;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  processed: boolean;
  invoiced: boolean;
}

export interface UsageQuota extends BaseUsageEntity {
  limitAmount: number;
  currentAmount: number;
  resetDate?: Date;
  hardLimit: boolean;
  alertThreshold?: number;
  exceeded: boolean;
  alertSent: boolean;
}

export interface UsageAlert extends BaseUsageEntity {
  userId: string;
  alertType: UsageAlertType;
  threshold: number;
  currentUsage: number;
  limitAmount: number;
  sent: boolean;
  acknowledged: boolean;
  resolvedAt?: Date;
  notificationSent: boolean;
  emailSent: boolean;
}

// Usage tracking API types - derived from main interfaces
export type RecordUsageRequest = Pick<UsageRecord, 'metricType' | 'quantity' | 'description' | 'metadata'>;

export interface UsageReportRequest {
  startDate?: Date;
  endDate?: Date;
  metricTypes?: UsageMetricType[];
  groupBy?: 'day' | 'week' | 'month';
  includeDetails?: boolean;
}

// Generic quota info type
export type QuotaInfo = {
  limit: number;
  current: number;
  percentage: number;
  exceeded: boolean;
};

// Usage report metric summary
export interface UsageMetricSummary {
  metricType: UsageMetricType;
  totalQuantity: number;
  recordCount: number;
  averageQuantity: number;
  quotaInfo?: QuotaInfo;
}

// Timeline data point
export interface TimelineDataPoint {
  date: Date;
  metricType: UsageMetricType;
  quantity: number;
}

export interface UsageReport {
  summary: {
    totalRecords: number;
    totalQuantity: number;
    period: {
      start: Date;
      end: Date;
    };
  };
  metrics: UsageMetricSummary[];
  timeline?: TimelineDataPoint[];
  details?: UsageRecord[];
}

// Usage trend type
export type UsageTrend = {
  direction: 'up' | 'down' | 'stable';
  change: number;
  period: string;
};

// Current usage stats per metric
export type UsageMetricStats = {
  current: number;
  limit?: number;
  percentage: number;
  exceeded: boolean;
  resetDate?: Date;
  trend?: UsageTrend;
};

export type CurrentUsageStats = {
  [key in UsageMetricType]?: UsageMetricStats;
};

// Subscription interface
export interface Subscription extends BaseEntity, BaseBillingFields {
  userId: string;
  planId: string;
  plan: SubscriptionPlan;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  trialStart?: Date;
  trialEnd?: Date;
  usageResetDate?: Date;
  metadata?: Record<string, any>;
}

// Stripe Customer interface
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  subscriptions: Subscription[];
}

// Session request/response types
export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export type CreateCheckoutSessionResponse = {
  sessionId: string;
  url: string;
};

// Public plan shape for pricing UI/API
export interface PublicPlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: BillingInterval;
  intervalCount: number;
  features: string[];
  stripePriceId: string;
  popular: boolean;
}

export type CreatePortalSessionRequest = {
  returnUrl?: string;
};

export type CreatePortalSessionResponse = {
  url: string;
};

// Subscription usage summary
export interface SubscriptionUsage {
  planName: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  usageStats: CurrentUsageStats;
  billingInfo: BaseBillingFields & {
    nextBillingDate: Date;
  };
  alerts?: UsageAlert[];
  quotas?: UsageQuota[];
}

// Webhook event types
export interface WebhookEvent extends BaseEntity {
  stripeEventId: string;
  eventType: string;
  processed: boolean;
  data: any;
  processingError?: string;
}

// Create input types using Omit utility type
export type CreateSubscriptionPlanInput = Omit<SubscriptionPlan, keyof BaseEntity>;
export type UpdateSubscriptionPlanInput = Partial<CreateSubscriptionPlanInput>;

export type CreateUsageQuotaInput = Omit<UsageQuota, keyof BaseEntity | 'currentAmount' | 'exceeded' | 'alertSent'>;
export type UpdateUsageQuotaInput = Partial<Pick<UsageQuota, 'limitAmount' | 'hardLimit' | 'alertThreshold' | 'resetDate'>>;

// Validation schemas
export const createCheckoutSessionSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  trialDays: z.number().min(0).max(365).optional(),
  metadata: z.record(z.string()).optional(),
});

export const createPortalSessionSchema = z.object({
  returnUrl: z.string().url().optional(),
});

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
  active: z.boolean().default(true),
});

export const recordUsageSchema = z.object({
  metricType: z.nativeEnum(UsageMetricType),
  quantity: z.number().positive('Quantity must be positive'),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const usageReportSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  metricTypes: z.array(z.nativeEnum(UsageMetricType)).optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
  includeDetails: z.boolean().optional(),
});

export const updateQuotaSchema = z.object({
  metricType: z.nativeEnum(UsageMetricType),
  limitAmount: z.number().min(0),
  hardLimit: z.boolean().optional(),
  alertThreshold: z.number().min(0).max(100).optional(),
});

export const acknowledgeAlertSchema = z.object({
  alertIds: z.array(z.string()),
});

// Stripe webhook event types we handle
export const STRIPE_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
} as const;

export type StripeWebhookEventType =
  typeof STRIPE_WEBHOOK_EVENTS[keyof typeof STRIPE_WEBHOOK_EVENTS];

// Plan feature definitions
export const PLAN_FEATURES = {
  STARTER: [
    'Up to 5 projects',
    '1GB storage',
    'Basic support',
    'Standard templates',
  ],
  PRO: [
    'Unlimited projects',
    '100GB storage',
    'Priority support',
    'Premium templates',
    'Advanced analytics',
    'Custom branding',
  ],
  ENTERPRISE: [
    'Everything in Pro',
    'Unlimited storage',
    'White-label solution',
    '24/7 phone support',
    'Custom integrations',
    'SLA guarantee',
    'Dedicated account manager',
  ],
} as const;
