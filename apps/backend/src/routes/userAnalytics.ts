/**
 * User Analytics Routes
 * Endpoints for user activity tracking and analysis
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/permissions';
import userAnalyticsService from '../services/userAnalyticsService';
import { log } from '../middleware/logger';

const router: Router = Router();

router.use(authenticate);

/**
 * GET /api/analytics/users/overview
 * Get user analytics overview
 */
router.get('/overview', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query;

        const endDate = to ? new Date(to as string) : new Date();
        const startDate = from
            ? new Date(from as string)
            : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

        const data = await userAnalyticsService.getAnalyticsOverview(startDate, endDate);

        res.json({ success: true, data });
    } catch (error) {
        log.error('Failed to get user analytics overview', { error });
        res.status(500).json({ success: false, error: 'Failed to get user analytics' });
    }
});

/**
 * GET /api/analytics/users/stats
 * Get per-user activity statistics
 */
router.get('/stats', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const hotelId = user.role === 'HOTEL_ADMIN' ? user.hotelId : undefined;

        const stats = await userAnalyticsService.getUserActivityStats(hotelId || undefined);

        res.json({ success: true, data: { users: stats } });
    } catch (error) {
        log.error('Failed to get user activity stats', { error });
        res.status(500).json({ success: false, error: 'Failed to get user stats' });
    }
});

/**
 * GET /api/analytics/users/activity
 * Get recent user activity
 */
router.get('/activity', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const hotelId = user.role === 'HOTEL_ADMIN' ? user.hotelId : undefined;

        const activities = await userAnalyticsService.getRecentActivity(limit, hotelId || undefined);

        res.json({ success: true, data: { activities } });
    } catch (error) {
        log.error('Failed to get recent activity', { error });
        res.status(500).json({ success: false, error: 'Failed to get activity' });
    }
});

/**
 * GET /api/analytics/users/logins
 * Get login history
 */
router.get('/logins', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const hotelId = user.role === 'HOTEL_ADMIN' ? user.hotelId : undefined;

        const logins = await userAnalyticsService.getLoginHistory(limit, hotelId || undefined);

        res.json({ success: true, data: { logins } });
    } catch (error) {
        log.error('Failed to get login history', { error });
        res.status(500).json({ success: false, error: 'Failed to get login history' });
    }
});

/**
 * GET /api/analytics/users/security
 * Get security overview
 */
router.get('/security', requireRole(['SUPER_ADMIN', 'HOTEL_ADMIN']), async (req: Request, res: Response) => {
    try {
        const user = req.user!;
        const hotelId = user.role === 'HOTEL_ADMIN' ? user.hotelId : undefined;

        const security = await userAnalyticsService.getSecurityOverview(hotelId || undefined);

        res.json({ success: true, data: security });
    } catch (error) {
        log.error('Failed to get security overview', { error });
        res.status(500).json({ success: false, error: 'Failed to get security overview' });
    }
});

export default router;

