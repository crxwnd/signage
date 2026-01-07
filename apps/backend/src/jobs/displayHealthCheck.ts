/**
 * Display Health Check Job
 * Marks displays as OFFLINE if they haven't sent heartbeat recently
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import { DisplayStatus } from '@prisma/client';

// Time without heartbeat before marking as OFFLINE (5 minutes)
const HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000;

// Check interval (1 minute)
const CHECK_INTERVAL_MS = 60 * 1000;

let intervalId: NodeJS.Timeout | null = null;

/**
 * Check all displays and mark stale ones as OFFLINE
 */
async function checkDisplayHealth(): Promise<void> {
    try {
        const cutoffTime = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);

        // Find displays that are ONLINE but haven't sent heartbeat recently
        const staleDisplays = await prisma.display.findMany({
            where: {
                status: DisplayStatus.ONLINE,
                OR: [
                    { lastSeen: { lt: cutoffTime } },
                    { lastSeen: null }
                ]
            },
            select: { id: true, name: true, lastSeen: true }
        });

        if (staleDisplays.length === 0) {
            return;
        }

        // Mark them as OFFLINE
        const result = await prisma.display.updateMany({
            where: {
                id: { in: staleDisplays.map(d => d.id) }
            },
            data: {
                status: DisplayStatus.OFFLINE
            }
        });

        log.info('[DisplayHealthCheck] Marked stale displays as OFFLINE', {
            count: result.count,
            displays: staleDisplays.map(d => ({ id: d.id, name: d.name, lastSeen: d.lastSeen }))
        });

    } catch (error) {
        log.error('[DisplayHealthCheck] Failed to check display health', { error });
    }
}

/**
 * Start the display health check job
 */
export function startDisplayHealthCheck(): void {
    if (intervalId) {
        log.warn('[DisplayHealthCheck] Already running');
        return;
    }

    log.info('[DisplayHealthCheck] Starting health check job', {
        timeoutMs: HEARTBEAT_TIMEOUT_MS,
        intervalMs: CHECK_INTERVAL_MS
    });

    // Run immediately on startup
    checkDisplayHealth();

    // Then run periodically
    intervalId = setInterval(checkDisplayHealth, CHECK_INTERVAL_MS);
}

/**
 * Stop the display health check job
 */
export function stopDisplayHealthCheck(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        log.info('[DisplayHealthCheck] Stopped health check job');
    }
}

export default {
    startDisplayHealthCheck,
    stopDisplayHealthCheck,
    checkDisplayHealth
};
