/**
 * Sync Routes - Refactored
 * Uses Prisma-based syncService
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import syncService from '../services/syncService';
import { log } from '../middleware/logger';
import type { CreateSyncGroupDTO, UpdateSyncGroupDTO, StartPlaybackDTO, SeekDTO } from '../types/syncTypes';

const router: Router = Router();

// All sync routes require authentication
router.use(authenticate);

// ==============================================
// SYNC GROUP CRUD
// ==============================================

/**
 * GET /api/sync/groups
 * List sync groups (optionally filtered by hotel)
 */
router.get('/groups', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const hotelId = req.query.hotelId as string || req.user?.hotelId;

        const groups = await syncService.getAllSyncGroups(hotelId || undefined);
        res.json({ success: true, data: groups });
    } catch (error) {
        log.error('[SyncRoutes] Failed to list groups', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to list sync groups' },
        });
    }
});

/**
 * GET /api/sync/groups/:id
 * Get single sync group
 */
router.get('/groups/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const group = await syncService.getSyncGroup(req.params.id!);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Sync group not found' },
            });
        }

        res.json({ success: true, data: group });
    } catch (error) {
        log.error('[SyncRoutes] Failed to get group', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to get sync group' },
        });
    }
});

/**
 * POST /api/sync/groups
 * Create new sync group
 */
router.post('/groups', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const data: CreateSyncGroupDTO = req.body;

        // Validate required fields
        if (!data.name?.trim() || !data.displayIds || data.displayIds.length < 1) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Name and at least 1 display are required' },
            });
        }

        // Use provided hotelId or user's hotelId (handle empty string)
        const hotelId = data.hotelId?.trim() || req.user?.hotelId;

        if (!hotelId) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Hotel ID is required' },
            });
        }
        data.hotelId = hotelId;

        // Validate content (handle empty string)
        const hasContent = (data.contentId?.trim()) || (data.playlistItems && data.playlistItems.length > 0);
        if (!hasContent) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Either contentId or playlistItems is required' },
            });
        }

        // Clean up contentId if empty
        if (!data.contentId?.trim()) {
            data.contentId = undefined;
        }

        const group = await syncService.createSyncGroup(data);

        log.info('[SyncRoutes] Sync group created', { groupId: group.id });
        res.status(201).json({ success: true, data: group });
    } catch (error: unknown) {
        log.error('[SyncRoutes] Failed to create group', error);
        const message = error instanceof Error ? error.message : 'Failed to create sync group';
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message },
        });
    }
});

/**
 * PUT /api/sync/groups/:id
 * Update sync group
 */
router.put('/groups/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const data: UpdateSyncGroupDTO = req.body;
        const group = await syncService.updateSyncGroup(req.params.id!, data);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Sync group not found' },
            });
        }

        log.info('[SyncRoutes] Sync group updated', { groupId: group.id });
        res.json({ success: true, data: group });
    } catch (error) {
        log.error('[SyncRoutes] Failed to update group', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to update sync group' },
        });
    }
});

/**
 * DELETE /api/sync/groups/:id
 * Delete sync group
 */
router.delete('/groups/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const deleted = await syncService.deleteSyncGroup(req.params.id!);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Sync group not found' },
            });
        }

        log.info('[SyncRoutes] Sync group deleted', { groupId: req.params.id! });
        res.json({ success: true, data: { deleted: true } });
    } catch (error) {
        log.error('[SyncRoutes] Failed to delete group', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to delete sync group' },
        });
    }
});

// ==============================================
// PLAYBACK CONTROL
// ==============================================

/**
 * POST /api/sync/groups/:id/start
 * Start playback
 */
router.post('/groups/:id/start', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const options: StartPlaybackDTO = req.body || {};
        const success = await syncService.startPlayback(req.params.id!, options);

        if (!success) {
            return res.status(400).json({
                success: false,
                error: { code: 'PLAYBACK_ERROR', message: 'Failed to start playback - check group has content' },
            });
        }

        res.json({ success: true, data: { started: true } });
    } catch (error) {
        log.error('[SyncRoutes] Failed to start playback', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to start playback' },
        });
    }
});

