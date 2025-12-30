/**
 * Sync Service
 * Manages sync groups and playback state for display synchronization
 * Uses Conductor Pattern: one display is master, others follow
 */

import { log } from '../middleware/logger';
import { getIO } from '../socket/socketManager';
import type {
    SyncGroup,
    SyncTick,
    ConductorInfo,
    SyncConductorChangedEvent,
    SyncGroupUpdatedEvent
} from '@shared-types';

// ==============================================
// IN-MEMORY STATE
// ==============================================

/**
 * Map of sync groups by ID
 */
const syncGroups = new Map<string, SyncGroup>();

/**
 * Map of displayId to groupId for quick lookup
 */
const displayToGroup = new Map<string, string>();

/**
 * Map of socketId to displayId
 */
const socketToDisplay = new Map<string, string>();

/**
 * Sync tick interval reference
 */
let tickInterval: NodeJS.Timeout | null = null;
const TICK_INTERVAL_MS = 100; // 100ms for <200ms sync precision

// ==============================================
// GROUP MANAGEMENT
// ==============================================

/**
 * Generate a unique group ID
 */
function generateGroupId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new sync group
 */
export function createSyncGroup(name: string, displayIds: string[]): SyncGroup {
    const id = generateGroupId();
    const now = Date.now();

    const group: SyncGroup = {
        id,
        name,
        displayIds,
        conductorId: null,
        conductorSocketId: null,
        currentContentId: null,
        playbackState: 'stopped',
        currentTime: 0,
        startedAt: null,
        createdAt: now,
        updatedAt: now,
    };

    syncGroups.set(id, group);

    // Map displays to this group
    for (const displayId of displayIds) {
        displayToGroup.set(displayId, id);
    }

    log.info('Sync group created', { id, name, displayCount: displayIds.length });

    // Auto-elect conductor if displays are connected
    electConductor(id);

    // Start tick interval if not running
    startTickInterval();

    return group;
}

/**
 * Get a sync group by ID
 */
export function getSyncGroup(groupId: string): SyncGroup | undefined {
    return syncGroups.get(groupId);
}

/**
 * Get all sync groups
 */
export function getAllSyncGroups(): SyncGroup[] {
    return Array.from(syncGroups.values());
}

/**
 * Update a sync group
 */
export function updateSyncGroup(groupId: string, updates: Partial<Pick<SyncGroup, 'name' | 'displayIds'>>): SyncGroup | null {
    const group = syncGroups.get(groupId);
    if (!group) return null;

    if (updates.name) {
        group.name = updates.name;
    }

    if (updates.displayIds) {
        // Remove old mappings
        for (const oldId of group.displayIds) {
            displayToGroup.delete(oldId);
        }
        // Add new mappings
        for (const newId of updates.displayIds) {
            displayToGroup.set(newId, groupId);
        }
        group.displayIds = updates.displayIds;

        // Re-elect conductor if current one is no longer in group
        if (group.conductorId && !updates.displayIds.includes(group.conductorId)) {
            electConductor(groupId);
        }
    }

    group.updatedAt = Date.now();
    emitGroupUpdated(group);

    return group;
}

/**
 * Delete a sync group
 */
export function deleteSyncGroup(groupId: string): boolean {
    const group = syncGroups.get(groupId);
    if (!group) return false;

    // Remove display mappings
    for (const displayId of group.displayIds) {
        displayToGroup.delete(displayId);
    }

    syncGroups.delete(groupId);
    log.info('Sync group deleted', { groupId });

    // Stop tick interval if no more groups
    if (syncGroups.size === 0) {
        stopTickInterval();
    }

    return true;
}

// ==============================================
// CONDUCTOR MANAGEMENT
// ==============================================

/**
 * Elect a conductor for a group
 * Chooses the first connected display
 */
export function electConductor(groupId: string): ConductorInfo | null {
    const group = syncGroups.get(groupId);
    if (!group || group.displayIds.length === 0) return null;

    // Find first connected display
    for (const displayId of group.displayIds) {
        const socketId = getSocketIdForDisplay(displayId);
        if (socketId) {
            return assignConductor(groupId, displayId, socketId, 'elected');
        }
    }

    log.warn('No connected displays to elect as conductor', { groupId });
    return null;
}

/**
 * Manually assign a conductor
 */
