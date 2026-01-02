/**
 * Server entry point
 * Starts the HTTP server with Express and Socket.io
 * Handles graceful shutdown
 */

import { createServer } from 'http';
import { createApp } from './app';
import { config, validateConfig } from './config';
import { log } from './middleware/logger';
import { prisma } from './utils/prisma';
import { initializeSocketIO, disconnectAll } from './socket/socketManager';
import { startScheduleChecker } from './jobs/scheduleChecker';
import { startMetricsUpdater, stopMetricsUpdater } from './jobs/metricsUpdater';
import syncService from './services/syncService';
import storageService from './services/storageService';

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    log.info('Validating configuration...');
    validateConfig();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    log.info('Initializing Socket.io...');
    initializeSocketIO(httpServer);

    // Test database connection
    log.info('Testing database connection...');
    try {
      await prisma.$connect();
      log.info('✓ Database connected successfully');

      // Initialize sync service (restore runtime state for playing groups)
      await syncService.initializeSyncService();

      // Initialize storage (MinIO or local)
      await storageService.initializeStorage();
    } catch (error) {
      log.error('✗ Database connection failed', error);
      log.warn('Server will start but database features may not work');
    }

    // Start HTTP server
    httpServer.listen(config.port, () => {
      log.info(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🚀 Signage Backend Server                                     ║
║                                                                ║
║  Environment: ${config.env.padEnd(47)}║
║  Port:        ${config.port.toString().padEnd(47)}║
║  Health:      http://localhost:${config.port}/health${' '.repeat(23)}║
║  Socket.io:   ws://localhost:${config.port}${' '.repeat(28)}║
║                                                                ║
║  Ready to accept requests! 🎉                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);

      // Start schedule checker job
      startScheduleChecker();

      // Start metrics updater job
      startMetricsUpdater();
    });

    // Graceful shutdown handlers
    const shutdown = (signal: string): void => {
      log.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      httpServer.close(async () => {
        log.info('HTTP server closed');

        // Disconnect all Socket.io clients
        await disconnectAll();
        log.info('Socket.io disconnected');

        // Cleanup sync service
        syncService.cleanupSyncService();
        log.info('Sync service cleaned up');

        // Stop metrics updater
        stopMetricsUpdater();
        log.info('Metrics updater stopped');

        // Disconnect from database
        try {
          await prisma.$disconnect();
          log.info('Database disconnected');
        } catch (error) {
          log.error('Error disconnecting from database', error);
        }

        log.info('Graceful shutdown complete');
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        log.error('Forced shutdown after timeout');
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      log.error('Uncaught Exception', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason: unknown) => {
      log.error('Unhandled Rejection', reason as Error);
      shutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    log.error('Failed to start server', error as Error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

// Start the server
startServer();
