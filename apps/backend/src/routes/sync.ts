/**
 * Sync Routes
 * API endpoints for managing sync groups and playback control
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import syncService from '../services/syncService';
import { log } from '../middleware/logger';
import type {
    CreateSyncGroupRequest,
    UpdateSyncGroupRequest,
    StartSyncPlaybackRequest,
    SeekSyncRequest,
    AssignConductorRequest
} from '@shared-types';

const router: Router = Router();

// All sync routes require authentication
router.use(authenticate);

// ==============================================
// SYNC GROUP CRUD
// ==============================================

/**
 * GET /api/sync/groups
 * List all sync groups
 */
router.get('/groups', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (_req, res) => {
    try {
        const groups = syncService.getAllSyncGroups();
        res.json({ success: true, data: groups });
    } catch (error) {
        log.error('Failed to get sync groups', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to get sync groups' } });
    }
});

/**
 * GET /api/sync/groups/:id
 */
router.get('/groups/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const group = syncService.getSyncGroup(req.params.id!);
        if (!group) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        res.json({ success: true, data: group });
    } catch (error) {
        log.error('Failed to get sync group', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to get sync group' } });
    }
});

/**
 * POST /api/sync/groups
 */
router.post('/groups', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const { name, displayIds } = req.body as CreateSyncGroupRequest;
        if (!name || !displayIds || !Array.isArray(displayIds)) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Name and displayIds required' } });
        }
        const group = syncService.createSyncGroup(name, displayIds);
        log.info('Sync group created via API', { groupId: group.id, name });
        res.status(201).json({ success: true, data: group });
    } catch (error) {
        log.error('Failed to create sync group', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to create sync group' } });
    }
});

/**
 * PUT /api/sync/groups/:id
 */
router.put('/groups/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const { name, displayIds } = req.body as UpdateSyncGroupRequest;
        const group = syncService.updateSyncGroup(req.params.id!, { name, displayIds });
        if (!group) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        log.info('Sync group updated via API', { groupId: group.id });
        res.json({ success: true, data: group });
    } catch (error) {
        log.error('Failed to update sync group', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to update sync group' } });
    }
});

/**
 * DELETE /api/sync/groups/:id
 */
router.delete('/groups/:id', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const deleted = syncService.deleteSyncGroup(req.params.id!);
        if (!deleted) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        log.info('Sync group deleted via API', { groupId: req.params.id });
        res.json({ success: true, data: { deleted: true } });
    } catch (error) {
        log.error('Failed to delete sync group', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to delete sync group' } });
    }
});

// ==============================================
// PLAYBACK CONTROL
// ==============================================

/**
 * POST /api/sync/groups/:id/start
 */
router.post('/groups/:id/start', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const { contentId, startPosition } = req.body as StartSyncPlaybackRequest;
        if (!contentId) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'contentId is required' } });
        }
        const success = syncService.startPlayback(req.params.id!, contentId, startPosition || 0);
        if (!success) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        log.info('Playback started via API', { groupId: req.params.id, contentId });
        res.json({ success: true, data: { started: true } });
    } catch (error) {
        log.error('Failed to start playback', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to start playback' } });
    }
});

/**
 * POST /api/sync/groups/:id/pause
 */
router.post('/groups/:id/pause', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const success = syncService.pausePlayback(req.params.id!);
        if (!success) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        log.info('Playback paused via API', { groupId: req.params.id });
        res.json({ success: true, data: { paused: true } });
    } catch (error) {
        log.error('Failed to pause playback', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to pause playback' } });
    }
});

/**
 * POST /api/sync/groups/:id/resume
 */
router.post('/groups/:id/resume', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const success = syncService.resumePlayback(req.params.id!);
        if (!success) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found or no content' } });
        }
        log.info('Playback resumed via API', { groupId: req.params.id });
        res.json({ success: true, data: { resumed: true } });
    } catch (error) {
        log.error('Failed to resume playback', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to resume playback' } });
    }
});

/**
 * POST /api/sync/groups/:id/seek
 */
router.post('/groups/:id/seek', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const { position } = req.body as SeekSyncRequest;
        if (typeof position !== 'number') {
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'position (number) is required' } });
        }
        const success = syncService.seekPlayback(req.params.id!, position);
        if (!success) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        log.info('Playback seeked via API', { groupId: req.params.id, position });
        res.json({ success: true, data: { seeked: true, position } });
    } catch (error) {
        log.error('Failed to seek playback', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to seek playback' } });
    }
});

/**
 * POST /api/sync/groups/:id/stop
 */
router.post('/groups/:id/stop', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const success = syncService.stopPlayback(req.params.id!);
        if (!success) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        log.info('Playback stopped via API', { groupId: req.params.id });
        res.json({ success: true, data: { stopped: true } });
    } catch (error) {
        log.error('Failed to stop playback', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to stop playback' } });
    }
});

// ==============================================
// CONDUCTOR MANAGEMENT
// ==============================================

/**
 * POST /api/sync/groups/:id/conductor
 */
router.post('/groups/:id/conductor', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), (req, res) => {
    try {
        const { displayId } = req.body as AssignConductorRequest;
        if (!displayId) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'displayId is required' } });
        }
        const group = syncService.getSyncGroup(req.params.id!);
        if (!group) {
            return res.status(404).json({ success: false, error: { code: 'GROUP_NOT_FOUND', message: 'Sync group not found' } });
        }
        const conductor = syncService.electConductor(req.params.id!);
        if (!conductor) {
            return res.status(400).json({ success: false, error: { code: 'NO_CONNECTED_DISPLAYS', message: 'No connected displays' } });
        }
        log.info('Conductor manually assigned via API', { groupId: req.params.id, displayId: conductor.displayId });
        res.json({ success: true, data: conductor });
    } catch (error) {
        log.error('Failed to assign conductor', error);
        res.status(500).json({ success: false, error: { code: 'SYNC_ERROR', message: 'Failed to assign conductor' } });
    }
});

export default router;
