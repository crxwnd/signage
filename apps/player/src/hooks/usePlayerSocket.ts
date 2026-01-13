'use client';

import { playerLog } from '@/lib/logger';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const HEARTBEAT_INTERVAL = 30000;

// Module-level singleton for player socket
let playerSocket: Socket | null = null;
let isSocketInitialized = false;

// Sync types
export interface SyncTick {
    groupId: string;
    contentId: string;
    currentTime: number;
    serverTime: number;
    playbackState: 'playing' | 'paused';
}

export interface SyncCommand {
    type: 'play' | 'pause' | 'seek' | 'stop';
    groupId: string;
    contentId?: string;
    seekTo?: number;
}

// Quick URL data from dashboard
export interface QuickUrlData {
    type: 'QUICK_URL';
    url: string;
    source: 'YOUTUBE' | 'VIMEO' | 'URL';
    contentType: 'VIDEO' | 'IMAGE';
    thumbnailUrl?: string;
    loop: boolean;
    syncGroupId?: string;
}

interface UsePlayerSocketOptions {
    displayId: string | null;
    syncGroupId?: string | null;
    onPlaylistUpdate?: () => void;
    onCommand?: (command: string, data?: unknown) => void;
    onPaired?: (displayId: string) => void;
    // Sync callbacks
    onSyncTick?: (tick: SyncTick) => void;
    onSyncCommand?: (command: SyncCommand) => void;
    onConductorChanged?: (data: { groupId: string; newConductorId: string }) => void;
    // Alert/Schedule callbacks
    onAlertActivated?: (data: { alertId: string; alert: any }) => void;
    onAlertDeactivated?: (data: { alertId: string }) => void;
    onScheduleActivated?: (data: { scheduleId: string; schedule: any }) => void;
    onScheduleEnded?: (data: { scheduleId: string }) => void;
    onContentRefresh?: () => void;
    // Quick URL callback
    onQuickUrl?: (data: QuickUrlData) => void;
}

