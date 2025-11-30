/**
 * Content Routes
 * HTTP routes for content management
 */

import { Router, type Router as ExpressRouter } from 'express';
import * as contentController from '../controllers/contentController';

const router: ExpressRouter = Router();

/**
 * GET /api/content/stats
 * Get content statistics
 */
router.get('/stats', contentController.getContentStats);

/**
 * GET /api/content
 * Get all content with optional filtering
 */
router.get('/', contentController.getContents);

/**
 * GET /api/content/:id
 * Get content by ID
 */
router.get('/:id', contentController.getContentById);

/**
 * POST /api/content
 * Create new content
 */
router.post('/', contentController.createContent);

/**
 * PATCH /api/content/:id
 * Update content
 */
router.patch('/:id', contentController.updateContent);

/**
 * DELETE /api/content/:id
 * Delete content
 */
router.delete('/:id', contentController.deleteContent);

export default router;
