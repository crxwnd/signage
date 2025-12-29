/**
 * Express application configuration
 * Configures middleware, routes, and error handling
 */

import path from 'path';
import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { logger, log } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import displaysRouter from './routes/displays';
import contentRouter from './routes/content';
import authRouter from './routes/auth';
import videoRouter from './routes/video';
import areasRouter from './routes/areas';
import playlistRouter from './routes/playlist';
import usersRouter from './routes/users';
import hotelsRouter from './routes/hotels';

// ... otros imports ...

// ==============================================
// 🚑 BIGINT SERIALIZATION FIX
// ==============================================
// Esto soluciona el error "Do not know how to serialize a BigInt"
// Convierte los BigInt de Prisma a string al enviar JSON
// @ts-expect-error BigInt prototype extension
BigInt.prototype.toJSON = function (): string {
  return this.toString();
};

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // ==============================================
  // MIDDLEWARE
  // ==============================================

  // CORS MUST BE FIRST - before any other middleware
  // This ensures preflight OPTIONS requests are handled correctly
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Security headers with Helmet.js (AFTER CORS)
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
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resource sharing
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

  // Request logging
  app.use(logger);

  // ==============================================
  // 📂 STATIC FILES (FIX DEFINITIVO)
  // ==============================================
  const storagePath = path.join(process.cwd(), 'storage');

  log.info('📂 Static files config:', {
    cwd: process.cwd(),
    storagePath,
  });

  app.use('/uploads', express.static(path.join(storagePath, 'uploads')));
  app.use('/thumbnails', express.static(path.join(storagePath, 'thumbnails')));
  app.use('/hls', express.static(path.join(storagePath, 'hls')));

  // ==============================================
  // ROUTES
  // ==============================================

  // Health check routes
  app.use(healthRouter);

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/areas', areasRouter);
  app.use('/api/displays', displaysRouter);
  app.use('/api/content', contentRouter);
  app.use('/api/video', videoRouter);
  app.use('/api/playlists', playlistRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/hotels', hotelsRouter);

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
