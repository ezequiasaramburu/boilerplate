import { Router } from 'express';
import { changePasswordSchema, loginSchema, refreshTokenSchema, registerSchema, verifyEmailTokenSchema } from '@my/types';
import { registrationRateLimit, sensitiveRateLimit, validateRequest } from '../middleware/index.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

// Public routes with specific rate limits
router.post('/register',
  registrationRateLimit, // Strict limit on registrations
  validateRequest({ body: registerSchema }),
  authController.register.bind(authController),
);

router.post('/login',
  validateRequest({ body: loginSchema }),
  authController.login.bind(authController),
);

router.post('/refresh',
  validateRequest({ body: refreshTokenSchema }),
  authController.refreshToken.bind(authController),
);

router.post('/logout',
  validateRequest({ body: refreshTokenSchema }),
  authController.logout.bind(authController),
);

// Protected routes (require authentication)
router.get('/profile',
  authenticateToken,
  authController.getProfile.bind(authController),
);

router.post('/logout-all',
  authenticateToken,
  authController.logoutAll.bind(authController),
);

router.post('/change-password',
  authenticateToken,
  sensitiveRateLimit, // Very strict limit on password changes
  validateRequest({ body: changePasswordSchema }),
  authController.changePassword.bind(authController),
);

// Password reset
router.post('/password/forgot',
  registrationRateLimit,
  authController.requestPasswordReset.bind(authController),
);
router.post('/password/reset',
  sensitiveRateLimit,
  authController.resetPassword.bind(authController),
);

// Email verification
router.post('/email/send-verification',
  authenticateToken,
  authController.sendEmailVerification.bind(authController),
);
router.get('/email/verify',
  validateRequest({ query: verifyEmailTokenSchema }),
  authController.verifyEmail.bind(authController),
);

export { router as authRouter };
