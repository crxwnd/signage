/**
 * Sync Socket Handlers
 * Handles sync group join/leave events from displays
 */

import { Socket } from 'socket.io';
import type {
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData,
} from '@shared-types';
import { log } from '../middleware/logger';
import syncService from '../services/syncService';

type TypedSocket = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

/**
 * Setup sync event handlers for a socket connection
 */
export function setupSyncHandlers(socket: TypedSocket): void {
    // Handle display joining a sync group
    socket.on('sync:join-group', (data) => {
        const { groupId, displayId } = data;

        if (!groupId || !displayId) {
            log.warn('[Sync] Invalid join-group data', { groupId, displayId, socketId: socket.id });
            return;
        }

        log.info('[Sync] Display joining group', { displayId, groupId, socketId: socket.id });

        // Register socket with sync service
        syncService.registerDisplaySocket(socket.id, displayId);

        // Get or validate group
        const group = syncService.getSyncGroup(groupId);

        if (!group) {
            log.warn('[Sync] Group not found', { groupId, displayId });
            return;
        }

        // Check if display is in the group
        if (!group.displayIds.includes(displayId)) {
            log.warn('[Sync] Display not member of group', { displayId, groupId });
            return;
        }

        // Join the sync room for this group
        socket.join(`sync-${groupId}`);

        // Send current group state to the joining display (for late join)
        const currentTime = syncService.getActiveGroups().find(g => g.id === groupId)
            ? calculateCurrentTime(group)
            : group.currentTime;

        socket.emit('sync:group-state', {
            groupId: group.id,
            contentId: group.currentContentId,
            currentTime,
            playbackState: group.playbackState,
            conductorId: group.conductorId,
            displayIds: group.displayIds,
        });

        log.info('[Sync] Display joined group successfully', {
            displayId,
            groupId,
            playbackState: group.playbackState,
            currentTime,
        });
    });

    // Handle display leaving a sync group
    socket.on('sync:leave-group', (data) => {
        const { groupId, displayId } = data;

        if (!groupId || !displayId) {
            log.warn('[Sync] Invalid leave-group data', { groupId, displayId });
            return;
        }

        log.info('[Sync] Display leaving group', { displayId, groupId, socketId: socket.id });

        // Leave the sync room
        socket.leave(`sync-${groupId}`);

        // Unregister from sync service
        syncService.unregisterDisplaySocket(socket.id);

        log.info('[Sync] Display left group successfully', { displayId, groupId });
    });

    // Handle conductor reporting position
    socket.on('sync:report-position', (data) => {
        const { groupId, displayId, currentTime } = data;

        if (!groupId || !displayId || typeof currentTime !== 'number') {
            return;
        }

        const group = syncService.getSyncGroup(groupId);

        // Only accept position reports from conductor
        if (group && group.conductorId === displayId) {
            // Update group's current time
            // This helps maintain accurate time even if server tick drifts
            log.debug('[Sync] Conductor position report', { groupId, displayId, currentTime });
        }
    });
}

/**
 * Calculate current playback time for a group
 */
function calculateCurrentTime(group: {
    playbackState: string;
    startedAt: number | null;
    currentTime: number;
}): number {
    if (group.playbackState !== 'playing' || !group.startedAt) {
        return group.currentTime;
    }

    const elapsed = (Date.now() - group.startedAt) / 1000;
    return group.currentTime + elapsed;
}