export function assignConductor(
    groupId: string,
    displayId: string,
    socketId: string,
    reason: 'elected' | 'failover' | 'manual' = 'manual'
): ConductorInfo | null {
    const group = syncGroups.get(groupId);
    if (!group) return null;

    if (!group.displayIds.includes(displayId)) {
        log.error('Display not in group', { groupId, displayId });
        return null;
    }

    const oldConductorId = group.conductorId;
    const now = Date.now();

    group.conductorId = displayId;
    group.conductorSocketId = socketId;
    group.updatedAt = now;

    const conductorInfo: ConductorInfo = {
        displayId,
        socketId,
        assignedAt: now,
        lastHeartbeat: now,
    };

    log.info('Conductor assigned', { groupId, displayId, reason });

    // Emit conductor changed event
    emitConductorChanged(groupId, oldConductorId, displayId, reason);

    return conductorInfo;
}

/**
 * Handle conductor disconnect - elect new conductor
 */
export function handleConductorDisconnect(socketId: string): void {
    const displayId = socketToDisplay.get(socketId);
    if (!displayId) return;

    const groupId = displayToGroup.get(displayId);
    if (!groupId) return;

    const group = syncGroups.get(groupId);
    if (!group || group.conductorId !== displayId) return;

    log.info('Conductor disconnected, electing new conductor', { groupId, oldConductorId: displayId });

    // Clear current conductor
    group.conductorId = null;
    group.conductorSocketId = null;

    // Try to elect new conductor (failover)
    const newConductor = electConductorFromConnected(groupId);
    if (newConductor) {
        assignConductor(groupId, newConductor.displayId, newConductor.socketId, 'failover');
    } else {
        // No connected displays, pause playback
        group.playbackState = 'paused';
        group.updatedAt = Date.now();
        emitGroupUpdated(group);
    }
}

/**
 * Find a connected display to be conductor
 */
function electConductorFromConnected(groupId: string): { displayId: string; socketId: string } | null {
    const group = syncGroups.get(groupId);
    if (!group) return null;

    for (const displayId of group.displayIds) {
        if (displayId === group.conductorId) continue; // Skip old conductor
        const socketId = getSocketIdForDisplay(displayId);
        if (socketId) {
            return { displayId, socketId };
        }
    }
    return null;
}

// ==============================================
// PLAYBACK CONTROL
// ==============================================

/**
 * Start playback in a sync group
 */
export function startPlayback(groupId: string, contentId: string, startPosition = 0): boolean {
    const group = syncGroups.get(groupId);
    if (!group) return false;

    const now = Date.now();
    group.currentContentId = contentId;
    group.playbackState = 'playing';
    group.currentTime = startPosition;
    group.startedAt = now - (startPosition * 1000); // Adjust for start position
    group.updatedAt = now;

    log.info('Playback started', { groupId, contentId, startPosition });
    emitGroupUpdated(group);

    return true;
}

/**
 * Pause playback in a sync group
 */
export function pausePlayback(groupId: string): boolean {
    const group = syncGroups.get(groupId);
    if (!group) return false;

    // Capture current time before pausing
    group.currentTime = calculateCurrentTime(group);
    group.playbackState = 'paused';
    group.startedAt = null;
    group.updatedAt = Date.now();

    log.info('Playback paused', { groupId, currentTime: group.currentTime });
    emitGroupUpdated(group);

    return true;
}

/**
 * Resume playback
 */
export function resumePlayback(groupId: string): boolean {
    const group = syncGroups.get(groupId);
    if (!group || !group.currentContentId) return false;

    const now = Date.now();
    group.playbackState = 'playing';
    group.startedAt = now - (group.currentTime * 1000);
    group.updatedAt = now;

    log.info('Playback resumed', { groupId, currentTime: group.currentTime });
    emitGroupUpdated(group);

    return true;
}

/**
 * Seek to position
 */
export function seekPlayback(groupId: string, position: number): boolean {
    const group = syncGroups.get(groupId);
    if (!group) return false;

    const now = Date.now();
    group.currentTime = position;
    if (group.playbackState === 'playing') {
        group.startedAt = now - (position * 1000);
    }
    group.updatedAt = now;

    log.info('Playback seeked', { groupId, position });
    emitGroupUpdated(group);

    return true;
}

/**
 * Stop playback
 */
