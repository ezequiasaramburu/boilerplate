export interface EmailData {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export interface BaseSubscription {
  id: string
  amount: number
  currency: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
}

export interface BasePlan {
  id: string
  name: string
  description: string | null
  features: any
}

import type { BaseUser } from '../common';

// Utility type combining the base types
export type SubscriptionWithPlan = BaseSubscription & {
  plan: BasePlan
  user: BaseUser
}

// Utility types for common notification scenarios
export type NotificationUser = Pick<BaseUser, 'email' | 'name'>
export type SubscriptionBasics = Pick<BaseSubscription, 'amount' | 'currency' | 'currentPeriodEnd' | 'trialEnd'>
export type PlanBasics = Pick<BasePlan, 'name' | 'features'>

export interface NotificationTemplate {
  id: string
  name: string
  subject: string
  html: string
  text?: string
}

export interface SlackNotificationPayload {
  channel: string
  text: string
  username?: string
  icon_emoji?: string
  attachments?: Array<{
    color?: string
    title?: string
    text?: string
    fields?: Array<{
      title: string
      value: string
      short?: boolean
    }>
  }>
}
