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
import { prisma } from '../utils/prisma';
import * as conductorManager from './conductorManager';
import { setupSyncHandlers } from './syncHandlers';

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
    socket.on('disconnect', async (reason) => {
      log.info(`Socket disconnected: ${socket.id}`, {
        reason,
        displayId: socket.data.displayId,
        userId: socket.data.userId,
      });

      // Update display status to OFFLINE in database
      if (socket.data.displayId) {
        try {
          await prisma.display.update({
            where: { id: socket.data.displayId },
            data: {
              status: 'OFFLINE',
              lastSeen: new Date(),
            },
          });
          log.info(`Display ${socket.data.displayId} marked as OFFLINE`);
        } catch (error) {
          log.error(`Failed to update display status on disconnect`, error);
        }
      }

      // Unregister from conductor manager
      conductorManager.unregisterDisplay(socket.id);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      log.error(`Socket error: ${socket.id}`, error);
    });

    // Test event handlers
    setupTestHandlers(socket);

    // Display event handlers
    setupDisplayHandlers(socket);

    // Sync event handlers
    setupSyncHandlers(socket);

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
 * Pairing codes storage (in production, use Redis)
 */
const pairingCodes = new Map<string, { socketId: string; createdAt: number }>();

/**
 * Socket to Display mapping for tracking connected displays
 */
const socketToDisplay = new Map<string, string>();

/**
 * Setup display event handlers
 * Handlers for display device registration, heartbeat, and pairing
 */
function setupDisplayHandlers(socket: TypedSocket): void {
  // Display registration handler (supports both formats)
  socket.on('display:register', async (data) => {
    // Support both { deviceId } and { displayId } formats
    const displayId = (data as any).displayId || (data as any).deviceId;

    if (!displayId) {
      log.warn('Display registration without ID', { socketId: socket.id });
      return;
    }

    log.info(`Display registration from ${socket.id}`, {
      displayId,
      deviceInfo: (data as any).deviceInfo,
    });

    // Store display ID in socket data
    socket.data.displayId = displayId;
    socket.data.role = 'display';

    // Track socket to display mapping
    socketToDisplay.set(socket.id, displayId);

    // Join display-specific room
    socket.join(`display:${displayId}`);

    // Update display status to ONLINE in database
    try {
      await prisma.display.update({
        where: { id: displayId },
        data: {
          status: 'ONLINE',
          lastSeen: new Date(),
        },
      });
      log.info(`Display ${displayId} marked as ONLINE`);
    } catch (error) {
      log.error(`Failed to update display status on register`, error);
    }

    // Register with conductor manager for role assignment (if has full deviceInfo)
    if ((data as any).deviceInfo) {
      conductorManager.registerDisplay(socket.id, data);
    }
  });

  // Display heartbeat handler (supports both formats)
  socket.on('display:heartbeat', async (data) => {
    const displayId = (data as any).displayId;

    if (!displayId) {
      log.warn('Heartbeat without displayId', { socketId: socket.id });
      return;
    }

    log.debug(`Heartbeat from display ${displayId}`, {
      socketId: socket.id,
      currentContentId: (data as any).currentContentId,
      playbackPosition: (data as any).playbackPosition,
    });

    // Update last seen time in socket data
    socket.data.displayId = displayId;

    // Update display lastSeen timestamp in database
    try {
      await prisma.display.update({
        where: { id: displayId },
        data: {
          lastSeen: new Date(),
          status: 'ONLINE',
        },
      });
    } catch (error) {
      log.error(`Failed to update display lastSeen on heartbeat`, error);
    }
  });

  // Request pairing code (for unconfigured displays)
  (socket as any).on('display:request-pairing', () => {
    // Generate 6-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store with socket ID
    pairingCodes.set(code, {
      socketId: socket.id,
      createdAt: Date.now()
    });

    socket.emit('pairing:code' as any, { code });
    log.info(`Pairing code generated: ${code} for socket ${socket.id}`);

    // Expire after 5 minutes
    setTimeout(() => {
      pairingCodes.delete(code);
      log.debug(`Pairing code ${code} expired`);
    }, 5 * 60 * 1000);
  });
}

/**
 * Get pairing data by code
 */
export function getPairingData(code: string): { socketId: string; createdAt: number } | undefined {
  return pairingCodes.get(code.toUpperCase());
}

/**
 * Delete pairing code
 */
export function deletePairingCode(code: string): void {
  pairingCodes.delete(code.toUpperCase());
}

/**
 * Get socket by ID
 */
export async function getSocketById(socketId: string): Promise<any> {
  if (!io) return null;
  const sockets = await io.fetchSockets();
  return sockets.find(s => s.id === socketId);
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
