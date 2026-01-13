/**
 * Content Routes
 * HTTP routes for content management
 *
 * SECURITY: All routes are protected by authentication middleware
 */

import { Router, type Router as ExpressRouter } from 'express';
import { authenticate } from '../middleware/auth';
import * as contentController from '../controllers/contentController';
import { uploadContent } from '../middleware/upload';

const router: ExpressRouter = Router();

// ==============================================
// SECURITY: Apply authentication to ALL routes
// ==============================================
router.use(authenticate);

/**
 * POST /api/content/upload
 * Upload content file (video or image)
 */
router.post(
  '/upload',
  uploadContent.single('file'),
  contentController.uploadContentFile
);

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
 * POST /api/content/url
 * Create content from external URL (YouTube, Vimeo, direct links)
 */
router.post('/url', contentController.createContentFromUrl);

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
