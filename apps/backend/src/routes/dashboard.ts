/**
 * Dashboard Routes
 * Provides aggregated stats and system information for the home dashboard
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import { getIO } from '../socket/socketManager';
import syncService from '../services/syncService';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Returns aggregated dashboard statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
    try {
        // Parallel queries for better performance
        const [
            displayStats,
            contentStats,
            recentDisplays,
            recentContent,
        ] = await Promise.all([
            // Display counts by status
            prisma.display.groupBy({
                by: ['status'],
                _count: { id: true },
            }),
            // Content counts by type and status
            prisma.content.groupBy({
                by: ['type', 'status'],
                _count: { id: true },
            }),
            // Recent displays (last 10 updated)
            prisma.display.findMany({
                take: 5,
                orderBy: { updatedAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    updatedAt: true,
                },
            }),
            // Recent content (last 5 uploaded)
            prisma.content.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    createdAt: true,
                },
            }),
        ]);

        // Calculate display stats
        const displays = {
            total: 0,
            online: 0,
            offline: 0,
            error: 0,
        };

        displayStats.forEach((stat) => {
            displays.total += stat._count.id;
            if (stat.status === 'ONLINE') displays.online = stat._count.id;
            else if (stat.status === 'OFFLINE') displays.offline = stat._count.id;
            else if (stat.status === 'ERROR') displays.error = stat._count.id;
        });

        // Calculate content stats
        const content = {
            total: 0,
            videos: 0,
            images: 0,
            html: 0,
            processing: 0,
        };

        contentStats.forEach((stat) => {
            content.total += stat._count.id;
            if (stat.type === 'VIDEO') content.videos += stat._count.id;
            else if (stat.type === 'IMAGE') content.images += stat._count.id;
            else if (stat.type === 'HTML') content.html += stat._count.id;
            if (stat.status === 'PROCESSING') content.processing += stat._count.id;
        });

        // Get sync groups stats
        const syncGroups = await syncService.getAllSyncGroups();
        const activeGroups = syncGroups.filter(g => g.state === 'PLAYING');

        // Build recent activity from recent changes
        const recentActivity = [
            ...recentDisplays.map((d) => ({
                id: `display-${d.id}`,
                type: d.status === 'ONLINE' ? 'display_connected' : 'display_disconnected',
                message: `Display "${d.name}" is ${d.status.toLowerCase()}`,
                timestamp: d.updatedAt.toISOString(),
            })),
            ...recentContent.map((c) => ({
                id: `content-${c.id}`,
                type: 'content_uploaded',
                message: `${c.type} "${c.name}" ${c.status === 'READY' ? 'ready' : c.status.toLowerCase()}`,
                timestamp: c.createdAt.toISOString(),
            })),
        ]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);

        // Get socket connections count
        const io = getIO();
        const socketConnections = io?.engine?.clientsCount || 0;

        // System status (simplified - in production would check actual connections)
        const systemStatus = {
            server: 'online' as const,
            database: true,
            redis: true,
            socketConnections,
            storageUsed: 0, // Would need MinIO integration
            storageTotal: 100, // GB placeholder
        };

        res.json({
            success: true,
            data: {
                displays,
                content,
                syncGroups: {
                    total: syncGroups.length,
                    active: activeGroups.length,
                },
                recentActivity,
                systemStatus,
            },
        });
    } catch (error) {
        log.error('Failed to get dashboard stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard stats',
        });
    }
});

export default router;
