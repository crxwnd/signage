/**
 * Analytics Service
 * Provides real analytics data from PlaybackLog and display status
 * Replaces mock data with actual database queries
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

/**
 * Get analytics overview with real data
 */
export async function getAnalyticsOverview(from: Date, to: Date) {
    try {
        // Get display stats
        const [onlineCount, totalCount] = await Promise.all([
            prisma.display.count({ where: { status: 'ONLINE' } }),
            prisma.display.count()
        ]);

        // Get playback logs for the period
        const playbackLogs = await prisma.playbackLog.findMany({
            where: {
                startedAt: { gte: from, lte: to }
            },
            select: {
                id: true,
                startedAt: true,
                duration: true,
                contentId: true,
                displayId: true
            }
        });

        // Calculate KPIs
        const totalPlays = playbackLogs.length;
        const uptimePercent = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;

        // Generate activity trend by day
        const activityByDay = new Map<string, { plays: number; bandwidth: number }>();

        // Initialize all days in range
        const currentDate = new Date(from);
        while (currentDate <= to) {
            const dateKey = currentDate.toISOString().split('T')[0] as string;
            activityByDay.set(dateKey, { plays: 0, bandwidth: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Aggregate plays by day
        playbackLogs.forEach(logEntry => {
            const dateKey = logEntry.startedAt.toISOString().split('T')[0] as string;
            const existing = activityByDay.get(dateKey);
            if (existing) {
                existing.plays++;
                // Estimate bandwidth: ~50MB per play (rough average)
                existing.bandwidth += 50;
            }
        });

        const activityTrend = Array.from(activityByDay.entries()).map(([date, data]) => ({
            date,
            plays: data.plays,
            bandwidth: data.bandwidth
        }));

        // Get top displays by plays
        const playsByDisplay = new Map<string, number>();
        playbackLogs.forEach(logEntry => {
            playsByDisplay.set(logEntry.displayId, (playsByDisplay.get(logEntry.displayId) || 0) + 1);
        });

        const displayNames = await prisma.display.findMany({
            where: { id: { in: Array.from(playsByDisplay.keys()) } },
            select: { id: true, name: true }
        });

        const topDisplays = Array.from(playsByDisplay.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([id, plays]) => ({
                id,
                name: displayNames.find(d => d.id === id)?.name || 'Unknown',
                plays
            }));

        return {
            period: { start: from.toISOString(), end: to.toISOString() },
            kpis: {
                uptimePercent,
                totalPlays,
                bandwidthGB: Math.round(totalPlays * 50 / 1024), // Estimate
                activeDisplays: onlineCount
            },
            activityTrend,
            topDisplays
        };
    } catch (error) {
        log.error('[AnalyticsService] Failed to get overview', { error });
        throw error;
    }
}

/**
 * Get display analytics with real uptime calculation
 */
export async function getDisplayAnalytics() {
    try {
        const displays = await prisma.display.findMany({
            include: {
                area: { select: { name: true } },
                hotel: { select: { name: true } },
                _count: {
                    select: { playbackLogs: true }
                }
            }
        });

        // Get playback logs for uptime calculation (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const displayMetrics = await Promise.all(displays.map(async (display) => {
            // Count total hours the display was online (based on playback logs)
            const logs = await prisma.playbackLog.findMany({
                where: {
                    displayId: display.id,
                    startedAt: { gte: thirtyDaysAgo }
                },
                select: { duration: true }
            });

            const totalSeconds = logs.reduce((sum, logEntry) => sum + (logEntry.duration || 0), 0);
            const hoursOnline = Math.round(totalSeconds / 3600);

            // Calculate uptime percentage (hours online / 720 hours in 30 days)
            const uptimePercent = Math.min(100, Math.round((hoursOnline / 720) * 100));

            // Count disconnections (ContentSourceChange with reason 'disconnected')
            const disconnections = await prisma.contentSourceChange.count({
                where: {
                    displayId: display.id,
                    reason: { contains: 'disconnect' },
                    timestamp: { gte: thirtyDaysAgo }
                }
            });

            return {
                id: display.id,
                name: display.name,
                location: display.area?.name || display.hotel?.name || 'Unknown',
                status: display.status,
                uptimePercent,
                hoursOnline,
                disconnections,
                lastError: null,
                bandwidthMB: hoursOnline * 100, // Rough estimate
                lastSeen: display.lastSeen
            };
        }));

        return {
            displays: displayMetrics,
            pagination: { page: 1, total: displays.length }
        };
    } catch (error) {
        log.error('[AnalyticsService] Failed to get display analytics', { error });
        throw error;
    }
}

/**
 * Get bandwidth analytics
 */
