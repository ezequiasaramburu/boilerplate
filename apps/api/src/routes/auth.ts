import { Router } from 'express'
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '@my/types'
import { validateRequest } from '../middleware/index.js'
import { authenticateToken } from '../middleware/auth.middleware.js'
import { authController } from '../controllers/auth.controller.js'

const router = Router()

// Public routes
router.post('/register', validateRequest({ body: registerSchema }), authController.register.bind(authController))
router.post('/login', validateRequest({ body: loginSchema }), authController.login.bind(authController))
router.post('/refresh', validateRequest({ body: refreshTokenSchema }), authController.refreshToken.bind(authController))
router.post('/logout', validateRequest({ body: refreshTokenSchema }), authController.logout.bind(authController))

// Protected routes (require authentication)
router.get('/profile', authenticateToken, authController.getProfile.bind(authController))
router.post('/logout-all', authenticateToken, authController.logoutAll.bind(authController))
router.post('/change-password', authenticateToken, validateRequest({ body: changePasswordSchema }), authController.changePassword.bind(authController))

export { router as authRouter } 