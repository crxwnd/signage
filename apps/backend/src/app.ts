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
import { logger } from './middleware/logger';
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
import syncRouter from './routes/sync';
import dashboardRouter from './routes/dashboard';
import analyticsRouter from './routes/analytics';

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

  // ==============================================
  // 📂 STATIC FILES (BEFORE RATE LIMITER)
  // ==============================================
  // Static files don't need rate limiting - they're served directly
  const storagePath = path.join(process.cwd(), 'storage');

  console.log('📂 Static files config:');
  console.log('   - CWD:', process.cwd());
  console.log('   - Storage path:', storagePath);

  app.use('/uploads', express.static(path.join(storagePath, 'uploads')));
  app.use('/thumbnails', express.static(path.join(storagePath, 'thumbnails')));
  app.use('/hls', express.static(path.join(storagePath, 'hls')));

  // Rate limiting (AFTER static files - only for API routes)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased from 100 to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for static files and auth session endpoints
    skip: (req) => {
      const reqPath = req.path;
      // Static files (already served above, but skip anyway)
      if (reqPath.startsWith('/hls/') ||
        reqPath.startsWith('/uploads/') ||
        reqPath.startsWith('/thumbnails/')) {
        return true;
      }
      // Auth session endpoints (called frequently, should not be rate limited)
      // Note: /api/auth/login IS rate limited to prevent brute force
      if (reqPath === '/api/auth/refresh' ||
        reqPath === '/api/auth/me' ||
        reqPath === '/api/auth/logout') {
        return true;
      }
      return false;
    },
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

  // Note: Static files are served BEFORE rate limiter (see above)

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
  app.use('/api/sync', syncRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/analytics', analyticsRouter);

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
