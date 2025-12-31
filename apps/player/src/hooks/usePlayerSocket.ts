'use client';

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
}: UsePlayerSocketOptions) {
    // Refs for callbacks (stable references)
    const onPlaylistUpdateRef = useRef(onPlaylistUpdate);
    const onCommandRef = useRef(onCommand);
    const onPairedRef = useRef(onPaired);
    const onSyncTickRef = useRef(onSyncTick);
    const onSyncCommandRef = useRef(onSyncCommand);
    const onConductorChangedRef = useRef(onConductorChanged);
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

    const [isConnected, setIsConnected] = useState(false);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize socket once at module level
    useEffect(() => {
        if (isSocketInitialized && playerSocket) {
            console.log('[PlayerSocket] Reusing existing socket');
            setIsConnected(playerSocket.connected);
            return;
        }

        console.log('[PlayerSocket] Initializing socket to', SOCKET_URL);
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
            console.log('[PlayerSocket] Connected:', socket.id);
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log('[PlayerSocket] Disconnected:', reason);
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
            console.log(`[PlayerSocket] Reconnected after ${attempt} attempts`);
            setIsConnected(true);
            setError(null);
        });

        socket.io.on('reconnect_attempt', (attempt) => {
            console.log(`[PlayerSocket] Reconnection attempt ${attempt}`);
        });

        socket.io.on('reconnect_failed', () => {
            console.log('[PlayerSocket] Reconnection failed - continuing offline');
            setError('Connection failed - running in offline mode');
        });

        // Event handlers
        socket.on('playlist:updated' as never, () => {
            console.log('[PlayerSocket] Playlist updated event');
            onPlaylistUpdateRef.current?.();
        });

        socket.on('display:command' as never, (data: { command: string; payload?: unknown }) => {
            console.log('[PlayerSocket] Command received:', data.command);
            onCommandRef.current?.(data.command, data.payload);
        });

        socket.on('pairing:code' as never, (data: { code: string }) => {
            console.log('[PlayerSocket] Pairing code:', data.code);
            setPairingCode(data.code);
        });

        socket.on('pairing:confirmed' as never, (data: { displayId: string }) => {
            console.log('[PlayerSocket] Pairing confirmed:', data.displayId);
            setPairingCode(null);
            onPairedRef.current?.(data.displayId);
        });

        // Sync event handlers
        socket.on('sync:tick' as never, (tick: SyncTick) => {
            onSyncTickRef.current?.(tick);
        });

        socket.on('sync:command' as never, (command: SyncCommand) => {
            console.log('[PlayerSocket] Sync command:', command.type);
            onSyncCommandRef.current?.(command);
        });

        socket.on('sync:conductor-changed' as never, (data: { groupId: string; newConductorId: string }) => {
            console.log('[PlayerSocket] Conductor changed:', data.newConductorId);
            onConductorChangedRef.current?.(data);
        });

        // No cleanup - socket persists for player lifetime
    }, []);

    // Register display when connected and displayId available
    useEffect(() => {
        if (!isConnected || !displayId || !playerSocket) return;

        // Avoid re-registering same display
        if (registeredDisplayRef.current === displayId) return;

        console.log('[PlayerSocket] Registering display:', displayId);
        playerSocket.emit('display:register', { displayId });
        registeredDisplayRef.current = displayId;
    }, [isConnected, displayId]);

    // Join sync group when syncGroupId changes
    useEffect(() => {
        if (!isConnected || !playerSocket) return;

        const currentGroup = joinedSyncGroupRef.current;

        // Leave old group if different
        if (currentGroup && currentGroup !== syncGroupId) {
            console.log('[PlayerSocket] Leaving sync group:', currentGroup);
            playerSocket.emit('sync:leave-group', { groupId: currentGroup, displayId });
            joinedSyncGroupRef.current = null;
        }

        // Join new group
        if (syncGroupId && syncGroupId !== currentGroup) {
            console.log('[PlayerSocket] Joining sync group:', syncGroupId);
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
            console.log('[PlayerSocket] Manual join sync group:', groupId);
            playerSocket.emit('sync:join-group', { groupId, displayId });
            joinedSyncGroupRef.current = groupId;
        }
    }, [displayId]);

    const leaveSyncGroup = useCallback(() => {
        if (playerSocket?.connected && joinedSyncGroupRef.current && displayId) {
            console.log('[PlayerSocket] Leaving sync group:', joinedSyncGroupRef.current);
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
