/**
 * Display Routes
 * HTTP routes for display management
 *
 * SECURITY: All routes are protected by authentication middleware
 */

import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middleware/auth';
import * as displaysController from '../controllers/displaysController';

const router: ExpressRouter = Router();

// ==============================================
// SECURITY: Apply authentication to ALL routes
// ==============================================
router.use(authenticate);

/**
 * GET /api/displays/stats
 * Get display statistics
 */
router.get('/stats', displaysController.getDisplayStats);

/**
 * GET /api/displays
 * Get all displays with optional filtering
 */
router.get('/', displaysController.getDisplays);

/**
 * GET /api/displays/:id
 * Get display by ID
 */
router.get('/:id', displaysController.getDisplayById);

/**
 * POST /api/displays
 * Create new display
 */
router.post('/', displaysController.createDisplay);

/**
 * PATCH /api/displays/:id
 * Update display
 */
router.patch('/:id', displaysController.updateDisplay);

/**
 * DELETE /api/displays/:id
 * Delete display
 */
router.delete('/:id', displaysController.deleteDisplay);

export default router;
