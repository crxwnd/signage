/**
 * Sync Types
 * Types for display synchronization using Conductor Pattern
 */

// ==============================================
// SYNC GROUP
// ==============================================

/**
 * A sync group is a collection of displays that play content synchronously
 * One display is the conductor (master), others are workers (followers)
 */
export interface SyncGroup {
    id: string;
    name: string;
    displayIds: string[];
    conductorId: string | null;
    conductorSocketId: string | null;

    // Playback state
    currentContentId: string | null;
    playbackState: 'playing' | 'paused' | 'stopped';
    currentTime: number;  // in seconds
    startedAt: number | null;  // Unix timestamp when playback started

    // Metadata
    createdAt: number;
    updatedAt: number;
}

// ==============================================
// SYNC TICK (Server -> Clients, every 100ms)
// ==============================================

/**
 * Sync tick broadcast to all displays in a group
 * Contains authoritative playback position
 */
export interface SyncTick {
    groupId: string;
    contentId: string;
    currentTime: number;      // Calculated server-side
    serverTime: number;       // Server timestamp for offset calculation
    playbackState: 'playing' | 'paused';
}

// ==============================================
// SYNC COMMANDS
// ==============================================

/**
 * Sync command from admin or conductor
 */
export interface SyncCommand {
    type: 'play' | 'pause' | 'seek' | 'next' | 'restart' | 'stop';
    groupId: string;
    contentId?: string;
    seekTo?: number;          // For seek command
    timestamp: number;
}

// ==============================================
// CONDUCTOR INFO
// ==============================================

/**
 * Information about the current conductor
 */
export interface ConductorInfo {
    displayId: string;
    socketId: string;
    assignedAt: number;
    lastHeartbeat: number;
}

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================

export interface CreateSyncGroupRequest {
    name: string;
    displayIds: string[];
}

export interface UpdateSyncGroupRequest {
    name?: string;
    displayIds?: string[];
}

export interface StartSyncPlaybackRequest {
    contentId: string;
    startPosition?: number;  // Optional start position in seconds
}

export interface SeekSyncRequest {
    position: number;  // Position in seconds
}

export interface AssignConductorRequest {
    displayId: string;
}

// ==============================================
// SOCKET EVENTS FOR SYNC (Additional to socket-events.ts)
// ==============================================

// Note: SyncCommandEvent already exists in socket-events.ts
// Only add new event types here

export interface SyncTickEvent extends SyncTick { }

export interface SyncGroupUpdatedEvent {
    group: SyncGroup;
    timestamp: number;
}

export interface SyncConductorChangedEvent {
    groupId: string;
    oldConductorId: string | null;
    newConductorId: string;
    reason: 'elected' | 'failover' | 'manual';
    timestamp: number;
}

export interface SyncJoinGroupEvent {
    groupId: string;
    displayId: string;
}

export interface SyncLeaveGroupEvent {
    groupId: string;
    displayId: string;
}

export interface SyncReportPositionEvent {
    groupId: string;
    displayId: string;
    contentId: string;
    currentTime: number;
    timestamp: number;
}

export interface SyncRequestSyncEvent {
    groupId: string;
    displayId: string;
}

