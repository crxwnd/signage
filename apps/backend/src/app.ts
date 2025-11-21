/**
 * Express application configuration
 * Configures middleware, routes, and error handling
 */

import express, { type Application } from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // ==============================================
  // MIDDLEWARE
  // ==============================================

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Request logging
  app.use(logger);

  // ==============================================
  // ROUTES
  // ==============================================

  // Health check routes
  app.use(healthRouter);

  // API routes will be added here in future tasks
  // app.use('/api', apiRouter);

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
