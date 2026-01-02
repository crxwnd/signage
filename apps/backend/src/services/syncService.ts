/**
 * Sync Service - Refactored
 * 
 * Manages sync groups using PRISMA for persistence and MAP for runtime state.
 * 
 * Architecture:
 * - Prisma: CRUD, configuration, persisted state
 * - Map: Runtime playback position, connected sockets, tick intervals
 */

import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';
import { getIO } from '../socket/socketManager';
import type {
    SyncRuntimeState,
    SyncGroupWithRelations,
    CreateSyncGroupDTO,
    UpdateSyncGroupDTO,
    StartPlaybackDTO,
    SeekDTO,
    SyncTickPayload,
    SyncStatePayload,
    SyncConductorChangedPayload,
} from '../types/syncTypes';

// ==============================================
// RUNTIME STATE (En memoria)
// ==============================================

/** Runtime state for active sync groups */
const runtimeStates = new Map<string, SyncRuntimeState>();

/** Tick intervals by groupId */
const tickIntervals = new Map<string, NodeJS.Timeout>();

/** Socket to display mapping */
const socketToDisplay = new Map<string, string>();

/** Display to sync group mapping (for quick lookup) */
const displayToGroup = new Map<string, string>();

const TICK_INTERVAL_MS = 100;

// ==============================================
// HELPER: Get Full URL for Content
// ==============================================

function getContentUrl(content: { hlsUrl?: string | null; originalUrl: string }): string {
    return content.hlsUrl || content.originalUrl;
}

// ==============================================
// INCLUDE CLAUSE FOR QUERIES
// ==============================================

const syncGroupInclude = {
    content: true,
    playlistItems: {
        include: { content: true },
        orderBy: { order: 'asc' as const },
    },
    displays: {
        include: { display: true },
    },
    conductor: true,
};

// ==============================================
// CRUD OPERATIONS (Prisma)
// ==============================================

/**
 * Create a new sync group
 */
export async function createSyncGroup(data: CreateSyncGroupDTO): Promise<SyncGroupWithRelations> {
    log.info('[SyncService] Creating sync group', { name: data.name, hotelId: data.hotelId });

    // Validate displays exist and belong to hotel
    const displays = await prisma.display.findMany({
        where: {
            id: { in: data.displayIds },
            hotelId: data.hotelId,
        },
    });

    if (displays.length !== data.displayIds.length) {
        throw new Error('Some displays not found or do not belong to this hotel');
    }

    // Create sync group with relations
    const group = await prisma.syncGroup.create({
        data: {
            name: data.name,
            hotelId: data.hotelId,
            contentId: data.contentId || null,
            state: 'STOPPED',
            position: 0,
            currentItem: 0,
            scheduleEnabled: data.scheduleEnabled || false,
            scheduleStart: data.scheduleStart ? new Date(data.scheduleStart) : null,
            scheduleEnd: data.scheduleEnd ? new Date(data.scheduleEnd) : null,
            scheduleStartTime: data.scheduleStartTime || null,
            scheduleEndTime: data.scheduleEndTime || null,
            scheduleRecurrence: data.scheduleRecurrence || null,
            // Create display memberships
            displays: {
                create: data.displayIds.map(displayId => ({
                    displayId,
                })),
            },
            // Create playlist items if provided
            playlistItems: data.playlistItems ? {
                create: data.playlistItems.map(item => ({
                    contentId: item.contentId,
                    duration: item.duration,
                    order: item.order,
                })),
            } : undefined,
        },
        include: syncGroupInclude,
    });

    // Update display-to-group mapping
    for (const displayId of data.displayIds) {
        displayToGroup.set(displayId, group.id);
    }

    log.info('[SyncService] Sync group created', { groupId: group.id, displayCount: data.displayIds.length });

    return group as SyncGroupWithRelations;
}

/**
 * Get sync group by ID
 */
export async function getSyncGroup(groupId: string): Promise<SyncGroupWithRelations | null> {
    const group = await prisma.syncGroup.findUnique({
        where: { id: groupId },
        include: syncGroupInclude,
    });
    return group as SyncGroupWithRelations | null;
}

