import type { Request, Response, NextFunction } from 'express'
import { stripeService } from '../services/stripe.service.js'
import type { 
  ApiResponse, 
  CreateCheckoutSessionRequest,
  CreatePortalSessionRequest,
  AuthUser 
} from '@my/types'

export class BillingController {
  // Get available subscription plans
  async getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await stripeService.getSubscriptionPlans()

      const response: ApiResponse = {
        success: true,
        message: 'Subscription plans retrieved successfully',
        data: { plans },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  // Create checkout session for subscription
  async createCheckoutSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id
      const checkoutRequest: CreateCheckoutSessionRequest = req.body

      const checkoutSession = await stripeService.createCheckoutSession(userId, checkoutRequest)

      const response: ApiResponse = {
        success: true,
        message: 'Checkout session created successfully',
        data: checkoutSession,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  // Create customer portal session
  async createPortalSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id
      const portalRequest: CreatePortalSessionRequest = req.body

      const portalSession = await stripeService.createPortalSession(userId, portalRequest)

      const response: ApiResponse = {
        success: true,
        message: 'Customer portal session created successfully',
        data: portalSession,
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  // Get user's subscription and usage information
  async getSubscriptionUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id

      const usage = await stripeService.getUserSubscriptionUsage(userId)

      const response: ApiResponse = {
        success: true,
        message: 'Subscription usage retrieved successfully',
        data: { usage },
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  // Cancel subscription
  async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id
      const { cancelAtPeriodEnd = true } = req.body

      await stripeService.cancelSubscription(userId, cancelAtPeriodEnd)

      const response: ApiResponse = {
        success: true,
        message: cancelAtPeriodEnd 
          ? 'Subscription will be canceled at the end of the current period'
          : 'Subscription canceled immediately',
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  // Reactivate subscription
  async reactivateSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req.user as AuthUser).id

      await stripeService.reactivateSubscription(userId)

      const response: ApiResponse = {
        success: true,
        message: 'Subscription reactivated successfully',
      }

      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}

export const billingController = new BillingController() 