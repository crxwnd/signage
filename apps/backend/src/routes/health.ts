/**
 * Health check routes
 * Provides endpoints to check system health and service status
 */

import { Router, type Request, type Response, type IRouter } from 'express';
import type { ApiSuccessResponse, HealthCheckResponse } from '@shared-types';
import { prisma } from '../utils/prisma';
import { log } from '../middleware/logger';

const router: IRouter = Router();

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * GET /health
 * Basic health check endpoint
 * Returns server status, uptime, and service availability
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Calculate uptime in seconds
    const uptime = (Date.now() - startTime) / 1000;

    // Check database connection
    let databaseStatus: 'ok' | 'down' = 'down';
    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'ok';
    } catch (error) {
      log.error('Database health check failed', error);
    }

    // Build health check response
    const healthData: HealthCheckResponse = {
      status: databaseStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime,
      services: {
        database: databaseStatus,
        redis: 'ok', // TODO: Implement Redis check in Day 3.3
        storage: 'ok', // TODO: Implement MinIO check later
        socketio: 'ok', // TODO: Implement Socket.io check in Day 3.2
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    // Return success response
    const response: ApiSuccessResponse<HealthCheckResponse> = {
      success: true,
      data: healthData,
      timestamp: new Date().toISOString(),
    };

    res.status(200).json(response);
  } catch (error) {
    log.error('Health check failed', error);

    // Return error response
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/container orchestration
 * Returns 200 if service is ready to accept traffic
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Check critical services
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      data: { ready: true },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Readiness check failed', error);

    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_NOT_READY',
        message: 'Service is not ready',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes/container orchestration
 * Returns 200 if service is alive (even if not fully functional)
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { alive: true },
    timestamp: new Date().toISOString(),
  });
});

export default router;
