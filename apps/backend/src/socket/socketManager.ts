/**
 * Socket.io Manager
 * Manages WebSocket connections, events, and real-time communication
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
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
 * Redis clients for pub/sub
 */
let pubClient: Redis | null = null;
let subClient: Redis | null = null;

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

  // Setup Redis adapter for clustering
  setupRedisAdapter();

  // Connection handler
  io.on('connection', (socket) => {
    log.info(`Socket connected: ${socket.id}`, {
      transport: socket.conn.transport.name,
      address: socket.handshake.address,
    });

    // Initialize socket data
    socket.data.authenticated = false;

    // Automatically join 'displays' room for real-time updates
    socket.join('displays');
    log.info(`Socket ${socket.id} joined 'displays' room`);

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
 * Setup Redis adapter for Socket.io clustering
 * Allows multiple Socket.io instances to communicate via Redis
 */
function setupRedisAdapter(): void {
  if (!io) {
    log.warn('Cannot setup Redis adapter: Socket.io not initialized');
    return;
  }

  try {
    // Parse Redis URL
    const redisUrl = config.redisUrl || 'redis://localhost:6379';

    log.info('Connecting to Redis for Socket.io adapter...', { redisUrl });

    // Create Redis clients for pub/sub
    pubClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        log.debug(`Redis retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: null, // Required for Redis adapter
      enableReadyCheck: false,
      lazyConnect: false,
    });

    subClient = pubClient.duplicate();

    // Handle connection events for pub client
    pubClient.on('connect', () => {
      log.info('✓ Redis pub client connected');
    });

    pubClient.on('ready', () => {
      log.info('✓ Redis pub client ready');
    });

    pubClient.on('error', (error) => {
      log.error('Redis pub client error', error);
    });

    pubClient.on('reconnecting', () => {
      log.warn('Redis pub client reconnecting...');
    });

    pubClient.on('close', () => {
      log.warn('Redis pub client connection closed');
    });

    // Handle connection events for sub client
    subClient.on('connect', () => {
      log.info('✓ Redis sub client connected');
    });

    subClient.on('ready', () => {
      log.info('✓ Redis sub client ready');
    });

    subClient.on('error', (error) => {
      log.error('Redis sub client error', error);
    });

    subClient.on('reconnecting', () => {
      log.warn('Redis sub client reconnecting...');
    });

    subClient.on('close', () => {
      log.warn('Redis sub client connection closed');
    });

    // Create and set Redis adapter
    io.adapter(createAdapter(pubClient, subClient));

    log.info('✓ Redis adapter configured for Socket.io clustering', {
      redisUrl,
    });
  } catch (error) {
    log.error('Failed to setup Redis adapter', error);
    log.warn('Socket.io will work without Redis adapter (single instance mode)');
    // Don't throw - allow server to start without Redis
  }
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

  // Close Redis connections
  if (pubClient) {
    log.info('Closing Redis pub client...');
    await pubClient.quit();
    pubClient = null;
  }

  if (subClient) {
    log.info('Closing Redis sub client...');
    await subClient.quit();
    subClient = null;
  }
}
