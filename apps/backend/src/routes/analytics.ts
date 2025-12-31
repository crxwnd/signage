/**
 * Analytics Routes
 * Provides aggregated analytics data for displays, content, and bandwidth
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/overview
 * Returns overview KPIs and activity trends
 */
router.get('/overview', async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query;

        // Default to last 7 days
        const endDate = to ? new Date(to as string) : new Date();
        const startDate = from
            ? new Date(from as string)
            : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Get display stats
        const [displayStats, recentDisplays] = await Promise.all([
            // Display counts by status
            prisma.display.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            // Recent displays (last 10 updated)
            prisma.display.findMany({
                take: 5,
                orderBy: { lastSeen: 'desc' },
                where: { status: 'ONLINE' },
                select: { id: true, name: true, lastSeen: true },
            }),
        ]);

        // Calculate KPIs
        let totalDisplays = 0;
        let onlineDisplays = 0;
        displayStats.forEach((stat) => {
            totalDisplays += stat._count.id;
            if (stat.status === 'ONLINE') onlineDisplays = stat._count.id;
        });

        const uptimePercent = totalDisplays > 0
            ? Math.round((onlineDisplays / totalDisplays) * 100)
            : 0;

        // Generate mock activity trend (in production would query actual events)
        const activityTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            activityTrend.push({
                date: date.toISOString().split('T')[0],
                plays: Math.floor(Math.random() * 100) + 20,
                bandwidth: Math.floor(Math.random() * 500) + 100,
            });
        }

        // Top displays (mock data for now)
        const topDisplays = recentDisplays.map((d, i) => ({
            id: d.id,
            name: d.name,
            plays: Math.floor(Math.random() * 50) + 10 - i * 5,
        }));

        res.json({
            success: true,
            data: {
                period: { start: startDate.toISOString(), end: endDate.toISOString() },
                kpis: {
                    uptimePercent,
                    totalPlays: Math.floor(Math.random() * 500) + 100,
                    bandwidthGB: Math.floor(Math.random() * 50) + 10,
                    activeDisplays: onlineDisplays,
                },
                activityTrend,
                topDisplays,
            },
        });
    } catch (error) {
        log.error('Failed to get analytics overview', error);
        res.status(500).json({ success: false, error: 'Failed to get analytics overview' });
    }
});

/**
 * GET /api/analytics/displays
 * Returns detailed display activity metrics
 */
router.get('/displays', async (_req: Request, res: Response) => {
    try {
        const displays = await prisma.display.findMany({
            include: {
                area: { select: { name: true } },
                hotel: { select: { name: true } },
            },
            orderBy: { lastSeen: 'desc' },
        });

        const displayMetrics = displays.map((display) => {
            // In production, calculate from actual event logs
            const isOnline = display.status === 'ONLINE';
            return {
                id: display.id,
                name: display.name,
                location: display.area?.name || display.hotel?.name || 'Unknown',
                status: display.status,
                uptimePercent: isOnline ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 50),
                hoursOnline: Math.floor(Math.random() * 200) + 50,
                disconnections: Math.floor(Math.random() * 10),
                lastError: null,
                bandwidthMB: Math.floor(Math.random() * 5000) + 500,
                lastSeen: display.lastSeen,
            };
        });

        res.json({
            success: true,
            data: {
                displays: displayMetrics,
                pagination: { page: 1, total: displays.length },
            },
        });
    } catch (error) {
        log.error('Failed to get display analytics', error);
        res.status(500).json({ success: false, error: 'Failed to get display analytics' });
    }
});

/**
 * GET /api/analytics/bandwidth
 * Returns bandwidth usage statistics
 */
router.get('/bandwidth', async (_req: Request, res: Response) => {
    try {
        // Generate mock daily data (in production would query BandwidthLog)
        const daily = [];
        const endDate = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            daily.push({
                date: date.toISOString().split('T')[0],
                totalMB: Math.floor(Math.random() * 2000) + 500,
            });
        }

        // Get top displays by bandwidth (mock)
        const displays = await prisma.display.findMany({
            take: 10,
            select: { id: true, name: true },
        });

        const byDisplay = displays.map((d) => ({
            displayId: d.id,
            name: d.name,
            totalMB: Math.floor(Math.random() * 5000) + 1000,
        })).sort((a, b) => b.totalMB - a.totalMB);

        const totalGB = Math.round(daily.reduce((sum, d) => sum + d.totalMB, 0) / 1024);
        const avgDailyMB = Math.round(daily.reduce((sum, d) => sum + d.totalMB, 0) / daily.length);

        res.json({
            success: true,
            data: {
                daily,
                byDisplay,
                summary: {
                    totalGB,
                    avgDailyMB,
                    projectedMonthlyGB: Math.round(avgDailyMB * 30 / 1024),
                },
            },
        });
    } catch (error) {
        log.error('Failed to get bandwidth analytics', error);
        res.status(500).json({ success: false, error: 'Failed to get bandwidth analytics' });
    }
});

/**
 * GET /api/analytics/content
 * Returns content performance statistics
 */
router.get('/content', async (_req: Request, res: Response) => {
    try {
        const contents = await prisma.content.findMany({
            where: { status: 'READY' },
            orderBy: { createdAt: 'desc' },
        });

        const contentMetrics = contents.map((content) => ({
            id: content.id,
            name: content.name,
            type: content.type,
            plays: Math.floor(Math.random() * 200) + 10,
            completionRate: Math.floor(Math.random() * 40) + 60,
            avgDuration: content.type === 'VIDEO' ? Math.floor(Math.random() * 120) + 30 : 15,
            displaysCount: Math.floor(Math.random() * 10) + 1,
        })).sort((a, b) => b.plays - a.plays);

        res.json({
            success: true,
            data: { content: contentMetrics },
        });
    } catch (error) {
        log.error('Failed to get content analytics', error);
        res.status(500).json({ success: false, error: 'Failed to get content analytics' });
    }
});

export default router;