export async function getBandwidthAnalytics() {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // Get all playback logs
        const logs = await prisma.playbackLog.findMany({
            where: { startedAt: { gte: thirtyDaysAgo } },
            include: {
                display: { select: { id: true, name: true } }
            }
        });

        // Aggregate by day
        const dailyMap = new Map<string, number>();
        const displayMap = new Map<string, { name: string; totalMB: number }>();

        logs.forEach(logEntry => {
            const date = logEntry.startedAt.toISOString().split('T')[0] as string;
            const estimatedMB = (logEntry.duration || 60) * 2; // ~2MB per minute estimate

            dailyMap.set(date, (dailyMap.get(date) || 0) + estimatedMB);

            const existing = displayMap.get(logEntry.displayId);
            if (existing) {
                existing.totalMB += estimatedMB;
            } else {
                displayMap.set(logEntry.displayId, {
                    name: logEntry.display.name,
                    totalMB: estimatedMB
                });
            }
        });

        // Fill in missing days
        const daily = [];
        const currentDate = new Date(thirtyDaysAgo);
        const now = new Date();
        while (currentDate <= now) {
            const dateKey = currentDate.toISOString().split('T')[0] as string;
            daily.push({
                date: dateKey,
                totalMB: dailyMap.get(dateKey) || 0
            });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const byDisplay = Array.from(displayMap.entries())
            .map(([displayId, data]) => ({
                displayId,
                name: data.name,
                totalMB: data.totalMB
            }))
            .sort((a, b) => b.totalMB - a.totalMB)
            .slice(0, 10);

        const totalMB = daily.reduce((sum, d) => sum + d.totalMB, 0);
        const totalGB = Math.round(totalMB / 1024);
        const avgDailyMB = daily.length > 0 ? Math.round(totalMB / daily.length) : 0;

        return {
            daily,
            byDisplay,
            summary: {
                totalGB,
                avgDailyMB,
                projectedMonthlyGB: Math.round(avgDailyMB * 30 / 1024)
            }
        };
    } catch (error) {
        log.error('[AnalyticsService] Failed to get bandwidth analytics', { error });
        throw error;
    }
}

/**
 * Get content analytics
 */
export async function getContentAnalytics() {
    try {
        const contents = await prisma.content.findMany({
            where: { status: 'READY' }
        });

        // Get play counts from PlaybackLog
        const contentMetrics = await Promise.all(contents.map(async (content) => {
            const logs = await prisma.playbackLog.findMany({
                where: { contentId: content.id },
                select: { duration: true }
            });

            const plays = logs.length;
            const totalDuration = logs.reduce((sum, logEntry) => sum + (logEntry.duration || 0), 0);
            const avgDuration = plays > 0 ? Math.round(totalDuration / plays) : 0;

            // Count unique displays
            const uniqueDisplays = await prisma.playbackLog.groupBy({
                by: ['displayId'],
                where: { contentId: content.id }
            });

            return {
                id: content.id,
                name: content.name,
                type: content.type,
                plays,
                completionRate: plays > 0 ? Math.min(100, Math.round((avgDuration / (content.duration || 60)) * 100)) : 0,
                avgDuration,
                displaysCount: uniqueDisplays.length
            };
        }));

        return {
            content: contentMetrics.sort((a, b) => b.plays - a.plays)
        };
    } catch (error) {
        log.error('[AnalyticsService] Failed to get content analytics', { error });
        throw error;
    }
}

/**
 * Record a playback event
 */
export async function recordPlaybackStart(data: {
    displayId: string;
    contentId: string;
    sourceType: string;
    sourceId?: string;
    hotelId: string;
}): Promise<string> {
    try {
        const logEntry = await prisma.playbackLog.create({
            data: {
                displayId: data.displayId,
                contentId: data.contentId,
                sourceType: data.sourceType,
                sourceId: data.sourceId,
                hotelId: data.hotelId,
                startedAt: new Date()
            }
        });

        log.info('[AnalyticsService] Recorded playback start', { logId: logEntry.id, displayId: data.displayId });
        return logEntry.id;
    } catch (error) {
        log.error('[AnalyticsService] Failed to record playback start', { error });
        throw error;
    }
}

/**
 * Record playback end
 */
export async function recordPlaybackEnd(logId: string, reason?: string): Promise<void> {
    try {
        const logEntry = await prisma.playbackLog.findUnique({
            where: { id: logId }
        });

        if (!logEntry) return;

        const duration = Math.round((Date.now() - logEntry.startedAt.getTime()) / 1000);

        await prisma.playbackLog.update({
            where: { id: logId },
            data: {
                endedAt: new Date(),
                duration,
                endReason: reason
            }
        });

        log.info('[AnalyticsService] Recorded playback end', { logId, duration, reason });
    } catch (error) {
        log.error('[AnalyticsService] Failed to record playback end', { error });
        throw error;
    }
}

export default {
    getAnalyticsOverview,
    getDisplayAnalytics,
    getBandwidthAnalytics,
    getContentAnalytics,
    recordPlaybackStart,
    recordPlaybackEnd
};
