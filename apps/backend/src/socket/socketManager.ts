/**
 * Socket.io Manager
 * Manages WebSocket connections, events, and real-time communication
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@shared-types';
import { config } from '../config';
import { log } from '../middleware/logger';

/**
 * Typed Socket type for convenience
 */
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Socket.io server instance
 */
let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

/**
 * Initialize Socket.io server
 * @param httpServer HTTP server instance from Express
 */
export function initializeSocketIO(
  httpServer: HTTPServer
): SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> {
  // Create Socket.io server with typed events
  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // Connection options
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    // Transports
    transports: ['websocket', 'polling'],
  });

  // Connection handler
  io.on('connection', (socket) => {
    log.info(`Socket connected: ${socket.id}`, {
      transport: socket.conn.transport.name,
      address: socket.handshake.address,
    });

    // Initialize socket data
    socket.data.authenticated = false;

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      log.info(`Socket disconnected: ${socket.id}`, {
        reason,
        displayId: socket.data.displayId,
        userId: socket.data.userId,
      });
    });

    // Handle connection errors
    socket.on('error', (error) => {
      log.error(`Socket error: ${socket.id}`, error);
    });

    // Test event handlers
    setupTestHandlers(socket);

    // Display event handlers (will be implemented in future tasks)
    // setupDisplayHandlers(socket);

    // Admin event handlers (will be implemented in future tasks)
    // setupAdminHandlers(socket);
  });

  log.info('✓ Socket.io initialized', {
    cors: config.corsOrigins,
    transports: ['websocket', 'polling'],
  });

  return io;
}

/**
 * Setup test event handlers
 * These are temporary handlers for testing Socket.io connection
 * Using untyped events for testing purposes
 */
function setupTestHandlers(socket: TypedSocket): void {
  // Test message handler (generic event for testing)
  // Using type assertion to bypass strict typing for test events
  (socket as any).on('test-message', (data: unknown) => {
    log.info(`Test message received from ${socket.id}`, { data });

    // Send response back to client
    (socket as any).emit('test-response', {
      message: 'Test message received by server',
      echo: data,
      serverTime: new Date().toISOString(),
    });
  });

  // Ping-pong test for latency checking
  (socket as any).on(
    'ping-test',
    (callback: (response: { pong: boolean; timestamp: number }) => void) => {
      log.debug(`Ping test received from ${socket.id}`);
      if (typeof callback === 'function') {
        callback({ pong: true, timestamp: Date.now() });
      }
    }
  );
}

/**
 * Get Socket.io server instance
 * @returns Socket.io server instance or null if not initialized
 */
export function getIO():
  | SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >
  | null {
  return io;
}

/**
 * Broadcast event to all connected clients
 */
export function broadcast<K extends keyof ServerToClientEvents>(
  event: K,
  ...args: Parameters<ServerToClientEvents[K]>
): void {
  if (!io) {
    log.warn('Cannot broadcast: Socket.io not initialized');
    return;
  }

  io.emit(event, ...args);
  log.debug(`Broadcasted event: ${String(event)}`);
}

/**
 * Emit event to specific room
 */
export function emitToRoom<K extends keyof ServerToClientEvents>(
  room: string,
  event: K,
  ...args: Parameters<ServerToClientEvents[K]>
): void {
  if (!io) {
    log.warn('Cannot emit to room: Socket.io not initialized');
    return;
  }

  io.to(room).emit(event, ...args);
  log.debug(`Emitted event to room ${room}: ${String(event)}`);
}

/**
 * Get count of connected sockets
 */
export async function getConnectedSocketsCount(): Promise<number> {
  if (!io) return 0;

  const sockets = await io.fetchSockets();
  return sockets.length;
}

/**
 * Disconnect all sockets gracefully
 */
export async function disconnectAll(): Promise<void> {
  if (!io) return;

  log.info('Disconnecting all Socket.io clients...');

  const sockets = await io.fetchSockets();
  for (const socket of sockets) {
    socket.disconnect(true);
  }

  log.info(`Disconnected ${sockets.length} clients`);
}
