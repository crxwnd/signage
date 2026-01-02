/**
 * Sync Socket Handlers - Refactored
 * Integrates with Prisma-based syncService
 */

import { Socket } from 'socket.io';
import { log } from '../middleware/logger';
import syncService from '../services/syncService';

/**
 * Setup sync event handlers for a socket connection
 */
export function setupSyncHandlers(socket: Socket): void {
    // Handle display identifying itself for sync
    socket.on('sync:register', async (data: { displayId: string }) => {
        const { displayId } = data;

        if (!displayId) {
            log.warn('[SyncHandlers] Invalid register data', { socketId: socket.id });
            return;
        }

        log.info('[SyncHandlers] Display registering for sync', { displayId, socketId: socket.id });

        try {
            await syncService.registerDisplaySocket(socket.id, displayId);
        } catch (error) {
            log.error('[SyncHandlers] Failed to register display', { displayId, error });
        }
    });

    // Handle display explicitly joining a sync group
    socket.on('sync:join-group', async (data: { groupId: string; displayId: string }) => {
        const { groupId, displayId } = data;

        if (!groupId || !displayId) {
            log.warn('[SyncHandlers] Invalid join-group data', { socketId: socket.id });
            return;
        }

        log.info('[SyncHandlers] Display joining group', { displayId, groupId, socketId: socket.id });

        // Join the room
        socket.join(`sync:${groupId}`);

        // Register if not already
        try {
            await syncService.registerDisplaySocket(socket.id, displayId);
        } catch (error) {
            log.error('[SyncHandlers] Failed to register on join', { displayId, error });
        }
    });

    // Handle display leaving a sync group
    socket.on('sync:leave-group', (data: { groupId: string }) => {
        const { groupId } = data;

        if (!groupId) return;

        log.info('[SyncHandlers] Display leaving group', { groupId, socketId: socket.id });
        socket.leave(`sync:${groupId}`);
    });

    // Handle conductor position reports (for drift correction)
    socket.on('sync:report-position', (data: { groupId: string; displayId: string; currentTime: number }) => {
        // This can be used for advanced drift correction
        // For now, we trust server-side calculation
        log.debug('[SyncHandlers] Position report', data);
    });

    // Handle disconnect - clean up
    socket.on('disconnect', async () => {
        log.info('[SyncHandlers] Socket disconnected', { socketId: socket.id });

        try {
            await syncService.unregisterDisplaySocket(socket.id);
        } catch (error) {
            log.error('[SyncHandlers] Failed to unregister on disconnect', { error });
        }
    });
}
