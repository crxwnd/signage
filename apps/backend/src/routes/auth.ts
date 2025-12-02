/**
 * Authentication Routes
 * HTTP routes for authentication and user management
 */

import { Router, type Router as ExpressRouter } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router: ExpressRouter = Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Public route
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 * Public route
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 * Public route (uses httpOnly cookie)
 */
router.post('/refresh', authController.refresh);

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

export default router;
