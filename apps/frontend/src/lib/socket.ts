/**
 * Socket.io client configuration
 * Singleton pattern con protección contra StrictMode
 */

import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@shared-types';
import { getAccessToken } from './api/auth';
import { debugLog, debugWarn } from './debug';

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Singleton state
let socket: TypedSocket | null = null;
let connectionCount = 0; // Track active consumers

/**
 * Initialize or get existing socket connection
 * Uses reference counting to manage lifecycle
 */
export function initializeSocket(): TypedSocket {
  connectionCount++;

  if (socket?.connected) {
    debugLog('Socket', 'Reusing existing connection, consumers:', connectionCount);
    return socket;
  }

  if (socket) {
    // Socket exists but disconnected - update auth and reconnect
    debugLog('Socket', 'Reconnecting existing socket with fresh token');
    const token = getAccessToken();
    if (token) {
      socket.auth = { token };
    }
    socket.connect();
    return socket;
  }

  debugLog('Socket', 'Creating new connection to', SOCKET_URL);

  const token = getAccessToken();

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    // JWT Authentication
    auth: token ? { token } : {},
  }) as TypedSocket;

  socket.on('connect', () => {
    debugLog('Socket', 'Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    debugLog('Socket', 'Disconnected:', reason);
    // Don't null the socket - let it reconnect automatically
  });

  socket.on('connect_error', (error) => {
    debugWarn('Socket', 'Connection error:', error.message);

    // Handle auth errors - try to reconnect with fresh token
    if (error.message === 'Authentication error' || error.message === 'Token expired') {
      debugWarn('Socket', 'Auth error, attempting reconnect with fresh token');
      setTimeout(() => {
        const newToken = getAccessToken();
        if (newToken && socket) {
          socket.auth = { token: newToken };
          socket.connect();
        }
      }, 1000);
    }
  });

  return socket;
}

/**
 * Get the current socket instance (may be null)
 */
export function getSocket(): TypedSocket | null {
  return socket;
}

/**
 * Release a socket consumer
 * Only truly disconnects when all consumers are gone
 */
export function releaseSocket(): void {
  connectionCount = Math.max(0, connectionCount - 1);
  console.log('[Socket] Released, remaining consumers:', connectionCount);

  // Don't disconnect - let socket persist for app lifetime
  // Only disconnect on explicit destroySocket() call
}

/**
 * Force disconnect and destroy socket (use sparingly)
 * Only call this on app unmount or explicit logout
 */
export function destroySocket(): void {
  if (socket) {
    console.log('[Socket] Destroying socket');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    connectionCount = 0;
  }
}

// Backwards compatibility alias
export const disconnectSocket = releaseSocket;
