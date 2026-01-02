/**
 * Alert Routes
 * API endpoints for alert management
 */

import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import * as alertController from '../controllers/alertController';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/alerts - List alerts
router.get('/', alertController.getAlerts);

// GET /api/alerts/:id - Get single alert
router.get('/:id', alertController.getAlertById);

// POST /api/alerts - Create alert (HOTEL_ADMIN or SUPER_ADMIN only)
router.post('/', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), alertController.createAlert);

// PUT /api/alerts/:id - Update alert
router.put('/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), alertController.updateAlert);

// PUT /api/alerts/:id/deactivate - Deactivate alert
router.put('/:id/deactivate', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), alertController.deactivateAlert);

// DELETE /api/alerts/:id - Delete alert
router.delete('/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), alertController.deleteAlert);

export default router;
