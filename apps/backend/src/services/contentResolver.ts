/**
 * Content Resolver Service
 * Determines what content a display should show based on priority hierarchy:
 * 1. Alerts (priority 1000+)
 * 2. Sync Groups (priority 500, when playing)
 * 3. Schedules (priority 100+)
 * 4. Playlist (priority 0)
 * 5. Fallback (priority -1)
 */

import { prisma } from '../utils/prisma';
import { scheduleService } from './scheduleService';
import { RRule } from 'rrule';
import { log } from '../middleware/logger';

// Local type definitions for content source
type ContentSourceType = 'alert' | 'sync' | 'schedule' | 'playlist' | 'fallback' | 'none';
type SyncState = 'STOPPED' | 'PLAYING' | 'PAUSED';

interface ContentInfo {
    id: string;
    name: string;
    type: string;
    hlsUrl?: string | null;
    originalUrl?: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
}

interface SyncGroupInfo {
    id: string;
    name: string;
    state: SyncState;
    position: number;
    currentItem: number;
    playlistItems: Array<{
        contentId: string;
        content: ContentInfo;
        order: number;
        duration?: number | null;
    }>;
}

interface ContentSource {
    type: ContentSourceType;
    priority: number;
    contentId?: string;
    content?: ContentInfo;
    syncGroupId?: string;
    syncGroup?: SyncGroupInfo;
    alertId?: string;
    alert?: { id: string; name: string; message?: string | null; type: string };
    scheduleId?: string;
    schedule?: { id: string; name: string; endTime: string };
    reason: string;
}

class ContentResolver {
    /**
     * Resolve what content a display should show right now
     */
    async resolve(displayId: string): Promise<ContentSource> {
        const display = await prisma.display.findUnique({
            where: { id: displayId },
            include: {
                area: true,
                hotel: true,
                fallbackContent: true,
            },
        });

        if (!display) {
            return { type: 'none', priority: -1, reason: 'Display not found' };
        }

        // 1. Check for ALERTS (highest priority)
        const alert = await this.getActiveAlert(display);
        if (alert) {
            return {
                type: 'alert',
                priority: 1000 + alert.priority,
                alertId: alert.id,
                alert: {
                    id: alert.id,
                    name: alert.name,
                    message: alert.message,
                    type: alert.type,
                },
                contentId: alert.contentId,
                content: this.mapContent(alert.content),
                reason: `Alert: ${alert.name} (priority ${alert.priority})`,
            };
        }

        // 2. Check for SYNC GROUP (when playing)
        const syncGroup = await this.getActiveSyncGroup(display);
        if (syncGroup) {
            return {
                type: 'sync',
                priority: 500,
                syncGroupId: syncGroup.id,
                syncGroup: this.mapSyncGroup(syncGroup),
                reason: `Sync Group: ${syncGroup.name} (${syncGroup.state})`,
            };
        }

        // 3. Check for SCHEDULE
        const schedule = await this.getActiveSchedule(display);
        if (schedule) {
            return {
                type: 'schedule',
                priority: 100 + schedule.priority,
                scheduleId: schedule.id,
                schedule: {
                    id: schedule.id,
                    name: schedule.name,
                    endTime: schedule.endTime,
                },
                contentId: schedule.contentId,
                content: this.mapContent(schedule.content),
                reason: `Schedule: ${schedule.name} (priority ${schedule.priority})`,
            };
        }

        // 4. Check for PLAYLIST
        const playlist = await this.getDisplayPlaylist(display);
        if (playlist.length > 0) {
            return {
                type: 'playlist',
                priority: 0,
                syncGroup: {
                    id: `playlist-${displayId}`,
                    name: 'Display Playlist',
                    state: 'PLAYING',
                    position: 0,
                    currentItem: 0,
                    playlistItems: playlist.map((item, index) => ({
                        contentId: item.contentId,
                        content: this.mapContent(item.content)!,
                        order: index,
                        duration: item.content.type === 'IMAGE' ? 15 : item.content.duration,
                    })),
                },
                reason: 'Display playlist',
            };
        }

        // 5. FALLBACK content
        if (display.fallbackContent) {
            return {
                type: 'fallback',
                priority: -1,
                contentId: display.fallbackContentId!,
                content: this.mapContent(display.fallbackContent),
                reason: 'Fallback content',
            };
        }

        // 6. No content
        return {
            type: 'none',
            priority: -1,
            reason: 'No content assigned',
        };
    }

