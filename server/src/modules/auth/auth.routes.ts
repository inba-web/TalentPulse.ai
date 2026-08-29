import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';
import rateLimit from 'express-rate-limit';

const authRouter = Router();

// Strict rate limiter for registration & logins (protects against brute-forcing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
});

authRouter.post('/register', authLimiter, AuthController.register);
authRouter.post('/login', authLimiter, AuthController.login);
authRouter.post('/logout', requireAuth, AuthController.logout);
authRouter.post('/refresh', AuthController.refresh);
authRouter.get('/verify-email', AuthController.verifyEmail);
authRouter.post('/forgot-password', authLimiter, AuthController.forgotPassword);
authRouter.post('/reset-password', authLimiter, AuthController.resetPassword);
authRouter.post('/change-password', requireAuth, AuthController.changePassword);
authRouter.get('/me', requireAuth, AuthController.me);

export default authRouter;
