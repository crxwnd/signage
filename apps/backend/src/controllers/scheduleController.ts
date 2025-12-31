/**
 * Schedule Controller
 * Handles CRUD operations with RBAC for schedules
 */

import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { scheduleService } from '../services/scheduleService';
import { UserRole } from '@prisma/client';
import { log } from '../middleware/logger';

/**
 * Get all schedules with optional filters
 * GET /api/schedules
 */
export async function getSchedules(req: Request, res: Response) {
    try {
        const user = req.user!;
        const { displayId, areaId, active, hotelId } = req.query;

        // Build where clause based on role
        const where: any = {};

        // RBAC filtering
        if (user.role === UserRole.HOTEL_ADMIN) {
            where.hotelId = user.hotelId;
        } else if (user.role === UserRole.AREA_MANAGER) {
            where.areaId = user.areaId;
        } else if (user.role === UserRole.SUPER_ADMIN && hotelId) {
            where.hotelId = hotelId;
        }

        // Optional filters
        if (displayId) where.displayId = displayId;
        if (areaId) where.areaId = areaId;
        if (active !== undefined) where.isActive = active === 'true';

        const schedules = await prisma.schedule.findMany({
            where,
            include: {
                content: { select: { id: true, name: true, type: true, thumbnailUrl: true } },
                display: { select: { id: true, name: true, location: true } },
                area: { select: { id: true, name: true } },
                hotel: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
            },
            orderBy: [{ priority: 'desc' }, { startDate: 'asc' }],
        });

        res.json({ success: true, data: schedules });
    } catch (error) {
        log.error('Error fetching schedules', error);
        res.status(500).json({ success: false, error: 'Failed to fetch schedules' });
    }
}

/**
 * Get single schedule by ID
 * GET /api/schedules/:id
 */
export async function getSchedule(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = req.user!;

        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                content: true,
                display: true,
                area: { include: { displays: { select: { id: true, name: true } } } },
                hotel: true,
                creator: { select: { id: true, name: true } },
            },
        });

        if (!schedule) {
            return res.status(404).json({ success: false, error: 'Schedule not found' });
        }

        // RBAC check
        if (user.role === UserRole.HOTEL_ADMIN && schedule.hotelId !== user.hotelId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        if (user.role === UserRole.AREA_MANAGER && schedule.areaId !== user.areaId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        // Add next occurrences
        const nextOccurrences = scheduleService.getNextOccurrences(schedule, 10);

        res.json({
            success: true,
            data: {
                ...schedule,
                nextOccurrences,
                recurrenceDescription: scheduleService.describeRecurrence(schedule.recurrence),
            },
        });
    } catch (error) {
        log.error('Error fetching schedule', error);
        res.status(500).json({ success: false, error: 'Failed to fetch schedule' });
    }
}

/**
 * Create new schedule
 * POST /api/schedules
 */
export async function createSchedule(req: Request, res: Response) {
    try {
        const user = req.user!;
        const {
            name,
            contentId,
            displayId,
            areaId,
            startDate,
            endDate,
            startTime,
            endTime,
            recurrence,
            priority,
            hotelId: requestHotelId,
        } = req.body;

        // Validation
        if (!name || !contentId || !startDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, contentId, startDate, startTime, endTime',
            });
        }

        if (!displayId && !areaId) {
            return res.status(400).json({
                success: false,
                error: 'Either displayId or areaId is required',
            });
        }

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                error: 'startTime must be before endTime',
            });
        }

        // Validate RRULE if provided
        if (recurrence && !scheduleService.isValidRRule(recurrence)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid recurrence rule format',
            });
        }

        // Determine hotel ID
        let hotelId: string;
        if (user.role === UserRole.SUPER_ADMIN) {
            hotelId = requestHotelId;
            if (!hotelId) {
                return res.status(400).json({ success: false, error: 'hotelId is required for SUPER_ADMIN' });
            }
        } else if (user.role === UserRole.HOTEL_ADMIN) {
            hotelId = user.hotelId!;
        } else {
            return res.status(403).json({ success: false, error: 'AREA_MANAGER cannot create schedules' });
        }

        // Verify content belongs to hotel
        const content = await prisma.content.findFirst({
            where: { id: contentId, hotelId },
        });
        if (!content) {
            return res.status(400).json({ success: false, error: 'Content not found in this hotel' });
        }

        // Verify display/area belongs to hotel
        if (displayId) {
            const display = await prisma.display.findFirst({
                where: { id: displayId, hotelId },
            });
            if (!display) {
                return res.status(400).json({ success: false, error: 'Display not found in this hotel' });
            }
        }

        if (areaId) {
            const area = await prisma.area.findFirst({
                where: { id: areaId, hotelId },
            });
            if (!area) {
                return res.status(400).json({ success: false, error: 'Area not found in this hotel' });
            }
        }

        const schedule = await prisma.schedule.create({
            data: {
                name,
                contentId,
                displayId: displayId || null,
                areaId: areaId || null,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                startTime,
                endTime,
                recurrence: recurrence || null,
                priority: priority || 0,
                hotelId,
                createdBy: user.userId,
            },
            include: {
                content: { select: { id: true, name: true, type: true } },
                display: { select: { id: true, name: true } },
                area: { select: { id: true, name: true } },
            },
        });

        log.info('Schedule created', { scheduleId: schedule.id, userId: user.userId });

        res.status(201).json({ success: true, data: schedule });
    } catch (error) {
        log.error('Error creating schedule', error);
        res.status(500).json({ success: false, error: 'Failed to create schedule' });
    }
}

