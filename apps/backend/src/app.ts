/**
 * Express application configuration
 * Configures middleware, routes, and error handling
 */

import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import displaysRouter from './routes/displays';
import contentRouter from './routes/content';
import authRouter from './routes/auth';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // ==============================================
  // MIDDLEWARE
  // ==============================================

  // Security headers with Helmet.js
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for signage displays
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests from this IP, please try again later',
      },
      timestamp: new Date().toISOString(),
    },
  });

  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing
  app.use(cookieParser());

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

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/displays', displaysRouter);
  app.use('/api/content', contentRouter);

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
