/**
 * Schedule Service
 * Handles scheduling logic with RRULE recurrence support
 */

import { RRule } from 'rrule';
import { prisma } from '../utils/prisma';
import { Schedule } from '@prisma/client';

interface ActiveSchedule {
    scheduleId: string;
    contentId: string;
    priority: number;
    scheduleName: string;
}

class ScheduleService {
    /**
     * Get the currently active content for a display based on schedules
     * Considers both direct display schedules and area schedules
     */
    async getActiveContent(displayId: string): Promise<ActiveSchedule | null> {
        // Get display with area info
        const display = await prisma.display.findUnique({
            where: { id: displayId },
            select: { id: true, areaId: true, hotelId: true },
        });

        if (!display) return null;

        // Get all potentially active schedules (direct + area)
        const schedules = await prisma.schedule.findMany({
            where: {
                isActive: true,
                hotelId: display.hotelId,
                OR: [
                    { displayId: displayId },
                    ...(display.areaId ? [{ areaId: display.areaId }] : []),
                ],
            },
            orderBy: { priority: 'desc' },
        });

        // Find the first active schedule
        for (const schedule of schedules) {
            if (this.isScheduleActiveNow(schedule)) {
                return {
                    scheduleId: schedule.id,
                    contentId: schedule.contentId,
                    priority: schedule.priority,
                    scheduleName: schedule.name,
                };
            }
        }

        return null;
    }

    /**
     * Check if a schedule is currently active
     */
    isScheduleActiveNow(schedule: Schedule): boolean {
        const now = new Date();

        // Check date range
        if (now < schedule.startDate) return false;
        if (schedule.endDate && now > schedule.endDate) return false;

        // Check time of day (HH:mm format)
        const currentTime = now.toTimeString().slice(0, 5); // "HH:mm"
        if (currentTime < schedule.startTime || currentTime > schedule.endTime) {
            return false;
        }

        // Check recurrence if defined
        if (schedule.recurrence) {
            try {
                const rule = RRule.fromString(`DTSTART:${this.formatDateForRRule(schedule.startDate)}\n${schedule.recurrence}`);
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);

                const occurrences = rule.between(todayStart, todayEnd);
                if (occurrences.length === 0) return false;
            } catch (error) {
                console.error('[ScheduleService] Invalid RRULE:', schedule.recurrence, error);
                return false;
            }
        }

        return true;
    }

    /**
     * Get next occurrences of a schedule
     */
    getNextOccurrences(schedule: Schedule, count: number = 5): Date[] {
        if (!schedule.recurrence) {
            // One-time schedule
            return [schedule.startDate];
        }

        try {
            const rule = RRule.fromString(`DTSTART:${this.formatDateForRRule(schedule.startDate)}\n${schedule.recurrence}`);
            return rule.all((_, i) => i < count);
        } catch (error) {
            console.error('[ScheduleService] Invalid RRULE:', schedule.recurrence, error);
            return [schedule.startDate];
        }
    }

    /**
     * Get schedules that will start in the next N minutes
     * Used by the notification job
     */
    async getSchedulesStartingIn(minutes: number): Promise<Schedule[]> {
        const now = new Date();
        const future = new Date(now.getTime() + minutes * 60 * 1000);
        const currentTime = now.toTimeString().slice(0, 5);
        const futureTime = future.toTimeString().slice(0, 5);

        const schedules = await prisma.schedule.findMany({
            where: {
                isActive: true,
                startDate: { lte: future },
                OR: [{ endDate: null }, { endDate: { gte: now } }],
                startTime: {
                    gte: currentTime,
                    lte: futureTime,
                },
            },
            include: {
                content: true,
                display: true,
                area: { include: { displays: true } },
            },
        });

        // Filter by recurrence
        return schedules.filter((s) => {
            if (!s.recurrence) return true;
            try {
                const rule = RRule.fromString(`DTSTART:${this.formatDateForRRule(s.startDate)}\n${s.recurrence}`);
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);
                return rule.between(todayStart, todayEnd).length > 0;
            } catch {
                return false;
            }
        });
    }

    /**
     * Get all displays affected by a schedule
     */
    async getAffectedDisplayIds(schedule: Schedule): Promise<string[]> {
        if (schedule.displayId) {
            return [schedule.displayId];
        }

        if (schedule.areaId) {
            const displays = await prisma.display.findMany({
                where: { areaId: schedule.areaId },
                select: { id: true },
            });
            return displays.map((d) => d.id);
        }

        return [];
    }

    /**
     * Format date for RRULE DTSTART
     */
    private formatDateForRRule(date: Date): string {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    /**
     * Parse RRULE string to human-readable description
     */
    describeRecurrence(rrule: string | null): string {
        if (!rrule) return 'Una vez';

        try {
            const rule = RRule.fromString(rrule);
            return rule.toText();
        } catch {
            return rrule;
        }
    }

    /**
     * Validate RRULE string
     */
    isValidRRule(rrule: string): boolean {
        try {
            RRule.fromString(rrule);
            return true;
        } catch {
            return false;
        }
    }
}

export const scheduleService = new ScheduleService();
