/**
 * Schedule Routes
 * API endpoints for schedule management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as scheduleController from '../controllers/scheduleController';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.get('/', scheduleController.getSchedules);
router.get('/:id', scheduleController.getSchedule);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

// Special endpoints
router.get('/active/:displayId', scheduleController.getActiveContentForDisplay);
router.get('/:id/preview', scheduleController.getSchedulePreview);

export default router;
