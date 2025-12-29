'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const HEARTBEAT_INTERVAL = 30000;

// Module-level singleton for player socket
let playerSocket: Socket | null = null;
let isSocketInitialized = false;

interface UsePlayerSocketOptions {
    displayId: string | null;
    onPlaylistUpdate?: () => void;
    onCommand?: (command: string, data?: unknown) => void;
    onPaired?: (displayId: string) => void;
}

export function usePlayerSocket({
    displayId,
    onPlaylistUpdate,
    onCommand,
    onPaired,
}: UsePlayerSocketOptions) {
    // Refs for callbacks (stable references)
    const onPlaylistUpdateRef = useRef(onPlaylistUpdate);
    const onCommandRef = useRef(onCommand);
    const onPairedRef = useRef(onPaired);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const registeredDisplayRef = useRef<string | null>(null);

    // Keep refs updated
    useEffect(() => { onPlaylistUpdateRef.current = onPlaylistUpdate; }, [onPlaylistUpdate]);
    useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
    useEffect(() => { onPairedRef.current = onPaired; }, [onPaired]);

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
            // Re-register display after reconnection (handled in separate effect)
        });

        socket.io.on('reconnect_attempt', (attempt) => {
            console.log(`[PlayerSocket] Reconnection attempt ${attempt}`);
        });

        socket.io.on('reconnect_failed', () => {
            console.log('[PlayerSocket] Reconnection failed - continuing offline');
            setError('Connection failed - running in offline mode');
        });

        // Event handlers using refs
        socket.on('playlist:updated' as any, () => {
            console.log('[PlayerSocket] Playlist updated event');
            onPlaylistUpdateRef.current?.();
        });

        socket.on('display:command' as any, (data: { command: string; payload?: unknown }) => {
            console.log('[PlayerSocket] Command received:', data.command);
            onCommandRef.current?.(data.command, data.payload);
        });

        socket.on('pairing:code' as any, (data: { code: string }) => {
            console.log('[PlayerSocket] Pairing code:', data.code);
            setPairingCode(data.code);
        });

        socket.on('pairing:confirmed' as any, (data: { displayId: string }) => {
            console.log('[PlayerSocket] Pairing confirmed:', data.displayId);
            setPairingCode(null);
            onPairedRef.current?.(data.displayId);
        });

        // No cleanup that destroys the socket
        // Socket persists for player lifetime
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
            playerSocket.emit('display:request-pairing' as any);
        }
    }, []);

    return { isConnected, pairingCode, error, requestPairing };
}