/**
 * Get all sync groups (for admin listing)
 */
export async function getAllSyncGroups(hotelId?: string): Promise<SyncGroupWithRelations[]> {
    const groups = await prisma.syncGroup.findMany({
        where: hotelId ? { hotelId } : undefined,
        include: syncGroupInclude,
        orderBy: { createdAt: 'desc' },
    });
    return groups as SyncGroupWithRelations[];
}

/**
 * Update sync group
 */
export async function updateSyncGroup(
    groupId: string,
    data: UpdateSyncGroupDTO
): Promise<SyncGroupWithRelations | null> {
    const existing = await getSyncGroup(groupId);
    if (!existing) return null;

    // Build update data
    const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.contentId !== undefined) updateData.contentId = data.contentId;
    if (data.scheduleEnabled !== undefined) updateData.scheduleEnabled = data.scheduleEnabled;
    if (data.scheduleStart !== undefined) updateData.scheduleStart = data.scheduleStart ? new Date(data.scheduleStart) : null;
    if (data.scheduleEnd !== undefined) updateData.scheduleEnd = data.scheduleEnd ? new Date(data.scheduleEnd) : null;
    if (data.scheduleStartTime !== undefined) updateData.scheduleStartTime = data.scheduleStartTime;
    if (data.scheduleEndTime !== undefined) updateData.scheduleEndTime = data.scheduleEndTime;
    if (data.scheduleRecurrence !== undefined) updateData.scheduleRecurrence = data.scheduleRecurrence;

    // Update displays if provided
    if (data.displayIds) {
        // Remove old mappings
        for (const d of existing.displays) {
            displayToGroup.delete(d.displayId);
        }

        // Delete existing and create new
        await prisma.syncGroupDisplay.deleteMany({ where: { syncGroupId: groupId } });
        await prisma.syncGroupDisplay.createMany({
            data: data.displayIds.map(displayId => ({
                syncGroupId: groupId,
                displayId,
            })),
        });

        // Update mappings
        for (const displayId of data.displayIds) {
            displayToGroup.set(displayId, groupId);
        }

        // Check if conductor was removed
        if (existing.conductorId && !data.displayIds.includes(existing.conductorId)) {
            updateData.conductorId = null;
        }
    }

    // Update playlist items if provided
    if (data.playlistItems) {
        await prisma.syncGroupContent.deleteMany({ where: { syncGroupId: groupId } });
        await prisma.syncGroupContent.createMany({
            data: data.playlistItems.map(item => ({
                syncGroupId: groupId,
                contentId: item.contentId,
                duration: item.duration,
                order: item.order,
            })),
        });
    }

    // Update the group
    const updated = await prisma.syncGroup.update({
        where: { id: groupId },
        data: updateData,
        include: syncGroupInclude,
    });

    // Notify connected displays
    broadcastGroupUpdate(updated as SyncGroupWithRelations);

    return updated as SyncGroupWithRelations;
}

/**
 * Delete sync group
 */
export async function deleteSyncGroup(groupId: string): Promise<boolean> {
    const group = await getSyncGroup(groupId);
    if (!group) return false;

    // Stop playback if running
    await stopPlayback(groupId);

    // Remove from runtime
    runtimeStates.delete(groupId);

    // Remove display mappings
    for (const d of group.displays) {
        displayToGroup.delete(d.displayId);
    }

    // Notify displays before deletion
    broadcastToGroup(groupId, 'sync:group-deleted', { groupId });

    // Delete from DB (cascades to displays and playlist items)
    await prisma.syncGroup.delete({ where: { id: groupId } });

    log.info('[SyncService] Sync group deleted', { groupId });

    return true;
}

// ==============================================
// PLAYBACK CONTROL
// ==============================================

/**
 * Start playback for a sync group
 */
