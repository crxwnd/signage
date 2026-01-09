/**
 * Analytics Routes
 * Uses real data from PlaybackLog and analyticsService
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import analyticsService from '../services/analyticsService';
import { log } from '../middleware/logger';
import { prisma } from '../utils/prisma';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/overview
 * Returns overview KPIs and activity trends using real data
 */
router.get('/overview', async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query;

        const endDate = to ? new Date(to as string) : new Date();
        const startDate = from
            ? new Date(from as string)
            : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        const data = await analyticsService.getAnalyticsOverview(startDate, endDate);

        res.json({ success: true, data });
    } catch (error) {
        log.error('Failed to get analytics overview', { error });
        res.status(500).json({ success: false, error: 'Failed to get analytics overview' });
    }
});

/**
 * GET /api/analytics/displays
 * Returns detailed display activity metrics using real data
 */
router.get('/displays', async (_req: Request, res: Response) => {
    try {
        const data = await analyticsService.getDisplayAnalytics();
        res.json({ success: true, data });
    } catch (error) {
        log.error('Failed to get display analytics', { error });
        res.status(500).json({ success: false, error: 'Failed to get display analytics' });
    }
});

/**
 * GET /api/analytics/bandwidth
 * Returns bandwidth usage statistics using real data
 */
router.get('/bandwidth', async (_req: Request, res: Response) => {
    try {
        const data = await analyticsService.getBandwidthAnalytics();
        res.json({ success: true, data });
    } catch (error) {
        log.error('Failed to get bandwidth analytics', { error });
        res.status(500).json({ success: false, error: 'Failed to get bandwidth analytics' });
    }
});

/**
 * GET /api/analytics/content
 * Returns content performance statistics using real data
 */
router.get('/content', async (_req: Request, res: Response) => {
    try {
        const data = await analyticsService.getContentAnalytics();
        res.json({ success: true, data });
    } catch (error) {
        log.error('Failed to get content analytics', { error });
        res.status(500).json({ success: false, error: 'Failed to get content analytics' });
    }
});

/**
 * GET /api/analytics/activity
 * Returns recent user activity
 */
router.get('/activity', async (req: Request, res: Response) => {
    try {
        const { limit = 10 } = req.query;
        const user = (req as any).user;

        // Get recent user activity from UserActivityLog
        const activity = await prisma.userActivityLog.findMany({
            where: user?.role === 'SUPER_ADMIN' ? {} : { user: { hotelId: user?.hotelId } },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        });

        // Format for frontend
        const formattedActivity = activity.map((a) => ({
            id: a.id,
            action: a.action,
            description: formatActivityDescription(a.action, a.resource || undefined, a.resourceId || undefined),
            userName: a.user?.name || 'System',
            userEmail: a.user?.email,
            resource: a.resource,
            resourceId: a.resourceId,
            createdAt: a.createdAt,
        }));

        res.json({ success: true, data: formattedActivity });
    } catch (error) {
        log.error('Failed to get activity', { error });
        res.status(500).json({ success: false, error: 'Failed to get activity' });
    }
});

function formatActivityDescription(action: string, _resource?: string, _resourceId?: string): string {
    const descriptions: Record<string, string> = {
        LOGIN: 'logged in',
        LOGOUT: 'logged out',
        LOGIN_FAILED: 'failed login attempt',
        CONTENT_UPLOAD: 'uploaded content',
        CONTENT_DELETE: 'deleted content',
        SCHEDULE_CREATE: 'created a schedule',
        SCHEDULE_UPDATE: 'updated a schedule',
        SCHEDULE_DELETE: 'deleted a schedule',
        ALERT_CREATE: 'created an alert',
        ALERT_UPDATE: 'updated an alert',
        ALERT_DEACTIVATE: 'deactivated an alert',
        DISPLAY_CREATE: 'added a display',
        DISPLAY_UPDATE: 'updated a display',
        DISPLAY_DELETE: 'removed a display',
        DISPLAY_PAIR: 'paired a display',
        USER_CREATE: 'created a user',
        USER_UPDATE: 'updated a user',
    };

    return descriptions[action] || action.toLowerCase().replace(/_/g, ' ');
}

export default router;