    /**
     * Get active alert for display (cascading: display > area > hotel)
     */
    private async getActiveAlert(display: { id: string; hotelId: string; areaId: string | null }) {
        const now = new Date();

        const alerts = await prisma.alert.findMany({
            where: {
                isActive: true,
                hotelId: display.hotelId,
                startAt: { lte: now },
                OR: [{ endAt: null }, { endAt: { gt: now } }],
                AND: [
                    {
                        OR: [
                            { displayId: display.id },
                            { displayId: null, areaId: display.areaId },
                            { displayId: null, areaId: null },
                        ],
                    },
                ],
            },
            include: {
                content: true,
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            take: 1,
        });

        return alerts[0] || null;
    }

    /**
     * Get active sync group for display
     */
    private async getActiveSyncGroup(display: { id: string }) {
        const membership = await prisma.syncGroupDisplay.findFirst({
            where: { displayId: display.id },
            include: {
                syncGroup: {
                    include: {
                        playlistItems: {
                            include: { content: true },
                            orderBy: { order: 'asc' },
                        },
                        content: true,
                    },
                },
            },
        });

        if (!membership) return null;

        const syncGroup = membership.syncGroup;

        // Only return if playing
        if (syncGroup.state !== 'PLAYING') return null;

        // Check schedule if enabled
        if (syncGroup.scheduleEnabled) {
            if (!this.isSyncScheduleActive(syncGroup)) {
                return null;
            }
        }

        // If single contentId, convert to playlistItems format
        if (syncGroup.contentId && syncGroup.playlistItems.length === 0 && syncGroup.content) {
            (syncGroup as any).playlistItems = [
                {
                    id: 'single',
                    syncGroupId: syncGroup.id,
                    contentId: syncGroup.contentId,
                    content: syncGroup.content,
                    order: 0,
                    duration: null,
                },
            ];
        }

        return syncGroup;
    }

    /**
     * Check if sync group schedule is active
     */
    private isSyncScheduleActive(syncGroup: {
        scheduleStart: Date | null;
        scheduleEnd: Date | null;
        scheduleStartTime: string | null;
        scheduleEndTime: string | null;
        scheduleRecurrence: string | null;
    }): boolean {
        const now = new Date();

        // Check date range
        if (syncGroup.scheduleStart && now < syncGroup.scheduleStart) return false;
        if (syncGroup.scheduleEnd && now > syncGroup.scheduleEnd) return false;

        // Check time of day
        if (syncGroup.scheduleStartTime && syncGroup.scheduleEndTime) {
            const currentTime = now.toTimeString().slice(0, 5);
            if (currentTime < syncGroup.scheduleStartTime) return false;
            if (currentTime > syncGroup.scheduleEndTime) return false;
        }

        // Check recurrence
        if (syncGroup.scheduleRecurrence) {
            try {
                const rule = RRule.fromString(syncGroup.scheduleRecurrence);
                const todayStart = new Date(now);
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date(now);
                todayEnd.setHours(23, 59, 59, 999);
                const occurrences = rule.between(todayStart, todayEnd);
                if (occurrences.length === 0) return false;
            } catch (error) {
                log.warn('Invalid RRULE in sync group schedule', { error });
            }
        }

        return true;
    }

    /**
     * Get active schedule for display
     */
    private async getActiveSchedule(display: { id: string; hotelId: string; areaId: string | null }) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5);

        const schedules = await prisma.schedule.findMany({
            where: {
                isActive: true,
                hotelId: display.hotelId,
                startDate: { lte: now },
                OR: [{ endDate: null }, { endDate: { gte: now } }],
                startTime: { lte: currentTime },
                endTime: { gte: currentTime },
                AND: [
                    {
                        OR: [
                            { displayId: display.id },
                            { displayId: null, areaId: display.areaId },
                            { displayId: null, areaId: null },
                        ],
                    },
                ],
            },
            include: {
                content: true,
            },
            orderBy: [{ priority: 'desc' }],
        });

        // Find first active schedule (considering recurrence)
        for (const schedule of schedules) {
            if (scheduleService.isScheduleActiveNow(schedule)) {
                return schedule;
            }
        }

        return null;
    }

    /**
     * Get playlist assigned to display
     */
    private async getDisplayPlaylist(display: { id: string }) {
        return prisma.displayContent.findMany({
            where: {
                displayId: display.id,
                content: { status: 'READY' },
            },
            include: { content: true },
            orderBy: { order: 'asc' },
        });
    }

    /**
     * Map content to response format
     */
    private mapContent(content: any): ContentInfo | undefined {
        if (!content) return undefined;
        return {
            id: content.id,
            name: content.name,
            type: content.type,
            hlsUrl: content.hlsUrl,
            originalUrl: content.originalUrl,
            thumbnailUrl: content.thumbnailUrl,
            duration: content.duration,
        };
    }

    /**
     * Map sync group to response format
     */
    private mapSyncGroup(syncGroup: any): SyncGroupInfo {
        return {
            id: syncGroup.id,
            name: syncGroup.name,
            state: syncGroup.state,
            position: syncGroup.position,
            currentItem: syncGroup.currentItem,
            playlistItems: syncGroup.playlistItems.map((item: any) => ({
                contentId: item.contentId,
                content: this.mapContent(item.content)!,
                order: item.order,
                duration: item.duration,
            })),
        };
    }
}

export const contentResolver = new ContentResolver();