export async function startPlayback(groupId: string, options?: StartPlaybackDTO): Promise<boolean> {
    const group = await getSyncGroup(groupId);
    if (!group) {
        log.warn('[SyncService] Cannot start playback - group not found', { groupId });
        return false;
    }

    // Validate group has content
    const hasContent = group.contentId || group.playlistItems.length > 0;
    if (!hasContent) {
        log.warn('[SyncService] Cannot start playback - no content assigned', { groupId });
        return false;
    }

    const now = Date.now();
    const startPosition = options?.startPosition || 0;

    // Update DB state
    await prisma.syncGroup.update({
        where: { id: groupId },
        data: {
            state: 'PLAYING',
            position: startPosition,
            currentItem: 0,
        },
    });

    // Initialize or update runtime state
    let runtime = runtimeStates.get(groupId);
    if (!runtime) {
        runtime = {
            groupId,
            isPlaying: true,
            currentPosition: startPosition,
            currentItemIndex: 0,
            startedAt: now,
            lastTickAt: now,
            connectedSockets: new Map(),
            conductorSocketId: null,
        };
        runtimeStates.set(groupId, runtime);
    } else {
        runtime.isPlaying = true;
        runtime.currentPosition = startPosition;
        runtime.currentItemIndex = 0;
        runtime.startedAt = now;
        runtime.lastTickAt = now;
    }

    // Start tick broadcasting
    startTickBroadcast(groupId);

    // Notify all displays
    const statePayload = buildStatePayload(group, runtime);
    broadcastToGroup(groupId, 'sync:started', statePayload);

    log.info('[SyncService] Playback started', { groupId, startPosition });

    return true;
}

/**
 * Pause playback
 */
export async function pausePlayback(groupId: string): Promise<boolean> {
    const runtime = runtimeStates.get(groupId);
    if (!runtime || !runtime.isPlaying) {
        log.warn('[SyncService] Cannot pause - not playing', { groupId });
        return false;
    }

    // Calculate current position
    const currentPosition = calculateCurrentPosition(runtime);

    // Update DB
    await prisma.syncGroup.update({
        where: { id: groupId },
        data: {
            state: 'PAUSED',
            position: currentPosition,
            currentItem: runtime.currentItemIndex,
        },
    });

    // Update runtime
    runtime.isPlaying = false;
    runtime.currentPosition = currentPosition;
    runtime.startedAt = null;

    // Stop tick broadcast
    stopTickBroadcast(groupId);

    // Notify displays
    broadcastToGroup(groupId, 'sync:paused', {
        groupId,
        position: currentPosition,
        currentItem: runtime.currentItemIndex,
    });

    log.info('[SyncService] Playback paused', { groupId, position: currentPosition });

    return true;
}

/**
 * Resume playback
 */
export async function resumePlayback(groupId: string): Promise<boolean> {
    const group = await getSyncGroup(groupId);
    if (!group) return false;

    const runtime = runtimeStates.get(groupId);
    if (!runtime) {
        // Create runtime from DB state
        return startPlayback(groupId, { startPosition: group.position });
    }

    if (runtime.isPlaying) {
        log.warn('[SyncService] Already playing', { groupId });
        return true;
    }

    const now = Date.now();

    // Update DB
    await prisma.syncGroup.update({
        where: { id: groupId },
        data: { state: 'PLAYING' },
    });

    // Update runtime
    runtime.isPlaying = true;
    runtime.startedAt = now;
    runtime.lastTickAt = now;

    // Start tick broadcast
    startTickBroadcast(groupId);

    // Notify displays
    broadcastToGroup(groupId, 'sync:resumed', {
        groupId,
        position: runtime.currentPosition,
        currentItem: runtime.currentItemIndex,
    });

    log.info('[SyncService] Playback resumed', { groupId, position: runtime.currentPosition });

    return true;
}

/**
 * Stop playback
 */
