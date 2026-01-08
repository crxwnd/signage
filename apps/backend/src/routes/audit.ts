/**
 * Audit Routes
 * Endpoints for audit logs and compliance
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import * as auditService from '../services/auditService';
import { log } from '../middleware/logger';

const router: Router = Router();

router.use(authenticate);

/**
 * GET /api/audit/logs
 * Get audit logs with filtering
 */
router.get('/logs', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        // RBAC: HOTEL_ADMIN can only see their hotel
        const hotelId = user.role === 'HOTEL_ADMIN' ? user.hotelId : req.query.hotelId as string;

        const params = {
            hotelId: hotelId || undefined,
            areaId: req.query.areaId as string,
            userId: req.query.userId as string,
            category: req.query.category as auditService.AuditCategory,
            action: req.query.action as auditService.AuditAction,
            severity: req.query.severity as auditService.AuditSeverity,
            resourceType: req.query.resourceType as string,
            resourceId: req.query.resourceId as string,
            from: req.query.from ? new Date(req.query.from as string) : undefined,
            to: req.query.to ? new Date(req.query.to as string) : undefined,
            limit: parseInt(req.query.limit as string) || 100,
            offset: parseInt(req.query.offset as string) || 0,
        };

        const result = await auditService.getAuditLogs(params);

        res.json({ success: true, data: result });
    } catch (error) {
        log.error('Failed to get audit logs', { error });
        res.status(500).json({ success: false, error: 'Failed to get audit logs' });
    }
});

/**
 * GET /api/audit/summary
 * Get audit summary statistics
 */
router.get('/summary', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const hotelId = user.role === 'HOTEL_ADMIN' ? user.hotelId : req.query.hotelId as string;

        const from = req.query.from ? new Date(req.query.from as string) : undefined;
        const to = req.query.to ? new Date(req.query.to as string) : undefined;

        const summary = await auditService.getAuditSummary(hotelId || undefined, from, to);

        res.json({ success: true, data: summary });
    } catch (error) {
        log.error('Failed to get audit summary', { error });
        res.status(500).json({ success: false, error: 'Failed to get audit summary' });
    }
});

/**
 * GET /api/audit/displays/:id/timeline
 * Get complete timeline for a display
 */
router.get('/displays/:id/timeline', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER']), async (req: Request, res: Response) => {
    try {
        const displayId = req.params.id as string;
        const from = req.query.from ? new Date(req.query.from as string) : undefined;
        const to = req.query.to ? new Date(req.query.to as string) : undefined;

        const timeline = await auditService.getDisplayTimeline(displayId, from, to);

        res.json({ success: true, data: { timeline } });
    } catch (error) {
        log.error('Failed to get display timeline', { error });
        res.status(500).json({ success: false, error: 'Failed to get display timeline' });
    }
});

/**
 * GET /api/audit/displays/:id/state-history
 * Get state history for a display
 */
router.get('/displays/:id/state-history', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER']), async (req: Request, res: Response) => {
    try {
        const displayId = req.params.id as string;
        const limit = parseInt(req.query.limit as string) || 100;

        const history = await auditService.getDisplayStateHistory(displayId, limit);

        res.json({ success: true, data: { history } });
    } catch (error) {
        log.error('Failed to get display state history', { error });
        res.status(500).json({ success: false, error: 'Failed to get display state history' });
    }
});

/**
 * GET /api/audit/users/:id/timeline
 * Get complete timeline for a user
 */
router.get('/users/:id/timeline', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const userId = req.params.id as string;
        const from = req.query.from ? new Date(req.query.from as string) : undefined;
        const to = req.query.to ? new Date(req.query.to as string) : undefined;

        const timeline = await auditService.getUserTimeline(userId, from, to);

        res.json({ success: true, data: timeline });
    } catch (error) {
        log.error('Failed to get user timeline', { error });
        res.status(500).json({ success: false, error: 'Failed to get user timeline' });
    }
});

/**
 * GET /api/audit/sessions
 * Get active sessions
 */
router.get('/sessions', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const hotelId = user.role === 'HOTEL_ADMIN' ? user.hotelId : req.query.hotelId as string;

        const sessions = await auditService.getActiveSessions(hotelId || undefined);

        res.json({ success: true, data: { sessions } });
    } catch (error) {
        log.error('Failed to get active sessions', { error });
        res.status(500).json({ success: false, error: 'Failed to get active sessions' });
    }
});

/**
 * POST /api/audit/sessions/:token/revoke
 * Revoke a session (force logout)
 */
router.post('/sessions/:token/revoke', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const sessionToken = req.params.token as string;
        const user = (req as any).user;

        await auditService.endSession(sessionToken, 'REVOKED');

        // Log this action
        await auditService.createAuditLog({
            userId: user.userId || user.id,
            action: 'DEACTIVATE',
            category: 'AUTHENTICATION',
            severity: 'WARNING',
            resource: 'session',
            resourceId: sessionToken,
            description: 'Session revoked by administrator',
        });

        res.json({ success: true, message: 'Session revoked' });
    } catch (error) {
        log.error('Failed to revoke session', { error });
        res.status(500).json({ success: false, error: 'Failed to revoke session' });
    }
});

/**
 * GET /api/audit/displays/:id/config-history
 * Get configuration change history for a display
 */
router.get('/displays/:id/config-history', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN', 'AREA_MANAGER']), async (req: Request, res: Response) => {
    try {
        const displayId = req.params.id as string;
        const limit = parseInt(req.query.limit as string) || 100;

        const history = await auditService.getDisplayConfigHistory(displayId, limit);

        res.json({ success: true, data: { history } });
    } catch (error) {
        log.error('Failed to get display config history', { error });
        res.status(500).json({ success: false, error: 'Failed to get display config history' });
    }
});

/**
 * GET /api/audit/content/:id/access
 * Get access logs for a content item
 */
router.get('/content/:id/access', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const contentId = req.params.id as string;
        const limit = parseInt(req.query.limit as string) || 100;

        const logs = await auditService.getContentAccessLogs(contentId, limit);

        res.json({ success: true, data: { logs } });
    } catch (error) {
        log.error('Failed to get content access logs', { error });
        res.status(500).json({ success: false, error: 'Failed to get content access logs' });
    }
});

export default router;
