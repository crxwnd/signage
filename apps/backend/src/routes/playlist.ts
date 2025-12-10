/**
 * Playlist Routes
 * Express router for playlist endpoints
 *
 * SECURITY: All routes are protected by authentication middleware
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as playlistController from '../controllers/playlistController';

const router: Router = Router();

// ==============================================
// SECURITY: Apply authentication to ALL routes
// ==============================================
router.use(authenticate);

// ==============================================
// PLAYLIST ROUTES
// ==============================================

/**
 * GET /api/playlists/:displayId
 * Get playlist for a display
 *
 * @security Bearer token required
 * @param displayId - Display ID
 * @returns Array of playlist items with content details
 */
router.get('/:displayId', playlistController.getPlaylist);

/**
 * POST /api/playlists/:displayId/content
 * Add content to a display's playlist
 *
 * @security Bearer token required
 * @param displayId - Display ID
 * @body { contentId: string, order?: number, startTime?: Date, endTime?: Date }
 * @returns Created playlist item
 *
 * @note Content and Display must belong to the same hotel (enforced in service)
 */
router.post('/:displayId/content', playlistController.addToPlaylist);

/**
 * DELETE /api/playlists/item/:id
 * Remove item from playlist
 *
 * @security Bearer token required
 * @param id - Playlist item ID (DisplayContent.id)
 * @returns { id: string }
 */
router.delete('/item/:id', playlistController.removeFromPlaylist);

/**
 * PUT /api/playlists/:displayId/reorder
 * Reorder playlist items
 *
 * @security Bearer token required
 * @param displayId - Display ID
 * @body { items: Array<{ id: string, order: number }> }
 * @returns Updated playlist
 */
router.put('/:displayId/reorder', playlistController.reorderPlaylist);

export default router;
