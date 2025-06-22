import { Router } from 'express'
import passport from '../config/passport.config.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { socialAuthController } from '../controllers/social-auth.controller.js'

const router = Router()

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
  socialAuthController.handleOAuthSuccess.bind(socialAuthController)
)

// GitHub OAuth routes  
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }))
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/auth/failure' }),
  socialAuthController.handleOAuthSuccess.bind(socialAuthController)
)

// OAuth failure route
router.get('/failure', socialAuthController.handleOAuthFailure.bind(socialAuthController))

// Protected routes for managing social accounts
router.get('/accounts', authenticateToken, socialAuthController.getUserSocialAccounts.bind(socialAuthController))
router.delete('/accounts/:provider', authenticateToken, socialAuthController.unlinkSocialAccount.bind(socialAuthController))

export { router as socialAuthRouter } 