export function usePlayerSocket({
    displayId,
    syncGroupId,
    onPlaylistUpdate,
    onCommand,
    onPaired,
    onSyncTick,
    onSyncCommand,
    onConductorChanged,
    onAlertActivated,
    onAlertDeactivated,
    onScheduleActivated,
    onScheduleEnded,
    onContentRefresh,
    onQuickUrl,
}: UsePlayerSocketOptions) {
    // Refs for callbacks (stable references)
    const onPlaylistUpdateRef = useRef(onPlaylistUpdate);
    const onCommandRef = useRef(onCommand);
    const onPairedRef = useRef(onPaired);
    const onSyncTickRef = useRef(onSyncTick);
    const onSyncCommandRef = useRef(onSyncCommand);
    const onConductorChangedRef = useRef(onConductorChanged);
    const onAlertActivatedRef = useRef(onAlertActivated);
    const onAlertDeactivatedRef = useRef(onAlertDeactivated);
    const onScheduleActivatedRef = useRef(onScheduleActivated);
    const onScheduleEndedRef = useRef(onScheduleEnded);
    const onContentRefreshRef = useRef(onContentRefresh);
    const onQuickUrlRef = useRef(onQuickUrl);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const registeredDisplayRef = useRef<string | null>(null);
    const joinedSyncGroupRef = useRef<string | null>(null);

    // Keep refs updated
    useEffect(() => { onPlaylistUpdateRef.current = onPlaylistUpdate; }, [onPlaylistUpdate]);
    useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
    useEffect(() => { onPairedRef.current = onPaired; }, [onPaired]);
    useEffect(() => { onSyncTickRef.current = onSyncTick; }, [onSyncTick]);
    useEffect(() => { onSyncCommandRef.current = onSyncCommand; }, [onSyncCommand]);
    useEffect(() => { onConductorChangedRef.current = onConductorChanged; }, [onConductorChanged]);
    useEffect(() => { onAlertActivatedRef.current = onAlertActivated; }, [onAlertActivated]);
    useEffect(() => { onAlertDeactivatedRef.current = onAlertDeactivated; }, [onAlertDeactivated]);
    useEffect(() => { onScheduleActivatedRef.current = onScheduleActivated; }, [onScheduleActivated]);
    useEffect(() => { onScheduleEndedRef.current = onScheduleEnded; }, [onScheduleEnded]);
    useEffect(() => { onContentRefreshRef.current = onContentRefresh; }, [onContentRefresh]);
    useEffect(() => { onQuickUrlRef.current = onQuickUrl; }, [onQuickUrl]);

    const [isConnected, setIsConnected] = useState(false);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize socket once at module level
    useEffect(() => {
        if (isSocketInitialized && playerSocket) {
            playerLog.log('[PlayerSocket] Reusing existing socket');
            setIsConnected(playerSocket.connected);
            return;
        }

        playerLog.log('[PlayerSocket] Initializing socket to', SOCKET_URL);
        isSocketInitialized = true;

        playerSocket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: Infinity,
            reconnectionDelayMax: 5000,
        });

        const socket = playerSocket;

        socket.on('connect', () => {
            playerLog.log('[PlayerSocket] Connected:', socket.id);
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', (reason) => {
            playerLog.log('[PlayerSocket] Disconnected:', reason);
            setIsConnected(false);
            registeredDisplayRef.current = null;
            joinedSyncGroupRef.current = null;
        });

        socket.on('connect_error', (err) => {
            console.error('[PlayerSocket] Connection error:', err.message);
            setError(err.message);
        });

        // Reconnection handlers
        socket.io.on('reconnect', (attempt) => {
            playerLog.log(`[PlayerSocket] Reconnected after ${attempt} attempts`);
            setIsConnected(true);
            setError(null);
        });

        socket.io.on('reconnect_attempt', (attempt) => {
            playerLog.log(`[PlayerSocket] Reconnection attempt ${attempt}`);
        });

        socket.io.on('reconnect_failed', () => {
            playerLog.log('[PlayerSocket] Reconnection failed - continuing offline');
            setError('Connection failed - running in offline mode');
        });

        // Event handlers
        socket.on('playlist:updated' as never, () => {
            playerLog.log('[PlayerSocket] Playlist updated event');
            onPlaylistUpdateRef.current?.();
        });

        socket.on('display:command' as never, (data: { command: string; payload?: unknown }) => {
            playerLog.log('[PlayerSocket] Command received:', data.command);
            onCommandRef.current?.(data.command, data.payload);
        });

        socket.on('pairing:code' as never, (data: { code: string }) => {
            playerLog.log('[PlayerSocket] Pairing code:', data.code);
            setPairingCode(data.code);
        });

        socket.on('pairing:confirmed' as never, (data: { displayId: string }) => {
            playerLog.log('[PlayerSocket] Pairing confirmed:', data.displayId);
            setPairingCode(null);
            onPairedRef.current?.(data.displayId);
        });

        // Sync event handlers
        socket.on('sync:tick' as never, (tick: SyncTick) => {
            onSyncTickRef.current?.(tick);
        });

        socket.on('sync:command' as never, (command: SyncCommand) => {
            playerLog.log('[PlayerSocket] Sync command:', command.type);
            onSyncCommandRef.current?.(command);
        });

        socket.on('sync:conductor-changed' as never, (data: { groupId: string; newConductorId: string }) => {
            playerLog.log('[PlayerSocket] Conductor changed:', data.newConductorId);
            onConductorChangedRef.current?.(data);
        });

        // Alert event handlers
        socket.on('alert:activated' as never, (data: { alertId: string; alert: any }) => {
            playerLog.log('[PlayerSocket] Alert activated:', data.alertId);
            onAlertActivatedRef.current?.(data);
        });

        socket.on('alert:deactivated' as never, (data: { alertId: string }) => {
            playerLog.log('[PlayerSocket] Alert deactivated:', data.alertId);
            onAlertDeactivatedRef.current?.(data);
        });

        // Schedule event handlers
        socket.on('schedule:activated' as never, (data: { scheduleId: string; schedule: any }) => {
            playerLog.log('[PlayerSocket] Schedule activated:', data.scheduleId);
            onScheduleActivatedRef.current?.(data);
        });

        socket.on('schedule:ended' as never, (data: { scheduleId: string }) => {
            playerLog.log('[PlayerSocket] Schedule ended:', data.scheduleId);
            onScheduleEndedRef.current?.(data);
        });

        // Content refresh handler
        socket.on('content:refresh' as never, () => {
            playerLog.log('[PlayerSocket] Content refresh requested');
            onContentRefreshRef.current?.();
        });

        // Quick URL handler
        socket.on('quick-play' as never, (data: QuickUrlData) => {
            playerLog.log('[PlayerSocket] Quick URL received:', data.url, data.source);
            onQuickUrlRef.current?.(data);
        });

        // No cleanup - socket persists for player lifetime
    }, []);

    // Register display when connected and displayId available
    useEffect(() => {
        if (!isConnected || !displayId || !playerSocket) return;

        // Avoid re-registering same display
        if (registeredDisplayRef.current === displayId) return;

        playerLog.log('[PlayerSocket] Registering display:', displayId);
        playerSocket.emit('display:register', { displayId });
        registeredDisplayRef.current = displayId;
    }, [isConnected, displayId]);

    // Join sync group when syncGroupId changes
    useEffect(() => {
        if (!isConnected || !playerSocket) return;

        const currentGroup = joinedSyncGroupRef.current;

        // Leave old group if different
        if (currentGroup && currentGroup !== syncGroupId) {
            playerLog.log('[PlayerSocket] Leaving sync group:', currentGroup);
            playerSocket.emit('sync:leave-group', { groupId: currentGroup, displayId });
            joinedSyncGroupRef.current = null;
        }

        // Join new group
        if (syncGroupId && syncGroupId !== currentGroup) {
            playerLog.log('[PlayerSocket] Joining sync group:', syncGroupId);
            playerSocket.emit('sync:join-group', { groupId: syncGroupId, displayId });
            joinedSyncGroupRef.current = syncGroupId;
        }
    }, [isConnected, syncGroupId, displayId]);

    // Heartbeat effect
    useEffect(() => {
        if (!isConnected || !displayId || !playerSocket) {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
            return;
        }

        // Send immediate heartbeat
        playerSocket.emit('display:heartbeat', { displayId });

        // Setup interval
        heartbeatRef.current = setInterval(() => {
            if (playerSocket?.connected) {
                playerSocket.emit('display:heartbeat', { displayId });
            }
        }, HEARTBEAT_INTERVAL);

        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
                heartbeatRef.current = null;
            }
        };
    }, [isConnected, displayId]);

    const requestPairing = useCallback(() => {
        if (playerSocket?.connected) {
            playerSocket.emit('display:request-pairing' as never);
        }
    }, []);

    const joinSyncGroup = useCallback((groupId: string) => {
        if (playerSocket?.connected && displayId) {
            playerLog.log('[PlayerSocket] Manual join sync group:', groupId);
            playerSocket.emit('sync:join-group', { groupId, displayId });
            joinedSyncGroupRef.current = groupId;
        }
    }, [displayId]);

    const leaveSyncGroup = useCallback(() => {
        if (playerSocket?.connected && joinedSyncGroupRef.current && displayId) {
            playerLog.log('[PlayerSocket] Leaving sync group:', joinedSyncGroupRef.current);
            playerSocket.emit('sync:leave-group', { groupId: joinedSyncGroupRef.current, displayId });
            joinedSyncGroupRef.current = null;
        }
    }, [displayId]);

    return {
        isConnected,
        pairingCode,
        error,
        requestPairing,
        joinSyncGroup,
        leaveSyncGroup,
        currentSyncGroup: joinedSyncGroupRef.current,
    };
}
