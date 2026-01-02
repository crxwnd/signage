/**
 * Sync API Client
 * Functions to interact with sync group endpoints
 */

import { authenticatedFetch } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
export interface SyncGroup {
    id: string;
    name: string;
    displayIds: string[];
    conductorId: string | null;
    conductorSocketId: string | null;
    currentContentId: string | null;
    playbackState: 'playing' | 'paused' | 'stopped';
    currentTime: number;
    startedAt: number | null;
    createdAt: number;
    updatedAt: number;
}

export interface CreateSyncGroupRequest {
    name: string;
    displayIds: string[];
    hotelId?: string;
    contentId?: string;
    playlistItems?: Array<{
        contentId: string;
        duration: number;
        order: number;
    }>;
    scheduleEnabled?: boolean;
    scheduleStart?: string;
    scheduleEnd?: string;
    scheduleStartTime?: string;
    scheduleEndTime?: string;
    scheduleRecurrence?: string;
}

export interface UpdateSyncGroupRequest {
    name?: string;
    displayIds?: string[];
}

export interface StartPlaybackRequest {
    contentId: string;
    startPosition?: number;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: { code: string; message: string };
}

// ==============================================
// CRUD Operations
// ==============================================

/**
 * Get all sync groups
 */
export async function getSyncGroups(): Promise<SyncGroup[]> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups`);
    const data: ApiResponse<SyncGroup[]> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch sync groups');
    }

    return data.data;
}

/**
 * Get a specific sync group
 */
export async function getSyncGroup(id: string): Promise<SyncGroup> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${id}`);
    const data: ApiResponse<SyncGroup> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to fetch sync group');
    }

    return data.data;
}

/**
 * Create a new sync group
 */
export async function createSyncGroup(request: CreateSyncGroupRequest): Promise<SyncGroup> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    const data: ApiResponse<SyncGroup> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create sync group');
    }

    return data.data;
}

/**
 * Update a sync group
 */
export async function updateSyncGroup(id: string, request: UpdateSyncGroupRequest): Promise<SyncGroup> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    const data: ApiResponse<SyncGroup> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to update sync group');
    }

    return data.data;
}

/**
 * Delete a sync group
 */
export async function deleteSyncGroup(id: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${id}`, {
        method: 'DELETE',
    });
    const data: ApiResponse<{ deleted: boolean }> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to delete sync group');
    }
}

// ==============================================
// Playback Control
// ==============================================

/**
 * Start synchronized playback
 */
export async function startSyncPlayback(groupId: string, contentId: string, startPosition = 0): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, startPosition }),
    });
    const data: ApiResponse<{ started: boolean }> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to start playback');
    }
}

/**
 * Pause synchronized playback
 */
export async function pauseSyncPlayback(groupId: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/pause`, {
        method: 'POST',
    });
    const data: ApiResponse<{ paused: boolean }> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to pause playback');
    }
}

/**
 * Resume synchronized playback
 */
export async function resumeSyncPlayback(groupId: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/resume`, {
        method: 'POST',
    });
    const data: ApiResponse<{ resumed: boolean }> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to resume playback');
    }
}

/**
 * Seek to position
 */
export async function seekSyncPlayback(groupId: string, position: number): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/seek`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
    });
    const data: ApiResponse<{ seeked: boolean }> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to seek');
    }
}

/**
 * Stop playback
 */
export async function stopSyncPlayback(groupId: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/stop`, {
        method: 'POST',
    });
    const data: ApiResponse<{ stopped: boolean }> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to stop playback');
    }
}

/**
 * Assign conductor manually
 */
export async function assignConductor(groupId: string, displayId: string): Promise<void> {
    const response = await authenticatedFetch(`${API_URL}/api/sync/groups/${groupId}/conductor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayId }),
    });
    const data: ApiResponse<unknown> = await response.json();

    if (!data.success) {
        throw new Error(data.error?.message || 'Failed to assign conductor');
    }
}
