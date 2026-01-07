/**
 * Hotels Routes
 * HTTP routes for hotel management
 * RBAC: SUPER_ADMIN for create/update/delete
 */

import { Router, type Router as ExpressRouter } from 'express';
import * as hotelsController from '../controllers/hotelsController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/hotels/stats
 * Get global statistics (must be before /:id)
 */
router.get('/stats', hotelsController.getHotelStats);

/**
 * GET /api/hotels
 * Get all hotels (filtered by role)
 */
router.get('/', hotelsController.getHotels);

/**
 * GET /api/hotels/:id
 * Get hotel by ID with statistics
 */
router.get('/:id', hotelsController.getHotelById);

/**
 * POST /api/hotels
 * Create new hotel (SUPER_ADMIN only)
 */
router.post('/', requireRole(['SUPER_ADMIN']), hotelsController.createHotel);

/**
 * PATCH /api/hotels/:id
 * Update hotel (SUPER_ADMIN only)
 */
router.patch('/:id', requireRole(['SUPER_ADMIN']), hotelsController.updateHotel);

/**
 * DELETE /api/hotels/:id
 * Delete hotel (SUPER_ADMIN only)
 */
router.delete('/:id', requireRole(['SUPER_ADMIN']), hotelsController.deleteHotel);

export default router;
