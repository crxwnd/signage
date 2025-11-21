/**
 * Socket.io client configuration
 * Typed socket client for real-time communication with backend
 */

import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@shared-types';

// Socket.io server URL from environment variable
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Typed Socket type
export type TypedSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

let socket: TypedSocket | null = null;

/**
 * Initialize Socket.io client connection
 * Returns a typed socket instance
 */
export function initializeSocket(): TypedSocket {
  if (socket) {
    console.log('[Socket] Already initialized');
    return socket;
  }

  console.log('[Socket] Initializing connection to', SOCKET_URL);

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  }) as TypedSocket;

  // Connection event handlers
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  // Reconnection events (using any for reserved socket.io events)
  (socket as any).on('reconnect', (attemptNumber: number) => {
    console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
  });

  (socket as any).on('reconnect_attempt', (attemptNumber: number) => {
    console.log('[Socket] Reconnection attempt', attemptNumber);
  });

  (socket as any).on('reconnect_error', (error: Error) => {
    console.error('[Socket] Reconnection error:', error.message);
  });

  (socket as any).on('reconnect_failed', () => {
    console.error('[Socket] Reconnection failed after all attempts');
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): TypedSocket | null {
  return socket;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(): void {
  if (socket) {
    console.log('[Socket] Disconnecting...');
    socket.disconnect();
    socket = null;
  }
}
