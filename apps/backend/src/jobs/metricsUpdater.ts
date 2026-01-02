/**
 * Metrics Updater Job
 * Periodically updates gauge metrics from database
 */

import { prisma } from '../utils/prisma';
import {
    updateDisplayMetrics,
    activeAlerts,
    activeSyncGroups,
    websocketConnections
} from '../services/metricsService';
import { getIO } from '../socket/socketManager';
import { log } from '../middleware/logger';

const UPDATE_INTERVAL_MS = 30000; // 30 seconds

let intervalId: NodeJS.Timeout | null = null;

async function updateMetrics(): Promise<void> {
    try {
        // Display counts
        const displayStats = await prisma.display.groupBy({
            by: ['status'],
            _count: true,
        });

        let online = 0, offline = 0, error = 0;
        for (const stat of displayStats) {
            if (stat.status === 'ONLINE') online = stat._count;
            else if (stat.status === 'OFFLINE') offline = stat._count;
            else if (stat.status === 'ERROR') error = stat._count;
        }
        updateDisplayMetrics(online, offline, error);

        // Active alerts
        const alertCounts = await prisma.alert.groupBy({
            by: ['type'],
            where: { isActive: true },
            _count: true,
        });

        activeAlerts.reset();
        for (const alert of alertCounts) {
            activeAlerts.set({ type: alert.type.toLowerCase() }, alert._count);
        }

        // Active sync groups
        const syncCount = await prisma.syncGroup.count({
            where: { state: 'PLAYING' },
        });
        activeSyncGroups.set(syncCount);

        // WebSocket connections
        const io = getIO();
        if (io) {
            const sockets = await io.fetchSockets();
            let displaySockets = 0, adminSockets = 0;
            for (const socket of sockets) {
                const socketType = (socket.data as { type?: string })?.type;
                if (socketType === 'display') displaySockets++;
                else adminSockets++;
            }
            websocketConnections.set({ type: 'display' }, displaySockets);
            websocketConnections.set({ type: 'admin' }, adminSockets);
        }

    } catch (error) {
        log.error('[MetricsUpdater] Failed to update metrics', { error });
    }
}

export function startMetricsUpdater(): void {
    if (intervalId) return;

    // Initial update
    updateMetrics();

    // Schedule periodic updates
    intervalId = setInterval(updateMetrics, UPDATE_INTERVAL_MS);

    log.info('[MetricsUpdater] Started - updating every 30 seconds');
}

export function stopMetricsUpdater(): void {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        log.info('[MetricsUpdater] Stopped');
    }
}
