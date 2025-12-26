/**
 * Hotels Routes
 * HTTP routes for hotel listing
 */

import { Router, type Router as ExpressRouter } from 'express';
import * as hotelsController from '../controllers/hotelsController';
import { authenticate } from '../middleware/auth';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/hotels
 * Get all hotels
 */
router.get('/', hotelsController.getHotels);

export default router;
