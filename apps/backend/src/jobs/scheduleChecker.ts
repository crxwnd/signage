/**
 * Schedule Checker Job
 * Runs every minute to check active schedules and emit socket events
 * when schedules activate or end based on current time and RRULE.
 */

import { prisma } from '../utils/prisma';
import { getIO } from '../socket/socketManager';
import { scheduleService } from '../services/scheduleService';
import { log } from '../middleware/logger';

// Track active schedules per display to detect changes
const activeSchedulesByDisplay = new Map<string, string>();

/**
 * Check all schedules and emit events for changes
 */
async function checkSchedules(): Promise<void> {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    log.debug('[ScheduleChecker] Running check', { time: currentTime });

    try {
        const io = getIO();
        if (!io) {
            log.warn('[ScheduleChecker] Socket.io not available');
            return;
        }

        // Get all active schedules with their targets
        const schedules = await prisma.schedule.findMany({
            where: {
                isActive: true,
            },
            include: {
                content: true,
                display: true,
                area: {
                    include: {
                        displays: { select: { id: true } },
                    },
                },
            },
        });

        // Get all displays to check
        const displaysToCheck = new Set<string>();
        schedules.forEach((schedule) => {
            if (schedule.displayId) {
                displaysToCheck.add(schedule.displayId);
            }
            if (schedule.area) {
                schedule.area.displays.forEach((d) => displaysToCheck.add(d.id));
            }
        });

        // Check each display
        for (const displayId of displaysToCheck) {
            // Find highest priority active schedule for this display
            const displaySchedules = schedules.filter((s) => {
                if (s.displayId === displayId) return true;
                if (s.area?.displays.some((d) => d.id === displayId)) return true;
                return false;
            });

            let activeSchedule = null;
            for (const schedule of displaySchedules.sort((a, b) => b.priority - a.priority)) {
                if (scheduleService.isScheduleActiveNow(schedule)) {
                    activeSchedule = schedule;
                    break;
                }
            }

            const previousScheduleId = activeSchedulesByDisplay.get(displayId);
            const currentScheduleId = activeSchedule?.id;

            // Schedule activated
            if (currentScheduleId && currentScheduleId !== previousScheduleId) {
                log.info('[ScheduleChecker] Schedule activated', {
                    displayId,
                    scheduleId: currentScheduleId,
                    scheduleName: activeSchedule?.name,
                });

                activeSchedulesByDisplay.set(displayId, currentScheduleId);

                (io.to(`display:${displayId}`) as any).emit('schedule:activated', {
                    scheduleId: currentScheduleId,
                    schedule: {
                        id: activeSchedule!.id,
                        name: activeSchedule!.name,
                        priority: activeSchedule!.priority,
                        endTime: activeSchedule!.endTime,
                        contentId: activeSchedule!.contentId,
                        content: activeSchedule!.content ? {
                            id: activeSchedule!.content.id,
                            name: activeSchedule!.content.name,
                            type: activeSchedule!.content.type,
                            hlsUrl: activeSchedule!.content.hlsUrl,
                            originalUrl: activeSchedule!.content.originalUrl,
                            duration: activeSchedule!.content.duration,
                        } : null,
                    },
                });
            }

            // Schedule ended
            if (previousScheduleId && !currentScheduleId) {
                log.info('[ScheduleChecker] Schedule ended', {
                    displayId,
                    scheduleId: previousScheduleId,
                });

                activeSchedulesByDisplay.delete(displayId);

                (io.to(`display:${displayId}`) as any).emit('schedule:ended', {
                    scheduleId: previousScheduleId,
                });
            }

            // Schedule changed (one ended, another started)
            if (previousScheduleId && currentScheduleId && previousScheduleId !== currentScheduleId) {
                log.info('[ScheduleChecker] Schedule changed', {
                    displayId,
                    previousScheduleId,
                    currentScheduleId,
                });

                // Emit end for old, then activation for new (already handled above)
                (io.to(`display:${displayId}`) as any).emit('schedule:ended', {
                    scheduleId: previousScheduleId,
                });
            }
        }

        // Clean up displays that no longer have schedules
        for (const [displayId, scheduleId] of activeSchedulesByDisplay.entries()) {
            if (!displaysToCheck.has(displayId)) {
                log.info('[ScheduleChecker] Removing orphaned schedule tracking', { displayId, scheduleId });
                activeSchedulesByDisplay.delete(displayId);
            }
        }

    } catch (error) {
        log.error('[ScheduleChecker] Error checking schedules', { error });
    }
}

/**
 * Start the schedule checker job
 */
export function startScheduleChecker(): void {
    // Run immediately on startup
    checkSchedules();

    // Run every 60 seconds
    setInterval(checkSchedules, 60 * 1000);

    log.info('[ScheduleChecker] Started - checking every 60 seconds');
}

/**
 * Get currently active schedules (for debugging)
 */
export function getActiveSchedules(): Map<string, string> {
    return new Map(activeSchedulesByDisplay);
}
