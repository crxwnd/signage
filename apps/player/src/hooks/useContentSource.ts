/**
 * useContentSource Hook
 * Determines what content a display should show right now.
 * Fetches from /current-source API and listens for Socket.io updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

type ContentSourceType = 'alert' | 'sync' | 'schedule' | 'playlist' | 'fallback' | 'none';

interface ContentInfo {
    id: string;
    name: string;
    type: 'VIDEO' | 'IMAGE' | 'HTML';
    hlsUrl?: string | null;
    originalUrl?: string;
    thumbnailUrl?: string | null;
    duration?: number | null;
}

interface AlertInfo {
    id: string;
    name: string;
    message?: string | null;
    type: string;
    priority: number;
}

interface SyncGroupInfo {
    id: string;
    name: string;
    state: 'STOPPED' | 'PLAYING' | 'PAUSED';
    position: number;
    currentItem: number;
    playlistItems: Array<{
        contentId: string;
        content: ContentInfo;
        order: number;
        duration?: number | null;
    }>;
}

interface ScheduleInfo {
    id: string;
    name: string;
    endTime: string;
}

interface ContentSource {
    type: ContentSourceType;
    priority: number;
    reason: string;
    contentId?: string;
    content?: ContentInfo;
    syncGroupId?: string;
    syncGroup?: SyncGroupInfo;
    alertId?: string;
    alert?: AlertInfo;
    scheduleId?: string;
    schedule?: ScheduleInfo;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface UseContentSourceOptions {
    displayId: string | null;
    pollInterval?: number; // 0 to disable polling
}

interface UseContentSourceReturn {
    source: ContentSource | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
    // Convenience flags
    isAlert: boolean;
    isSync: boolean;
    isSchedule: boolean;
    isPlaylist: boolean;
    isFallback: boolean;
}

// Module-level socket for content source
let contentSocket: Socket | null = null;

export function useContentSource({
    displayId,
    pollInterval = 60000,
}: UseContentSourceOptions): UseContentSourceReturn {
    const [source, setSource] = useState<ContentSource | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const socketInitialized = useRef(false);

    const fetchSource = useCallback(async () => {
        if (!displayId) return;

        try {
            const response = await fetch(`${API_URL}/api/displays/${displayId}/current-source`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setSource(data.data || data);
            setError(null);
        } catch (err) {
            console.error('[useContentSource] Error fetching source:', err);
            setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
            setIsLoading(false);
        }
    }, [displayId]);

    // Initial fetch
    useEffect(() => {
        if (displayId) {
            setIsLoading(true);
            fetchSource();
        } else {
            setSource(null);
            setIsLoading(false);
        }
    }, [displayId, fetchSource]);

    // Optional polling
    useEffect(() => {
        if (!displayId || !pollInterval || pollInterval <= 0) return;

        const interval = setInterval(fetchSource, pollInterval);
        return () => clearInterval(interval);
    }, [displayId, pollInterval, fetchSource]);

    // Socket connection for real-time updates
    useEffect(() => {
        if (!displayId || socketInitialized.current) return;

        socketInitialized.current = true;
        contentSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
        });

        contentSocket.on('connect', () => {
            console.log('[useContentSource] Socket connected');
            // Join display room
            contentSocket?.emit('display:register', { displayId });
        });

        // Alert handlers
        contentSocket.on('alert:activated', (data: { alertId: string; alert: any }) => {
            console.log('[useContentSource] Alert activated:', data.alertId);
            // Immediately set alert as source (highest priority)
            setSource({
                type: 'alert',
                priority: 1000 + (data.alert.priority || 0),
                alertId: data.alertId,
                alert: data.alert,
                contentId: data.alert.contentId,
                content: data.alert.content,
                reason: `Alert: ${data.alert.name}`,
            });
        });

        contentSocket.on('alert:deactivated', (data: { alertId: string }) => {
            console.log('[useContentSource] Alert deactivated:', data.alertId);
            // Re-fetch to get next priority content
            fetchSource();
        });

        // Schedule handlers
        contentSocket.on('schedule:activated', (data: { scheduleId: string; schedule: any }) => {
            console.log('[useContentSource] Schedule activated:', data.scheduleId);
            // Only update if not currently showing an alert
            setSource((prev) => {
                if (prev?.type === 'alert') {
                    return prev; // Alert has higher priority
                }
                return {
                    type: 'schedule',
                    priority: 100 + (data.schedule.priority || 0),
                    scheduleId: data.scheduleId,
                    schedule: data.schedule,
                    contentId: data.schedule.contentId,
                    content: data.schedule.content,
                    reason: `Schedule: ${data.schedule.name}`,
                };
            });
        });

        contentSocket.on('schedule:ended', (data: { scheduleId: string }) => {
            console.log('[useContentSource] Schedule ended:', data.scheduleId);
            // Re-fetch to get next priority content
            fetchSource();
        });

        // Playlist update handler
        contentSocket.on('playlist:updated', () => {
            console.log('[useContentSource] Playlist updated');
            fetchSource();
        });

        // General content refresh
        contentSocket.on('content:refresh', () => {
            console.log('[useContentSource] Content refresh requested');
            fetchSource();
        });

        return () => {
            // Don't disconnect - keep socket alive for player lifetime
        };
    }, [displayId, fetchSource]);

    return {
        source,
        isLoading,
        error,
        refetch: fetchSource,
        isAlert: source?.type === 'alert',
        isSync: source?.type === 'sync',
        isSchedule: source?.type === 'schedule',
        isPlaylist: source?.type === 'playlist',
        isFallback: source?.type === 'fallback',
    };
}