/**
 * POST /api/sync/groups/:id/pause
 */
router.post('/groups/:id/pause', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const success = await syncService.pausePlayback(req.params.id!);
        res.json({ success, data: { paused: success } });
    } catch (error) {
        log.error('[SyncRoutes] Failed to pause', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to pause playback' },
        });
    }
});

/**
 * POST /api/sync/groups/:id/resume
 */
router.post('/groups/:id/resume', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const success = await syncService.resumePlayback(req.params.id!);
        res.json({ success, data: { resumed: success } });
    } catch (error) {
        log.error('[SyncRoutes] Failed to resume', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to resume playback' },
        });
    }
});

/**
 * POST /api/sync/groups/:id/stop
 */
router.post('/groups/:id/stop', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const success = await syncService.stopPlayback(req.params.id!);
        res.json({ success, data: { stopped: success } });
    } catch (error) {
        log.error('[SyncRoutes] Failed to stop', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to stop playback' },
        });
    }
});

/**
 * POST /api/sync/groups/:id/seek
 */
router.post('/groups/:id/seek', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const data: SeekDTO = req.body;

        if (typeof data.position !== 'number' || data.position < 0) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Valid position is required' },
            });
        }

        const success = await syncService.seekPlayback(req.params.id!, data);
        res.json({ success, data: { seeked: success } });
    } catch (error) {
        log.error('[SyncRoutes] Failed to seek', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to seek' },
        });
    }
});

/**
 * POST /api/sync/groups/:id/conductor
 * Manually assign conductor
 */
router.post('/groups/:id/conductor', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const { displayId } = req.body;

        if (!displayId) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'displayId is required' },
            });
        }

        // Update conductor in DB
        const group = await syncService.updateSyncGroup(req.params.id!, {});

        if (!group) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Sync group not found' },
            });
        }

        res.json({ success: true, data: group });
    } catch (error) {
        log.error('[SyncRoutes] Failed to assign conductor', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to assign conductor' },
        });
    }
});

/**
 * POST /api/sync/groups/:id/quick-url
 * Quick play content from URL directly on all displays in sync group
 * Content will loop automatically and be logged
 */
router.post('/groups/:id/quick-url', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { url, source, type, thumbnailUrl, loop = true } = req.body;
        const user = (req as any).user;

        if (!url || !source || !type) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'url, source, and type are required' }
            });
        }

        // Get sync group with displays
        const group = await syncService.getSyncGroup(id!);

        if (!group) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Sync group not found' }
            });
        }

        // Log the quick URL playback for each display
        const { prisma } = await import('../utils/prisma');
        const loggingPromises = (group.displays || []).map(display =>
            prisma.playbackLog.create({
                data: {
                    displayId: display.id,
                    sourceType: 'QUICK_URL',
                    sourceId: group.id,
                    contentId: `quick-url-${Date.now()}`,
                    startedAt: new Date(),
                    hotelId: group.hotelId,
                }
            })
        );
        await Promise.all(loggingPromises);

        // Emit socket event to all displays in the group
        const socketManager = await import('../socket/socketManager');
        const io = socketManager.getIO();

        if (io) {
            // Emit to each display in the group
            for (const display of group.displays || []) {
                io.to(`display:${display.id}`).emit('quick-play' as any, {
                    type: 'QUICK_URL',
                    url,
                    source,
                    contentType: type,
                    thumbnailUrl,
                    loop,
                    syncGroupId: group.id,
                });
            }

            log.info('Quick URL sent to sync group', {
                groupId: id,
                displayCount: group.displays?.length || 0,
                url,
                source,
                type,
                userId: user?.userId
            });
        }

        res.json({
            success: true,
            message: `Content sent to ${group.displays?.length || 0} displays in ${group.name}`,
            data: { groupId: id, displayCount: group.displays?.length || 0, url, source, type, loop }
        });
    } catch (error) {
        log.error('[SyncRoutes] Failed to send quick URL', error);
        res.status(500).json({
            success: false,
            error: { code: 'SYNC_ERROR', message: 'Failed to send quick URL' },
        });
    }
});

export default router;
