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
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const hotelFilter = user?.role === 'SUPER_ADMIN' ? {} : { hotelId: user?.hotelId };

        // Parallel queries for better performance
        const [
            displayStats,
            contentStats,
            contentSize,
            alertsCount,
            schedulesCount,
            areasCount,
            usersCount,
            hotelsCount,
            recentDisplays,
            recentContent,
        ] = await Promise.all([
            // Display counts by status
            prisma.display.groupBy({
                by: ['status'],
                where: hotelFilter,
                _count: { id: true },
            }),
            // Content counts by type and status
            prisma.content.groupBy({
                by: ['type', 'status'],
                where: hotelFilter,
                _count: { id: true },
            }),
            // Content storage size
            prisma.content.aggregate({
                where: hotelFilter,
                _sum: { fileSize: true },
            }),
            // Active alerts count
            prisma.alert.count({
                where: {
                    ...hotelFilter,
                    isActive: true,
                    OR: [
                        { endAt: null },
                        { endAt: { gte: new Date() } },
                    ],
                },
            }),
            // Active schedules
            prisma.schedule.count({
                where: {
                    ...hotelFilter,
                    isActive: true,
                },
            }),
            // Areas count
            prisma.area.count({
                where: hotelFilter,
            }),
            // Users count
            user?.role === 'SUPER_ADMIN'
                ? prisma.user.count()
                : prisma.user.count({ where: { hotelId: user?.hotelId } }),
            // Hotels count (only for super admin)
            user?.role === 'SUPER_ADMIN' ? prisma.hotel.count() : Promise.resolve(0),
            // Recent displays (last 10 updated)
            prisma.display.findMany({
                take: 5,
                where: hotelFilter,
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
                where: hotelFilter,
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
            totalSize: Number(contentSize._sum.fileSize || 0),
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

        // Calculate storage
        const storageUsedBytes = Number(contentSize._sum.fileSize || 0);
        const storageUsedGB = Math.round(storageUsedBytes / 1024 / 1024 / 1024);
        const storageTotalGB = 100;

        // System status
        const systemStatus = {
            server: 'online' as const,
            database: true,
            redis: true,
            socketConnections,
            storageUsed: storageUsedBytes,
            storageTotal: storageTotalGB * 1024 * 1024 * 1024,
        };

        res.json({
            success: true,
            data: {
                displays,
                content,
                alerts: {
                    active: alertsCount,
                },
                schedules: {
                    active: schedulesCount,
                },
                syncGroups: syncGroups.length,
                areas: areasCount,
                users: {
                    total: usersCount,
                },
                hotels: hotelsCount,
                storage: {
                    used: `${storageUsedGB}GB`,
                    total: `${storageTotalGB}GB`,
                    percentage: Math.round((storageUsedBytes / (storageTotalGB * 1024 * 1024 * 1024)) * 100),
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

/**
 * GET /api/dashboard/displays-attention
 * Returns displays that need attention (ERROR or OFFLINE)
 */
router.get('/displays-attention', async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const hotelFilter = user?.role === 'SUPER_ADMIN' ? {} : { hotelId: user?.hotelId };

        const displays = await prisma.display.findMany({
            where: {
                ...hotelFilter,
                status: { in: ['ERROR', 'OFFLINE'] },
            },
            select: {
                id: true,
                name: true,
                location: true,
                status: true,
                lastSeen: true,
                lastError: true,
                lastErrorCode: true,
                lastErrorAt: true,
                area: { select: { name: true } },
            },
            orderBy: [
                { status: 'asc' }, // ERROR first
                { lastSeen: 'desc' },
            ],
            take: 10,
        });

        res.json({ success: true, data: displays });
    } catch (error) {
        log.error('Failed to get displays attention', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get displays requiring attention',
        });
    }
});

export default router;

