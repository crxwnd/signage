/**
 * Alert Controller
 * CRUD operations for alerts with RBAC and Socket.io notifications
 */

import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import { getIO } from '../socket/socketManager';

export async function getAlerts(req: Request, res: Response) {
    try {
        const user = req.user!;
        const { active, hotelId, areaId } = req.query;

        const where: any = {};

        // RBAC
        if (user.role === 'SUPER_ADMIN') {
            if (hotelId) where.hotelId = hotelId;
        } else {
            where.hotelId = user.hotelId;
        }

        if (areaId) where.areaId = areaId;
        if (active !== undefined) where.isActive = active === 'true';

        const alerts = await prisma.alert.findMany({
            where,
            include: {
                content: { select: { id: true, name: true, type: true, thumbnailUrl: true } },
                display: { select: { id: true, name: true } },
                area: { select: { id: true, name: true } },
                hotel: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        });

        return res.json({ data: alerts });
    } catch (error) {
        log.error('Error fetching alerts', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function getAlertById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = req.user!;

        const alert = await prisma.alert.findUnique({
            where: { id },
            include: {
                content: true,
                display: true,
                area: true,
                hotel: true,
                creator: { select: { id: true, name: true } },
            },
        });

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // RBAC
        if (user.role !== 'SUPER_ADMIN' && alert.hotelId !== user.hotelId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        return res.json({ data: alert });
    } catch (error) {
        log.error('Error fetching alert', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function createAlert(req: Request, res: Response) {
    try {
        const user = req.user!;
        const { name, message, contentId, hotelId, areaId, displayId, type, priority, startAt, endAt } = req.body;

        // Validation
        if (!name || !contentId) {
            return res.status(400).json({ error: 'name and contentId are required' });
        }

        // RBAC: determine hotelId
        let effectiveHotelId = hotelId;
        if (user.role !== 'SUPER_ADMIN') {
            effectiveHotelId = user.hotelId;
        } else if (!hotelId) {
            return res.status(400).json({ error: 'hotelId is required for SUPER_ADMIN' });
        }

        // Verify content exists and belongs to hotel
        const content = await prisma.content.findFirst({
            where: { id: contentId, hotelId: effectiveHotelId },
        });

        if (!content) {
            return res.status(404).json({ error: 'Content not found or access denied' });
        }

        const alert = await prisma.alert.create({
            data: {
                name,
                message: message || null,
                contentId,
                hotelId: effectiveHotelId,
                areaId: areaId || null,
                displayId: displayId || null,
                type: type || 'INFO',
                priority: priority || 100,
                startAt: startAt ? new Date(startAt) : new Date(),
                endAt: endAt ? new Date(endAt) : null,
                createdBy: user.userId,
            },
            include: {
                content: true,
                display: true,
                area: true,
            },
        });

        // Notify affected displays via Socket.io
        await notifyAlertActivated(alert);

        log.info('Alert created', { alertId: alert.id, createdBy: user.userId });

        return res.status(201).json({ data: alert });
    } catch (error) {
        log.error('Error creating alert', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function updateAlert(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = req.user!;
        const { name, message, contentId, areaId, displayId, type, priority, startAt, endAt, isActive } = req.body;

        const existing = await prisma.alert.findUnique({ where: { id } });

        if (!existing) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // RBAC
        if (user.role !== 'SUPER_ADMIN' && existing.hotelId !== user.hotelId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const alert = await prisma.alert.update({
            where: { id },
            data: {
                name: name ?? existing.name,
                message: message !== undefined ? message : existing.message,
                contentId: contentId ?? existing.contentId,
                areaId: areaId !== undefined ? areaId : existing.areaId,
                displayId: displayId !== undefined ? displayId : existing.displayId,
                type: type ?? existing.type,
                priority: priority ?? existing.priority,
                startAt: startAt ? new Date(startAt) : existing.startAt,
                endAt: endAt !== undefined ? (endAt ? new Date(endAt) : null) : existing.endAt,
                isActive: isActive !== undefined ? isActive : existing.isActive,
            },
            include: {
                content: true,
                display: true,
                area: true,
            },
        });

        // Notify if status changed
        if (isActive !== undefined && isActive !== existing.isActive) {
            if (isActive) {
                await notifyAlertActivated(alert);
            } else {
                await notifyAlertDeactivated(alert);
            }
        }

        log.info('Alert updated', { alertId: id, updatedBy: user.userId });

        return res.json({ data: alert });
    } catch (error) {
        log.error('Error updating alert', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deactivateAlert(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = req.user!;

        const alert = await prisma.alert.findUnique({
            where: { id },
            include: { display: true, area: true },
        });

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // RBAC
        if (user.role !== 'SUPER_ADMIN' && alert.hotelId !== user.hotelId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.alert.update({
            where: { id },
            data: { isActive: false },
        });

        await notifyAlertDeactivated(alert);

        log.info('Alert deactivated', { alertId: id, deactivatedBy: user.userId });

        return res.json({ message: 'Alert deactivated' });
    } catch (error) {
        log.error('Error deactivating alert', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export async function deleteAlert(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = req.user!;

        const alert = await prisma.alert.findUnique({ where: { id } });

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // RBAC
        if (user.role !== 'SUPER_ADMIN' && alert.hotelId !== user.hotelId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // If active, deactivate first
        if (alert.isActive) {
            await notifyAlertDeactivated(alert);
        }

        await prisma.alert.delete({ where: { id } });

        log.info('Alert deleted', { alertId: id, deletedBy: user.userId });

        return res.json({ message: 'Alert deleted' });
    } catch (error) {
        log.error('Error deleting alert', { error });
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// ==============================================
// SOCKET.IO NOTIFICATIONS
// ==============================================

async function getAffectedDisplays(alert: { hotelId: string; areaId: string | null; displayId: string | null }) {
    const where: any = { hotelId: alert.hotelId };

    if (alert.displayId) {
        where.id = alert.displayId;
    } else if (alert.areaId) {
        where.areaId = alert.areaId;
    }

    return prisma.display.findMany({
        where,
        select: { id: true },
    });
}

async function notifyAlertActivated(alert: any) {
    try {
        const io = getIO();
        if (!io) return;

        const displays = await getAffectedDisplays(alert);

        for (const display of displays) {
            (io.to(`display:${display.id}`) as any).emit('alert:activated', {
                alertId: alert.id,
                alert: {
                    id: alert.id,
                    name: alert.name,
                    message: alert.message,
                    type: alert.type,
                    priority: alert.priority,
                },
                contentId: alert.contentId,
            });
        }

        // Notify admin room
        (io.to('displays') as any).emit('alert:created', { alertId: alert.id });
    } catch (error) {
        log.warn('Failed to emit alert:activated', { error });
    }
}

async function notifyAlertDeactivated(alert: any) {
    try {
        const io = getIO();
        if (!io) return;

        const displays = await getAffectedDisplays(alert);

        for (const display of displays) {
            (io.to(`display:${display.id}`) as any).emit('alert:deactivated', {
                alertId: alert.id,
            });
        }

        (io.to('displays') as any).emit('alert:updated', { alertId: alert.id });
    } catch (error) {
        log.warn('Failed to emit alert:deactivated', { error });
    }
}
