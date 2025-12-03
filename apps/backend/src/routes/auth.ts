/**
 * Authentication Routes
 * HTTP routes for authentication and user management
 */

import { Router, type Router as ExpressRouter } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { AUTH_RATE_LIMIT } from '../config/auth';

const router: ExpressRouter = Router();

/**
 * Rate limiter for authentication endpoints
 * Protects against brute force attacks
 * 5 requests per 15 minutes for sensitive auth operations
 */
const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT.windowMs,
  max: AUTH_RATE_LIMIT.max,
  message: AUTH_RATE_LIMIT.message,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/auth/register
 * Register a new user
 * Public route - rate limited (5 req/15min)
 */
router.post('/register', authRateLimiter, authController.register);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 * Public route - rate limited (5 req/15min)
 */
router.post('/login', authRateLimiter, authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 * Public route (uses httpOnly cookie) - rate limited (5 req/15min)
 */
router.post('/refresh', authRateLimiter, authController.refresh);

/**
 * POST /api/auth/logout
 * Logout user by clearing refresh token cookie
 * Public route
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Protected route - requires authentication
 */
router.get('/me', authenticate, authController.me);

/**
 * POST /api/auth/login/2fa
 * Complete 2FA login with TOTP token
 * Public route
 */
router.post('/login/2fa', authController.login2FA);

/**
 * POST /api/auth/2fa/setup
 * Setup 2FA for authenticated user
 * Protected route - requires authentication
 */
router.post('/2fa/setup', authenticate, authController.setup2FA);

/**
 * POST /api/auth/2fa/verify
 * Verify TOTP code and enable 2FA
 * Protected route - requires authentication
 */
router.post('/2fa/verify', authenticate, authController.verify2FA);

/**
 * POST /api/auth/2fa/disable
 * Disable 2FA for authenticated user
 * Protected route - requires authentication
 */
router.post('/2fa/disable', authenticate, authController.disable2FA);

export default router;
