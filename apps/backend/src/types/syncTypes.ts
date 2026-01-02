/**
 * Sync Types for Backend
 * Separates runtime state from persisted data
 */

import type { SyncGroup, SyncGroupDisplay, SyncGroupContent, Content, Display, SyncState } from '@prisma/client';

// ==============================================
// RUNTIME STATE (En memoria, efímero)
// ==============================================

/**
 * Estado runtime de un sync group durante reproducción
 * Se pierde al reiniciar el servidor - es aceptable
 */
export interface SyncRuntimeState {
    groupId: string;

    // Playback state (runtime)
    isPlaying: boolean;
    currentPosition: number;      // Segundos con decimales
    currentItemIndex: number;     // Índice del item actual en playlist
    startedAt: number | null;     // Timestamp cuando inició playback
    lastTickAt: number;           // Timestamp del último tick

    // Connected displays (runtime)
    connectedSockets: Map<string, string>;  // socketId -> displayId

    // Conductor (runtime)
    conductorSocketId: string | null;
}

// ==============================================
// PRISMA TYPES WITH RELATIONS
// ==============================================

export type SyncGroupWithRelations = SyncGroup & {
    content: Content | null;
    playlistItems: (SyncGroupContent & {
        content: Content;
    })[];
    displays: (SyncGroupDisplay & {
        display: Display;
    })[];
    conductor: Display | null;
};

// ==============================================
// API REQUEST/RESPONSE TYPES
// ==============================================

export interface CreateSyncGroupDTO {
    name: string;
    hotelId: string;

    // Contenido (uno u otro)
    contentId?: string;
    playlistItems?: {
        contentId: string;
        duration?: number;
        order: number;
    }[];

    // Displays
    displayIds: string[];

    // Schedule (opcional)
    scheduleEnabled?: boolean;
    scheduleStart?: string;      // ISO date string
    scheduleEnd?: string;        // ISO date string
    scheduleStartTime?: string;  // "HH:mm"
    scheduleEndTime?: string;    // "HH:mm"
    scheduleRecurrence?: string; // RRULE string
}

export interface UpdateSyncGroupDTO {
    name?: string;
    contentId?: string;
    playlistItems?: {
        contentId: string;
        duration?: number;
        order: number;
    }[];
    displayIds?: string[];
    scheduleEnabled?: boolean;
    scheduleStart?: string;
    scheduleEnd?: string;
    scheduleStartTime?: string;
    scheduleEndTime?: string;
    scheduleRecurrence?: string;
}

export interface StartPlaybackDTO {
    contentId?: string;          // Override content for this session
    startPosition?: number;      // Start from specific position
}

export interface SeekDTO {
    position: number;            // Position in seconds
}

// ==============================================
// SOCKET EVENT PAYLOADS
// ==============================================

export interface SyncTickPayload {
    groupId: string;
    position: number;
    currentItem: number;
    serverTime: number;
    state: 'PLAYING' | 'PAUSED';
}

export interface SyncStatePayload {
    groupId: string;
    state: SyncState;
    position: number;
    currentItem: number;
    conductorId: string | null;
    content: {
        id: string;
        name: string;
        type: string;
        url: string;
        duration?: number;
    } | null;
    playlistItems: {
        contentId: string;
        name: string;
        type: string;
        url: string;
        duration?: number;
        order: number;
    }[];
}

export interface SyncConductorChangedPayload {
    groupId: string;
    oldConductorId: string | null;
    newConductorId: string;
    reason: 'elected' | 'failover' | 'manual';
}