export function stopPlayback(groupId: string): boolean {
    const group = syncGroups.get(groupId);
    if (!group) return false;

    group.playbackState = 'stopped';
    group.currentTime = 0;
    group.startedAt = null;
    group.updatedAt = Date.now();

    log.info('Playback stopped', { groupId });
    emitGroupUpdated(group);

    return true;
}

// ==============================================
// SYNC TICK BROADCASTING
// ==============================================

/**
 * Calculate current playback time for a group
 */
function calculateCurrentTime(group: SyncGroup): number {
    if (group.playbackState !== 'playing' || !group.startedAt) {
        return group.currentTime;
    }
    return (Date.now() - group.startedAt) / 1000;
}

/**
 * Get all active (playing) groups
 */
export function getActiveGroups(): SyncGroup[] {
    return Array.from(syncGroups.values()).filter(g => g.playbackState === 'playing');
}

/**
 * Broadcast sync ticks to all active groups
 */
function broadcastSyncTicks(): void {
    const io = getIO();
    if (!io) return;

    const activeGroups = getActiveGroups();
    const now = Date.now();

    for (const group of activeGroups) {
        const tick: SyncTick = {
            groupId: group.id,
            contentId: group.currentContentId || '',
            currentTime: calculateCurrentTime(group),
            serverTime: now,
            playbackState: group.playbackState as 'playing' | 'paused',
        };

        // Emit to group room
        io.to(`sync-${group.id}`).emit('sync:tick', tick);
    }
}

/**
 * Start the tick interval
 */
function startTickInterval(): void {
    if (tickInterval) return;

    tickInterval = setInterval(broadcastSyncTicks, TICK_INTERVAL_MS);
    log.info('Sync tick interval started');
}

/**
 * Stop the tick interval
 */
function stopTickInterval(): void {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
        log.info('Sync tick interval stopped');
    }
}

// ==============================================
// SOCKET TRACKING
// ==============================================

/**
 * Register a socket for a display
 */
export function registerDisplaySocket(socketId: string, displayId: string): void {
    socketToDisplay.set(socketId, displayId);

    // Check if display should join a group
    const groupId = displayToGroup.get(displayId);
    if (groupId) {
        const io = getIO();
        if (io) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                socket.join(`sync-${groupId}`);
                log.info('Display joined sync group room', { displayId, groupId });
            }
        }

        // If group has no conductor, elect this display
        const group = syncGroups.get(groupId);
        if (group && !group.conductorId) {
            assignConductor(groupId, displayId, socketId, 'elected');
        }
    }
}

/**
 * Unregister a socket
 */
export function unregisterDisplaySocket(socketId: string): void {
    const displayId = socketToDisplay.get(socketId);
    socketToDisplay.delete(socketId);

    if (displayId) {
        // Handle conductor disconnect
        handleConductorDisconnect(socketId);
    }
}

/**
 * Get socket ID for a display
 */
function getSocketIdForDisplay(displayId: string): string | null {
    for (const [socketId, dId] of socketToDisplay.entries()) {
        if (dId === displayId) return socketId;
    }
    return null;
}

// ==============================================
// EVENT EMISSION
// ==============================================

function emitGroupUpdated(group: SyncGroup): void {
    const io = getIO();
    if (!io) return;

    const event: SyncGroupUpdatedEvent = {
        group,
        timestamp: Date.now(),
    };

    io.to(`sync-${group.id}`).emit('sync:group-updated', event);
}

function emitConductorChanged(
    groupId: string,
    oldConductorId: string | null,
    newConductorId: string,
    reason: 'elected' | 'failover' | 'manual'
): void {
    const io = getIO();
    if (!io) return;

    const event: SyncConductorChangedEvent = {
        groupId,
        oldConductorId,
        newConductorId,
        reason,
        timestamp: Date.now(),
    };

    io.to(`sync-${groupId}`).emit('sync:conductor-changed', event);
}

// ==============================================
// EXPORTS
// ==============================================

export default {
    createSyncGroup,
    getSyncGroup,
    getAllSyncGroups,
    updateSyncGroup,
    deleteSyncGroup,
    electConductor,
    assignConductor,
    startPlayback,
    pausePlayback,
    resumePlayback,
    seekPlayback,
    stopPlayback,
    getActiveGroups,
    registerDisplaySocket,
    unregisterDisplaySocket,
};
