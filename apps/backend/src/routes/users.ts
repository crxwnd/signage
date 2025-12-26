/**
 * Users Routes
 * HTTP routes for user management
 * Protected: SUPER_ADMIN and HOTEL_ADMIN only
 */

import { Router, type Router as ExpressRouter } from 'express';
import * as usersController from '../controllers/usersController';
import { authenticate } from '../middleware/auth';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/users
 * Get all users (filtered by role permissions)
 */
router.get('/', usersController.getUsers);

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', usersController.getUserById);

/**
 * POST /api/users
 * Create new user
 */
router.post('/', usersController.createUser);

/**
 * PATCH /api/users/:id
 * Update user
 */
router.patch('/:id', usersController.updateUser);

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', usersController.deleteUser);

export default router;