/**
 * Update schedule
 * PUT /api/schedules/:id
 */
export async function updateSchedule(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = req.user!;
        const updates = req.body;

        // Find existing schedule
        const existing = await prisma.schedule.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Schedule not found' });
        }

        // RBAC check
        if (user.role === UserRole.HOTEL_ADMIN && existing.hotelId !== user.hotelId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        if (user.role === UserRole.AREA_MANAGER) {
            return res.status(403).json({ success: false, error: 'AREA_MANAGER cannot update schedules' });
        }

        // Validate RRULE if being updated
        if (updates.recurrence && !scheduleService.isValidRRule(updates.recurrence)) {
            return res.status(400).json({ success: false, error: 'Invalid recurrence rule format' });
        }

        // Validate time order
        const startTime = updates.startTime || existing.startTime;
        const endTime = updates.endTime || existing.endTime;
        if (startTime >= endTime) {
            return res.status(400).json({ success: false, error: 'startTime must be before endTime' });
        }

        const schedule = await prisma.schedule.update({
            where: { id },
            data: {
                name: updates.name,
                contentId: updates.contentId,
                displayId: updates.displayId,
                areaId: updates.areaId,
                startDate: updates.startDate ? new Date(updates.startDate) : undefined,
                endDate: updates.endDate ? new Date(updates.endDate) : undefined,
                startTime: updates.startTime,
                endTime: updates.endTime,
                recurrence: updates.recurrence,
                priority: updates.priority,
                isActive: updates.isActive,
            },
            include: {
                content: { select: { id: true, name: true, type: true } },
                display: { select: { id: true, name: true } },
                area: { select: { id: true, name: true } },
            },
        });

        log.info('Schedule updated', { scheduleId: id, userId: user.userId });

        res.json({ success: true, data: schedule });
    } catch (error) {
        log.error('Error updating schedule', error);
        res.status(500).json({ success: false, error: 'Failed to update schedule' });
    }
}

/**
 * Delete schedule
 * DELETE /api/schedules/:id
 */
export async function deleteSchedule(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const user = req.user!;

        const existing = await prisma.schedule.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, error: 'Schedule not found' });
        }

        // RBAC check
        if (user.role === UserRole.HOTEL_ADMIN && existing.hotelId !== user.hotelId) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }
        if (user.role === UserRole.AREA_MANAGER) {
            return res.status(403).json({ success: false, error: 'AREA_MANAGER cannot delete schedules' });
        }

        await prisma.schedule.delete({ where: { id } });

        log.info('Schedule deleted', { scheduleId: id, userId: user.userId });

        res.json({ success: true, message: 'Schedule deleted' });
    } catch (error) {
        log.error('Error deleting schedule', error);
        res.status(500).json({ success: false, error: 'Failed to delete schedule' });
    }
}

/**
 * Get active content for a display
 * GET /api/schedules/active/:displayId
 */
export async function getActiveContentForDisplay(req: Request, res: Response) {
    try {
        const displayId = req.params.displayId;

        if (!displayId) {
            return res.status(400).json({ success: false, error: 'displayId is required' });
        }

        const activeContent = await scheduleService.getActiveContent(displayId);

        res.json({ success: true, data: activeContent });
    } catch (error) {
        log.error('Error fetching active content', error);
        res.status(500).json({ success: false, error: 'Failed to fetch active content' });
    }
}

/**
 * Preview schedule occurrences
 * GET /api/schedules/:id/preview
 */
export async function getSchedulePreview(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { count = '10' } = req.query;

        const schedule = await prisma.schedule.findUnique({ where: { id } });
        if (!schedule) {
            return res.status(404).json({ success: false, error: 'Schedule not found' });
        }

        const occurrences = scheduleService.getNextOccurrences(schedule, parseInt(count as string, 10));

        res.json({
            success: true,
            data: {
                scheduleId: id,
                occurrences,
                recurrenceDescription: scheduleService.describeRecurrence(schedule.recurrence),
            },
        });
    } catch (error) {
        log.error('Error fetching schedule preview', error);
        res.status(500).json({ success: false, error: 'Failed to fetch schedule preview' });
    }
}
