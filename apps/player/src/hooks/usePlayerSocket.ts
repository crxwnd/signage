'use client';

/**
 * usePlayerSocket Hook
 * Socket.io connection for SmartTV player
 * Handles registration, heartbeats, commands, and pairing
 * 
 * IMPORTANT: Uses refs for callbacks to prevent socket reconnection loops
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

interface UsePlayerSocketOptions {
    displayId: string | null;
    onPlaylistUpdate?: () => void;
    onCommand?: (command: string, data?: unknown) => void;
    onPaired?: (displayId: string) => void;
}

interface UsePlayerSocketReturn {
    isConnected: boolean;
    pairingCode: string | null;
    error: string | null;
    requestPairing: () => void;
}

export function usePlayerSocket({
    displayId,
    onPlaylistUpdate,
    onCommand,
    onPaired,
}: UsePlayerSocketOptions): UsePlayerSocketReturn {
    // Refs for callbacks (prevents re-renders from causing reconnections)
    const onPlaylistUpdateRef = useRef(onPlaylistUpdate);
    const onCommandRef = useRef(onCommand);
    const onPairedRef = useRef(onPaired);

    // Update refs when callbacks change
    useEffect(() => { onPlaylistUpdateRef.current = onPlaylistUpdate; }, [onPlaylistUpdate]);
    useEffect(() => { onCommandRef.current = onCommand; }, [onCommand]);
    useEffect(() => { onPairedRef.current = onPaired; }, [onPaired]);

    // Socket ref - persists between renders
    const socketRef = useRef<Socket | null>(null);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef(false);

    const [isConnected, setIsConnected] = useState(false);
    const [pairingCode, setPairingCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Send heartbeat
    const sendHeartbeat = useCallback(() => {
        if (socketRef.current?.connected && displayId) {
            socketRef.current.emit('display:heartbeat', { displayId });
            console.log('[Socket] Heartbeat sent');
        }
    }, [displayId]);

    // Request pairing code
    const requestPairing = useCallback(() => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('display:request-pairing');
            console.log('[Socket] Pairing requested');
        }
    }, []);

    // Main effect - only runs ONCE on mount
    useEffect(() => {
        // Prevent multiple initializations
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        console.log('[Socket] Initializing connection...');

        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id);
            setIsConnected(true);
            setError(null);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
            setError(`Connection error: ${err.message}`);
        });

        // Player events - use refs to avoid stale closures
        socket.on('playlist:updated', (data: unknown) => {
            console.log('[Socket] Playlist updated:', data);
            onPlaylistUpdateRef.current?.();
        });

        socket.on('display:command', (data: { command: string; payload?: unknown }) => {
            console.log('[Socket] Command received:', data);
            onCommandRef.current?.(data.command, data.payload);
        });

        socket.on('pairing:code', (data: { code: string }) => {
            console.log('[Socket] Pairing code received:', data.code);
            setPairingCode(data.code);
        });

        socket.on('pairing:confirmed', (data: { displayId: string }) => {
            console.log('[Socket] Pairing confirmed:', data.displayId);
            setPairingCode(null);
            onPairedRef.current?.(data.displayId);
        });

        socket.on('pairing:error', (data: { message: string }) => {
            console.error('[Socket] Pairing error:', data.message);
            setError(data.message);
        });

        // Cleanup only on component unmount
        return () => {
            console.log('[Socket] Cleaning up...');
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
            socket.disconnect();
            socketRef.current = null;
            isInitializedRef.current = false;
        };
    }, []); // ← NO DEPENDENCIES - only on mount

    // Separate effect to register display when displayId changes
    useEffect(() => {
        if (socketRef.current?.connected && displayId) {
            socketRef.current.emit('display:register', { displayId });
            console.log('[Socket] Display registered:', displayId);
        }
    }, [displayId, isConnected]); // Only when displayId or connection changes

    // Effect for heartbeat
    useEffect(() => {
        if (isConnected && displayId) {
            sendHeartbeat();
            heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

            return () => {
                if (heartbeatRef.current) {
                    clearInterval(heartbeatRef.current);
                }
            };
        }
    }, [isConnected, displayId, sendHeartbeat]);

    return {
        isConnected,
        pairingCode,
        error,
        requestPairing,
    };
}