export async function stopPlayback(groupId: string): Promise<boolean> {
    // Update DB
    await prisma.syncGroup.update({
        where: { id: groupId },
        data: {
            state: 'STOPPED',
            position: 0,
            currentItem: 0,
        },
    });

    // Update runtime
    const runtime = runtimeStates.get(groupId);
    if (runtime) {
        runtime.isPlaying = false;
        runtime.currentPosition = 0;
        runtime.currentItemIndex = 0;
        runtime.startedAt = null;
    }

    // Stop tick broadcast
    stopTickBroadcast(groupId);

    // Notify displays
    broadcastToGroup(groupId, 'sync:stopped', { groupId });

    log.info('[SyncService] Playback stopped', { groupId });

    return true;
}

/**
 * Seek to position
 */
export async function seekPlayback(groupId: string, data: SeekDTO): Promise<boolean> {
    const runtime = runtimeStates.get(groupId);
    if (!runtime) {
        log.warn('[SyncService] Cannot seek - no runtime state', { groupId });
        return false;
    }

    const now = Date.now();

    // Update position
    runtime.currentPosition = data.position;
    runtime.startedAt = runtime.isPlaying ? now : null;
    runtime.lastTickAt = now;

    // Update DB
    await prisma.syncGroup.update({
        where: { id: groupId },
        data: { position: data.position },
    });

    // Notify displays
    broadcastToGroup(groupId, 'sync:seek', {
        groupId,
        position: data.position,
        serverTime: now,
    });

    log.info('[SyncService] Seek', { groupId, position: data.position });

    return true;
}

// ==============================================
// TICK BROADCASTING
// ==============================================

function startTickBroadcast(groupId: string): void {
    // Don't duplicate
    if (tickIntervals.has(groupId)) return;

    log.debug('[SyncService] Starting tick broadcast', { groupId });

    const interval = setInterval(() => {
        const runtime = runtimeStates.get(groupId);
        if (!runtime || !runtime.isPlaying) {
            stopTickBroadcast(groupId);
            return;
        }

        const now = Date.now();
        const position = calculateCurrentPosition(runtime);
        runtime.lastTickAt = now;

        const tick: SyncTickPayload = {
            groupId,
            position,
            currentItem: runtime.currentItemIndex,
            serverTime: now,
            state: 'PLAYING',
        };

        broadcastToGroup(groupId, 'sync:tick', tick);
    }, TICK_INTERVAL_MS);

    tickIntervals.set(groupId, interval);
}

function stopTickBroadcast(groupId: string): void {
    const interval = tickIntervals.get(groupId);
    if (interval) {
        clearInterval(interval);
        tickIntervals.delete(groupId);
        log.debug('[SyncService] Stopped tick broadcast', { groupId });
    }
}

function calculateCurrentPosition(runtime: SyncRuntimeState): number {
    if (!runtime.isPlaying || !runtime.startedAt) {
        return runtime.currentPosition;
    }
    const elapsed = (Date.now() - runtime.startedAt) / 1000;
    return runtime.currentPosition + elapsed;
}

// ==============================================
// CONDUCTOR MANAGEMENT
// ==============================================

/**
 * Elect conductor for a group (first connected display)
 */
async function electConductor(groupId: string): Promise<string | null> {
    const runtime = runtimeStates.get(groupId);
    if (!runtime || runtime.connectedSockets.size === 0) {
        return null;
    }

    // Get first connected display
    const entry = runtime.connectedSockets.entries().next();
    if (entry.done) return null;

    const [socketId, displayId] = entry.value;

    await assignConductor(groupId, displayId, socketId, 'elected');

    return displayId;
}

/**
 * Assign conductor
 */
async function assignConductor(
    groupId: string,
    displayId: string,
    socketId: string,
    reason: 'elected' | 'failover' | 'manual'
): Promise<void> {
    const group = await getSyncGroup(groupId);
    if (!group) return;

    const oldConductorId = group.conductorId;

    // Update DB
    await prisma.syncGroup.update({
        where: { id: groupId },
        data: { conductorId: displayId },
    });

    // Update runtime
    const runtime = runtimeStates.get(groupId);
    if (runtime) {
        runtime.conductorSocketId = socketId;
    }

    // Notify
    const payload: SyncConductorChangedPayload = {
        groupId,
        oldConductorId,
        newConductorId: displayId,
        reason,
    };
    broadcastToGroup(groupId, 'sync:conductor-changed', payload);

    log.info('[SyncService] Conductor assigned', { groupId, displayId, reason });
}

