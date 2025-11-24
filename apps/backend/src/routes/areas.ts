/**
 * Areas Routes
 * API routes for hotel areas management
 */

import { Router, type Router as RouterType } from 'express';
import { getAreas } from '../controllers/areasController';

const router: RouterType = Router();

/**
 * GET /api/areas
 * Get all areas
 */
router.get('/', getAreas);

export default router;
