/**
 * Analytics Routes
 * Uses real data from PlaybackLog and analyticsService
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import analyticsService from '../services/analyticsService';
import { log } from '../middleware/logger';

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

export default router;