/**
 * Handle conductor disconnect - failover to next display
 */
async function handleConductorFailover(groupId: string, disconnectedDisplayId: string): Promise<void> {
    const group = await getSyncGroup(groupId);
    if (!group || group.conductorId !== disconnectedDisplayId) return;

    const runtime = runtimeStates.get(groupId);
    if (!runtime || runtime.connectedSockets.size === 0) {
        // No displays connected, clear conductor
        await prisma.syncGroup.update({
            where: { id: groupId },
            data: { conductorId: null },
        });
        if (runtime) runtime.conductorSocketId = null;
        return;
    }

    // Find next display
    for (const [socketId, displayId] of runtime.connectedSockets) {
        if (displayId !== disconnectedDisplayId) {
            await assignConductor(groupId, displayId, socketId, 'failover');
            return;
        }
    }
}

// ==============================================
// SOCKET TRACKING
// ==============================================

/**
 * Register display socket connection
 */
export async function registerDisplaySocket(socketId: string, displayId: string): Promise<void> {
    socketToDisplay.set(socketId, displayId);

    // Find group for this display
    const membership = await prisma.syncGroupDisplay.findFirst({
        where: { displayId },
        include: { syncGroup: true },
    });

    if (!membership) return;

    const groupId = membership.syncGroupId;
    displayToGroup.set(displayId, groupId);

    // Add to runtime
    let runtime = runtimeStates.get(groupId);
    if (!runtime) {
        runtime = {
            groupId,
            isPlaying: membership.syncGroup.state === 'PLAYING',
            currentPosition: membership.syncGroup.position,
            currentItemIndex: membership.syncGroup.currentItem,
            startedAt: membership.syncGroup.state === 'PLAYING' ? Date.now() : null,
            lastTickAt: Date.now(),
            connectedSockets: new Map(),
            conductorSocketId: null,
        };
        runtimeStates.set(groupId, runtime);

        // Start tick if playing
        if (runtime.isPlaying) {
            startTickBroadcast(groupId);
        }
    }

    runtime.connectedSockets.set(socketId, displayId);

    // Join socket room
    const io = getIO();
    const socket = io?.sockets.sockets.get(socketId);
    if (socket) {
        socket.join(`sync:${groupId}`);
    }

    // Elect conductor if none
    if (!membership.syncGroup.conductorId) {
        await electConductor(groupId);
    }

    // Send current state to newly connected display (late join)
    const group = await getSyncGroup(groupId);
    if (group && socket) {
        const statePayload = buildStatePayload(group, runtime);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socket.emit('sync:state' as any, statePayload);
    }

    log.info('[SyncService] Display connected', { socketId, displayId, groupId });
}

/**
 * Unregister display socket
 */
export async function unregisterDisplaySocket(socketId: string): Promise<void> {
    const displayId = socketToDisplay.get(socketId);
    if (!displayId) return;

    socketToDisplay.delete(socketId);

    const groupId = displayToGroup.get(displayId);
    if (!groupId) return;

    const runtime = runtimeStates.get(groupId);
    if (runtime) {
        runtime.connectedSockets.delete(socketId);

        // Handle conductor disconnect
        if (runtime.conductorSocketId === socketId) {
            await handleConductorFailover(groupId, displayId);
        }
    }

    // Leave socket room
    const io = getIO();
    const socket = io?.sockets.sockets.get(socketId);
    if (socket) {
        socket.leave(`sync:${groupId}`);
    }

    log.info('[SyncService] Display disconnected', { socketId, displayId, groupId });
}

// ==============================================
// BROADCAST HELPERS
// ==============================================

function broadcastToGroup(groupId: string, event: string, data: unknown): void {
    const io = getIO();
    if (!io) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    io.to(`sync:${groupId}`).emit(event as any, data);
}

