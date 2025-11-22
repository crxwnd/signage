/**
 * Display Routes
 * HTTP routes for display management
 */

import { Router, type Router as ExpressRouter } from 'express';
import * as displaysController from '../controllers/displaysController';

const router: ExpressRouter = Router();

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
