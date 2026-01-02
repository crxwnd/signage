/**
 * Content Source Types
 * Types for the content priority/resolution system
 */

export type ContentSourceType = 'alert' | 'sync' | 'schedule' | 'playlist' | 'fallback' | 'none';
export type SyncState = 'STOPPED' | 'PLAYING' | 'PAUSED';

export interface ContentInfo {
    id: string;
    name: string;
    type: string;
    hlsUrl?: string | null;
    originalUrl?: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
}

export interface SyncGroupInfo {
    id: string;
    name: string;
    state: SyncState;
    position: number;
    currentItem: number;
    playlistItems: Array<{
        contentId: string;
        content: ContentInfo;
        order: number;
        duration?: number | null;
    }>;
}

export interface ContentSource {
    type: ContentSourceType;
    priority: number;

    // Content info
    contentId?: string;
    content?: ContentInfo;

    // For sync groups
    syncGroupId?: string;
    syncGroup?: SyncGroupInfo;

    // For alerts
    alertId?: string;
    alert?: {
        id: string;
        name: string;
        message?: string | null;
        type: string;
    };

    // For schedules
    scheduleId?: string;
    schedule?: {
        id: string;
        name: string;
        endTime: string;
    };

    // Why this source was selected
    reason: string;
}
