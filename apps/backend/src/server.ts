/**
 * Server entry point
 * Starts the HTTP server and handles graceful shutdown
 */

import { createApp } from './app';
import { config, validateConfig } from './config';
import { log } from './middleware/logger';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

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

    // Test database connection
    log.info('Testing database connection...');
    try {
      await prisma.$connect();
      log.info('✓ Database connected successfully');
    } catch (error) {
      log.error('✗ Database connection failed', error);
      log.warn('Server will start but database features may not work');
    }

    // Start HTTP server
    const server = app.listen(config.port, () => {
      log.info(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🚀 Signage Backend Server                                     ║
║                                                                ║
║  Environment: ${config.env.padEnd(47)}║
║  Port:        ${config.port.toString().padEnd(47)}║
║  Health:      http://localhost:${config.port}/health${' '.repeat(23)}║
║                                                                ║
║  Ready to accept requests! 🎉                                  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string): Promise<void> => {
      log.info(`${signal} received. Starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        log.info('HTTP server closed');

        // Disconnect from database
        try {
          await prisma.$disconnect();
          log.info('Database disconnected');
        } catch (error) {
          log.error('Error disconnecting from database', error);
        }

        log.info('Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after timeout
      setTimeout(() => {
        log.error('Forced shutdown after timeout');
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
    process.exit(1);
  }
}

// Start the server
startServer();