function broadcastGroupUpdate(group: SyncGroupWithRelations): void {
    const runtime = runtimeStates.get(group.id);
    const payload = buildStatePayload(group, runtime);
    broadcastToGroup(group.id, 'sync:group-updated', payload);
}

function buildStatePayload(
    group: SyncGroupWithRelations,
    runtime: SyncRuntimeState | undefined
): SyncStatePayload {
    const position = runtime ? calculateCurrentPosition(runtime) : group.position;
    const currentItem = runtime?.currentItemIndex ?? group.currentItem;

    return {
        groupId: group.id,
        state: group.state,
        position,
        currentItem,
        conductorId: group.conductorId,
        content: group.content ? {
            id: group.content.id,
            name: group.content.name,
            type: group.content.type,
            url: getContentUrl(group.content),
            duration: group.content.duration ?? undefined,
        } : null,
        playlistItems: group.playlistItems.map(item => ({
            contentId: item.contentId,
            name: item.content.name,
            type: item.content.type,
            url: getContentUrl(item.content),
            duration: item.duration ?? item.content.duration ?? undefined,
            order: item.order,
        })),
    };
}

// ==============================================
// QUERIES FOR CONTENT RESOLVER
// ==============================================

/**
 * Get active sync group for a display
 * Used by contentResolver to determine if display should show sync content
 */
export async function getActiveSyncGroupForDisplay(displayId: string): Promise<{
    group: SyncGroupWithRelations;
    runtime: SyncRuntimeState | null;
} | null> {
    // Find membership
    const membership = await prisma.syncGroupDisplay.findFirst({
        where: { displayId },
        include: {
            syncGroup: {
                include: syncGroupInclude,
            },
        },
    });

    if (!membership) return null;

    const group = membership.syncGroup as SyncGroupWithRelations;

    // Only return if PLAYING
    if (group.state !== 'PLAYING') return null;

    const runtime = runtimeStates.get(group.id) || null;

    return { group, runtime };
}

// ==============================================
// INITIALIZATION & CLEANUP
// ==============================================

/**
 * Initialize sync service on server start
 * Restores runtime state for PLAYING groups
 */
export async function initializeSyncService(): Promise<void> {
    log.info('[SyncService] Initializing...');

    // Find all PLAYING groups
    const playingGroups = await prisma.syncGroup.findMany({
        where: { state: 'PLAYING' },
        include: {
            displays: true,
        },
    });

    for (const group of playingGroups) {
        // Create runtime state
        runtimeStates.set(group.id, {
            groupId: group.id,
            isPlaying: true,
            currentPosition: group.position,
            currentItemIndex: group.currentItem,
            startedAt: Date.now(),
            lastTickAt: Date.now(),
            connectedSockets: new Map(),
            conductorSocketId: null,
        });

        // Update display mappings
        for (const d of group.displays) {
            displayToGroup.set(d.displayId, group.id);
        }

        // Start tick broadcast
        startTickBroadcast(group.id);
    }

    log.info('[SyncService] Initialized', { playingGroups: playingGroups.length });
}

/**
 * Cleanup on server shutdown
 */
export function cleanupSyncService(): void {
    log.info('[SyncService] Cleaning up...');

    // Stop all tick intervals
    for (const interval of tickIntervals.values()) {
        clearInterval(interval);
    }
    tickIntervals.clear();

    // Clear runtime state
    runtimeStates.clear();
    socketToDisplay.clear();
    displayToGroup.clear();

    log.info('[SyncService] Cleanup complete');
}

// ==============================================
// EXPORTS
// ==============================================

export default {
    // CRUD
    createSyncGroup,
    getSyncGroup,
    getAllSyncGroups,
    updateSyncGroup,
    deleteSyncGroup,

    // Playback
    startPlayback,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    seekPlayback,

    // Socket tracking
    registerDisplaySocket,
    unregisterDisplaySocket,

    // Queries
    getActiveSyncGroupForDisplay,

    // Lifecycle
    initializeSyncService,
    cleanupSyncService,
};
